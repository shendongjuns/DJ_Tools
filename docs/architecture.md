# 架构说明

## 总览

DJ Tools 采用前后端分离的单仓库结构，分为三个目录：

| 目录 | 定位 | 技术栈 |
|------|------|--------|
| `web/` | 前端 SPA | React 19 + Vite + TypeScript + Ant Design |
| `server/` | 后端 API | Spring Boot 3.5 + MyBatis + JWT |
| `ops/` | 部署运维 | Docker Compose + Nginx + PostgreSQL + MinIO |

## 部署拓扑

```text
┌─────────────────────────────────────────────────────────┐
│                      Docker Host                         │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   web    │    │    server    │    │   postgres   │  │
│  │  Nginx   │───▶│  Spring Boot │───▶│  PostgreSQL  │  │
│  │  :80     │    │  :8080       │    │  :5432       │  │
│  └──────────┘    └──────┬───────┘    └──────────────┘  │
│                         │                               │
│                         │    ┌──────────────┐           │
│                         └───▶│    minio     │           │
│                              │  :9000/9001  │           │
│                              └──────────────┘           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              /var/run/docker.sock (ro)            │  │
│  │              容器指标采集（可选）                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 请求链路

```
浏览器 → Nginx (:80) → /api/* 代理到 server:8080
                      → 其他路径 fallback 到 /index.html（SPA）
                      → /share 公开分享笔记，无需认证
```

生产环境下 Nginx 承担反向代理，浏览器与后端同源，无需额外跨域配置。

## 前端架构

### 路由

| 路径 | 页面 | 认证要求 |
|------|------|----------|
| `/login` | 登录 | 否 |
| `/initial-password` | 首次密码修改 | 强制重定向 |
| `/` | 首页仪表盘 | JWT |
| `/todos` | TODO 列表 | JWT |
| `/notes` | 笔记列表 | JWT |
| `/notes/:id` | 笔记详情 | JWT |
| `/share/notes/:token` | 分享笔记预览 | 否（公开） |

### 状态管理

- **认证状态** — `AuthContext`：JWT token、用户信息、localStorage 同步、401 自动登出
- **主题状态** — `ThemeContext`：主题预设加载、切换、localStorage 持久化

### API 层

```
组件 → services.ts (领域封装) → client.ts (axios 实例) → 后端 API
```

`client.ts` 统一处理：
- 请求头注入 JWT `Authorization: Bearer <token>`
- 响应体解包 `{ success, data, message }`
- HTTP 401 → 清除本地会话 → 跳转登录
- 全局异常 → 派发 `djtools:system-error` 事件 → `GlobalErrorPrompt` 展示

## 后端架构

### 分层结构

```text
Controller  →  Service  →  Mapper (接口)  →  MyBatis XML (SQL)
    │                          │
    ├── 参数校验                ├── 接口在 Java 中定义
    ├── 权限检查                └── SQL 在 resources/mapper/*.xml 中
    └── 响应封装
```

### 安全模型

**无状态认证**，不依赖服务端 Session。

```text
1. POST /api/auth/login → 返回 accessToken + refreshToken
2. 前端存储 token → 后续请求携带 Authorization: Bearer <accessToken>
3. Access Token 过期（120 分钟）→ 前端用 refreshToken 换取新 accessToken
4. Refresh Token 有效期 14 天，存储在数据库可主动吊销
5. 退出登录 → 删除 refreshToken 记录 → 前端清除存储
```

**公开端点**（无需认证）：

- `/api/auth/**` — 登录、刷新、退出、初始密码
- `/actuator/health` — 健康检查
- `GET /api/share/notes/**` — 公开分享笔记

**强制首次改密**：`InitialPasswordEnforcementFilter` 检查 `forcePasswordChange` 标志，拦截所有非改密请求。

### 领域模块

| 模块 | 包路径 | 职责 |
|------|--------|------|
| auth | `com.djtools.auth` | 登录、刷新令牌、退出、初始密码修改 |
| user | `com.djtools.user` | 个人资料、密码修改、启动时默认账号初始化 |
| todo | `com.djtools.todo` | TODO CRUD、五阶段状态机、逾期检测 |
| note | `com.djtools.note` | 文件夹、标签、笔记、附件、分享链接 |
| notification | `com.djtools.notification` | 提醒记录、SSE 实时推送 |
| search | `com.djtools.search` | 跨 TODO + 笔记全文搜索 |
| dashboard | `com.djtools.dashboard` | 首页概览、宿主机器/JVM/Docker 容器指标 |
| security | `com.djtools.security` | JWT 生成/解析、过滤器链、当前用户上下文 |
| common | `com.djtools.common` | 统一响应体 `ApiResponse<T>`、全局异常处理 |
| config | `com.djtools.config` | 属性绑定、CORS、SecurityConfig、基础设施 Bean |

## 数据层

### 数据库

PostgreSQL 18，Flyway 管理迁移版本。

```
server/src/main/resources/
├── db/migration/
│   └── V1__init_schema_and_seed.sql   基线迁移（表、索引、种子数据）
└── mapper/
    ├── UserAccountMapper.xml
    ├── RefreshTokenMapper.xml
    ├── TodoMapper.xml
    ├── NoteMapper.xml
    ├── NoteFolderMapper.xml
    ├── NoteTagMapper.xml
    ├── NoteTagRelationMapper.xml
    ├── NoteAttachmentMapper.xml
    ├── NoteShareMapper.xml
    ├── NotificationMapper.xml
    └── SearchMapper.xml
```

核心表：`user_account` · `refresh_token` · `todo_item` · `notification` · `note_folder` · `note` · `note_tag` · `note_tag_rel` · `note_attachment` · `note_share`

### 搜索

基于 PostgreSQL `pg_trgm` 扩展的 trigram 模糊匹配，支持中文分词。对笔记标题、摘要、正文以及 TODO 标题建立索引。

## 容器化

### 后端 Dockerfile（`server/Dockerfile`）

两阶段构建：
1. **builder**：Maven + JDK 21 Alpine，BuildKit 缓存挂载 Maven 依赖
2. **runtime**：JRE 21 Alpine，仅复制 jar 包

### 前端 Dockerfile（`web/Dockerfile`）

两阶段构建：
1. **builder**：Node 25 Alpine，`npm install` → `npm run build`
2. **runtime**：Nginx 1.29 Alpine，托管 `dist/` + 挂载 `default.conf`

### 镜像发布

推送到 `main` 分支或打 `v*.*.*` tag 时，GitHub Actions 自动构建 `linux/amd64` + `linux/arm64` 双平台镜像并发布到 GHCR。
