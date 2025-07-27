FROM python:3.13-slim-bookworm

ARG APP_VERSION
ARG BUILD_TIMESTAMP
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

WORKDIR /opt

COPY ./pyproject.toml /opt/pyproject.toml
COPY ./uv.lock /opt/uv.lock

RUN uv venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv

RUN uv sync --frozen --no-cache

# application directory
WORKDIR /app

# copy src directory
COPY ./src /app/src

# install socat and netcat for database connectivity
RUN apt update && apt upgrade -y && apt install -y socat netcat-openbsd

# copy dbschema directory
COPY ./dbschema /app/dbschema

# set path
ENV PATH="/opt/.venv/bin:$PATH"

# install curl for health checks
RUN apt update && apt install -y curl

# # Default command to run the application
# CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
