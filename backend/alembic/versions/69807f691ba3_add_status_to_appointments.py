"""add_status_to_appointments

Revision ID: 69807f691ba3
Revises: f3a2b1c0e9d8
Create Date: 2026-04-16 20:05:39.298022

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69807f691ba3'
down_revision: Union[str, Sequence[str], None] = 'f3a2b1c0e9d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('appointments', sa.Column('status', sa.String(length=30), nullable=False, server_default='Pending'))
    op.create_index(op.f('ix_appointments_status'), 'appointments', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_appointments_status'), table_name='appointments')
    op.drop_column('appointments', 'status')
