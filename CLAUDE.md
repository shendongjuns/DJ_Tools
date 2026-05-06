# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

DJ_Tools is a Chinese personal workspace app with a separated frontend/backend and a three-directory monorepo layout:

- `web/`: React 19 + Vite + TypeScript frontend using Ant Design and `md-editor-rt`
- `server/`: Java 21 Spring Boot 3.5 backend using Spring Security, MyBatis, PostgreSQL, Flyway, MinIO, Actuator, OSHI, and Docker Java
- `ops/`: Docker Compose, PostgreSQL, Nginx, and deployment configuration

The V1 product scope includes dashboard monitoring, TODOs, personal notes, global search, notification bell, and theme switching. UI text and product-facing behavior are Chinese by default. The built-in initial account is `admin` / `123456`, and first login requires password change.

## Common commands

### Frontend

```bash
cd web
npm install
npm run dev
npm run build
npm run preview
```

- Node requirement: `>=25.0.0`
- Dev server: `http://localhost:5173`
- Vite proxies `/api` and `/share` to `VITE_PROXY_TARGET` or `http://localhost:8080`
- There is currently no frontend lint or test script; `npm run build` runs `tsc -b && vite build`

### Backend

```bash
cd server
mvn spring-boot:run
mvn test
mvn test -Dtest=DashboardServiceTests
mvn test -Dtest=DashboardServiceTests#methodName
mvn -DskipTests package
```

- Java requirement: 21
- Default backend address: `http://localhost:8080`
- There is no Maven wrapper; use the system `mvn`
- There is currently no Checkstyle/Spotless/PMD lint command

### Local infrastructure

```bash
cd ops
docker compose up -d postgres minio
docker compose stop postgres minio
docker compose logs -f postgres minio
docker compose config
```

Defaults:

- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`
- Data directories are under `ops/data/`

### Full Docker Compose deployment

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

The server Docker build uses BuildKit cache mounts for Maven dependencies. Keep BuildKit enabled for compose builds.

## Architecture notes

### Frontend structure

- App entry and routing: `web/src/main.tsx`, `web/src/App.tsx`, `web/src/router/index.tsx`
- API layer: `web/src/api/client.ts`, `web/src/api/services.ts`
- State/context: `web/src/store/AuthContext.tsx`, `web/src/store/ThemeContext.tsx`
- Main pages: dashboard, TODO, notes, note detail, shared note, login, initial password under `web/src/pages/`
- Cross-cutting UI: global search, notification bell, theme switcher under `web/src/components/`
- Theme presets are JSON files in `web/src/theme/presets/`; current presets are `cartoon`, `default`, `dark`, `illustration`, and `glass`

### Backend structure

Backend packages are organized by domain under `server/src/main/java/com/djtools/`:

- `auth`: login, refresh token, initial password flow
- `security`: JWT/security integration
- `user`: profile/account behavior
- `todo`: TODO CRUD and status handling
- `notification`: reminder/notification handling
- `note`: folders, tags, notes, attachments, shares
- `search`: global search
- `dashboard`: TODO/note summaries and host/container/app metrics
- `config` and `common`: shared configuration and response/error plumbing

Configuration lives in `server/src/main/resources/application.yml`. Logs are configured by `server/src/main/resources/logback-spring.xml`.

### Data access and migrations

- PostgreSQL is the supported database.
- MyBatis mapper interfaces should contain method definitions only; SQL belongs in `server/src/main/resources/mapper/*.xml`.
- Flyway migrations live in `server/src/main/resources/db/migration/`.
- `V1__init_schema_and_seed.sql` is the current baseline schema, indexes, comments, and default admin seed for the unreleased first version.
- After the first version is published, do not edit already-applied Flyway migrations; add `V2__*.sql`, `V3__*.sql`, etc. for schema/data changes.
- Search uses PostgreSQL `pg_trgm` indexes.

### Operations

`ops/docker-compose.yml` defines four services:

- `postgres`: PostgreSQL 18 with config from `ops/postgres/postgresql.conf`
- `minio`: object storage for note attachments
- `server`: Spring Boot backend, mounts `/var/run/docker.sock` read-only for container metrics and writes logs to `ops/logs/server`
- `web`: Nginx-hosted frontend

The backend automatically skips Docker container metrics when not running in a container or when Docker socket access is unavailable.
