# Automation Operations Center (AOC)

The Automation Operations Center (AOC) is a comprehensive web-based platform designed for managing BitSwan pipelines and automations. It provides a centralized interface for monitoring, deploying, and managing data processing workflows and automation tasks.

## Architecture

**Frontend**: React SPA (`aoc-frontend/`) - Pure client-side application  
**Backend**: Django REST API (`django/`) - All business logic, authentication, and secrets  
**CLI**: AOC setup and management tool (`aoc_cli/`)  

## Features

- Modern React frontend with responsive design
- Django REST API backend with comprehensive authentication
- Keycloak integration for SSO and user management
- Real-time monitoring and metrics via MQTT
- Pipeline deployment and version control
- Automation task scheduling and monitoring
- Development mode with live code refresh

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- [Bitswan workspaces](https://github.com/bitswan-space/bitswan-workspaces)

## Quick Start

### Production Setup

1. Install the AOC CLI tool:
```bash
pip install .
```

2. Set up DNS for `*.yourdomain.com` to point to your server

3. Initialize AOC:
```bash
aoc init \
  --domain=yourdomain.com \
  --org-name="Your Organization" \
  --admin-email=admin@yourdomain.com
```

4. Access the platform:
- **Frontend**: https://aoc.yourdomain.com  
- **API**: https://api.yourdomain.com

### Development Setup

1. Install the AOC CLI tool:
```bash
pip install -e .
```

2. Initialize development environment:
```bash
aoc init --dev
```

3. Access the platform:
- **Frontend**: http://aoc.bitswan.localhost  
- **API**: http://api.bitswan.localhost
- **Keycloak**: http://keycloak.bitswan.localhost

Both frontend and backend run in containers with live code refresh!

## Architecture Details

### Frontend (`aoc-frontend/`)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + Radix UI components
- **State**: React Query + Context API
- **Build**: Standard React build process
- **Deployment**: Nginx static serving + API proxy

### Backend (`django/`)
- **Framework**: Django 4.2 with Django REST Framework
- **Authentication**: Keycloak integration with JWT tokens
- **Database**: PostgreSQL
- **APIs**: Comprehensive REST API for all frontend needs
- **Security**: All secrets and sensitive operations

### CLI Tool (`aoc_cli/`)
- **Language**: Python with Click
- **Purpose**: Setup, configuration, and deployment management
- **Features**: Docker orchestration, environment setup, service configuration

## Service URLs

In both development and production, services follow a consistent pattern:

- **Frontend**: `aoc.<domain>`
- **Backend API**: `api.<domain>` 
- **Keycloak**: `keycloak.<domain>`
- **MQTT**: `mqtt.<domain>`
- **InfluxDB**: `influx.<domain>`

The React frontend automatically determines the backend URL based on the current hostname.
