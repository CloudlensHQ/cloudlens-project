# Frontend Docker Setup Guide

## Overview

This directory contains Docker configuration for the CloudLens frontend (Next.js application) with both production and development setups.

## Files Structure

```
frontend/
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Production setup
├── docker-compose.dev.yml  # Development setup with hot reload
├── package.json            # Dependencies and scripts
└── DOCKER_README.md        # This guide
```

## Quick Start

### Production Setup

```bash
# Build and run production container
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop the container
docker-compose down
```

### Development Setup (Hot Reload)

```bash
# Build and run development container with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build

# Stop the development container
docker-compose -f docker-compose.dev.yml down
```

## Configuration Details

### Production Configuration (`docker-compose.yml`)

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner # Uses production stage
    container_name: cloudlens-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    networks:
      - cloudlens-network
    restart: unless-stopped
```

**Features:**

- ✅ **Optimized Build**: Multi-stage Docker build for smaller image size
- ✅ **Production Ready**: NODE_ENV=production for optimal performance
- ✅ **Auto Restart**: Container restarts automatically if it crashes
- ✅ **Network Isolation**: Uses dedicated Docker network

### Development Configuration (`docker-compose.dev.yml`)

```yaml
services:
  frontend-dev:
    build:
      target: base # Uses base stage with dev dependencies
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true # Enables file watching in Docker
    volumes:
      - .:/app # Mount source code for hot reload
      - /app/node_modules # Preserve node_modules
      - /app/.next # Preserve Next.js cache
    command: ["pnpm", "dev"] # Runs dev server with Turbopack
```

**Features:**

- ✅ **Hot Reload**: File changes trigger automatic rebuilds
- ✅ **Volume Mounts**: Source code changes reflected immediately
- ✅ **Turbopack**: Fast refresh with Next.js Turbopack
- ✅ **Development Tools**: Full Next.js development experience

## Environment Variables

### Required Environment Variables

| Variable                  | Description         | Production              | Development             |
| ------------------------- | ------------------- | ----------------------- | ----------------------- |
| `NODE_ENV`                | Runtime environment | `production`            | `development`           |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL     | `http://localhost:8000` | `http://localhost:8000` |
| `PORT`                    | Application port    | `3000`                  | `3000`                  |
| `HOSTNAME`                | Bind hostname       | `0.0.0.0`               | `0.0.0.0`               |

### Optional Environment Variables

| Variable            | Purpose                 | Default           |
| ------------------- | ----------------------- | ----------------- |
| `WATCHPACK_POLLING` | File watching in Docker | `true` (dev only) |

### Customizing Environment Variables

Create a `.env` file in the frontend directory:

```bash
# .env file
NODE_ENV=development
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME=CloudLens
```

Then reference it in docker-compose:

```yaml
services:
  frontend:
    env_file:
      - .env
    # ... other config
```

## Docker Commands Reference

### Basic Operations

```bash
# Build without cache
docker-compose build --no-cache

# View logs
docker-compose logs -f frontend

# Execute commands in running container
docker-compose exec frontend sh

# Check container status
docker-compose ps

# Remove containers and networks
docker-compose down --remove-orphans
```

### Development Operations

```bash
# Rebuild development container
docker-compose -f docker-compose.dev.yml build --no-cache

# View development logs
docker-compose -f docker-compose.dev.yml logs -f frontend-dev

# Access development container shell
docker-compose -f docker-compose.dev.yml exec frontend-dev sh

# Install new packages (development)
docker-compose -f docker-compose.dev.yml exec frontend-dev pnpm add package-name
```

### Image Management

```bash
# List Docker images
docker images | grep frontend

# Remove unused images
docker image prune

# Remove specific image
docker rmi cloudlens-frontend
```

## Integration with Backend

### Backend Connection

The frontend connects to the backend using the `NEXT_PUBLIC_BACKEND_URL` environment variable.

**Default Setup:**

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`

### Running Full Stack

1. **Start Backend First:**

   ```bash
   cd ../fastapi-backend
   docker-compose up -d
   ```

2. **Start Frontend:**

   ```bash
   cd ../frontend
   docker-compose up -d
   ```

3. **Access Applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

### Network Configuration

For container-to-container communication, you might want to use a shared network:

```yaml
# In both frontend and backend docker-compose.yml
networks:
  cloudlens-network:
    external: true
    name: shared-cloudlens-network
