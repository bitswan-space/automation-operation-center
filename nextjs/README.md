# Bitswan Pipeline Admin

A dynamic React-based (Next.js) dashboard for monitoring Pipelines and Worklows built using BitSwan.

## Features

* **Real-time Monitoring**: Stay updated with the current status of your Docker containers.
* **Responsive UI**: Access the dashboard from desktop, tablet, or mobile.
* **Secure Integrations**: Securely fetch data from Portainer.

## Prerequisites

* Node.js and pnpm
* Docker (optional for containerized deployment/ environment)

## Setup and Installation

### Local Development

1. Clone the repository:

   ```bash
   git clone git@github.com:bitswan-space/bitswan-pipeline-admin.git
   cd bitswan-pipeline-admin
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

   Visit <http://localhost:3000> in your browser.

### Docker Setup

```bash
docker-compose build
```
