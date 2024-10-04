# Bitswan Pipeline Admin

A dynamic React-based (Next.js) dashboard for monitoring Pipelines and Worklows built using BitSwan.

## Features

* **Real-time Monitoring**: Stay updated with the current status of your Docker containers.
* **Responsive UI**: Access the dashboard from desktop, tablet, or mobile.
* **Secure Integrations**: Securely fetch data from Portainer.

## Prerequisites

* Node.js and pnpm
* Docker (optional for containerized deployment/ environment)
* Running MQTT Broker - EMQX
* Running InfluxDB Instance (Hooked up to Monitored Pipelines)
* Running Keycloak Instance (Authentication)
* Running AOC Django Backend Instance


## Architecture

![Architecture Diagram](https://cdn.discordapp.com/attachments/1199407607694250088/1291692858147082323/image.png?ex=67010637&is=66ffb4b7&hm=23750d4cbd86e59e956ed66b4735357143260b97cdc871f0939714db206c33f2&)

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

3. Setup the following environment variables:

   ```bash
   # INFLUX DB
   INFLUXDB_URL=""
   INFLUXDB_TOKEN=""
   INFLUXDB_ORG=""
   INFLUXDB_BUCKET=""


   # KEYCLOAK prod
   KEYCLOAK_CLIENT_ID=""
   KEYCLOAK_CLIENT_SECRET=""
   KEYCLOAK_ISSUER=""
   KEYCLOAK_REFRESH_URL=""
   KEYCLOAK_END_SESSION_URL=""
   KEYCLOAK_POST_LOGOUT_REDIRECT_URI=""


   # AOC Django Backend
   NEXT_PUBLIC_AOC_BACKEND_API_URL=""

   # EMQX
   EMQX_JWT_SECRET=""
   EMQX_MQTT_URL=""


   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   Visit <http://localhost:3000> in your browser.

### Docker Setup

```bash
docker-compose build
```
