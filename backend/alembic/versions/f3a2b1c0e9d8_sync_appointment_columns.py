"""Sync appointment columns

Revision ID: f3a2b1c0e9d8
Revises: e52021b2f6d9
Create Date: 2026-04-15 19:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a2b1c0e9d8'
down_revision: Union[str, None] = 'e52021b2f6d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to appointments table
    op.add_column('appointments', sa.Column('patient_date_of_birth', sa.Date(), nullable=True))
    op.add_column('appointments', sa.Column('patient_age', sa.Integer(), nullable=True))
    op.add_column('appointments', sa.Column('patient_gender', sa.String(length=20), nullable=True))
    op.add_column('appointments', sa.Column('patient_mobile', sa.String(length=20), nullable=True))
    op.add_column('appointments', sa.Column('patient_email', sa.String(length=120), nullable=True))
    op.add_column('appointments', sa.Column('patient_address', sa.String(length=255), nullable=True))
    op.add_column('appointments', sa.Column('department', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_appointments_department'), 'appointments', ['department'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_department'), table_name='appointments')
    op.drop_column('appointments', 'department')
    op.drop_column('appointments', 'patient_address')
    op.drop_column('appointments', 'patient_email')
    op.drop_column('appointments', 'patient_mobile')
    op.drop_column('appointments', 'patient_gender')
    op.drop_column('appointments', 'patient_age')
    op.drop_column('appointments', 'patient_date_of_birth')
