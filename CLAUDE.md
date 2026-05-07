# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

DJ_Tools 是一个中文个人工作台项目，采用三目录单仓库结构：

- `web/`：React 19 + Vite + TypeScript 前端，使用 Ant Design 和 `md-editor-rt`。
- `server/`：Java 21 + Spring Boot 3.5 后端，使用 Spring Security、MyBatis、PostgreSQL、Flyway、MinIO、Actuator、OSHI 和 Docker Java。
- `ops/`：Docker Compose、PostgreSQL、MinIO、Nginx 和部署配置。

V1 产品范围包括首页监控、TODO、个人笔记、全局搜索、通知铃铛和主题切换。界面文案和面向产品的行为默认使用中文。内置初始账号为 `admin` / `123456`，首次登录后需要修改密码。

## 项目专用 Skill 使用规则

- 开发或审查 SQL、Flyway 迁移、MyBatis XML SQL、PostgreSQL 配置或查询优化时，使用 `postgresql-optimization` 和 `postgresql-code-review`。
- 开发 `server/` 下的 Java 或 Spring Boot 后端代码时，使用 `java-springboot`。
- 开发 `web/` 下的 Web UI、React、TypeScript、样式或前端行为时，使用 `frontend-design` 和 `vercel-react-best-practices`。
- 开发 Dockerfile、Docker Compose 配置、容器构建行为或 `ops/` 下的部署文件时，使用 `multi-stage-dockerfile`。

## 常用命令

### 前端

```bash
cd web
npm install
npm run dev
npm run build
npm run preview
```

- Node.js 要求：`>=25.0.0`。
- 开发服务器：`http://localhost:5173`。
- `npm run build` 会执行 `tsc -b && vite build`。
- 当前没有前端 lint 或 test 脚本。
- Vite 将 `/api` 代理到 `VITE_PROXY_TARGET`，未配置时默认为 `http://localhost:8080`。
- 前端 API 请求在设置 `VITE_API_BASE_URL` 时使用该值；否则使用相对当前 origin 的路径。

### 后端

```bash
cd server
mvn spring-boot:run
mvn test
mvn test -Dtest=DashboardServiceTests
mvn test -Dtest=DashboardServiceTests#methodName
mvn -DskipTests package
```

- Java 要求：21。
- 默认后端地址：`http://localhost:8080`。
- 当前没有 Maven Wrapper；使用系统 `mvn`。
- 当前没有 Checkstyle、Spotless 或 PMD lint 命令。
- 后端已配置 Spring Boot 测试依赖，但仓库当前只有测试资源，尚无 Java 测试类。

### 本地基础设施

```bash
cd ops
docker compose up -d postgres minio
docker compose stop postgres minio
docker compose logs -f postgres minio
docker compose config
```

默认本地地址：

- PostgreSQL：`localhost:5432`
- MinIO API：`http://localhost:9000`
- MinIO 控制台：`http://localhost:9001`
- 数据目录：`ops/data/`

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

- Compose 默认通过 `http://localhost:8088` 访问前端。
- 执行 Compose 构建时保持启用 BuildKit；后端 Dockerfile 使用 BuildKit Maven 缓存挂载。
- 后端日志挂载到 `ops/logs/server`。

## 前端架构

- 应用入口与路由位于 `web/src/main.tsx`、`web/src/App.tsx` 和 `web/src/router/index.tsx`。
- `ProtectedRoute` 会将未登录用户重定向到 `/login`，并将 `forcePasswordChange` 用户强制重定向到 `/initial-password`。
- `web/src/store/AuthContext.tsx` 负责 token/profile 启动加载、本地存储同步、退出登录和刷新个人资料。
- `web/src/store/ThemeContext.tsx` 负责主题状态和持久化；主题预设 JSON 位于 `web/src/theme/presets/`。
- API 访问集中在 `web/src/api/client.ts`，领域 API 封装位于 `web/src/api/services.ts`。
- API 客户端期望后端返回 `{ success, data, message }` 结构；发生全局错误时派发 `djtools:system-error`，HTTP 401 时清理本地会话并跳转登录页。
- 主要页面包括首页、TODO、笔记列表、笔记详情、分享笔记预览、登录、初始密码修改，位于 `web/src/pages/`。
- 通用 UI 包括应用布局、全局搜索、通知铃铛、主题切换和全局错误提示。

## 后端架构

后端按领域组织在 `server/src/main/java/com/djtools/` 下：

- `auth`：登录、刷新令牌、退出登录、初始密码修改。
- `security`：JWT 认证、当前用户工具、无状态安全过滤器、首次登录密码修改拦截。
- `user`：个人资料、密码修改、刷新令牌存储、默认账号初始化。
- `todo`：TODO CRUD、状态流转、逾期处理和提醒相关数据。
- `notification`：提醒通知，以及用于实时通知更新的 stream 端点。
- `note`：文件夹、标签、笔记、附件、MinIO 文件存储和分享链接。
- `search`：TODO 和笔记的全局搜索。
- `dashboard`：TODO/笔记概览，以及宿主机、JVM/应用、Docker 容器指标。
- `config` 和 `common`：应用属性、基础设施 Bean、CORS/Security 配置、响应包装和异常处理。

安全模型为无状态认证。`/api/auth/**`、`/actuator/health` 和 `GET /api/share/notes/**` 公开访问，其余接口需要 JWT 认证。

## 数据访问与迁移

- PostgreSQL 是项目支持的数据库。
- MyBatis Mapper 接口只保留方法定义；SQL 维护在 `server/src/main/resources/mapper/*.xml`。
- MyBatis 开启数据库下划线字段到 Java 驼峰属性的自动映射。
- Flyway 迁移位于 `server/src/main/resources/db/migration/`。
- `V1__init_schema_and_seed.sql` 是当前未发布首版的基线结构和种子迁移，包含表结构、索引、注释和默认管理员账号。
- 首个版本发布后，不要修改已经执行过的 Flyway 迁移；结构或数据变更应新增 `V2__*.sql`、`V3__*.sql` 等迁移文件。
- 搜索能力使用 PostgreSQL `pg_trgm` 索引。

## 配置与部署说明

- 后端配置位于 `server/src/main/resources/application.yml`。
- 后端日志由 `server/src/main/resources/logback-spring.xml` 配置。
- 常用部署环境变量记录在 `README.md` 并由 `ops/docker-compose.yml` 使用；生产部署必须覆盖默认数据库、MinIO 和 JWT 密钥。
- `ops/docker-compose.yml` 定义 `postgres`、`minio`、`server` 和 `web` 四个服务。
- `server` 服务只读挂载 `/var/run/docker.sock` 用于容器指标采集；Docker Socket 不可用时，后端会跳过容器指标采集。
- `web` Docker 镜像使用 Node 25 构建 Vite 应用，并通过 Nginx 和 `ops/nginx/default.conf` 托管 `dist/`。