```

Create the shared network:

```bash
docker network create shared-cloudlens-network
```

## Dockerfile Explanation

### Multi-Stage Build Process

1. **Base Stage**: Install pnpm and setup workspace
2. **Dependencies Stage**: Install production dependencies only
3. **Builder Stage**: Install all dependencies and build the application
4. **Runner Stage**: Final production image with minimal footprint

### Build Targets

```bash
# Build specific stage
docker build --target base -t frontend-base .
docker build --target deps -t frontend-deps .
docker build --target builder -t frontend-builder .
docker build --target runner -t frontend-runner .
```

## Performance Optimization

### Production Optimizations

- ✅ **Multi-stage build** reduces final image size
- ✅ **Non-root user** improves security
- ✅ **Production dependencies only** in final image
- ✅ **Next.js standalone output** for minimal runtime

### Development Optimizations

- ✅ **Turbopack** for faster development builds
- ✅ **Volume mounts** for instant file changes
- ✅ **Polling** for reliable file watching in Docker

## Troubleshooting

### Common Issues

#### 1. Hot Reload Not Working

```bash
# Ensure WATCHPACK_POLLING is enabled
environment:
  - WATCHPACK_POLLING=true

# Check volume mounts are correct
volumes:
  - .:/app
  - /app/node_modules
```

#### 2. Backend Connection Issues

```bash
# Check backend is running
curl http://localhost:8000/docs

# Verify environment variable
docker-compose exec frontend env | grep BACKEND_URL

# Check network connectivity
docker-compose exec frontend curl http://localhost:8000/docs
```

#### 3. Build Failures

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build --dry-run .
```

#### 4. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process or change port
ports:
  - "3001:3000"  # Map to different host port
```

### Debugging Commands

```bash
# Check container logs
docker-compose logs frontend

# Access container shell
docker-compose exec frontend sh

# Check running processes in container
docker-compose exec frontend ps aux

# Check disk usage
docker-compose exec frontend df -h

# Test network connectivity
docker-compose exec frontend ping backend
```

## Best Practices

### Development Workflow

1. **Always use development compose** for active development
2. **Test with production compose** before deployment
3. **Use volume mounts** for instant feedback
4. **Keep dependencies updated** in both stages

### Production Deployment

1. **Use production compose** for staging/production
2. **Set proper environment variables** for target environment
3. **Use external networks** for service communication
4. **Monitor container health** and logs

### Security Considerations

1. **Non-root user** in production containers
2. **Minimal attack surface** with multi-stage builds
3. **Environment variable management** (avoid secrets in compose files)
4. **Network isolation** between services

## Scripts and Automation

### Makefile (Optional)

Create a `Makefile` for common operations:

```makefile
.PHONY: dev prod build clean logs

dev:
	docker-compose -f docker-compose.dev.yml up --build

prod:
	docker-compose up --build

build:
	docker-compose build --no-cache

clean:
	docker-compose down --remove-orphans
	docker system prune -f

logs:
	docker-compose logs -f
```

Usage:

```bash
make dev    # Start development
make prod   # Start production
make clean  # Clean up
```

## Monitoring and Logs

### Log Management

```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# Filter logs by service
docker-compose logs frontend

# Save logs to file
docker-compose logs > frontend-logs.txt
```

### Health Checks

Add health checks to monitor application status:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Next Steps

1. **Configure CI/CD** to build and deploy containers
2. **Set up monitoring** for production deployments
3. **Implement health checks** for container orchestration
4. **Add SSL/TLS** for production HTTPS
5. **Configure load balancing** for scalability

---

## Quick Commands Summary

| Purpose           | Command                                               |
| ----------------- | ----------------------------------------------------- |
| **Development**   | `docker-compose -f docker-compose.dev.yml up --build` |
| **Production**    | `docker-compose up --build`                           |
| **Stop Services** | `docker-compose down`                                 |
| **View Logs**     | `docker-compose logs -f`                              |
| **Shell Access**  | `docker-compose exec frontend sh`                     |
| **Rebuild**       | `docker-compose build --no-cache`                     |

Happy coding! 🚀
