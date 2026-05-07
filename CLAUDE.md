# CLAUDE.md

本文件用于说明 Claude Code（claude.ai/code）在本仓库中工作时应遵循的项目约定。

## 项目概览

DJ_Tools 是一个中文个人工作台项目，采用前后端分离架构和三目录单仓库结构：

- `web/`：React 19 + Vite + TypeScript 前端，使用 Ant Design 和 `md-editor-rt`
- `server/`：Java 21 + Spring Boot 3.5 后端，使用 Spring Security、MyBatis、PostgreSQL、Flyway、MinIO、Actuator、OSHI 和 Docker Java
- `ops/`：Docker Compose、PostgreSQL、Nginx 和部署配置

V1 产品范围包括首页监控、TODO、个人笔记、全局搜索、通知铃铛和主题切换。界面文案和面向产品的行为默认使用中文。内置初始账号为 `admin` / `123456`，首次登录后需要修改密码。

## 项目专用 Skill 使用规则

- 开发或审查 SQL、数据库迁移、MyBatis SQL 映射、PostgreSQL 配置或查询优化时，使用 `postgresql-optimization`、
`postgresql-code-review`  skill。
- 开发 `server/` 下的 Java 或 Spring Boot 后端代码时，使用 `java-springboot` skill。
- 开发 `web/` 下的 Web UI、React、TypeScript、样式或前端行为时，使用 `frontend-design`、`vercel-react-best-practices`  skill。
- 开发 Dockerfile、Docker Compose 配置、容器构建行为或 `ops/` 下的部署文件时，使用 `multi-stage-dockerfile`  skill。

## 常用命令

### 前端

```bash
cd web
npm install
npm run dev
npm run build
npm run preview
```

- Node.js 要求：`>=25.0.0`
- 开发服务器：`http://localhost:5173`
- Vite 将 `/api` 和 `/share` 代理到 `VITE_PROXY_TARGET`，未配置时默认为 `http://localhost:8080`
- 当前没有前端 lint 或 test 脚本；`npm run build` 会执行 `tsc -b && vite build`

### 后端

```bash
cd server
mvn spring-boot:run
mvn test
mvn test -Dtest=DashboardServiceTests
mvn test -Dtest=DashboardServiceTests#methodName
mvn -DskipTests package
```

- Java 要求：21
- 默认后端地址：`http://localhost:8080`
- 当前没有 Maven Wrapper；使用系统 `mvn`
- 当前没有 Checkstyle、Spotless 或 PMD lint 命令

### 本地基础设施

```bash
cd ops
docker compose up -d postgres minio
docker compose stop postgres minio
docker compose logs -f postgres minio
docker compose config
```

默认地址：

- PostgreSQL：`localhost:5432`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`
- 数据目录位于 `ops/data/`

### 完整 Docker Compose 部署

```bash
cd ops
DOCKER_BUILDKIT=1 docker compose up -d --build
docker compose down
docker compose restart server
docker compose restart web
docker compose logs -f
docker compose logs -f server
docker compose logs -f web
```

后端 Docker 构建使用 BuildKit 缓存 Maven 依赖。执行 Compose 构建时保持启用 BuildKit。

## 架构说明

### 前端结构

- 应用入口与路由：`web/src/main.tsx`、`web/src/App.tsx`、`web/src/router/index.tsx`
- API 层：`web/src/api/client.ts`、`web/src/api/services.ts`
- 状态与上下文：`web/src/store/AuthContext.tsx`、`web/src/store/ThemeContext.tsx`
- 主要页面：首页、TODO、笔记、笔记详情、分享笔记、登录、初始密码修改，位于 `web/src/pages/`
- 通用 UI：全局搜索、通知铃铛、主题切换，位于 `web/src/components/`
- 主题预设为 `web/src/theme/presets/` 下的 JSON 文件；当前预设包括 `cartoon`、`default`、`dark`、`illustration` 和 `glass`

### 后端结构

后端按领域组织在 `server/src/main/java/com/djtools/` 下：

- `auth`：登录、刷新令牌、初始密码修改流程
- `security`：JWT 与安全集成
- `user`：个人资料与账号行为
- `todo`：TODO CRUD 与状态处理
- `notification`：提醒与通知处理
- `note`：文件夹、标签、笔记、附件、分享
- `search`：全局搜索
- `dashboard`：TODO/笔记概览，以及宿主机、容器、应用指标
- `config` 和 `common`：共享配置、响应和错误处理

配置文件位于 `server/src/main/resources/application.yml`。日志由 `server/src/main/resources/logback-spring.xml` 配置。

### 数据访问与迁移

- PostgreSQL 是项目支持的数据库。
- MyBatis Mapper 接口只保留方法定义；SQL 放在 `server/src/main/resources/mapper/*.xml` 中。
- Flyway 迁移位于 `server/src/main/resources/db/migration/`。
- `V1__init_schema_and_seed.sql` 是当前未发布首版的基线结构，包含表结构、索引、注释和默认管理员账号种子数据。
- 首个版本发布后，不要修改已经执行过的 Flyway 迁移；结构或数据变更应新增 `V2__*.sql`、`V3__*.sql` 等迁移文件。
- 搜索能力使用 PostgreSQL `pg_trgm` 索引。

### 运维

`ops/docker-compose.yml` 定义了四个服务：

- `postgres`：PostgreSQL 18，使用 `ops/postgres/postgresql.conf` 中的配置
- `minio`：用于笔记附件的对象存储
- `server`：Spring Boot 后端，只读挂载 `/var/run/docker.sock` 用于容器指标采集，并将日志写入 `ops/logs/server`
- `web`：基于 Nginx 托管的前端

后端在非容器环境或 Docker Socket 不可用时，会自动跳过 Docker 容器指标采集。
