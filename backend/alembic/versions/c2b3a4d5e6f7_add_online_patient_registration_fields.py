"""add online patient registration fields

Revision ID: c2b3a4d5e6f7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-01 07:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2b3a4d5e6f7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('booking_id', sa.String(length=20), nullable=True))
    op.add_column('patients', sa.Column('address', sa.String(length=255), nullable=True))
    op.add_column('patients', sa.Column('doctor_name', sa.String(length=120), nullable=True))
    op.add_column('patients', sa.Column('appointment_date', sa.Date(), nullable=True))
    op.create_index(op.f('ix_patients_booking_id'), 'patients', ['booking_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_patients_booking_id'), table_name='patients')
    op.drop_column('patients', 'appointment_date')
    op.drop_column('patients', 'doctor_name')
    op.drop_column('patients', 'address')
    op.drop_column('patients', 'booking_id')
