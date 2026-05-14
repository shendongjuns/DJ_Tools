<div align="center">

# DJ Tools

**你的个人工作台 — 待办、笔记、监控，一站打理。**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/spring--boot-3.5-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/react-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ed.svg)](https://www.docker.com/)

</div>

---

## 是什么

DJ Tools 是面向个人的一站式效率工具，把 **TODO 管理**、**Markdown 笔记**、**系统监控** 整合进一个界面，部署在你自己手里。

- 前后端分离，完整 Docker Compose 部署，一条命令启动。
- 前端 React 19 + Ant Design，后端 Spring Boot 3.5，数据全部落在你自己的 PostgreSQL 里。
- 笔记支持文件夹、标签、附件上传、公开分享，支持 Markdown 实时预览。
- 首页实时展示宿主机器、JVM、Docker 容器三项指标，运维心中有数。
- 全局搜索、通知提醒、主题切换，开箱即用。

## 功能一览

<table>
<tr>
<td width="50%">

### 首页仪表盘
- TODO / 笔记概览统计
- 未读提醒数量
- 宿主机：CPU · 内存 · 磁盘 · 网络 · 开机时长
- JVM：堆内存 · GC · 线程 · PID · 运行时长
- Docker 容器 CPU / 内存（挂载 socket 时可用）

### TODO List
- 新增、编辑、删除待办事项
- 截止时间 & 提醒时间
- 五阶段状态流转：待开始 → 进行中 → 已完成 / 已取消
- 逾期自动标记，完成/取消时间记录

</td>
<td width="50%">

### 个人笔记
- Markdown 编辑 & 实时预览
- 文件夹分类 + 标签系统
- 标题、摘要、正文三字段搜索
- 附件上传 / 删除（MinIO 存储）
- 一键生成分享链接，匿名只读预览

### 全局能力
- 顶部导航：首页 · TODO · 笔记 · 全局搜索 · 通知 · 主题
- 全局搜索覆盖 TODO + 笔记
- 通知铃铛实时提醒
- 四套主题预设，配置自动持久化
- 响应式布局，桌面端 & 移动端均可使用

</td>
</tr>
</table>

## 快速开始

确保已安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)。

```bash
git clone https://github.com/shendongjuns/DJ_Tools.git
cd DJ_Tools/ops

# 复制环境变量模板，按需修改密钥
cp .env.example .env

# 一键构建并启动全部服务
DOCKER_BUILDKIT=1 docker compose up -d --build
```

打开浏览器访问 `http://localhost:8088`，使用内置账号登录：

| 账号 | 密码 |
|------|------|
| `admin` | `123456` |

> 首次登录强制修改密码。生产环境请务必替换 `.env` 中的数据库、MinIO、JWT 密钥。

## 架构

```text
┌──────────────────────────────────────────────────┐
│                    浏览器                         │
│               http://localhost:8088              │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│                 Nginx (web 容器)                  │
│        / → dist/    /api/* → server:8080         │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│             Spring Boot (server 容器)             │
│   JWT 认证 · MyBatis · Flyway · Actuator · OSHI  │
└──────┬────────────────────┬──────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    MinIO     │
│   :5432      │   │ :9000/:9001  │
└──────────────┘   └──────────────┘
```

## 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 19 / 5.8 |
| 构建工具 | Vite | 6 |
| UI 组件 | Ant Design + md-editor-rt | 5 / 5 |
| 后端框架 | Spring Boot | 3.5 |
| 安全认证 | Spring Security + JWT (jjwt) | 0.12 |
| 持久层 | MyBatis + Flyway | 3.0 / 10.x |
| 数据库 | PostgreSQL | 18 |
| 对象存储 | MinIO | latest |
| 系统监控 | OSHI + Docker Java | 6.6 / 3.4 |
| 反向代理 | Nginx | 1.29 |
| 容器化 | Docker + Docker Compose | — |

## 本地开发

启动基础依赖后，前后端分开运行：

```bash
# 1. 启动 PostgreSQL + MinIO
cd ops && docker compose up -d postgres minio

# 2. 启动后端（另一个终端）
cd server && mvn spring-boot:run
# → http://localhost:8080

# 3. 启动前端（另一个终端）
cd web && npm install && npm run dev
# → http://localhost:5173
```

Vite 自动将 `/api` 请求代理到后端，无需额外配置。后端代码修改后手动重启 Maven 进程；前端支持热更新。

## 项目结构

