<div align="center">
<h1>@strapi-community/dockerize</h1>
<img src="https://raw.githubusercontent.com/strapi-community/strapi-tool-dockerize/main/.github/assets/banner.png">

<p>Add docker support for a Strapi Project with ease 🚀</p>

_Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a ☕️ if this tool was helpful_ [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

<p>
  <a href="https://discord.strapi.io">
    <img src="https://img.shields.io/discord/811989166782021633?color=blue&label=strapi-discord" alt="Strapi Discord">
  </a>
  <a href="https://www.npmjs.org/package/@strapi-community/dockerize">
    <img src="https://img.shields.io/npm/v/@strapi-community/dockerize/latest.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.org/package/@strapi-community/dockerize">
    <img src="https://img.shields.io/npm/dm/@strapi-community/dockerize" alt="Monthly download on NPM" />
  </a>
</p>
</div>

## What's new in v2.5 🎉

Complete rewrite. Smart auto-detection from your existing project, plugin-based architecture, multi-stage Dockerfiles, health checks everywhere, and support for all 4 major package managers. Zero questions when your project already has the answers.

## ✨ Quick Start

**Interactive mode** (walks you through everything):

```bash
npx @strapi-community/dockerize
```

**Auto-detect everything** (zero prompts, uses your existing config):

```bash
npx @strapi-community/dockerize -y
```

**Override specific values** while auto-detecting the rest:

```bash
npx @strapi-community/dockerize -y -d postgres --pm pnpm
```

## 🚀 Features

- 🔍 **Smart auto-detection** of Strapi version, database, package manager, and environment from your existing project
- 🐘 **4 databases**: PostgreSQL, MySQL, MariaDB, SQLite
- 📦 **4 package managers**: npm, yarn, pnpm, bun
- 🐳 **Multi-stage Dockerfiles** with health checks and non-root user
- 🏗️ **docker-compose** with database health checks and `depends_on` conditions
- 🏭 **Production-ready** `Dockerfile.prod` with minimal runtime image
- 🔧 **Optional Adminer** for database management in dev
- ✅ **Strapi v4 + v5 support** (auto-detects correct Node version: v5 uses Node 22, v4 uses Node 20)
- ⚡ **Zero-config for existing projects** (reads `.env`, `package.json`, lock files, and config files)
- 🔄 **Backs up existing Docker files** before overwriting

## 💻 CLI Flags

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--path` | `-p` | Path to Strapi project | `.` |
| `--database` | `-d` | Database client (`postgres`, `mysql`, `mariadb`, `sqlite`) | auto-detected |
| `--package-manager` | `--pm` | Package manager (`npm`, `yarn`, `pnpm`, `bun`) | auto-detected |
| `--yes` | `-y` | Skip prompts and use detected/default values | `false` |

## 🔍 Detection

When you run the tool, it scans your project and figures out everything it can before asking questions.

| What | Where it looks |
|------|---------------|
| Strapi version (v4/v5) | `@strapi/strapi` or `@strapi/core` version in `package.json` |
| TypeScript or JavaScript | `typescript` in dependencies |
| Database client | `.env` (`DATABASE_CLIENT`), then `config/database.{ts,js}`, then dependencies (`pg`, `mysql2`, `better-sqlite3`) |
| Package manager | Lock files: `bun.lockb` / `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`. Falls back to checking PATH |
| Database connection | `.env`, `.env.development`, `.env.local` (`DATABASE_HOST`, `DATABASE_PORT`, etc.) |
| Environment | `NODE_ENV` in `.env` |
| Project name | `name` field in `package.json` |

With `-y`, detected values are used directly. Missing values fall back to sensible defaults (postgres, npm, development).

## 🔐 Docker Secrets (Production)

By default, database credentials live in `.env`. This is fine for development, but for production you should use Docker Compose secrets.

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  strapi:
    secrets:
      - db_password
    environment:
      DATABASE_PASSWORD: /run/secrets/db_password

  strapi-db:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD: /run/secrets/db_password
```

Create the secrets directory and file:

```bash
mkdir -p secrets
echo "your-secure-password" > secrets/db_password.txt
chmod 600 secrets/db_password.txt
```

📖 [Docker Secrets documentation](https://docs.docker.com/compose/how-tos/use-secrets/)

## 📁 Generated Files

| File | Description |
|------|-------------|
| `Dockerfile` | Development multi-stage Dockerfile with hot-reload |
| `Dockerfile.prod` | Production-optimized Dockerfile with minimal runtime (generated when env is `production` or `both`) |
| `docker-compose.yml` | Full stack with database, health checks, and networking |
| `.dockerignore` | Keeps node_modules, .env, and other junk out of the image |
| `.env` | Database connection variables (appended with markers, preserves existing content) |
| `config/env/development/database.{ts,js}` | Strapi database config wired to environment variables |

## 📦 Package Manager Support

| Manager | Lock File | Docker Base Image | Install Command |
|---------|-----------|-------------------|----------------|
| npm | `package-lock.json` | `node:{version}-alpine` | `npm ci` |
| yarn | `yarn.lock` | `node:{version}-alpine` | `yarn install --frozen-lockfile` |
| pnpm | `pnpm-lock.yaml` | `node:{version}-alpine` | `pnpm install --frozen-lockfile` |
| bun | `bun.lockb` | `oven/bun:1-alpine` | `bun install --frozen-lockfile` |

## 🐘 Database Support

| Database | Docker Image | Health Check | Driver |
|----------|-------------|-------------|--------|
| PostgreSQL | `postgres:16-alpine` | `pg_isready` | `pg` |
| MySQL | `mysql:8.4` | `mysqladmin ping` | `mysql2` |
| MariaDB | `mariadb:11` | `healthcheck.sh --connect --innodb_initialized` | `mysql2` |
| SQLite | N/A (no container) | N/A | `better-sqlite3` |

SQLite runs inside the Strapi container with a volume mount for the `.tmp` data directory. No separate database service needed.

## 🧹 Reset

Remove all generated Docker files from your project:

```bash
npx @strapi-community/dockerize reset
```

This removes `Dockerfile`, `Dockerfile.prod`, `docker-compose.yml`, `docker-compose.yaml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`, and `.dockerignore`.

## 🎗 Contributing

Built with [Bun](https://bun.sh). To get started:

```bash
bun install
bun run dev        # run locally
bun test           # run tests
bun run lint       # lint with ultracite (biome)
bun run lint:fix   # auto-fix lint issues
```

If interested in contributing or maintaining, email simen@dehlin.dev or ping on [Discord](https://discord.strapi.io/).

## 🔄 Migration from v1

**What changed:**
- No more `new` keyword for CLI arguments. Just pass flags directly.
- Database and package manager flags renamed (`--dbclient` is now `--database` / `-d`, `--packagemanager` is now `--package-manager` / `--pm`)
- Removed granular DB connection flags (`--dbhost`, `--dbport`, etc.). These are auto-detected from `.env` or prompted interactively.
- `--useCompose` flag removed. Compose generation is prompted interactively (defaults to yes).
- `--type` flag removed. TypeScript/JavaScript is auto-detected from dependencies.

**What's new:**
- Smart auto-detection. The tool reads your project before asking questions.
- `-y` flag for fully non-interactive mode.
- pnpm and bun support.
- SQLite support.
- Multi-stage Dockerfiles with health checks and non-root user.
- Production Dockerfile (`Dockerfile.prod`) with minimal runtime.
- Database health checks in docker-compose with `depends_on: condition: service_healthy`.
- Optional Adminer for database management.
- Automatic database driver installation.
- Existing Docker files are backed up before overwriting.

**What's removed:**
- `new` subcommand (creating Strapi projects). Use `npx create-strapi@latest` separately.
- Auto-open bug report in browser.
- Auto-install yarn globally.
- "Custom" environment option. Use `development`, `production`, or `both`.

## ⭐️ Show your support

Give a star if this project helped you.
Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a ☕️ if it was helpful. [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

## 🔗 Links

- [NPM package](https://www.npmjs.com/package/@strapi-community/dockerize)
- [GitHub repository](https://github.com/strapi-community/strapi-tool-dockerize)

## 🌎 Community support

- For general help using Strapi, please refer to [the official Strapi documentation](https://strapi.io/documentation/).
- For support with this plugin you can DM me in the Strapi Discord [channel](https://discord.strapi.io/).

## 🙋‍♀️ Authors

- [@Eventyret / Simen Daehlin](https://github.com/Eventyret)

## 🙋‍♂️ Contributors (Thank you 🙏)

- [@DimitriGilbert](https://github.com/DimitriGilbert)
- [@YEK-PLUS](https://github.com/YEK-PLUS)
- [@RobbieClarken](https://github.com/RobbieClarken)
- [@nevotheless](https://github.com/nevotheless)
- [@SudeepPatel-0812](https://github.com/SudeepPatel-0812)

## 🔖 License

See the [LICENSE](./LICENSE.md) file for licensing information.
