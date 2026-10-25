"""Razorpay subscription checkout, history, and signed webhook endpoints."""

import hashlib
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.billing import SubscriptionPlan
from app.models.user import User
from app.schemas.billing import CheckoutResponse, PaymentSummary, PlanCreateRequest, PlanResponse, SubscriptionSummary
from app.services.billing_service import (
    cancel_subscription,
    create_checkout,
    create_plan,
    list_payments,
    list_subscriptions,
    process_webhook,
)

router = APIRouter(tags=["Billing"])


@router.get("/billing/plans", response_model=list[PlanResponse])
async def get_published_plans(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(SubscriptionPlan).where(
        SubscriptionPlan.is_published.is_(True),
        SubscriptionPlan.provider_plan_id.is_not(None),
    ).order_by(SubscriptionPlan.amount_minor))
    return result.scalars().all()


@router.post("/billing/checkout", response_model=CheckoutResponse)
async def start_checkout(
    plan_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await create_checkout(db, plan_id, current_user)


@router.get("/billing/me", response_model=list[SubscriptionSummary])
async def my_subscriptions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await list_subscriptions(db, current_user.id)


@router.get("/billing/payments", response_model=list[PaymentSummary])
async def my_payments(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await list_payments(db, current_user.id)


@router.post("/billing/subscriptions/{subscription_id}/cancel", status_code=status.HTTP_202_ACCEPTED)
async def request_cancellation(
    subscription_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await cancel_subscription(db, current_user.id, subscription_id)
    return {"status": "cancellation_scheduled", "access_policy": "until_paid_through_date"}


@router.post("/billing/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    signature: str | None = Header(default=None, alias="X-Razorpay-Signature"),
    event_id: str | None = Header(default=None, alias="X-Razorpay-Event-Id"),
):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 1_000_000:
        raise HTTPException(status_code=413, detail="Webhook payload is too large")
    raw = await request.body()
    if len(raw) > 1_000_000:
        raise HTTPException(status_code=413, detail="Webhook payload is too large")
    stable_event_id = event_id or hashlib.sha256(raw).hexdigest()
    processed = await process_webhook(db, raw, stable_event_id, signature)
    return {"received": True, "processed": processed}


@router.post("/admin/billing/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_plan(
    data: PlanCreateRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await create_plan(db, data)


@router.get("/admin/billing/plans", response_model=list[PlanResponse])
async def admin_list_plans(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.created_at.desc()))
    return result.scalars().all()
