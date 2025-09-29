# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install git for any git dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
ENV CI=false
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/build /usr/build

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy docker scripts
COPY docker/entrypoint /entrypoint
COPY docker/start /start
COPY docker/dev /dev-command

RUN chmod +x /entrypoint /start /dev-command

EXPOSE 80 3000

ENTRYPOINT ["/entrypoint"]
