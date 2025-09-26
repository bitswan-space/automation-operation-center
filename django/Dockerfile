FROM docker.io/python:3.12-slim-bookworm

ARG BUILD_ENVIRONMENT=production
ARG APP_HOME=/app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    BUILD_ENV=${BUILD_ENVIRONMENT} \
    UV_CACHE_DIR=/tmp/uv-cache

WORKDIR ${APP_HOME}

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install system dependencies
RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    zlib1g-dev \
    libjpeg-dev \
    libpng-dev \
    libjpeg62-turbo \
    libpng16-16 \
    gettext \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create django user and group
RUN addgroup --system --gid 1000 django \
    && adduser --system --uid 1000 --ingroup django django \
    && mkdir -p /tmp/uv-cache \
    && chown django:django /tmp/uv-cache

# Copy scripts and application code as django user
COPY --chown=django:django ./docker/entrypoint /entrypoint
COPY --chown=django:django ./docker/start /start
COPY --chown=django:django ./docker/dev /dev-command
COPY --chown=django:django . ${APP_HOME}

RUN chmod +x /entrypoint /start /dev-command \
    && chown -R django:django ${APP_HOME}

USER django

# Reinstall Python dependencies as django user (ensures correct permissions)
RUN uv pip install .

# Compile messages with required environment variables
RUN DATABASE_URL="" \
    EMQX_JWT_SECRET="" \
    DJANGO_SETTINGS_MODULE="config.settings.test" \
    uv run python manage.py compilemessages

ENTRYPOINT ["/entrypoint"]
