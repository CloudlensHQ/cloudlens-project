from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config import settings
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Database configuration
DATABASE_USERNAME = settings.database_username
DATABASE_PASSWORD = settings.database_password
DATABASE_NAME = settings.database_name
DATABASE_HOSTNAME = settings.database_hostname
DATABASE_PORT = settings.database_port

# Construct database URL
SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{DATABASE_USERNAME}:{DATABASE_PASSWORD}@{DATABASE_HOSTNAME}:{DATABASE_PORT}/{DATABASE_NAME}"

# Create engine with connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # poolclass=QueuePool,
    # pool_size=5,
    # max_overflow=10,
    # pool_timeout=30,
    # pool_pre_ping=True,
    # pool_recycle=600,  # Reduced from 3600 to 600 seconds
    # # Add these parameters for better connection management
    # pool_use_lifo=True,
    # echo=False,
)

# Create session factory (remove scoped_session)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Add this to prevent detached instance errors
)


@contextmanager
def get_db(application_name=None):
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        if application_name:
            db.execute(
                text("SET application_name = :app_name"), {"app_name": application_name}
            )
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
        logger.info("Database session closed")


def get_db_session():
    """FastAPI dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        logger.info("Database session closed")


# Remove the global session
# db = SessionLocal()  # Remove this line