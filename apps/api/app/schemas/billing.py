from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PlanCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=160)
    slug: str = Field(min_length=2, max_length=100, pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=1000)
    amount_minor: int = Field(gt=0, le=100_000_000)
    currency: Literal["INR"] = "INR"
    interval_unit: Literal["monthly", "yearly"]
    interval_count: int = Field(default=1, ge=1, le=12)
    total_billing_cycles: int = Field(default=12, ge=1, le=120)
    included_exam_ids: list[UUID] = Field(min_length=1)
    is_published: bool = False


class PlanResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    amount_minor: int
    currency: str
    interval_unit: str
    interval_count: int
    total_billing_cycles: int
    included_exam_ids: list[UUID]
    is_published: bool

    model_config = {"from_attributes": True}


class CheckoutResponse(BaseModel):
    subscription_id: str
    key_id: str
    name: str
    description: str
    amount_minor: int
    currency: str


class SubscriptionSummary(BaseModel):
    id: UUID
    plan_id: UUID
    plan_name: str
    provider_subscription_id: str
    status: str
    current_period_start: datetime | None
    current_period_end: datetime | None
    cancel_at_cycle_end: bool
    created_at: datetime


class PaymentSummary(BaseModel):
    provider_payment_id: str
    amount_minor: int
    currency: str
    status: str
    captured_at: datetime | None
    created_at: datetime
