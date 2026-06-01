"""add_ambulance_trips_table

Revision ID: f1d301c7134a
Revises: 1c69af229113
Create Date: 2026-05-25 15:24:02.268369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1d301c7134a'
down_revision: Union[str, Sequence[str], None] = '1c69af229113'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('ambulance_trips',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('owner_user_id', sa.Integer(), nullable=False),
    sa.Column('ambulance_id', sa.Integer(), nullable=False),
    sa.Column('ambulance_code', sa.String(length=20), nullable=False),
    sa.Column('vehicle_number', sa.String(length=20), nullable=False),
    sa.Column('patient_name', sa.String(length=120), nullable=False),
    sa.Column('destination', sa.String(length=255), nullable=False),
    sa.Column('driver_name', sa.String(length=120), nullable=True),
    sa.Column('paramedic_name', sa.String(length=120), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ambulance_trips_id'), 'ambulance_trips', ['id'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_owner_user_id'), 'ambulance_trips', ['owner_user_id'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_ambulance_id'), 'ambulance_trips', ['ambulance_id'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_ambulance_code'), 'ambulance_trips', ['ambulance_code'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_vehicle_number'), 'ambulance_trips', ['vehicle_number'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_patient_name'), 'ambulance_trips', ['patient_name'], unique=False)
    op.create_index(op.f('ix_ambulance_trips_destination'), 'ambulance_trips', ['destination'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_ambulance_trips_destination'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_patient_name'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_vehicle_number'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_ambulance_code'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_ambulance_id'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_owner_user_id'), table_name='ambulance_trips')
    op.drop_index(op.f('ix_ambulance_trips_id'), table_name='ambulance_trips')
    op.drop_table('ambulance_trips')

