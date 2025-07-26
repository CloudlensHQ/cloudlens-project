# Tenant-Scoped Authentication System

## Overview

This system implements a secure, tenant-scoped authentication mechanism where:

- **Signup Process**: Automatically creates a tenant for each new user
- **JWT Tokens**: Include tenant information for automatic scoping
- **API Endpoints**: Automatically scoped to the authenticated user's tenant
- **Next.js Middleware**: Handles JWT validation, token refresh, and automatic redirects
- **API Client**: Automatically attaches tokens and handles authentication

## 🔧 Key Features

### Backend Features

- ✅ **Automatic Tenant Creation**: New users get their own tenant/organization
- ✅ **JWT with Tenant Context**: Tokens include user_id, tenant_id, and email
- ✅ **Tenant-Scoped Middleware**: All API calls are automatically scoped to user's tenant
- ✅ **Secure Password Handling**: bcrypt hashing with proper salt rounds
- ✅ **Token Refresh**: Automatic token refresh for seamless user experience

### Frontend Features

- ✅ **Next.js Middleware**: Handles route protection and token management
- ✅ **Automatic Token Attachment**: API calls automatically include auth headers
- ✅ **Tenant Context Headers**: X-User-ID and X-Tenant-ID headers automatically added
- ✅ **Cookie Integration**: Tokens stored in both localStorage and cookies
- ✅ **Proactive Token Refresh**: Tokens refreshed before expiration

## 🔄 Authentication Flow

### 1. User Signup

```typescript
// User signs up
const response = await signup(
  'john@example.com',
  'Password123!',
  'John',
  'Doe'
);

// Backend automatically:
// 1. Creates a new Tenant for the user
// 2. Creates User with tenant_id assigned
// 3. Generates JWT with tenant context
// 4. Returns token with user and tenant info
```

### 2. JWT Token Structure

```json
{
  "sub": "user-uuid-here",
  "tenant_id": "tenant-uuid-here",
  "email": "john@example.com",
  "exp": 1640995200
}
```

### 3. API Call Flow

```typescript
// Frontend makes API call
const response = await apiClient.get('/api/scan/scans');

// Middleware automatically:
// 1. Checks token expiration
// 2. Refreshes token if needed
// 3. Adds Authorization header
// 4. Adds X-User-ID and X-Tenant-ID headers

// Backend automatically:
// 1. Validates JWT token
// 2. Extracts tenant context
// 3. Scopes all database queries to user's tenant
```

## 🛠 Implementation Details

### Backend Authentication Middleware

```python
# New TenantContext class
class TenantContext:
    def __init__(self, user: User, tenant: Tenant):
        self.user = user
        self.tenant = tenant
        self.user_id = user.id
        self.tenant_id = tenant.id

# Dependency injection for tenant-scoped endpoints
@api.post("/scans")
async def get_scans(
    request: ScanListRequest,
    context: TenantContext = Depends(get_current_context),
    db: Session = Depends(get_db)
):
    # Query automatically scoped to user's tenant
    query = db.query(CloudScan).filter(CloudScan.created_by == context.tenant_id)
```

### Frontend API Client

```typescript
// Automatic token management
class ApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const headers = { 'Content-Type': 'application/json' };

    // Automatic token attachment
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Automatic tenant context
    if (userData) {
      headers['X-User-ID'] = userData.id;
      headers['X-Tenant-ID'] = userData.tenantId;
    }

    return headers;
  }
}
```

### Next.js Middleware

```typescript
// Automatic route protection and token management
export async function middleware(request: NextRequest) {
  // Token expiration check
  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken);

  // Automatic token refresh
  if (!isAuthenticated && hasValidRefreshToken) {
    const refreshedTokens = await refreshTokens(refreshToken);
    // Update cookies automatically
  }

  // Route protection
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
```

## 📝 Usage Examples

### 1. Creating Tenant-Scoped Endpoints

**Before (Manual Tenant ID)**:

```python
@api.post("/scans")
async def get_scans(request: ScanListRequest, db: Session = Depends(get_db)):
    # Manual tenant filtering
    query = db.query(CloudScan).filter(CloudScan.created_by == request.tenant_id)
```

**After (Automatic Tenant Scoping)**:

