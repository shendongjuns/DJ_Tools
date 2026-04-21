FROM node:25-alpine AS builder

WORKDIR /app

# 先复制依赖清单，以便在依赖未变化时复用缓存层。
COPY ./web/package.json ./package.json

RUN npm install

COPY ./web .

RUN npm run build

FROM nginx:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./ops/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
