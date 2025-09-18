# define an alias for the specific python version used in this file.
FROM docker.io/python:3.11.8-slim-bookworm as python

# Python build stage
FROM python as python-build-stage

ARG BUILD_ENVIRONMENT=production

# Install apt packages
RUN apt-get update && apt-get install --no-install-recommends -y \
  # dependencies for building Python packages
  build-essential \
  # psycopg2 dependencies
  libpq-dev \
  # Pillow dependencies
  zlib1g-dev \
  libjpeg-dev \
  libpng-dev \
  # Cleaning up
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Requirements are installed here to ensure they will be cached.
COPY ./requirements .

# Upgrade pip and install wheel
RUN pip install --upgrade pip wheel setuptools

# Create Python Dependency and Sub-Dependency Wheels.
RUN pip wheel --wheel-dir /usr/src/app/wheels \
  --no-cache-dir \
  -r ${BUILD_ENVIRONMENT}.txt


# Python 'run' stage
FROM python as python-run-stage

ARG BUILD_ENVIRONMENT=production
ARG APP_HOME=/app

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  BUILD_ENV=${BUILD_ENVIRONMENT}

WORKDIR ${APP_HOME}

RUN addgroup --system --gid 1000 django \
  && adduser --system --uid 1000 --ingroup django django

# Install required system dependencies
RUN apt-get update && apt-get install --no-install-recommends -y \
  # psycopg2 dependencies
  libpq-dev \
  # Pillow dependencies
  libjpeg62-turbo \
  libpng16-16 \
  # Translations dependencies
  gettext \
  # cleaning up unused files
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# All absolute dir copies ignore workdir instruction. All relative dir copies are wrt to the workdir instruction
# copy python dependency wheels from python-build-stage
COPY --from=python-build-stage /usr/src/app/wheels  /wheels/

# use wheels to install python dependencies
RUN pip install --no-cache-dir --no-index --find-links=/wheels/ /wheels/* \
  && rm -rf /wheels/

# Script files
COPY --chown=django:django ./docker/entrypoint /entrypoint
COPY --chown=django:django ./docker/start /start
COPY --chown=django:django ./docker/dev /dev


# copy application code to WORKDIR
COPY --chown=django:django . ${APP_HOME}

RUN chmod +x /entrypoint /start /dev

# make django owner of the WORKDIR directory as well.
RUN chown django:django ${APP_HOME}

USER django

# Compile messages with required environment variables
RUN DATABASE_URL="" \
  EMQX_JWT_SECRET="" \
  DJANGO_SETTINGS_MODULE="config.settings.test" \
  python manage.py compilemessages

ENTRYPOINT ["/entrypoint"]
