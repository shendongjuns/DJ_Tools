# DJ_Tools

DJ_Tools 是一个面向个人场景的中文工作台项目，采用前后端分离和单仓三目录结构，当前版本聚焦三个核心能力：首页、TODO List、个人笔记。项目支持响应式布局、五套主题切换、全局搜索、全局提醒铃铛，并通过 Docker Compose 完成部署。

## 1. 项目定位

- 单用户个人工作台，V1 内置默认账号 `admin`
- 默认昵称 `admin`
- 默认密码 `123456`
- 首次登录后强制修改密码
- 后续支持修改昵称、登录账号、密码
- 页面默认中文展示
- 导航栏位于顶部
- 默认主题为卡通风格

## 2. V1 功能范围

### 2.1 首页

- 展示 TODO 概览
- 展示笔记概览
- 展示未读提醒数量
- 展示宿主机监控
- 展示 Docker 容器监控
- 展示应用监控

监控明细如下：

- 宿主机：CPU、内存、Swap、磁盘容量、网络收发、开机时长
- Docker 容器：CPU、内存
- 应用：JVM 堆内存、非堆内存、GC、PID、运行时长、进程 CPU、进程内存

说明：

- Docker 容器监控已改为自动识别，不再通过开关变量控制。
- 当服务运行在容器内且挂载了 `/var/run/docker.sock` 时，自动采集容器指标。
- 本机直接开发运行前后端时，不处于容器内，系统会自动跳过容器监控。
- 即使当前机器没有 Docker Socket 或无权限访问，系统也会自动降级，不影响整体启动。

### 2.2 TODO List

- 支持新增、编辑、删除
- 支持截止时间 `dueAt`
- 支持提醒时间 `remindAt`
- 支持状态切换
- 支持逾期与未完成计算态展示

数据库持久化状态仅保存：

- `PENDING`
- `IN_PROGRESS`
- `COMPLETED`

接口返回时会额外计算展示：

- 待完成
- 未完成
- 逾期

### 2.3 个人笔记

- 支持文件夹分类
- 支持标签
- 支持标题、摘要、正文关键词搜索
- 支持按文件夹、标签筛选
- 点击笔记后进入独立详情页
- 详情页默认优先预览
- 点击“编辑”后切换到 Markdown 编辑态
- 右侧显示目录
- Markdown 编辑器采用 `md-editor-rt`
- 支持附件上传、删除
- 支持分享链接
- 分享页匿名可访问，但仅支持只读预览

### 2.4 全局能力

- 顶部导航：首页、TODO、笔记、全局搜索、铃铛、主题切换、个人设置
- 全局搜索支持 `all`、`todo`、`note`
- 笔记页面进入时，全局搜索默认作用域自动切到笔记
- 铃铛显示未读提醒数量与提醒列表
- 主题切换结果会持久化到用户配置

## 3. 技术架构

### 3.1 前端

- React
- Vite
- Ant Design
- `md-editor-rt`
- Node 统一采用 `25`

说明：

- 你最初提到过 Node 22，但当前仓库已经统一成 Node 25，目的是让本地、镜像、构建环境保持一致，不再分裂版本。

### 3.2 后端

- Spring Boot 3
- Spring Security
- MyBatis
- PostgreSQL 18
- MinIO
- JDK 21
- Actuator
- OSHI

### 3.3 运维

- Docker
- Docker Compose
- Nginx

## 4. 镜像选型

- 前端构建镜像：`node:25-alpine`
- 前端运行镜像：`nginx:1.29-alpine`
- 后端构建镜像：`maven:3.9.14-eclipse-temurin-21-alpine`
- 后端运行镜像：`maven:3.9.14-eclipse-temurin-21-alpine`
- PostgreSQL：`postgres:18.3-alpine3.22`
- MinIO：`minio/minio:RELEASE.2025-09-07T16-13-09Z`

## 5. 主题体系

