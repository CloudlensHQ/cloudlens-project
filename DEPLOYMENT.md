# CloudLens Docker Deployment Guide

This guide will help you deploy CloudLens using Docker Compose in both development and production environments.

## 📋 Prerequisites

### System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Memory**: At least 2GB RAM available for containers
- **Storage**: At least 5GB free disk space

### Installation

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🚀 Quick Deployment

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd cloudlens-project
```

### 2. Environment Setup

#### Copy Environment Template

```bash
cp env.example .env
```

> **Note**: All environment variables are now managed through this single `.env` file using Docker Compose's `env_file` feature. This simplifies configuration and eliminates duplication.

#### Generate Security Keys

```bash
# Generate JWT Secret (copy the output)
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(32))"

# Generate Encryption Key (copy the output)
python3 -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
```

#### Configure .env File

Edit the `.env` file with your values:

```bash
nano .env  # or use your preferred editor
```

**Required Variables:**

- `SUPABASE_URL` and `SUPABASE_KEY`: From your Supabase project
- `WORKOS_CLIENT_*` and `WORKOS_API_KEY`: From your WorkOS application
- `JWT_SECRET`: Generated above
- `ENCRYPTION_KEY`: Generated above

### 3. Deploy

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify Deployment

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration Details

### Service Architecture

```
┌─────────────────────────────────────┐
│             Load Balancer           │ (Optional - Production)
│              (Nginx)                │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┼───────────────────┐
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │         Frontend            │    │
│  │       (Next.js)             │    │
│  │      Port: 3000             │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │          Backend            │    │
│  │        (FastAPI)            │    │
│  │       Port: 8000            │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │        Database             │    │
│  │      (PostgreSQL)           │    │
│  │       Port: 5432            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Environment Variables by Service

#### Environment File Management

All services now use the same `.env` file through Docker Compose's `env_file` feature:

**Shared Configuration (from .env file):**

- **Database**: `DATABASE_*` variables (overridden for container networking)
- **Supabase**: `SUPABASE_URL`, `SUPABASE_KEY`
- **WorkOS**: All `WORKOS_*` variables
- **Security**: `JWT_SECRET`, `ENCRYPTION_KEY`
- **Email**: `SMTP_*` variables (optional)
- **Application**: `ENVIRONMENT`, `API_DEBUG`, `LOG_LEVEL`, etc.

**Container-Specific Overrides:**

- **Backend**: Database hostname set to `postgres` container
- **Frontend**: Backend URL set to `backend` container

#### Database (`postgres` service)

- Automatically configured with predefined credentials
- Data persisted in `postgres_data` volume

## 🛠️ Development Workflow

### Local Development with Hot Reload

```bash
# Start only the database
docker-compose up postgres -d

# Run backend with hot reload
cd fastapi-backend
uv sync
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, run frontend with hot reload
cd frontend
pnpm install
pnpm dev
```

### Development with Docker

```bash
# Use override file for development
cp docker-compose.override.yml.example docker-compose.override.yml

# Start development environment
docker-compose up -d
```

### Making Code Changes

```bash
# Rebuild after code changes
docker-compose build [service-name]
docker-compose up -d [service-name]

# Or rebuild all services
docker-compose build
docker-compose up -d
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check service health
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Check specific service health
curl http://localhost:8000/health  # Backend
curl http://localhost:3000         # Frontend
```

### Database Operations

```bash
# Access database
docker-compose exec postgres psql -U cloudlens_user -d cloudlens_db

# Backup database
docker-compose exec postgres pg_dump -U cloudlens_user cloudlens_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U cloudlens_user -d cloudlens_db < backup.sql
```

### Container Management

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose down -v

# Restart specific service
docker-compose restart [service-name]

# View resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

## 🔒 Production Deployment

### Security Hardening

1. **Use strong passwords** for all services
2. **Enable firewall** rules to restrict access
3. **Use HTTPS** with SSL certificates
4. **Regular security updates** for base images
5. **Limit container resources** to prevent DoS

### Production docker-compose.yml

```yaml
# Additional production configurations
services:
  frontend:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  backend:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  postgres:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Reverse Proxy Setup (Nginx)

```nginx
# /etc/nginx/sites-available/cloudlens
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Automated backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/cloudlens"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec postgres pg_dump -U cloudlens_user cloudlens_db > $BACKUP_DIR/db_$DATE.sql

# Environment backup
cp .env $BACKUP_DIR/env_$DATE.bak

# Compress backup
tar -czf $BACKUP_DIR/cloudlens_backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE.*

echo "Backup completed: cloudlens_backup_$DATE.tar.gz"
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill the process
sudo kill -9 [PID]
```

#### Database Connection Issues

```bash
# Check postgres logs
docker-compose logs postgres

# Verify database connectivity
docker-compose exec backend python -c "
from dbschema.db_connector import get_db_connection
print('Database connection:', 'Success' if get_db_connection() else 'Failed')
"
```

#### Memory Issues

```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory
```

#### Build Failures

```bash
# Clear Docker cache
docker system prune -f
docker builder prune -f

# Rebuild from scratch
docker-compose build --no-cache
```

### Logging Configuration

```bash
# Enable debug logging
echo "LOG_LEVEL=DEBUG" >> .env
echo "API_DEBUG=true" >> .env

# Restart services
docker-compose restart backend

# Follow logs
docker-compose logs -f backend
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml - Multiple replicas
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - '8000-8002:8000'
```

### Load Balancing with Nginx

```nginx
upstream backend_pool {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}

server {
    location /api {
        proxy_pass http://backend_pool;
    }
}
```

## 🆘 Support

If you encounter issues:

1. **Check logs**: `docker-compose logs -f`
2. **Verify configuration**: Review `.env` file
3. **Test connectivity**: Use health check endpoints
4. **Check resources**: Ensure adequate memory/disk space
5. **Review documentation**: Re-read setup instructions

For additional support, please refer to the main README.md or create an issue in the project repository.
