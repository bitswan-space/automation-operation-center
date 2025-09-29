FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm install

COPY . .

COPY docker/entrypoint /entrypoint
COPY docker/start /start
COPY docker/dev /dev-command

RUN chmod +x /entrypoint /start /dev-command

ENV CI=false
RUN npm run build

RUN apk add --no-cache nginx

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 3000

ENTRYPOINT ["/entrypoint"]
