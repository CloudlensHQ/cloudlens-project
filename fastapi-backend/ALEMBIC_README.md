# Alembic Database Migration Guide

## Table of Contents

- [What is Alembic?](#what-is-alembic)
- [Project Setup](#project-setup)
- [Configuration](#configuration)
- [Basic Commands](#basic-commands)
- [Migration Workflow](#migration-workflow)
- [Common Scenarios](#common-scenarios)
- [Docker Integration](#docker-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What is Alembic?

Alembic is a database migration tool for SQLAlchemy, the Python SQL toolkit. It provides a way to:

- **Track database schema changes** over time
- **Version control your database structure** alongside your code
- **Apply and rollback changes** safely across different environments
- **Generate migrations automatically** from SQLAlchemy model changes
- **Maintain database consistency** across development, staging, and production

### Why Use Alembic?

- ✅ **Version Control**: Track every database change
- ✅ **Team Collaboration**: Share schema changes with your team
- ✅ **Environment Consistency**: Same database structure across all environments
- ✅ **Safe Deployments**: Apply changes incrementally and safely
- ✅ **Rollback Capability**: Undo changes if something goes wrong

## Project Setup

### Directory Structure

```
fastapi-backend/
├── alembic/                    # Alembic configuration directory
│   ├── versions/              # Migration files directory
│   ├── env.py                 # Environment configuration
│   └── script.py.mako         # Migration script template
├── alembic.ini                # Alembic configuration file
├── dbschema/
│   └── model.py              # SQLAlchemy models
└── src/
    └── config.py             # Database configuration
```

### Dependencies

Our `pyproject.toml` includes:

```toml
dependencies = [
    "alembic>=1.14.0",
    "sqlalchemy>=2.0.41",
    "psycopg2-binary>=2.9.10",  # PostgreSQL driver
    # ... other dependencies
]
```

## Configuration

### 1. alembic.ini

Main configuration file that specifies:

- **Script location**: Where migration files are stored
- **Database URL**: Connection string (can be overridden by environment)
- **Logging settings**: How migration operations are logged

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+psycopg2://cloudlens_user:cloudlens_password@postgres:5432/cloudlens_db
```

### 2. alembic/env.py

Environment setup that:

- **Imports your models** for auto-generation
- **Configures database connection** using environment variables
- **Sets up migration context** for online/offline modes

Key features:

- Uses environment variables for Docker compatibility
- Imports `Base` from your models for auto-generation
- Supports both development and production environments

### 3. Docker Integration

Database connection automatically uses environment variables:

```yaml
environment:
  - DATABASE_HOSTNAME=postgres
  - DATABASE_PORT=5432
  - DATABASE_NAME=cloudlens_db
  - DATABASE_USERNAME=cloudlens_user
  - DATABASE_PASSWORD=cloudlens_password
```

## Basic Commands

### Development Commands (Local)

If running locally with uv/pip:

```bash
# Check current migration version
alembic current

# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Downgrade to previous version
alembic downgrade -1

# Show migration history
alembic history
```

### Docker Commands (Recommended)

Since our setup uses Docker:

```bash
# Check current migration version
docker-compose exec server alembic current

# Create a new migration (auto-generate from model changes)
docker-compose exec server alembic revision --autogenerate -m "Add user profile fields"

# Create an empty migration (manual)
docker-compose exec server alembic revision -m "Add custom indexes"

# Apply all pending migrations
docker-compose exec server alembic upgrade head

# Apply migrations up to a specific version
docker-compose exec server alembic upgrade abc123

# Downgrade to previous version
docker-compose exec server alembic downgrade -1

# Downgrade to specific version
docker-compose exec server alembic downgrade abc123

# Show current version and pending migrations
docker-compose exec server alembic current
docker-compose exec server alembic history --verbose

# Show SQL that would be executed (dry run)
docker-compose exec server alembic upgrade head --sql
```

## Migration Workflow

### 1. Standard Development Workflow

```bash
# 1. Make changes to your SQLAlchemy models
# Edit: dbschema/model.py

# 2. Generate migration from model changes
docker-compose exec server alembic revision --autogenerate -m "Add email verification to users"

# 3. Review the generated migration file
# Check: alembic/versions/[timestamp]_add_email_verification_to_users.py

# 4. Apply the migration
docker-compose exec server alembic upgrade head

# 5. Verify changes in database
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "\d users"
```

### 2. Migration File Structure

Each migration file contains:

```python
"""Add email verification to users

Revision ID: abc123def456
Revises: previous_revision
Create Date: 2025-01-15 10:30:00.123456

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'abc123def456'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Forward migration logic
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))

def downgrade() -> None:
    # Reverse migration logic
    op.drop_column('users', 'email_verified')
```

## Common Scenarios

### 1. Adding a New Table

```python
# 1. Add new model to dbschema/model.py
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)

# 2. Generate migration
docker-compose exec server alembic revision --autogenerate -m "Add user profiles table"

# 3. Apply migration
docker-compose exec server alembic upgrade head
```

### 2. Adding a Column

```python
# 1. Modify existing model
class User(Base):
    # ... existing fields ...
    phone_number = Column(String(20), nullable=True)  # New field

# 2. Generate and apply
docker-compose exec server alembic revision --autogenerate -m "Add phone number to users"
docker-compose exec server alembic upgrade head
```

### 3. Renaming a Column

```python
# Manual migration needed (auto-generate can't detect renames)
def upgrade() -> None:
    op.alter_column('users', 'old_column_name', new_column_name='new_column_name')

def downgrade() -> None:
    op.alter_column('users', 'new_column_name', new_column_name='old_column_name')
```

### 4. Adding Indexes

```python
def upgrade() -> None:
    op.create_index('ix_users_email_domain', 'users', ['email'])
    op.create_index('ix_scans_created_at', 'cloud_scan', ['created_at'])

def downgrade() -> None:
    op.drop_index('ix_users_email_domain', table_name='users')
    op.drop_index('ix_scans_created_at', table_name='cloud_scan')
```

### 5. Data Migrations

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade() -> None:
    # Schema change
    op.add_column('users', sa.Column('status', sa.String(20), nullable=True))

    # Data migration
    users_table = table('users',
        column('id', sa.UUID),
        column('status', sa.String)
    )

    op.execute(
        users_table.update().values(status='active')
    )

    # Make column non-nullable after populating data
    op.alter_column('users', 'status', nullable=False)
```

## Docker Integration

### Automatic Migrations on Startup

Our `docker-compose.yml` runs migrations automatically:

```yaml
command: >
  /bin/bash -c "
  echo 'Waiting for database...' &&
  while ! nc -z postgres 5432; do sleep 1; done &&
  echo 'Database is ready!' &&
  alembic upgrade head &&
  # ... start application
  "
```

### Manual Migration in Development

```bash
# Start only the database
docker-compose up postgres -d

# Run migration commands
docker-compose exec server alembic current
docker-compose exec server alembic revision --autogenerate -m "Your changes"
docker-compose exec server alembic upgrade head

# Start full application
docker-compose up
```

## Best Practices

### 1. Migration Naming

Use descriptive names:

```bash
# Good
docker-compose exec server alembic revision --autogenerate -m "Add user email verification fields"
docker-compose exec server alembic revision --autogenerate -m "Create audit log table"
docker-compose exec server alembic revision --autogenerate -m "Add indexes for scan performance"

# Avoid
docker-compose exec server alembic revision --autogenerate -m "Update"
docker-compose exec server alembic revision --autogenerate -m "Fix"
```

### 2. Review Generated Migrations

Always review auto-generated migrations:

```bash
# After generating migration, check the file:
cat alembic/versions/[latest_file].py

# Look for:
# - Correct table/column names
# - Proper data types
# - Foreign key constraints
# - Index creation
# - Data preservation
```

### 3. Test Migrations

```bash
# Test upgrade
docker-compose exec server alembic upgrade head

# Test downgrade
docker-compose exec server alembic downgrade -1

# Test upgrade again
docker-compose exec server alembic upgrade head
```

### 4. Backup Before Major Changes

```bash
# Backup database before major migrations
docker-compose exec postgres pg_dump -U cloudlens_user cloudlens_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 5. Environment-Specific Migrations

```python
# Use revision dependencies for environment-specific changes
from alembic import context

def upgrade() -> None:
    if context.get_context().environment == 'production':
        # Production-specific changes
        pass
    else:
        # Development changes
        pass
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Can't locate revision identified by 'head'"

```bash
# Check migration history
docker-compose exec server alembic history

# Stamp database with current version
docker-compose exec server alembic stamp head
```

#### 2. "Target database is not up to date"

```bash
# Check current version
docker-compose exec server alembic current

# Apply pending migrations
docker-compose exec server alembic upgrade head
```

#### 3. "Can't import module" errors

```bash
# Check if models can be imported
docker-compose exec server python -c "from dbschema.model import Base; print('Import successful')"

# Check Python path in alembic/env.py
```

#### 4. Database connection errors

```bash
# Test database connection
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT version();"

# Check environment variables
docker-compose exec server env | grep DATABASE
```

#### 5. Migration conflicts

```bash
# If multiple people created migrations, you might need to merge:
docker-compose exec server alembic merge -m "Merge migrations" revision1 revision2
```

### Database Inspection Commands

```bash
# List all tables
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "\dt"

# Describe table structure
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "\d users"

# Check table data
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT * FROM alembic_version;"

# Check indexes
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "\di"

# Check foreign keys
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f';"
```

## Emergency Procedures

### Rollback Deployment

```bash
# Rollback to previous migration
docker-compose exec server alembic downgrade -1

# Rollback to specific version
docker-compose exec server alembic downgrade abc123

# Check current version after rollback
docker-compose exec server alembic current
```

### Reset Migration History (Development Only)

```bash
# WARNING: This will lose migration history
# Drop all tables
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Remove migration files (keep env.py and script.py.mako)
rm alembic/versions/*.py

# Create initial migration
docker-compose exec server alembic revision --autogenerate -m "Initial migration"

# Apply migration
docker-compose exec server alembic upgrade head
```

### Database Recovery

```bash
# Restore from backup
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db < backup_file.sql

# Stamp with correct version after restore
docker-compose exec server alembic stamp head
```

## Advanced Usage

### Custom Migration Scripts

```python
# alembic/versions/[timestamp]_custom_migration.py
def upgrade() -> None:
    # Run custom SQL
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # Bulk data operations
    connection = op.get_bind()
    result = connection.execute("SELECT id FROM users WHERE status IS NULL")
    for row in result:
        connection.execute(
            "UPDATE users SET status = 'active' WHERE id = %s",
            (row.id,)
        )
```

### Branching and Merging

```bash
# Create branch
docker-compose exec server alembic revision -m "Feature branch" --branch-label feature

# Create migration on branch
docker-compose exec server alembic revision -m "Feature changes" --head feature@head

# Merge branches
docker-compose exec server alembic merge -m "Merge feature" heads
```

---

## Quick Reference

### Essential Commands

| Command                                    | Description                    |
| ------------------------------------------ | ------------------------------ |
| `alembic current`                          | Show current migration version |
| `alembic revision --autogenerate -m "msg"` | Create new migration           |
| `alembic upgrade head`                     | Apply all pending migrations   |
| `alembic downgrade -1`                     | Rollback one migration         |
| `alembic history`                          | Show migration history         |
| `alembic show head`                        | Show latest migration          |

### File Locations

- **Configuration**: `alembic.ini`
- **Environment**: `alembic/env.py`
- **Migrations**: `alembic/versions/`
- **Models**: `dbschema/model.py`

Remember to always prefix commands with `docker-compose exec server` when using Docker!

````# Check users table
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT id, email, first_name, is_active, created_at FROM users;"

# Check tenant table
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT id, name, email, created_at FROM tenant;"

# Check cloud_scan table
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT id, name, status, cloud_provider, created_at FROM cloud_scan;"

# Check service_scan_result table
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT id, service_name, region, created_at FROM service_scan_result LIMIT 5;"

# Check regions table
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db -c "SELECT * FROM regions;"```
````
