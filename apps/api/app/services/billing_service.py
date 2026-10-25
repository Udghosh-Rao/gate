"""Server-side Razorpay subscription and webhook handling."""

import hashlib
import hmac
from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.billing import PaymentRecord, Subscription, SubscriptionPlan, WebhookEvent
from app.models.exam import Exam
from app.models.user import User
from app.schemas.billing import CheckoutResponse, PlanCreateRequest, PlanResponse, SubscriptionSummary, PaymentSummary


def _require_razorpay(*, webhook: bool = False) -> tuple[str, str]:
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret or (webhook and not settings.RAZORPAY_WEBHOOK_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay test credentials are not configured")
    if settings.RAZORPAY_MODE != "live" and not key_id.startswith("rzp_test_"):
        raise HTTPException(status_code=503, detail="Configure Razorpay test-mode credentials before checkout")
    if settings.RAZORPAY_MODE == "live" and not key_id.startswith("rzp_live_"):
        raise HTTPException(status_code=503, detail="Razorpay live mode requires a live key ID")
    return key_id, key_secret


async def _provider_request(method: str, path: str, payload: dict | None = None) -> dict:
    key_id, key_secret = _require_razorpay()
    try:
        async with httpx.AsyncClient(timeout=12.0, auth=(key_id, key_secret)) as client:
            response = await client.request(method, f"https://api.razorpay.com/v1{path}", json=payload)
        if response.is_error:
            detail = response.json().get("error", {}).get("description", "Razorpay request failed")
            raise HTTPException(status_code=502, detail=detail)
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Razorpay is temporarily unavailable") from exc


async def create_plan(db: AsyncSession, data: PlanCreateRequest) -> PlanResponse:
    existing_slug = await db.execute(select(SubscriptionPlan.id).where(SubscriptionPlan.slug == data.slug))
    if existing_slug.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="A plan with this slug already exists")
    exam_rows = await db.execute(select(Exam.id).where(Exam.id.in_(data.included_exam_ids)))
    if set(exam_rows.scalars().all()) != set(data.included_exam_ids):
        raise HTTPException(status_code=400, detail="All included examinations must exist")
    provider_plan = await _provider_request("POST", "/plans", {
        "period": data.interval_unit,
        "interval": data.interval_count,
        "item": {
            "name": data.name,
            "amount": data.amount_minor,
            "currency": data.currency,
            "description": data.description or data.name,
        },
        "notes": {"plan_slug": data.slug},
    })
    plan = SubscriptionPlan(
        name=data.name,
        slug=data.slug,
        description=data.description,
        amount_minor=data.amount_minor,
        currency=data.currency,
        interval_unit=data.interval_unit,
        interval_count=data.interval_count,
        total_billing_cycles=data.total_billing_cycles,
        included_exam_ids=[str(exam_id) for exam_id in data.included_exam_ids],
        provider_plan_id=provider_plan["id"],
        is_published=data.is_published,
    )
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return PlanResponse.model_validate(plan)


async def create_checkout(db: AsyncSession, plan_id: UUID, user: User) -> CheckoutResponse:
    plan_result = await db.execute(select(SubscriptionPlan).where(
        SubscriptionPlan.id == plan_id,
        SubscriptionPlan.is_published.is_(True),
    ))
    plan = plan_result.scalar_one_or_none()
    if not plan or not plan.provider_plan_id:
        raise HTTPException(status_code=404, detail="Subscription plan is unavailable")
    existing = await db.execute(select(Subscription).where(
        Subscription.user_id == user.id,
        Subscription.plan_id == plan.id,
        Subscription.status.in_(["created", "authenticated", "active"]),
    ).order_by(Subscription.created_at.desc()).limit(1))
    subscription = existing.scalar_one_or_none()
    if subscription is None:
        provider = await _provider_request("POST", "/subscriptions", {
            "plan_id": plan.provider_plan_id,
            "total_count": plan.total_billing_cycles,
            "quantity": 1,
            "customer_notify": 1,
            "notes": {"user_id": str(user.id), "plan_id": str(plan.id)},
        })
        if not provider.get("id"):
            raise HTTPException(status_code=502, detail="Razorpay did not return a subscription reference")
        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            provider_subscription_id=provider["id"],
            status=provider.get("status", "created"),
        )
        db.add(subscription)
        await db.flush()
    key_id, _ = _require_razorpay()
    return CheckoutResponse(
        subscription_id=subscription.provider_subscription_id,
        key_id=key_id,
        name=plan.name,
        description=plan.description or plan.name,
        amount_minor=plan.amount_minor,
        currency=plan.currency,
    )


async def list_subscriptions(db: AsyncSession, user_id: UUID) -> list[SubscriptionSummary]:
    rows = await db.execute(
        select(Subscription, SubscriptionPlan.name)
        .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )
    return [SubscriptionSummary(
        id=sub.id,
        plan_id=sub.plan_id,
        plan_name=plan_name,
        provider_subscription_id=sub.provider_subscription_id,
        status=sub.status,
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        cancel_at_cycle_end=sub.cancel_at_cycle_end,
        created_at=sub.created_at,
    ) for sub, plan_name in rows.all()]


