from pydantic import Field

from .base import AppBaseModel


class ProductModuleRead(AppBaseModel):
    id: str = Field(..., min_length=1, max_length=80)
    title: str = Field(..., min_length=1, max_length=120)
    status: str = Field(..., min_length=1, max_length=80)
    summary: str = Field(..., min_length=1, max_length=400)
    allowed_roles: list[str]
    connected_routes: list[str]
    metrics: list[str]
