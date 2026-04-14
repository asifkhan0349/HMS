from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from .base import ORMBase


class InventoryItemBase(BaseModel):
    item_code: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=120)
    category: str = Field(..., min_length=2, max_length=100)
    stock: int = Field(default=0, ge=0)
    unit: str = Field(..., min_length=1, max_length=20)
    status: str = Field(..., min_length=2, max_length=50)


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    item_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    stock: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    status: Optional[str] = Field(None, min_length=2, max_length=50)


class InventoryItemRead(InventoryItemBase, ORMBase):
    id: int
    created_at: datetime
