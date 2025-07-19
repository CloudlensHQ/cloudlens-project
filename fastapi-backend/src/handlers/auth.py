from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from dbschema.db_connector import get_db_session
from dbschema.model import User
from src.schemas.auth import (
    UserSignUpRequest,
    UserSignInRequest,
    UserResponse,
    TokenResponse,
    AuthResponse,
    OnboardingRequest,
    OnboardingResponse,
    PasswordChangeRequest,
    RefreshTokenRequest,
    MessageResponse
)
from ..middleware.auth import get_current_user, get_current_active_user
from ..utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from ..config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(
    signup_data: UserSignUpRequest,
    db: Session = Depends(get_db_session)
):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = hash_password(signup_data.password)
    
    # Create new user
    new_user = User(
        email=signup_data.email,
        password_hash=password_hash,
        first_name=signup_data.first_name,
        last_name=signup_data.last_name,
        is_active=True,
        is_verified=False,
        onboarding_completed=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, 
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    # Create response
    user_response = UserResponse.from_orm(new_user)
    token_response = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=user_response
    )
    
    return AuthResponse(
        success=True,
        message="User created successfully",
        data=token_response
    )


@router.post("/signin", response_model=AuthResponse)
async def signin(
    signin_data: UserSignInRequest,
    db: Session = Depends(get_db_session)
):
    """
    Sign in a user
    """
    # Find user by email
    user = db.query(User).filter(User.email == signin_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(signin_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Create response
    user_response = UserResponse.from_orm(user)
    token_response = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=user_response
    )
    
    return AuthResponse(
        success=True,
        message="Sign in successful",
        data=token_response
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db_session)
):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    payload = verify_token(refresh_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Get user
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Create response
    user_response = UserResponse.from_orm(user)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user profile
    """
    return UserResponse.from_orm(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout user (client-side token removal)
    """
    # In a more advanced implementation, you could maintain a blacklist of tokens
    # For now, we'll just return a success message and let the client handle token removal
    return MessageResponse(
        success=True,
        message="Logout successful"
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Change user password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = hash_password(password_data.new_password)
    
    # Update user password
    current_user.password_hash = new_password_hash
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return MessageResponse(
        success=True,
        message="Password changed successfully"
    )


@router.post("/onboarding/complete", response_model=OnboardingResponse)
async def complete_onboarding(
    onboarding_data: OnboardingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Complete user onboarding
    """
    # Mark onboarding as completed
    current_user.onboarding_completed = True
    current_user.updated_at = datetime.utcnow()
    
    # Here you could save additional onboarding data to a separate table
    # For now, we'll just mark it as completed
    
    db.commit()
    
    return OnboardingResponse(
        success=True,
        message="Onboarding completed successfully",
        onboarding_completed=True
    )


@router.get("/onboarding/status", response_model=OnboardingResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user onboarding status
    """
    return OnboardingResponse(
        success=True,
        message="Onboarding status retrieved",
        onboarding_completed=current_user.onboarding_completed
    ) 