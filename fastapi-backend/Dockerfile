FROM python:3.13-slim-bookworm

ARG APP_VERSION
ARG BUILD_TIMESTAMP
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Enable bytecode compilation
# ENV UV_COMPILE_BYTECODE=1

WORKDIR /opt

COPY ./pyproject.toml /opt/pyproject.toml
COPY ./uv.lock /opt/uv.lock

RUN uv venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv

RUN uv sync --frozen --no-cache

# RUN pip install playwright

# RUN playwright install --with-deps chromium

WORKDIR /app

COPY ./src /app

RUN apt update && apt upgrade -y && apt install -y socat

COPY ./gel.toml /gel.toml
COPY ./dbschema /dbschema

ENV PATH="/opt/.venv/bin:$PATH"

# # Reset the entrypoint, don't invoke `uv`
# ENTRYPOINT []
