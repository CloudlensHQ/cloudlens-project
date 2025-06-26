# CloudLens FastAPI Backend

A comprehensive FastAPI backend for CloudLens - AWS Cloud Security Scanning Platform with WorkOS integration.

## Features

- **WorkOS Integration**: Complete authentication and organization management
- **AWS Cloud Scanning**: Automated security scanning of AWS resources
- **Encrypted Credentials Storage**: Secure storage of AWS credentials using Fernet encryption
- **Multi-tenant Support**: Organization-based data isolation
- **Webhook Support**: Real-time updates from WorkOS
- **Background Jobs**: Asynchronous AWS scanning
- **Database Migrations**: Alembic integration for schema management

## Architecture

```
├── src/
│   ├── auth.py                 # WorkOS authentication service
│   ├── auth_routes.py          # Authentication endpoints
│   ├── config.py               # Application configuration
│   ├── encryption.py           # Encryption utilities for AWS credentials
│   ├── main.py                 # FastAPI application
│   ├── handlers/
│   │   ├── scan_endpoints.py   # AWS scanning endpoints
│   │   └── webhooks/
│   │       └── workos_webhooks.py  # WorkOS webhook handlers
│   └── jobs/
│       └── aws_cloud_scan.py   # AWS scanning job logic
├── dbschema/
│   ├── model.py                # SQLAlchemy models
│   └── db_connector.py         # Database connection management
└── alembic/                    # Database migrations
```

## Database Schema

### Core Tables

1. **Organization**: WorkOS organizations
2. **User**: Users linked to WorkOS and organizations
3. **AWSCredentials**: Encrypted AWS credentials per organization
4. **CloudScan**: Scan metadata and status
5. **ServiceScanResult**: Detailed scan results per AWS service
6. **Tenant**: Legacy tenant support (can be linked to organizations)

## Setup Instructions

### 1. Environment Setup

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_HOSTNAME=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=cloudlens_db

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# WorkOS Configuration
WORKOS_API_KEY=sk_test_your_workos_api_key
WORKOS_CLIENT_ID=client_your_workos_client_id

# JWT Configuration
JWT_SECRET_KEY=your-very-secure-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Encryption Configuration (for AWS credentials)
ENCRYPTION_KEY=your-encryption-key-for-aws-credentials
```

### 2. Generate Encryption Key

Generate a secure encryption key for AWS credentials:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Install Dependencies

```bash
uv sync
```

### 4. Database Migration

```bash
# Create initial migration
uv run alembic revision --autogenerate -m "Initial migration"

# Run migrations
uv run alembic upgrade head
```

### 5. Run the Application

```bash
# Development
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Production
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication

- `POST /api/auth/workos` - Authenticate with WorkOS token
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/organization` - Get current organization
- `POST /api/auth/logout` - Logout user

### AWS Credentials Management

- `POST /api/scan/credentials` - Create encrypted AWS credentials
- `GET /api/scan/credentials` - List organization's credentials
- `DELETE /api/scan/credentials/{id}` - Delete credentials

### AWS Scanning

- `POST /api/scan/start` - Start AWS security scan
- `GET /api/scan/results` - Get scan results for organization
- `GET /api/scan/results/{scan_id}` - Get detailed scan results
- `DELETE /api/scan/results/{scan_id}` - Delete scan results

### Webhooks

- `POST /webhooks/workos/events` - WorkOS webhook endpoint

### Utility

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/config` - Get public configuration

## WorkOS Integration

### Webhook Events Handled

1. **organization.created** - Creates new organization
2. **organization.updated** - Updates organization details
3. **organization.deleted** - Soft deletes organization
4. **user.created** - Creates new user
5. **user.updated** - Updates user details
6. **user.deleted** - Deactivates user

### Authentication Flow

1. Frontend authenticates user with WorkOS
2. Frontend sends WorkOS access token to `/api/auth/workos`
3. Backend validates token with WorkOS
4. Backend creates/updates user and organization in database
5. Backend returns JWT token for subsequent requests

## AWS Scanning

### Supported Services

- EC2 Instances
- EBS Volumes
- S3 Buckets
- Security Groups
- RDS Databases
- KMS Keys
- IAM Users

### Security Features

- Encrypted credential storage using Fernet encryption
- Organization-based access control
- Background job processing
- Regional scanning with exclusion support
- Comprehensive security assessment

### Scan Process

1. Store encrypted AWS credentials
2. Trigger scan with credential selection
3. Background job decrypts credentials
4. Scan AWS resources across regions
5. Store results in database
6. Update scan status

## Security Considerations

1. **Credential Encryption**: AWS credentials are encrypted using Fernet with PBKDF2 key derivation
2. **JWT Authentication**: Secure token-based authentication
3. **Webhook Verification**: WorkOS webhook signature verification
4. **Organization Isolation**: Data is isolated by organization
5. **Environment Variables**: Sensitive configuration via environment variables

## Development

### Adding New AWS Services

1. Add scanning function to `jobs/aws_cloud_scan.py`
2. Update `scan_region()` function to include new service
3. Test with various AWS configurations

### Adding New Webhook Events

1. Add handler function to `handlers/webhooks/workos_webhooks.py`
2. Update event routing in main webhook handler
3. Test with WorkOS webhook simulator

### Database Schema Changes

1. Update models in `dbschema/model.py`
2. Generate migration: `uv run alembic revision --autogenerate -m "Description"`
3. Review and apply: `uv run alembic upgrade head`

## Docker Deployment

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY . .

RUN pip install uv
RUN uv sync

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Monitoring and Logging

- Structured logging with different log levels
- Health check endpoint for monitoring
- Database session management with proper cleanup
- Error handling with appropriate HTTP status codes

## Contributing

1. Follow the existing code structure
2. Add proper error handling and logging
3. Update documentation for new features
4. Test with different scenarios
5. Ensure security best practices

## License

[Your License Here]
