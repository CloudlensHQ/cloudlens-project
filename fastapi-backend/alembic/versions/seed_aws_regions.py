"""Seed AWS regions

Revision ID: seed_aws_regions
Revises: 0fda572cfd20
Create Date: 2025-07-27 06:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'seed_aws_regions'
down_revision = '0fda572cfd20'
branch_labels = None
depends_on = None

# AWS regions to seed
AWS_REGIONS = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'eu-north-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-northeast-3',
    'ap-south-1',
    'ca-central-1',
    'sa-east-1',
]


def upgrade() -> None:
    # Insert AWS regions
    regions_table = sa.table(
        'regions',
        sa.column('id', PG_UUID(as_uuid=True)),
        sa.column('name', sa.Text()),
        sa.column('cloud_provider', sa.Text()),
        sa.column('created_at', sa.TIMESTAMP(timezone=True)),
        sa.column('updated_at', sa.TIMESTAMP(timezone=True)),
    )
    
    now = datetime.utcnow()
    regions_data = []
    for region_name in AWS_REGIONS:
        regions_data.append({
            'id': str(uuid.uuid4()),
            'name': region_name,
            'cloud_provider': 'AWS',
            'created_at': now,
            'updated_at': now,
        })
    
    if regions_data:
        op.bulk_insert(regions_table, regions_data)


def downgrade() -> None:
    # Remove seeded AWS regions
    op.execute(
        "DELETE FROM regions WHERE cloud_provider = 'AWS' AND name IN ('{}')".format(
            "', '".join(AWS_REGIONS)
        )
    )
