# 本地开发指南

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Java | 21 | 后端编译与运行 |
| Maven | 3.9+ | 后端构建（系统 `mvn`） |
| Node.js | 25+ | 前端编译与运行 |
| npm | 10+ | 前端包管理 |
| Docker | 26+ | 本地运行 PostgreSQL 和 MinIO |
| Docker Compose | 2+ | 编排基础设施容器 |

## 初始化

```bash
git clone https://github.com/shendongjuns/DJ_Tools.git
cd DJ_Tools
```

## 启动基础设施

```bash
cd ops
docker compose up -d postgres minio
```

验证服务：

```bash
# PostgreSQL 连接测试
docker compose exec postgres pg_isready -U djtools -d dj_tools

# MinIO 控制台
open http://localhost:9001
```

默认凭据：

| 服务 | 地址 | 用户名 | 密码 |
|------|------|--------|------|
| PostgreSQL | `localhost:5432` | `djtools` | `djtools123` |
| MinIO API | `http://localhost:9000` | `minioadmin` | `minioadmin123` |
| MinIO Console | `http://localhost:9001` | `minioadmin` | `minioadmin123` |

## 启动后端

```bash
cd server
mvn spring-boot:run
```

后端默认运行在 `http://localhost:8080`。首次启动时 Flyway 自动执行数据库迁移并播种默认管理员账号。

常用 Maven 命令：

```bash
mvn test                                                  # 运行全部测试
mvn test -Dtest=DashboardServiceTests                     # 运行指定测试类
mvn test -Dtest=DashboardServiceTests#testGetOverview     # 运行指定方法
mvn -DskipTests package                                   # 跳过测试打包
```

后端代码修改后需手动重启 Maven 进程，无热重载。

## 启动前端

```bash
cd web
npm install
npm run dev
```

默认运行在 `http://localhost:5173`，Vite 自动将 `/api` 代理到 `http://localhost:8080`，无需跨域配置。

前端支持热模块替换（HMR），修改代码后浏览器自动刷新。

## 默认账号

| 账号 | 密码 |
|------|------|
| `admin` | `123456` |

首次登录强制要求修改密码。

## 可用脚本

### 前端

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 本地预览构建产物 |

### 后端

| 命令 | 说明 |
|------|------|
| `mvn spring-boot:run` | 启动 Spring Boot 应用 |
| `mvn test` | 运行全部测试 |
| `mvn -DskipTests package` | 跳过测试，打包 jar |
| `mvn clean` | 清理构建产物 |

### 运维

| 命令 | 说明 |
|------|------|
| `docker compose up -d postgres minio` | 启动基础依赖 |
| `docker compose stop postgres minio` | 停止基础依赖 |
| `docker compose logs -f postgres` | 查看 PostgreSQL 日志 |
| `docker compose config` | 验证 compose 文件 |

## 数据库变更

在 `server/src/main/resources/db/migration/` 下新增 `V2__*.sql`、`V3__*.sql` 等迁移文件。应用启动时 Flyway 自动执行未执行的迁移。

**注意**：首个版本发布后，不要修改已执行的历史迁移文件（`V1__*.sql`）。所有结构或数据变更都需要新增迁移。

## 项目配置

后端配置入口：`server/src/main/resources/application.yml`

关键配置项及其默认值：

```yaml
# 数据库
spring.datasource.url: jdbc:postgresql://localhost:5432/dj_tools
spring.datasource.username: djtools

# JWT
app.jwt.access-token-expire-minutes: 120
app.jwt.refresh-token-expire-days: 14

# 文件上传
spring.servlet.multipart.max-file-size: 20MB
spring.servlet.multipart.max-request-size: 30MB
```

本地开发可通过环境变量覆盖，无需修改配置文件。例如：

```bash
POSTGRES_PASSWORD=custompass mvn spring-boot:run
```
