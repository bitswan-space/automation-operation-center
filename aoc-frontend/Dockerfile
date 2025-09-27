FROM node:18-alpine

WORKDIR /app

# Install system dependencies for development tools
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for development mode)
RUN npm install

# Copy source code
COPY . .

# Copy entrypoint scripts
COPY docker/entrypoint /entrypoint
COPY docker/start /start
COPY docker/dev /dev-command

RUN chmod +x /entrypoint /start /dev-command

# Build the app for production (skip for dev image)
# RUN npm run build

# Install nginx for production serving
RUN apk add --no-cache nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 3000

ENTRYPOINT ["/entrypoint"]