async def list_payments(db: AsyncSession, user_id: UUID) -> list[PaymentSummary]:
    rows = await db.execute(select(PaymentRecord).where(
        PaymentRecord.user_id == user_id
    ).order_by(PaymentRecord.created_at.desc()).limit(100))
    return [PaymentSummary.model_validate(payment) for payment in rows.scalars().all()]


async def cancel_subscription(db: AsyncSession, user_id: UUID, subscription_id: UUID) -> None:
    result = await db.execute(select(Subscription).where(
        Subscription.id == subscription_id,
        Subscription.user_id == user_id,
    ).with_for_update())
    subscription = result.scalar_one_or_none()
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if subscription.status not in {"active", "authenticated"}:
        raise HTTPException(status_code=409, detail="This subscription cannot be cancelled")
    await _provider_request("POST", f"/subscriptions/{subscription.provider_subscription_id}/cancel", {
        "cancel_at_cycle_end": 1,
    })
    subscription.cancel_at_cycle_end = True


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _epoch_to_datetime(value: int | None) -> datetime | None:
    return datetime.fromtimestamp(value, timezone.utc) if value else None


async def process_webhook(db: AsyncSession, raw_body: bytes, event_id: str, signature: str | None) -> bool:
    if not verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    try:
        import json
        payload = json.loads(raw_body)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc
    event_type = payload.get("event")
    if not isinstance(event_type, str):
        raise HTTPException(status_code=400, detail="Webhook event type is missing")

    try:
        async with db.begin_nested():
            db.add(WebhookEvent(
                provider_event_id=event_id,
                event_type=event_type,
                payload_sha256=hashlib.sha256(raw_body).hexdigest(),
            ))
            await db.flush()
    except IntegrityError:
        return False

    subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity") or {}
    provider_sub_id = subscription_entity.get("id") or subscription_entity.get("subscription_id")
    subscription = None
    if provider_sub_id:
        record = await db.execute(select(Subscription).where(
            Subscription.provider_subscription_id == provider_sub_id
        ).with_for_update())
        subscription = record.scalar_one_or_none()

    event_status = {
        "subscription.authenticated": "authenticated",
        "subscription.activated": "active",
        "subscription.charged": "active",
        "subscription.pending": "pending",
        "subscription.halted": "halted",
        "subscription.paused": "paused",
        "subscription.resumed": "active",
        "subscription.cancelled": "cancelled",
        "subscription.completed": "completed",
    }.get(event_type)
    if subscription is not None and event_status:
        subscription.status = event_status
        subscription.current_period_start = _epoch_to_datetime(
            subscription_entity.get("current_start") or subscription_entity.get("start_at")
        ) or subscription.current_period_start
        subscription.current_period_end = _epoch_to_datetime(
            subscription_entity.get("current_end") or subscription_entity.get("charge_at")
        ) or subscription.current_period_end
        if event_type == "subscription.cancelled":
            subscription.cancel_at_cycle_end = True
            subscription.cancelled_at = datetime.now(timezone.utc)

    payment = payload.get("payload", {}).get("payment", {}).get("entity") or {}
    if subscription is None and payment.get("subscription_id"):
        record = await db.execute(select(Subscription).where(
            Subscription.provider_subscription_id == payment["subscription_id"]
        ).with_for_update())
        subscription = record.scalar_one_or_none()
    payment_id = payment.get("id")
    if payment_id:
        existing_payment = await db.execute(select(PaymentRecord).where(
            PaymentRecord.provider_payment_id == payment_id
        ))
        payment_record = existing_payment.scalar_one_or_none()
        payment_status = payment.get("status") or ("captured" if event_type == "subscription.charged" else "pending")
        if event_type == "payment.refunded":
            payment_status = "refunded"
            if subscription:
                subscription.status = "refunded"
        if payment_record is None and subscription is not None:
            db.add(PaymentRecord(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                provider_payment_id=payment_id,
                amount_minor=int(payment.get("amount") or 0),
                currency=payment.get("currency") or "INR",
                status=payment_status,
                captured_at=_epoch_to_datetime(payment.get("created_at")) if payment_status == "captured" else None,
            ))
        elif payment_record is not None:
            payment_record.status = payment_status
            if payment_status == "captured":
                payment_record.captured_at = _epoch_to_datetime(payment.get("created_at")) or datetime.now(timezone.utc)
            if payment_status == "refunded" and subscription:
                subscription.status = "refunded"
    return True


async def has_exam_entitlement(db: AsyncSession, user_id: UUID, exam_id: UUID) -> bool:
    now = datetime.now(timezone.utc)
    rows = await db.execute(
        select(Subscription, SubscriptionPlan.included_exam_ids)
        .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
        .where(
            Subscription.user_id == user_id,
            Subscription.status.in_(["active", "cancelled"]),
            Subscription.current_period_end.is_not(None),
            Subscription.current_period_end > now,
        )
    )
    exam_id_str = str(exam_id)
    return any(exam_id_str in ids for _, ids in rows.all())
