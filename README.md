# Automation Operations Center (AOC)

The Automation Operations Center (AOC) is a comprehensive web-based platform designed for managing BitSwan pipelines and automations. It provides a centralized interface for monitoring, deploying, and managing data processing workflows and automation tasks.

## Features

- Web-based dashboard for pipeline management
- Real-time monitoring and metrics
- Integrated authentication via Keycloak
- Pipeline deployment and version control
- Automation task scheduling and monitoring

## Prerequisites

- Docker and Docker Compose
- Python 3.10+

## Quick Start

1. Install the AOC CLI tool:

```bash
pip install .
```

2. Set up DNS

Set up DNS for `*.example.com` or whatever domain you want to use to point to your server.
You can also use a subdomain like `*.bitswan.example.com`

3. Run the setup command

```bash
aoc-cli init \
  --domain=example.com \
  --org-name="Example Org" \
  --admin-email=admin@platform.local \
  --admin-password=randompassword
```

## For local development

1. Install the AOC CLI tool:

```bash
pip install .
```

2. Setup your hosts

```
aoc update-hosts
```

3. Initialize the AOC environment

```
aoc init \
  --env=dev \
  --protocol=http \
  --domain=platform.local \
  --org-name="Example Org" \
  --admin-email=admin@platform.local \
  --admin-password=randompassword
```
