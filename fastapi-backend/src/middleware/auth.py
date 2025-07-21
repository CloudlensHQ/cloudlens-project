from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from dbschema.db_connector import get_db_session
from dbschema.model import User, Tenant
from src.utils import verify_token


security = HTTPBearer()


class TenantContext:
    """Context class to hold user and tenant information"""
    def __init__(self, user: User, tenant: Tenant):
        self.user = user
        self.tenant = tenant
        self.user_id = user.id
        self.tenant_id = tenant.id if tenant else None


class AuthMiddleware:
    def __init__(self, require_auth: bool = True, require_tenant: bool = True):
        self.require_auth = require_auth
        self.require_tenant = require_tenant
    
    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db_session)
    ) -> Optional[TenantContext]:
        """
        Authenticate user and load tenant context
        """
        if not self.require_auth:
            return None
            
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header is required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify the token
        payload = verify_token(credentials.credentials)
        if not payload:
            print(f"Token verification failed for token: {credentials.credentials[:20]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print('payload', payload)
        
        # Get user from database
        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
        
        # Load tenant context if required
        tenant = None
        if self.require_tenant:
            if not tenant_id or not user.tenant_id or str(user.tenant_id) != tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid tenant association",
                )
            
            tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant not found",
                )
        
        return TenantContext(user=user, tenant=tenant) if tenant else user


def get_current_context(context: TenantContext = Depends(AuthMiddleware(require_auth=True, require_tenant=True))) -> TenantContext:
    """
    Dependency to get current authenticated user with tenant context
    """
    print('context', context)
    return context


def get_current_user(context: TenantContext = Depends(get_current_context)) -> User:
    """
    Dependency to get current authenticated user
    """
    return context.user


def get_current_tenant(context: TenantContext = Depends(get_current_context)) -> Tenant:
    """
    Dependency to get current user's tenant
    """
    return context.tenant


def get_tenant_scoped_context(context: TenantContext = Depends(get_current_context)) -> Tuple[User, Tenant]:
    """
    Dependency to get both user and tenant for tenant-scoped operations
    """
    return context.user, context.tenant


def get_current_active_user(context: TenantContext = Depends(get_current_context)) -> User:
    """
    Dependency to get current active user
    """
    user = context.user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return user


def get_current_verified_user(context: TenantContext = Depends(get_current_context)) -> User:
    """
    Dependency to get current verified user
    """
    user = context.user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not verified"
        )
    return user


def get_optional_context(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db_session)
) -> Optional[TenantContext]:
    """
    Optional authentication - returns context if valid token provided, None otherwise
    """
    if not credentials:
        return None
    
    payload = verify_token(credentials.credentials)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None
    
    tenant = None
    if tenant_id and user.tenant_id and str(user.tenant_id) == tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    
    return TenantContext(user=user, tenant=tenant) if tenant else None 