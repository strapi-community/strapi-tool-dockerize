<div align="center">
<h1>@strapi-community/dockerize</h1>
<img src="https://raw.githubusercontent.com/strapi-community/strapi-tool-dockerize/main/.github/assets/banner.png">

<p>Add Docker support to any Strapi project in seconds.</p>

_Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a coffee if this tool was helpful._ [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

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

## What's New in v2

Complete rewrite in TypeScript with [Bun](https://bun.sh). Plugin-based architecture, smart auto-detection, multi-stage production Dockerfiles, health checks everywhere, and support for all four major package managers. Zero questions when your project already has the answers.

**Core:**

- Plugin architecture for databases, package managers, and secret backends
- [LiquidJS](https://liquidjs.com/) templates for all Dockerfile and Compose generation
- [@clack/prompts](https://github.com/bombshell-dev/clack) for a polished interactive CLI
- Auto-detection of Strapi version, database, package manager, ESM/CJS, installed plugins, and existing `.env` values
- `--env=both` generates dual Dockerfiles and Compose files in a single run
- 4-stage production build (deps, build, production-deps, runtime) for minimal images

**Production-Ready:**

- Secret manager plugin system (`--secrets docker-secrets`); new backends are a single plugin file (see [CONTRIBUTING.md](./CONTRIBUTING.md))
- Container resource limits (memory, CPU) with environment-aware defaults
- Database backup sidecar for automated production backups
- Health check customization for both Strapi and database services
- Database driver version pinning to Strapi-compatible versions

**Developer Experience:**

- Named presets (`--preset local-dev`, `--preset production`, `--preset ci`)
- Dry-run preview mode (`--dry-run`) to see generated files without writing to disk
- Strapi plugin detection for upload providers and email services
- Reset command to cleanly remove all generated files

## Quick Start

```bash
# Interactive mode (auto-detects everything, confirms with you)
npx @strapi-community/dockerize

# Non-interactive, accept all detected defaults
npx @strapi-community/dockerize --yes

# Production-ready with secrets and backups
npx @strapi-community/dockerize --preset production --backups

# Preview what would be generated
npx @strapi-community/dockerize --dry-run

# Override database and package manager
npx @strapi-community/dockerize --yes -d postgres --pm pnpm
```

## Supported Configurations

| Category | Options |
|----------|---------|
| **Strapi** | v4, v5 |
| **Databases** | PostgreSQL, MySQL, MariaDB, SQLite |
| **Package Managers** | npm, yarn, pnpm, bun |
| **Languages** | TypeScript, JavaScript |
| **Module Systems** | ESM, CommonJS |
| **Environments** | development, production, both |
| **Secret Backends** | none, docker-secrets |
| **Presets** | local-dev, production, ci |

## CLI Flags

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--path` | `-p` | Path to Strapi project | `.` |
| `--database` | `-d` | Database client (`postgres`, `mysql`, `mariadb`, `sqlite`) | auto-detected |
| `--package-manager` | `--pm` | Package manager (`npm`, `yarn`, `pnpm`, `bun`) | auto-detected |
| `--env` | `-e` | Environment (`development`, `production`, `both`) | prompted |
| `--compose` / `--no-compose` | | Generate docker-compose.yml (or skip it) | prompted |
| `--secrets` | `-s` | Secret backend (`none`, `docker-secrets`) | `none` |
| `--preset` | | Named preset (`local-dev`, `production`, `ci`) | none |
| `--backups` | | Include database backup sidecar in production compose | `false` |
| `--memory` | | Container memory limit (e.g., `2g`, `512m`) | env-based |
| `--cpus` | | Container CPU limit (e.g., `2`, `0.5`) | env-based |
| `--health-interval` | | Health check interval (e.g., `30s`) | `30s` |
| `--health-timeout` | | Health check timeout (e.g., `10s`) | `10s` |
| `--health-start-period` | | Health check start period (e.g., `40s`, `2m`) | `40s` |
| `--health-retries` | | Health check retry count | `3` |
| `--dry-run` | | Preview generated files without writing to disk | `false` |
| `--skip-deps` | | Skip installing database driver | `false` |
| `--verbose` | | Print detection, resolution, and file write diagnostics | `false` |
| `--yes` | `-y` | Skip all prompts, use detected/default values | `false` |

### Usage Examples

```bash
# Interactive mode
npx @strapi-community/dockerize

# Non-interactive with defaults
npx @strapi-community/dockerize --yes

# Production preset with backups and secrets
npx @strapi-community/dockerize --preset production --backups --secrets docker-secrets

# CI-friendly with custom resource limits
npx @strapi-community/dockerize --preset ci --memory 4g --cpus 4

# Local dev with postgres and pnpm
npx @strapi-community/dockerize --preset local-dev -d postgres --pm pnpm

# Preview before committing
npx @strapi-community/dockerize --dry-run --preset production

# Both environments
npx @strapi-community/dockerize --yes --env=both

# Custom health check timing for large projects
npx @strapi-community/dockerize --yes --health-start-period=120s --health-retries=10

# Reset (remove all generated files)
npx @strapi-community/dockerize reset
```

## Presets

Presets bundle opinionated defaults for common scenarios. They merge with auto-detection and can be overridden by CLI flags.

| Preset | Environment | Compose | Adminer | Secrets |
|--------|-------------|---------|---------|---------|
| `local-dev` | development | yes | yes | none |
| `production` | production | yes | no | docker-secrets |
| `ci` | production | yes | no | none |

Priority order: **CLI flags > preset > auto-detection > defaults**

```bash
# Start local development fast
npx @strapi-community/dockerize --preset local-dev

# Production-ready with one flag
npx @strapi-community/dockerize --preset production

# Production preset but override the database
npx @strapi-community/dockerize --preset production -d mysql
```

## Auto-Detection

The tool scans your project and resolves as much as possible before asking any questions. With `--yes`, detected values are used directly. Missing values fall back to sensible defaults (`postgres`, `npm`, `development`).

| What | Where It Looks |
|------|---------------|
| Strapi version (v4/v5) | `@strapi/strapi` or `@strapi/core` version in `package.json` |
| TypeScript or JavaScript | `typescript` in dependencies |
| ESM or CJS | `"type": "module"` in `package.json` |
| Database client | `.env` (`DATABASE_CLIENT`), then `config/database.{ts,js}`, then dependencies (`pg`, `mysql2`, `better-sqlite3`) |
| Package manager | Lock files: `bun.lockb` / `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`. Falls back to checking PATH |
| Database connection | `.env`, `.env.development`, `.env.local` for `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` |
| Environment | `NODE_ENV` in `.env` |
| Project name | `name` field in `package.json` |
| Strapi plugins | Upload providers (S3, Cloudinary) and email providers (SendGrid, Mailgun, SES) in dependencies |

Existing `.env` values for database host, port, name, username, and password are read and used to pre-populate prompts (or applied directly in `--yes` mode).

### Strapi Plugin Detection

The tool detects installed Strapi plugins and automatically adds their required environment variables to the generated `.env` file with empty placeholders.

| Plugin | Environment Variables |
|--------|----------------------|
| `@strapi/provider-upload-aws-s3` | `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`, `AWS_REGION`, `AWS_BUCKET` |
| `@strapi/provider-upload-cloudinary` | `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` |
| `@strapi/provider-email-sendgrid` | `SENDGRID_API_KEY` |
| `@strapi/provider-email-mailgun` | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` |
| `@strapi/provider-email-amazon-ses` | `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_REGION` |

Detected plugins show up in the CLI summary and their env vars are grouped in the generated `.env` file under labeled sections.

## Generated Files

| File | When Generated | Description |
|------|---------------|-------------|
| `Dockerfile` | `--env=development` or `--env=both` | Development image with hot-reload support |
| `Dockerfile.prod` | `--env=production` or `--env=both` | Production multi-stage image (4-stage build) |
| `docker-compose.yml` | `--env=development` or `--env=both` | Development Compose with database service and health checks |
| `docker-compose.prod.yml` | `--env=both` | Production Compose with secrets and resource limits |
| `.dockerignore` | Always | Comprehensive exclusion list |
| `.env` | Always | Environment variables with detected plugin vars (appended with markers, preserves existing content) |
| `config/env/{dev,prod}/database.{ts,js}` | Always | Strapi database config wired to environment variables |
| `secrets/db_password.txt` | When `--secrets docker-secrets` | Docker secret file for database password |

## Production Dockerfile

The production Dockerfile (`Dockerfile.prod`) uses a multi-stage build:

1. **base** - System dependencies, non-root user setup
2. **deps** - Install all dependencies (including devDependencies for the build step)
3. **build** - Compile Strapi with `strapi build`
4. **production-deps** - Install only production dependencies
5. **runtime** - Minimal Alpine image with only built output and production node_modules

All images run as a non-root `strapi` user with a configurable health check on `/_health`.

## Package Manager Support

| Manager | Lock File | Docker Base Image | Install Command |
|---------|-----------|-------------------|----------------|
| npm | `package-lock.json` | `node:{version}-alpine` | `npm ci` |
| yarn | `yarn.lock` | `node:{version}-alpine` | `yarn install --frozen-lockfile` |
| pnpm | `pnpm-lock.yaml` | `node:{version}-alpine` | `pnpm install --frozen-lockfile` |
| bun | `bun.lockb` / `bun.lock` | `oven/bun:1-alpine` | `bun install --frozen-lockfile` |

Node version is selected based on Strapi version: v5 uses Node 22, v4 uses Node 20.

## Database Support

| Database | Docker Image | Health Check | Driver |
|----------|-------------|-------------|--------|
| PostgreSQL | `postgres:16-alpine` | `pg_isready` | `pg@^8.8.0` |
| MySQL | `mysql:8.4` | `mysqladmin ping` | `mysql2@^3.9.8` (v5) / `mysql2@^3.10.0` (v4) |
| MariaDB | `mariadb:11` | `healthcheck.sh --connect --innodb_initialized` | `mysql2@^3.9.8` (v5) / `mysql2@^3.10.0` (v4) |
| SQLite | N/A (no container) | N/A | `better-sqlite3@^12.4.1` (v5) / `better-sqlite3@^8.6.0` (v4) |

SQLite runs inside the Strapi container with a volume mount for the `.tmp` data directory. No separate database service is needed.

For SQLite with ESM projects, a `__dirname` polyfill is included in the generated database config.

Database drivers are pinned to Strapi-compatible versions and installed automatically unless `--skip-deps` is passed.

## Docker Compose

Compose files include:

- **Database service** with health checks and `depends_on: condition: service_healthy`
- **Named volumes** for database persistence and uploads
- **Bridge networking** between Strapi and the database
- **Log rotation** (`json-file` driver, 10MB max, 3 files)
- **Container resource limits** with environment-aware defaults (configurable via `--memory` and `--cpus`)
- **Optional [Adminer](https://www.adminer.org/)** for database management in development
- **Optional backup sidecar** for automated database backups in production

### Resource Limits

Compose services include `deploy.resources.limits` with sensible defaults per environment:

| Environment | Strapi | Database |
|-------------|--------|----------|
| development | 2g memory, 2 CPUs | 1g memory, 1 CPU |
| production | 1g memory, 1 CPU | 512m memory, 0.5 CPUs |

Override with `--memory` and `--cpus` for the Strapi service (database gets half).

### Secret Manager

The `--secrets` flag controls how sensitive values (database passwords) are handled in production compose files.

**`--secrets none`** (default): Database password lives in `.env` as a plain value.

**`--secrets docker-secrets`**: Password is stored in `secrets/db_password.txt` and mounted into containers via Docker secrets. The tool generates the secrets directory and file for you.

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  strapi-db:
    secrets:
      - db_password
```

The secret manager is a plugin system. Adding new backends (Vault, AWS Secrets Manager) only requires creating a new plugin file. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Database Backups

Enable with `--backups` to add an automated backup sidecar to production compose files.

| Database | Backup Image | Schedule | Retention |
|----------|-------------|----------|-----------|
| PostgreSQL | `prodrigestivill/postgres-backup-local:16` | Daily at 2am | 7 days |
| MySQL | `databack/mysql-backup:latest` | Daily at 2am | 7 days |
| MariaDB | `databack/mysql-backup:latest` | Daily at 2am | 7 days |

Backups are stored in a `{project}-backups` named volume.

```bash
# Production with automated backups
npx @strapi-community/dockerize --preset production --backups
```

## Dry-Run Mode

Preview all generated files without writing anything to disk:

```bash
npx @strapi-community/dockerize --dry-run
npx @strapi-community/dockerize --dry-run --preset production --backups
```

Outputs each file with a header separator, useful for reviewing output before committing or piping to other tools.

## Reset

Remove all generated Docker files, config files, and env markers from your project:

```bash
npx @strapi-community/dockerize reset
```

This removes:
- `Dockerfile`, `Dockerfile.prod`, and their `.bak` backups
- `docker-compose.yml`, `docker-compose.yaml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`
- `.dockerignore`
- `config/env/development/database.{ts,js}` and `config/env/production/database.{ts,js}`
- Dockerize markers from `.env` (restores original content)
- Empty `config/env` directories left behind

## Migration from v1

**What changed:**
- No more `new` keyword for CLI arguments. Just pass flags directly.
- Database and package manager flags renamed (`--dbclient` is now `--database` / `-d`, `--packagemanager` is now `--package-manager` / `--pm`)
- Removed granular DB connection flags (`--dbhost`, `--dbport`, etc.). These are auto-detected from `.env` or prompted interactively.
- `--useCompose` flag removed. Compose generation is prompted interactively (defaults to yes).
- `--type` flag removed. TypeScript/JavaScript is auto-detected from dependencies.

**What's new:**
- Smart auto-detection reads your project before asking questions.
- `-y` flag for fully non-interactive mode.
- `--env` flag for choosing development, production, or both.
- pnpm and bun support.
- SQLite support with ESM-safe `__dirname` polyfill.
- Multi-stage Dockerfiles with health checks and non-root user.
- Production Dockerfile (`Dockerfile.prod`) with 4-stage build.
- Database health checks in docker-compose with `depends_on: condition: service_healthy`.
- Optional Adminer for database management.
- Automatic database driver installation with version pinning.
- Existing Docker files are backed up before overwriting.
- Docker secrets via `--secrets docker-secrets`.
- Named presets for common scenarios.
- Dry-run preview mode.
- Strapi plugin detection and env var generation.
- Container resource limits.
- Automated database backups.
- Configurable health checks.
- Reset command with full cleanup (files, config, env markers).

**What's removed:**
- `new` subcommand (creating Strapi projects). Use `npx create-strapi@latest` separately.
- Auto-open bug report in browser.
- Auto-install yarn globally.
- "Custom" environment option. Use `development`, `production`, or `both`.

## Contributing

Built with [Bun](https://bun.sh) and TypeScript. To get started:

```bash
bun install
bun run dev        # run locally
bun test           # run tests (464 tests, 994 assertions)
bun run lint       # lint with biome
bun run lint:fix   # auto-fix lint issues
bun run format     # format with biome
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide, including how to write plugins, templates, and tests.

Found a bug or have a feature request? [Open an issue](https://github.com/strapi-community/strapi-tool-dockerize/issues) on GitHub.

## Show Your Support

Give a star if this project helped you.
Feel free to buy [@Eventyret](https://www.github.com/Eventyret) a coffee if it was helpful. [Open Collective](https://opencollective.com/strapi/projects/strapi-tool-dockerize)

## Links

- [NPM package](https://www.npmjs.com/package/@strapi-community/dockerize)
- [GitHub repository](https://github.com/strapi-community/strapi-tool-dockerize)
- [Strapi documentation](https://docs.strapi.io/)
- [Docker documentation](https://docs.docker.com/)
- [Docker Compose documentation](https://docs.docker.com/compose/)

## Community Support

- For general help using Strapi, refer to [the official Strapi documentation](https://docs.strapi.io/).
- For support with this tool you can DM me in the Strapi Discord [channel](https://discord.strapi.io/).

## Authors

- [@Eventyret / Simen Daehlin](https://github.com/Eventyret)

## Contributors (Thank you)

- [@DimitriGilbert](https://github.com/DimitriGilbert)
- [@YEK-PLUS](https://github.com/YEK-PLUS)
- [@RobbieClarken](https://github.com/RobbieClarken)
- [@nevotheless](https://github.com/nevotheless)
- [@SudeepPatel-0812](https://github.com/SudeepPatel-0812)

## License

See the [LICENSE](./LICENSE.md) file for licensing information.