```python
@api.post("/scans")
async def get_scans(
    request: ScanListRequest,
    context: TenantContext = Depends(get_current_context),
    db: Session = Depends(get_db)
):
    # Automatic tenant scoping
    query = db.query(CloudScan).filter(CloudScan.created_by == context.tenant_id)
```

### 2. Frontend API Calls

```typescript
// No need to manually pass tenant_id or manage tokens
const useScans = () => {
  const { data, error } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      // apiClient automatically adds auth headers and tenant context
      const response = await apiClient.post('/api/scan/scans', {
        status: 'COMPLETED',
        limit: 50,
      });
      return response.data;
    },
  });
};
```

### 3. Protected Route Component

```typescript
// Routes are automatically protected by middleware
function Dashboard() {
  const { user } = useAuth(); // Always authenticated here

  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <p>Organization: {user.tenant?.name}</p>
    </div>
  );
}
```

## 🔒 Security Features

### 1. Password Security

- **bcrypt hashing** with proper salt rounds
- **Password strength validation** (8+ chars, uppercase, lowercase, numbers)
- **Password change** requires current password verification

### 2. JWT Security

- **Short-lived access tokens** (30 minutes default)
- **Long-lived refresh tokens** (30 days default)
- **Automatic token rotation** on refresh
- **Secure token storage** (httpOnly cookies + localStorage)

### 3. Route Protection

- **Middleware-level protection** for all routes
- **Automatic redirects** based on auth status
- **Onboarding flow enforcement**
- **Token validation** on every request

## 🚀 Migration Guide

### For Existing Endpoints

1. **Update imports**:

```python
from ..middleware.auth import get_current_context, TenantContext
```

2. **Update function signature**:

```python
# Before
async def my_endpoint(request: MyRequest, db: Session = Depends(get_db)):

# After
async def my_endpoint(
    request: MyRequest,
    context: TenantContext = Depends(get_current_context),
    db: Session = Depends(get_db)
):
```

3. **Remove tenant_id from request models**:

```python
# Before
class MyRequest(BaseModel):
    tenant_id: str  # Remove this
    other_field: str

# After
class MyRequest(BaseModel):
    other_field: str  # tenant_id comes from context
```

4. **Use context.tenant_id instead of request.tenant_id**:

```python
# Before
query = db.query(MyModel).filter(MyModel.tenant_id == request.tenant_id)

# After
query = db.query(MyModel).filter(MyModel.tenant_id == context.tenant_id)
```

### For Frontend Components

1. **Use the new API client**:

```typescript
import { useApiClient } from '@/lib/api/client';

function MyComponent() {
  const apiClient = useApiClient();

  const fetchData = async () => {
    // No need to manually add tenant_id or auth headers
    const response = await apiClient.get('/api/my-endpoint');
    return response.data;
  };
}
```

2. **Remove manual tenant_id passing**:

```typescript
// Before
const response = await fetch('/api/scans', {
  method: 'POST',
  body: JSON.stringify({
    tenant_id: user.tenantId, // Remove this
    status: 'COMPLETED',
  }),
});

// After
const response = await apiClient.post('/api/scans', {
  status: 'COMPLETED', // tenant_id automatic
});
```

## 📋 Checklist for Implementation

### Backend Setup

- [x] Update User model with tenant relationship
- [x] Create TenantContext and updated middleware
- [x] Update authentication endpoints to create/assign tenants
- [x] Include tenant_id in JWT tokens
- [x] Update example endpoints to use tenant context

### Frontend Setup

- [x] Create Next.js middleware for route protection
- [x] Update AuthContext to store tenant info in cookies
- [x] Create enhanced API client with auto-token attachment
- [x] Update route protection logic
- [x] Create onboarding flow

### Database Setup

- [x] Add User table with tenant foreign key
- [x] Create indexes for performance
- [x] Add updated_at triggers

## 🎯 Benefits

1. **Security**: All data is automatically scoped to the correct tenant
2. **Developer Experience**: No need to manually pass tenant_id everywhere
3. **Scalability**: Easy to add new tenant-scoped endpoints
4. **Maintainability**: Centralized authentication logic
5. **User Experience**: Seamless token refresh and route protection

This system provides a robust foundation for multi-tenant SaaS applications with enterprise-grade security and excellent developer experience.
