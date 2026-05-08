# DJ_Tools

DJ_Tools 是一个面向个人使用场景的中文工作台项目，采用前后端分离架构，提供首页监控、TODO List、个人笔记、全局搜索、提醒通知和主题切换等能力。项目支持本地开发和 Docker Compose 一体化部署。

## 功能特性

### 首页

- TODO 概览
- 笔记概览
- 未读提醒统计
- 宿主机监控：CPU、内存、Swap、磁盘、网络、开机时长
- 应用监控：JVM 内存、GC、PID、运行时长、进程 CPU、进程内存
- Docker 容器监控：Docker 部署且 Docker Socket 可用时，可手动查询容器 CPU 与内存指标

### TODO List

- 新增、编辑、删除待办
- 支持截止时间和提醒时间
- 支持状态切换与逾期展示
- 支持完成时间、取消时间记录

待办状态：

- `PENDING`：待开始
- `IN_PROGRESS`：进行中
- `UNFINISHED`：逾期
- `COMPLETED`：已完成
- `CANCELLED`：已取消

### 个人笔记

- 文件夹分类
- 标签管理
- 标题、摘要、正文关键词搜索
- Markdown 编辑与预览
- 附件上传与删除
- 分享链接与匿名只读预览

### 全局能力

- 顶部导航：首页、TODO、笔记、全局搜索、通知、主题切换、个人设置
- 全局搜索支持 `all`、`todo`、`note` 范围
- 通知铃铛展示未读提醒与提醒列表
- 主题配置持久化
- 响应式布局，适配桌面端与移动端

## 技术栈

### 前端

- React 19
- Vite
- TypeScript
- Ant Design
- md-editor-rt
- Node.js 25+

### 后端

- Java 21
- Spring Boot 3.5
- Spring Security
- MyBatis
- PostgreSQL 18
- Flyway
- MinIO
- Actuator
- OSHI
- Docker Java

### 运维

- Docker
- Docker Compose
- Nginx

## 默认账号

首次启动后会初始化一个默认管理员账号：

- 登录账号：`admin`
- 默认密码：`123456`
- 默认昵称：`admin`
- 默认主题：`cartoon`

首次登录后需要修改初始密码。生产环境请在首次登录后立即完成密码修改，并更新部署环境中的敏感配置。

## 项目结构

```text
DJ_Tools
├── README.md
├── web/                 # 前端项目
├── server/              # 后端项目
└── ops/                 # Docker Compose 与部署配置
```

关键目录：

```text
web/src
├── api/                 # API 请求封装
├── components/          # 通用组件
├── layouts/             # 页面布局
├── pages/               # 页面
├── router/              # 路由
├── store/               # 全局状态
├── styles/              # 全局样式
└── theme/               # 主题配置

server/src/main
├── java/com/djtools
│   ├── auth/            # 认证
│   ├── dashboard/       # 首页与监控
│   ├── note/            # 笔记
│   ├── notification/    # 通知
│   ├── search/          # 搜索
│   ├── security/        # 安全配置
│   ├── todo/            # 待办
│   └── user/            # 用户设置
└── resources
    ├── db/migration/    # Flyway 迁移
    ├── mapper/          # MyBatis XML
    └── application.yml
```

## 数据库说明

项目使用 PostgreSQL 作为数据库，数据库结构由 Flyway 管理。

- 初始化迁移：`server/src/main/resources/db/migration/V1__init_schema_and_seed.sql`
- MyBatis SQL：`server/src/main/resources/mapper/*.xml`
- Mapper 接口仅保留方法定义，SQL 统一放在 XML 中
- 搜索能力基于 PostgreSQL `pg_trgm` 扩展

核心表：

- `user_account`
- `refresh_token`
- `todo_item`
- `notification`
- `note_folder`
- `note`
- `note_tag`
- `note_tag_rel`
- `note_attachment`
- `note_share`

后续版本如需调整数据库结构，请新增 `V2__*.sql`、`V3__*.sql` 等迁移文件；已发布版本不应修改已执行的历史迁移。

## 后端接口概览

### 认证与个人设置

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/initial-password`
- `GET /api/me`
- `PUT /api/me/profile`
- `PUT /api/me/password`

### 首页与监控

- `GET /api/dashboard/overview`
- `GET /api/dashboard/host-metrics`
- `GET /api/dashboard/container-metrics`
- `GET /api/dashboard/app-metrics`
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`

### TODO

