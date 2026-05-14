# AGENTS.md

This file serves as a pointer for AI coding assistants.

For detailed context on this repository — including architecture, conventions, commands, and skill usage rules — see [CLAUDE.md](CLAUDE.md).

## Quick Reference

- **Language**: Chinese (UI, comments, docs)
- **Frontend**: `web/` — React 19 + Vite + TypeScript + Ant Design
- **Backend**: `server/` — Java 21 + Spring Boot 3.5 + MyBatis + PostgreSQL + Flyway
- **Ops**: `ops/` — Docker Compose + Nginx + MinIO
- **Default account**: `admin` / `123456` (force password change on first login)

## Key Commands

```bash
# Frontend dev
cd web && npm install && npm run dev      # → :5173

# Backend dev
cd server && mvn spring-boot:run          # → :8080

# Full Docker deploy
cd ops && DOCKER_BUILDKIT=1 docker compose up -d --build   # → :8088
```

See [docs/](docs/) for architecture, development, and deployment guides.