```text
DJ_Tools
├── web/                    前端 React + Vite
│   ├── src/
│   │   ├── api/            API 请求层
│   │   ├── components/     通用组件
│   │   ├── layouts/        布局组件
│   │   ├── pages/          页面（登录、首页、TODO、笔记……）
│   │   ├── router/         路由 & 鉴权守卫
│   │   ├── store/          全局状态（认证、主题）
│   │   ├── styles/         全局样式
│   │   ├── theme/          主题预设 JSON
│   │   └── utils/          工具函数
│   ├── Dockerfile          Node 25 构建 → Nginx 托管
│   └── package.json
│
├── server/                 后端 Spring Boot
│   ├── src/main/java/com/djtools/
│   │   ├── auth/           认证（登录、刷新、初始密码）
│   │   ├── dashboard/      首页 & 系统监控
│   │   ├── note/           笔记、文件夹、标签、附件、分享
│   │   ├── notification/   提醒通知 & SSE 推送
│   │   ├── search/         全局搜索
│   │   ├── security/       JWT 过滤器 & 安全配置
│   │   ├── todo/           TODO CRUD & 状态机
│   │   ├── user/           用户 & 配置
│   │   ├── common/         响应体、异常处理
│   │   └── config/         基础设施配置
│   ├── src/main/resources/
│   │   ├── db/migration/   Flyway SQL
│   │   ├── mapper/         MyBatis XML
│   │   └── application.yml
│   ├── Dockerfile          Maven 构建 → JRE 运行
│   └── pom.xml
│
└── ops/                    部署 & 运维
    ├── docker-compose.yml        本地构建部署
    ├── docker-compose.prod.yml   生产镜像部署
    ├── nginx/default.conf        反向代理规则
    ├── postgres/postgresql.conf  PG 配置
    ├── .env.example              环境变量模板
    └── data/                     持久化数据（PostgreSQL + MinIO）
```

## 部署

### Docker Compose（推荐）

```bash
cd ops
cp .env.example .env
# 编辑 .env，务必替换 POSTGRES_PASSWORD、MINIO_ROOT_PASSWORD、JWT_SECRET

# 本地构建
DOCKER_BUILDKIT=1 docker compose up -d --build

# 或使用已发布的 GHCR 镜像
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

推送代码到 `main` 分支后，GitHub Actions 自动构建 `linux/amd64` + `linux/arm64` 双平台镜像并发布到 GHCR。

### 查看日志

```bash
docker compose logs -f          # 全部服务
docker compose logs -f server   # 仅后端
docker compose logs -f web      # 仅前端
```

### 停止

```bash
docker compose down
```

## 环境变量

所有可配置变量见 `ops/.env.example`。生产部署必须修改以下三项：

| 变量 | 说明 |
|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 |
| `MINIO_ROOT_PASSWORD` | MinIO 对象存储密码 |
| `JWT_SECRET` | JWT 签名密钥，建议 256 位以上随机字符串 |

## 接口索引

### 认证 & 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 退出 |
| POST | `/api/auth/initial-password` | 首次修改密码 |
| GET | `/api/me` | 获取当前用户信息 |
| PUT | `/api/me/profile` | 更新个人信息 |
| PUT | `/api/me/password` | 修改密码 |

### 首页 & 监控

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/overview` | 首页概览 |
| GET | `/api/dashboard/host-metrics` | 宿主机指标 |
| GET | `/api/dashboard/container-metrics` | Docker 容器指标 |
| GET | `/api/dashboard/app-metrics` | JVM 应用指标 |
| GET | `/api/notifications` | 通知列表 |
| PUT | `/api/notifications/{id}/read` | 标记已读 |

### TODO

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/todos` | 列表 |
| POST | `/api/todos` | 新增 |
| PUT | `/api/todos/{id}` | 编辑 |
| PATCH | `/api/todos/{id}/status` | 状态变更 |
| DELETE | `/api/todos/{id}` | 删除 |

### 笔记

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/note-folders` | 文件夹列表 |
| POST | `/api/note-folders` | 新建文件夹 |
| GET | `/api/note-tags` | 标签列表 |
| GET/POST | `/api/notes` | 笔记列表 / 新增 |
| GET/PUT/DELETE | `/api/notes/{id}` | 笔记详情 / 编辑 / 删除 |
| GET/POST | `/api/notes/{id}/attachments` | 附件列表 / 上传 |
| DELETE | `/api/note-attachments/{id}` | 删除附件 |
| POST | `/api/notes/{id}/share` | 创建分享 |
| DELETE | `/api/note-shares/{id}` | 取消分享 |
| GET | `/share/notes/{token}` | 匿名查看分享笔记 |

### 搜索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/search?scope=all\|todo\|note&keyword=...` | 全局搜索 |

## 许可证

[MIT](LICENSE)

---

<div align="center">
  <sub>Built with ❤︎ by <a href="https://github.com/shendongjuns">shendongjuns</a></sub>
</div>