前端采用 Ant Design Token 统一驱动主题，主题预设以 JSON 注册表管理，当前提供 5 套主题：

- `cartoon`：卡通风格，默认主题
- `default`：默认主题
- `dark`：暗黑风格
- `illustration`：插画风格
- `glass`：玻璃风格

主题文件位于：

- `web/src/theme/presets/*.json`

## 6. 项目目录结构

```text
DJ_Tools
├── README.md
├── web
│   ├── Dockerfile
│   ├── package.json
│   └── src
├── server
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main
│       ├── java/com/djtools
│       │   ├── auth
│       │   ├── common
│       │   ├── config
│       │   ├── dashboard
│       │   ├── note
│       │   ├── notification
│       │   ├── search
│       │   ├── security
│       │   ├── todo
│       │   └── user
│       └── resources
│           ├── application.yml
│           ├── logback-spring.xml
│           ├── mapper
│           └── schema.sql
└── ops
    ├── .env
    ├── docker-compose.yml
    ├── postgres
    │   └── postgresql.conf
    └── nginx
        └── default.conf
```

## 7. 后端数据访问说明

### 7.1 MyBatis SQL 放置方式

当前项目已经按你的要求完成调整：

- `Mapper` 接口只保留方法定义
- SQL 全部放在 `server/src/main/resources/mapper/*.xml`
- 不再把 SQL 写在注解里

这样做的目的很直接：

- SQL 更容易集中管理
- 动态 SQL 更清晰
- 后续改表、调优、排查问题更方便

### 7.2 `resources/db` 是做什么的

当前项目里没有继续保留 `server/src/main/resources/db` 目录，原因是：

- 这个目录通常会被拿来放数据库迁移脚本
- 例如 Flyway 的 `db/migration`，或者团队自定义的初始化 SQL
- 但本项目 V1 当前并没有引入 Flyway/Liquibase
- 现在使用的是 Spring Boot 启动时执行 `server/src/main/resources/schema.sql`

所以目前数据库初始化入口只有：

- `server/src/main/resources/schema.sql`

如果后续我们引入 Flyway，再把迁移脚本放入 `resources/db` 会更合理。

## 8. 数据库模型

当前版本核心表如下：

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

搜索相关使用 PostgreSQL `pg_trgm` 扩展做关键词检索，V1 不引入独立搜索引擎。

当前数据库对象已补充：

- 表注释
- 字段注释

可直接在 DBeaver、Navicat 或 `psql` 中查看表结构说明。

## 8.1 PostgreSQL 配置说明

PostgreSQL 当前通过 [postgresql.conf](/home/ubuntu/Projects/DJ_Tools/ops/postgres/postgresql.conf) 加载一套保守通用的单机参数，重点覆盖：

- 连接数
- 缓存
- WAL 与检查点
- 查询规划
- 慢 SQL 与锁等待日志

这些参数面向个人工作台的单机部署场景设计，如果宿主机资源较小，可以继续下调内存相关项。

## 9. 后端接口概览

### 9.1 认证与个人设置

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/initial-password`
- `GET /api/me`
- `PUT /api/me/profile`
- `PUT /api/me/password`

### 9.2 首页与监控

- `GET /api/dashboard/overview`
- `GET /api/dashboard/host-metrics`
- `GET /api/dashboard/container-metrics`
- `GET /api/dashboard/app-metrics`
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`

### 9.3 TODO

- `GET /api/todos`
- `POST /api/todos`
- `PUT /api/todos/{id}`
- `PATCH /api/todos/{id}/status`
- `DELETE /api/todos/{id}`

### 9.4 笔记

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

### 9.5 搜索

- `GET /api/search?scope=all|todo|note&keyword=...`

统一返回字段：

- `scope`
- `type`
- `title`
- `snippet`
- `targetId`
- `extraMeta`

## 10. 本机开发方式

本机开发建议拆成两部分：

