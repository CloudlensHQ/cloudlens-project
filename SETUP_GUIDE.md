# CloudLens Authentication Setup Guide

## Environment Variables Setup

### Backend (.env)

1. Copy the `fastapi-backend/example_env.txt` file to `fastapi-backend/.env`
2. Fill in the following **required** values:

#### Database Configuration

```
DATABASE_HOSTNAME=your_postgres_host
DATABASE_PORT=5432
DATABASE_PASSWORD=your_db_password
DATABASE_USERNAME=your_db_username
DATABASE_NAME=cloudlens_db
```

#### Supabase Configuration

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

#### JWT Authentication (CRITICAL)

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters-long
```

**⚠️ IMPORTANT:** Generate a secure JWT secret using:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Encryption Key (CRITICAL)

```
ENCRYPTION_KEY=your-base64-encoded-encryption-key
```

**⚠️ IMPORTANT:** Generate a secure encryption key using:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Frontend (.env.local)

1. Copy the `frontend/example_env.txt` file to `frontend/.env.local`
2. Set the backend URL:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Database Setup

### Create User Table in Supabase

Run this SQL in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    onboarding_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login TIMESTAMPTZ,
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Installation & Running

### Backend

```bash
cd fastapi-backend
pip install -r requirements.txt
# or if using uv
uv sync
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Authentication Flow

1. **Sign Up:** New users register at `/signup`
2. **Onboarding:** After signup, users complete onboarding at `/onboarding`
3. **Sign In:** Existing users sign in at `/signin`
4. **Dashboard:** Authenticated users access the dashboard at `/dashboard`

## Security Features

✅ **Password Hashing:** bcrypt with salt rounds
✅ **JWT Tokens:** Secure token-based authentication
✅ **Token Refresh:** Automatic token refresh mechanism
✅ **Route Protection:** Automatic redirects based on auth status
✅ **Input Validation:** Both frontend and backend validation
✅ **Secure Storage:** JWT tokens stored securely in localStorage

## API Endpoints

### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change user password

### Onboarding

- `POST /auth/onboarding/complete` - Complete onboarding
- `GET /auth/onboarding/status` - Check onboarding status

## Troubleshooting

### Common Issues

1. **JWT Token Errors:** Make sure JWT_SECRET is set and at least 32 characters
2. **Database Connection:** Verify database credentials and connection
3. **CORS Issues:** Ensure CORS_ORIGINS includes your frontend URL
4. **Import Errors:** Install missing dependencies with `pip install -r requirements.txt`

### Development Tips

- Use `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24 hours) for development
- Set `API_DEBUG=true` for detailed error messages
- Use `LOG_LEVEL=DEBUG` for verbose logging

## Production Considerations

- [ ] Use strong, unique JWT_SECRET (minimum 32 characters)
- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment-specific database credentials
- [ ] Enable proper logging and monitoring
- [ ] Set up backup and recovery procedures
- [ ] Use secure headers and CSP policies
 