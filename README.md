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
- [Bitswan workspaces](https://github.com/bitswan-space/bitswan-workspaces)

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
bitswan on-prem-aoc init \
  --domain=example.com \
  --org-name="Example Org" \
  --admin-email=admin@platform.local \
  --admin-password=randompassword
```

## For local development

1. Create a python env

```bash
python -m venv venv
```

```bash
source venv/bin/activate
```

2. Install the AOC CLI tool:

```bash
pip install -e .
```

3. Run the setup command

```bash
bitswan on-prem-aoc dev init
```

You can 'enter' everything if you want to use the default values.

Follow terminal instructions of running a docker container.

4. Install next.js dependencies

install pnpm

### For Linux
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Restart your terminal if pnpm was just installed and get into the venv again.

Go to nextjs folder and install dependencies.

```bash
cd nextjs
pnpm install
```

5. Run the development server

Make sure you have 20.0.0 node.js installed. If you have nvm you can easily change it by running `nvm use 20.0.0`

```bash
pnpm dev
```

Open the AOC in your browser at `http://localhost:3000`.

## Environment Variables

### NEXT_PUBLIC_BITSWAN_EXPERIMENTAL

Controls the visibility of experimental features in the frontend interface.

- **Type**: String (optional)
- **Values**: `"true"` (case-insensitive) to enable, any other value or unset to disable
- **Default**: Disabled (experimental features hidden)

When set to `"true"`, the following experimental features will be visible:
- Workspaces link (in main sidebar)
- Processes link (in main sidebar)
- General tab (in Settings page)

**Example usage:**
```bash
# Enable experimental features
NEXT_PUBLIC_BITSWAN_EXPERIMENTAL=true

# Disable experimental features (default)
NEXT_PUBLIC_BITSWAN_EXPERIMENTAL=false
# or simply omit the variable
```

**Note**: This is a client-side environment variable (prefixed with `NEXT_PUBLIC_`) and will be visible in the browser. Use it only for features that are safe to expose publicly.

**Automatic Setup**: The AOC CLI automatically sets this variable based on the deployment environment:
- **Development mode** (`--dev` flag): Set to `"true"` to enable experimental features
- **Production mode**: Set to `"false"` to disable experimental features