- 前端和后端使用本机开发模式运行
- PostgreSQL 与 MinIO 使用 Docker Compose 起本地基础设施

### 10.1 启动本地基础设施

进入 `ops` 目录后，直接使用同一个 compose 文件启动 PostgreSQL 与 MinIO：

```bash
cd ops
docker compose up -d postgres minio
```

停止本地基础设施：

```bash
cd ops
docker compose stop postgres minio
```

查看本地基础设施日志：

```bash
cd ops
docker compose logs -f postgres minio
```

启动后默认地址：

- PostgreSQL：`localhost:5432`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`

### 10.2 启动后端

```bash
cd server
mvn spring-boot:run
```

默认地址：

- `http://localhost:8080`

说明：

- 本机直接运行后端时，因为不是容器内部运行，Docker 容器监控会自动关闭。

### 10.3 启动前端

```bash
cd web
npm install
npm run dev
```

默认地址：

- `http://localhost:5173`

Vite 已代理：

- `/api`
- `/share`

## 11. Docker Compose 部署方式

线上或一体化部署时，直接使用 `docker compose` 命令，不再依赖任何脚本。

### 11.1 启动

```bash
cd ops
docker compose up -d --build
```

### 11.2 停止

```bash
cd ops
docker compose down
```

### 11.3 重启指定服务

```bash
cd ops
docker compose restart server
docker compose restart web
```

### 11.4 查看日志

查看全部日志：

```bash
cd ops
docker compose logs -f
```

查看后端日志：

```bash
cd ops
docker compose logs -f server
```

查看前端日志：

```bash
cd ops
docker compose logs -f web
```

### 11.5 默认访问地址

- 前端：`http://localhost:8088`
- 后端：`http://localhost:8080`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`

## 12. 日志挂载与回收

当前版本对前后端采用两套日志策略：

- 后端保留宿主机文件日志，便于单独查看与长期留存
- 前端依赖 Docker 自身日志能力，通过 `docker compose logs` 查看与轮转

### 12.1 后端日志

后端日志挂载目录：

- `ops/logs/server`

策略：

- 由 `server/src/main/resources/logback-spring.xml` 控制
- 同时输出控制台和文件
- 文件按“日期 + 大小”滚动
- 单文件 20MB
- 保留 15 天
- 总占用上限 1GB

### 12.2 前端日志

前端实际为 Nginx 容器日志，不再挂载宿主机文件目录。

策略：

- 由 Docker `json-file` 日志驱动负责
- 单文件上限 20MB
- 最多保留 10 份
- 通过 compose 命令查看：

```bash
cd ops
docker compose logs -f web
```

### 12.3 宿主机查看方式

后端可直接查看挂载目录中的文件，前端使用 compose 命令查看容器标准输出：

```bash
ls ops/logs/server
cd ops
docker compose logs -f web
```

## 13. 环境变量说明

常用变量位于：

- `ops/.env`

主要包括：

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

生产环境务必修改：

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

## 14. 验证建议

### 14.1 前端

```bash
cd web
npm install
npm run build
```

### 14.2 后端

```bash
cd server
mvn test
```

### 14.3 Compose 配置检查

```bash
cd ops
docker compose config
```

## 15. 当前实现说明

- 前端全局中文
- 页面响应式布局，适配桌面端与移动端
- Ant Design 主题统一通过 JSON 配置注册
- 后端按领域分包
- MyBatis SQL 全部迁移到 XML
- 数据库初始化当前使用 `schema.sql`
- PostgreSQL 已补充表字段注释与保守通用的性能配置
- `ops` 目录不再保留脚本文件

## 16. 后续可扩展方向

- 多用户与更细粒度权限模型
- 引入 Flyway 后将数据库迁移脚本独立到 `resources/db`
- 更强的中文搜索能力
- 更多个人工作台模块
- 附件匿名只读预览能力进一步增强

## 17. 许可证

本项目沿用仓库根目录中的 `LICENSE`。
