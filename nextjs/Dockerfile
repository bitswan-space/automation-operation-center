ARG BUILD_NO
ARG COMMIT_HASH

##### DEPENDENCIES

FROM --platform=linux/amd64 node:18.12-alpine3.17 AS deps

ARG BUILD_NO
ARG COMMIT_HASH

RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# Install dependencies based on the preferred package manager

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
    else echo "Lockfile not found." && exit 1; \
    fi

##### BUILDER

FROM --platform=linux/amd64 node:18.12-alpine3.17 AS builder

ARG BUILD_NO
ARG COMMIT_HASH

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_MQTT_URL wss://mqtt.bitswan.space
ENV NEXT_PUBLIC_COMMIT_HASH=${COMMIT_HASH}
ENV NEXT_PUBLIC_BUILD_NO=${BUILD_NO}

# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
    if [ -f yarn.lock ]; then SKIP_ENV_VALIDATION=1 yarn build; \
    elif [ -f package-lock.json ]; then SKIP_ENV_VALIDATION=1 npm run build; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && SKIP_ENV_VALIDATION=1 pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

##### RUNNER

FROM --platform=linux/amd64 node:18.12-alpine3.17 AS runner

ARG BUILD_NO
ARG COMMIT_HASH

WORKDIR /app

ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1

ENV NEXT_PUBLIC_MQTT_URL wss://mqtt.bitswan.space
ENV NEXT_PUBLIC_COMMIT_HASH=${COMMIT_HASH}
ENV NEXT_PUBLIC_BUILD_NO=${BUILD_NO}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
