from datetime import datetime
from typing import Literal

from pydantic import Field

from .base import AppBaseModel


InsightSeverity = Literal["info", "warning", "critical"]
InsightStatus = Literal["active", "acknowledged", "resolved"]


class AIInsightRead(AppBaseModel):
    id: str = Field(..., min_length=1, max_length=80)
    product: str = Field(..., min_length=1, max_length=80)
    module: str = Field(..., min_length=1, max_length=80)
    severity: InsightSeverity
    status: InsightStatus = "active"
    title: str = Field(..., min_length=1, max_length=140)
    message: str = Field(..., min_length=1, max_length=500)
    recommendation: str = Field(..., min_length=1, max_length=300)
    trigger: str = Field(..., min_length=1, max_length=300)
    source: str = Field(..., min_length=1, max_length=120)
    created_at: datetime
