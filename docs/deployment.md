# 部署指南

## 方式一：Docker Compose 本地构建（推荐）

完整构建前后端镜像并启动全部服务：

```bash
cd ops

# 复制环境变量模板（首次部署）
cp .env.example .env
# 编辑 .env，替换密钥

# 构建并启动
DOCKER_BUILDKIT=1 docker compose up -d --build
```

启动后访问 `http://localhost:8088`。

## 方式二：Docker Compose 使用预构建镜像

适用于从 GHCR 拉取已发布镜像的生产环境：

```bash
cd ops
cp .env.example .env
# 编辑 .env，务必修改：
#   POSTGRES_PASSWORD
#   MINIO_ROOT_PASSWORD
#   JWT_SECRET
#   GITHUB_REPOSITORY_OWNER（如果你的 fork）

docker compose -f docker-compose.prod.yml --env-file .env up -d
```

如果 GHCR package 设置为私有，需要先登录：

```bash
docker login ghcr.io
```

## 环境变量

`ops/.env` 中所有可用变量：

| 变量 | 说明 | 默认值 | 生产需改 |
|------|------|--------|:--------:|
| `GITHUB_REPOSITORY_OWNER` | GitHub 用户名 | `shendongjuns` | |
| `IMAGE_TAG` | 镜像标签 | `latest` | |
| `WEB_PORT` | 前端对外端口 | `8088` | |
| `CORS_ENABLED` | 后端 CORS 开关 | `false`（Nginx 部署） | |
| `WEB_ORIGIN` | 前端访问地址 | `http://localhost:8088` | |
| `POSTGRES_DB` | 数据库名 | `dj_tools` | |
| `POSTGRES_USER` | 数据库用户 | `djtools` | |
| `POSTGRES_PASSWORD` | 数据库密码 | — | **是** |
| `MINIO_ROOT_USER` | MinIO 用户名 | `minioadmin` | |
| `MINIO_ROOT_PASSWORD` | MinIO 密码 | — | **是** |
| `MINIO_BUCKET` | 附件 Bucket 名 | `dj-tools-attachments` | |
| `JWT_SECRET` | JWT 签名密钥 | — | **是** |

生产环境务必修改的三项：
- `POSTGRES_PASSWORD`：数据库密码
- `MINIO_ROOT_PASSWORD`：对象存储密码
- `JWT_SECRET`：JWT 签名密钥，建议 256 位以上随机字符串

生成安全密钥：

```bash
# JWT 密钥（64 字节随机字符串）
openssl rand -base64 64

# 数据库密码
openssl rand -base64 32
```

## 服务端口

| 服务 | 内部端口 | 对外端口 | 说明 |
|------|----------|----------|------|
| web (Nginx) | 80 | `WEB_PORT` (8088) | 浏览器入口 |
| server | 8080 | `SERVER_PORT` (8080) | Compose 内部暴露 |
| postgres | 5432 | `POSTGRES_PORT` (5432) | 数据库 |
| minio API | 9000 | `MINIO_PORT` (9000) | 对象存储 API |
| minio Console | 9001 | `MINIO_CONSOLE_PORT` (9001) | MinIO 管理界面 |

## Docker 镜像

### 自动构建

推送代码到 `main` 分支或打 `v*.*.*` tag 时，GitHub Actions 自动构建双平台镜像并发布到 GHCR：

- `ghcr.io/<owner>/dj-tools-server:latest`
- `ghcr.io/<owner>/dj-tools-web:latest`

### 手动构建

```bash
# 后端
docker build -f server/Dockerfile -t ghcr.io/<owner>/dj-tools-server:local .

# 前端
docker build -f web/Dockerfile -t ghcr.io/<owner>/dj-tools-web:local .
```

## 数据持久化

Compose 挂载以下目录：

| 宿主机路径 | 容器路径 | 内容 |
|------------|----------|------|
| `ops/data/postgres/` | `/var/lib/postgresql` | 数据库文件 |
| `ops/data/minio/` | `/data` | 附件文件（MinIO） |
| `ops/logs/server/` | `/app/logs` | 后端文件日志 |

**备份建议**：定期备份 `ops/data/` 整个目录，以及 `.env` 文件中的密钥。

## 日志

```bash
# 全部服务
docker compose logs -f

# 指定服务
docker compose logs -f server
docker compose logs -f web

# 最近 200 行
docker compose logs --tail=200 server
```

后端日志同时写入 `ops/logs/server/`，支持按日期和大小滚动（由 `logback-spring.xml` 控制）。

## Nginx 配置

`ops/nginx/default.conf` ：

- `/` → SPA fallback 到 `index.html`
- `/api/` → 代理到 `server:8080`
- `/share/` → 代理到 `server:8080`

如需添加自定义域名或 HTTPS，修改该文件后重新构建 web 镜像或挂载自定义配置。

## 升级

```bash
cd ops

# 拉取最新代码
git pull

# 重新构建并启动
DOCKER_BUILDKIT=1 docker compose up -d --build

# 或使用新镜像
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Flyway 会在后端启动时自动执行新增的数据库迁移。
