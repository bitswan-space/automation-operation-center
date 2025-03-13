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

1. create a python env

```bash
python -m venv venv
```

```
source venv/bin/activate
```

2. Install the AOC CLI tool:

```bash
pip install -e .
```

3. Run the setup command

```bash
aoc dev init
```

you can 'enter' everything if you want to use the default values

follow terminal instructions of running a docker container

4. Install next.js dependencies

install pnpm

### For Linux
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

restart your terminal if pnpm was just installed and get into the venv again.

go to nextjs folder and install dependencies

```bash
cd nextjs
pnpm install
```

5. Run the development server

Make sure you have 20.0.0 node.js installed. If you have nvm you can easily change it by running `nvm use 20.0.0`

```bash
pnpm dev
```

6. Open the AOC in your browser at `http://localhost:3000`