- `GET /api/todos`
- `POST /api/todos`
- `PUT /api/todos/{id}`
- `PATCH /api/todos/{id}/status`
- `DELETE /api/todos/{id}`

### 笔记

- `GET /api/note-folders`
- `POST /api/note-folders`
- `GET /api/note-tags`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/{id}`
- `PUT /api/notes/{id}`
- `DELETE /api/notes/{id}`
- `GET /api/notes/{id}/attachments`
- `POST /api/notes/{id}/attachments`
- `DELETE /api/note-attachments/{id}`
- `POST /api/notes/{id}/share`
- `DELETE /api/note-shares/{id}`
- `GET /share/notes/{token}`

### 搜索

- `GET /api/search?scope=all|todo|note&keyword=...`

## 本地开发

### 启动基础设施

```bash
cd ops
docker compose up -d postgres minio
```

默认地址：

- PostgreSQL：`localhost:5432`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`

### 启动后端

```bash
cd server
mvn spring-boot:run
```

默认地址：`http://localhost:8080`

### 启动前端

```bash
cd web
npm install
npm run dev
```

默认地址：`http://localhost:5173`

Vite 默认代理：

- `/api`
- `/share`

## Docker Compose 部署

### 本地构建启动

```bash
cd ops
DOCKER_BUILDKIT=1 docker compose up -d --build
```

### 使用已发布镜像部署

项目可通过 GitHub Actions 将前后端镜像发布到 GitHub Container Registry：

- `ghcr.io/<owner>/dj-tools-server:<tag>`
- `ghcr.io/<owner>/dj-tools-web:<tag>`

生产服务器部署步骤：

```bash
cd ops
cp .env.example .env
# 编辑 .env，替换 POSTGRES_PASSWORD、MINIO_ROOT_PASSWORD、JWT_SECRET、WEB_ORIGIN 等生产配置
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

如 GHCR package 设置为私有，需要先在服务器登录：

```bash
docker login ghcr.io
```

### Vercel 与免费部署说明

Vercel 适合部署 `web/` 静态前端，但不适合直接运行本项目完整后端栈。当前后端是长期运行的 Spring Boot 服务，并依赖 PostgreSQL、MinIO，以及可选 Docker Socket 容器监控能力。

如果只将前端部署到 Vercel：

- 在 Vercel 导入 GitHub 仓库，Root Directory 选择 `web`。
- 设置环境变量 `VITE_API_BASE_URL=https://api.your-domain.example`。
- 后端、PostgreSQL、MinIO 仍需部署到其他平台。

Render、Fly.io、Railway、Koyeb 等平台可以试用免费额度部署部分服务，但通常存在休眠、持久化存储、带宽、区域或数据库额度限制。包含 PostgreSQL 和 MinIO 的完整应用更推荐部署到 VPS 或自有主机，并使用 Docker Compose 管理。

### 手动构建镜像

```bash
docker build -f server/Dockerfile -t ghcr.io/<owner>/dj-tools-server:local .
docker build -f web/Dockerfile -t ghcr.io/<owner>/dj-tools-web:local .
```

### 停止

```bash
cd ops
docker compose down
```

### 查看日志

```bash
cd ops
docker compose logs -f
```

指定服务日志：

```bash
cd ops
docker compose logs -f server
docker compose logs -f web
```

默认访问地址：

- 前端：`http://localhost:8088`
- 后端：`http://localhost:8080`
- PostgreSQL：`localhost:5432`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`

## 环境变量

常用环境变量位于 `ops/.env`，生产环境可复制 `ops/.env.example` 后修改：

- `GITHUB_REPOSITORY_OWNER`
- `IMAGE_TAG`
- `WEB_PORT`
- `SERVER_PORT`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MINIO_PORT`
- `MINIO_CONSOLE_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_BUCKET`
- `JWT_SECRET`
- `WEB_ORIGIN`

生产环境务必修改：

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

## 日志

后端日志挂载目录：

```text
ops/logs/server
```

后端日志由 `server/src/main/resources/logback-spring.xml` 控制，支持按日期和大小滚动。前端为 Nginx 容器日志，可通过 Docker Compose 查看。

## 构建与验证

前端构建：

```bash
cd web
npm install
npm run build
```

后端测试：

```bash
cd server
mvn test
```

Compose 配置检查：

```bash
cd ops
docker compose config
```

## 许可证

本项目沿用仓库根目录中的 `LICENSE`。
