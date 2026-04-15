from typing import Annotated

from fastapi import Path


PositiveId = Annotated[int, Path(..., gt=0)]
ResetToken = Annotated[str, Path(..., min_length=1)]
