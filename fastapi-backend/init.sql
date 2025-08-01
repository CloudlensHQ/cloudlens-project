-- Initialize PostgreSQL database with required extensions
-- This file is executed when the PostgreSQL container starts up

-- Enable UUID extension for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- You can add any other initialization scripts here 