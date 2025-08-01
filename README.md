# CloudLens - AWS Cloud Security Scanning Platform

CloudLens is a comprehensive cloud security scanning platform that helps you monitor and secure your AWS infrastructure. The platform consists of a FastAPI backend and a Next.js frontend, all containerized for easy deployment.

## 🚀 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

### 1. Clone and Setup

```bash
git clone <your-repository-url>
cd cloudlens-project
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit the `.env` file and fill in your actual values. All environment variables are now managed in this single file, making configuration much simpler!

#### Required Environment Variables

1. **Generate Security Keys:**
   ```bash
   # Generate JWT Secret
   python -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(32))"
   
   # Generate Encryption Key
   python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
   ```

2. **Supabase Configuration:**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings > API

3. **WorkOS Configuration:**
   - Go to [WorkOS](https://workos.com)
   - Create an application
   - Get your Client ID, Client Secret, and API Key

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Check if all services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Backend Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Next.js       │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 5432)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Environment Management

### Simplified Configuration

All environment variables are now managed through a single `.env` file that gets loaded into all containers. This approach provides:

- **Single source of truth** for all configuration
- **Easy environment switching** (dev, staging, prod)
- **No duplication** of environment variables
- **Better security** - one file to secure

### Environment Override

The docker-compose.yml only overrides essential variables needed for container networking:

- **Backend**: Database connection points to `postgres` container
- **Frontend**: API URL points to `backend` container  
- **Database**: Uses predefined container credentials

## 🛠️ Development

### Local Development Setup

If you want to run the services locally for development:

#### Backend Development
```bash
cd fastapi-backend
uv sync
cp env.example .env  # Configure your environment
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Development
```bash
cd frontend
pnpm install
cp env.example .env.local  # Configure your environment
pnpm dev
```

### Docker Development

For development with Docker (with hot reload):

```bash
# Start only the database
docker-compose up postgres -d

# Run backend locally with hot reload
cd fastapi-backend
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend locally with hot reload
cd frontend
pnpm dev
```

## 📋 Available Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild services after code changes
docker-compose build
docker-compose up -d

# Access service shells
docker-compose exec backend bash
docker-compose exec frontend sh

# Database operations
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db
```

## 🔧 Configuration

### Environment Variables

The application uses a single `.env` file for all configuration. Key variables include:

#### Backend Configuration
- `DATABASE_*`: PostgreSQL connection settings (overridden for containers)
- `SUPABASE_*`: Supabase configuration
- `WORKOS_*`: WorkOS authentication settings
- `JWT_SECRET`: JWT token signing key
- `ENCRYPTION_KEY`: Data encryption key
- `SMTP_*`: Email configuration

#### Frontend Configuration
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL (overridden for containers)
- `WORKOS_*`: WorkOS authentication settings
- `ENCRYPTION_KEY`: Must match backend encryption key

### Database Setup

The PostgreSQL database is automatically initialized when you run docker-compose. If you need to set up additional tables or run migrations, refer to the database schema files in `fastapi-backend/dbschema/`.

## 🚦 Health Checks

All services include health checks:

- **Backend:** `http://localhost:8000/health`
- **Frontend:** `http://localhost:3000` (Next.js built-in)
- **Database:** Built-in PostgreSQL health check

## 📁 Project Structure

```
cloudlens-project/
├── fastapi-backend/          # FastAPI backend service
│   ├── src/                  # Application source code
│   ├── dbschema/            # Database schemas
│   ├── Dockerfile           # Backend container definition
│   └── pyproject.toml       # Python dependencies
├── frontend/                 # Next.js frontend service
│   ├── src/                 # Application source code
│   ├── Dockerfile           # Frontend container definition
│   └── package.json         # Node.js dependencies
├── docker-compose.yml       # Multi-service orchestration
├── env.example             # Environment variables template
├── .env                    # Your configuration (create from template)
└── README.md               # This file
```

## 🔒 Security Notes

1. **Never commit `.env` files** - they contain sensitive credentials
2. **Use strong, unique keys** - generate new JWT secrets and encryption keys
3. **Enable HTTPS in production** - configure a reverse proxy like Nginx
4. **Regular updates** - keep dependencies and base images updated
5. **Database backups** - implement regular backup strategies

## 🚀 Production Deployment

For production deployment, consider:

1. **Use a reverse proxy** (Nginx/Caddy) for HTTPS termination
2. **Set up proper logging** and monitoring
3. **Use managed databases** instead of the containerized PostgreSQL
4. **Implement backup strategies** for data persistence
5. **Set up CI/CD pipelines** for automated deployments
6. **Use secrets management** for sensitive environment variables

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines Here]
