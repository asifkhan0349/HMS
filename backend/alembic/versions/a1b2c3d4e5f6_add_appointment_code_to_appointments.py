"""Add appointment_code to appointments

Revision ID: a1b2c3d4e5f6
Revises: f3a2b1c0e9d8
Create Date: 2026-06-01 06:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '15dbb66b87a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'appointments',
        sa.Column('appointment_code', sa.String(length=20), nullable=True)
    )
    op.create_index(
        op.f('ix_appointments_appointment_code'),
        'appointments',
        ['appointment_code'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_appointment_code'), table_name='appointments')
    op.drop_column('appointments', 'appointment_code')
