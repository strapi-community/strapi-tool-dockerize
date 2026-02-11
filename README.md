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

## What's New in v2.5

Complete rewrite in TypeScript with [Bun](https://bun.sh). Plugin-based architecture for databases and package managers. Smart auto-detection from your existing project, multi-stage production Dockerfiles, health checks everywhere, and support for all four major package managers. Zero questions when your project already has the answers.

Highlights:

- **Plugin architecture** for database and package manager support
- **[LiquidJS](https://liquidjs.com/) templates** for all Dockerfile and Compose generation
- **[@clack/prompts](https://github.com/bombshell-dev/clack)** for a polished interactive CLI experience
- **Auto-detection** of Strapi version (v4/v5), database, package manager, ESM/CJS, and existing `.env` values
- **`--env=both`** generates dual Dockerfiles AND dual Compose files in a single run
- **4-stage production build** (deps, build, production-deps, runtime) for minimal images
- **Docker secrets** wired into production Compose files
- **Reset command** to cleanly remove all generated files, including config and env markers

## Quick Start

```bash
# Interactive mode (auto-detects everything, confirms with you)
npx @strapi-community/dockerize

# Non-interactive, accept all detected defaults
npx @strapi-community/dockerize --yes

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

## CLI Flags

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--path` | `-p` | Path to Strapi project | `.` |
| `--database` | `-d` | Database client (`postgres`, `mysql`, `mariadb`, `sqlite`) | auto-detected |
| `--package-manager` | `--pm` | Package manager (`npm`, `yarn`, `pnpm`, `bun`) | auto-detected |
| `--env` | `-e` | Environment (`development`, `production`, `both`) | prompted or `development` |
| `--compose` / `--no-compose` | | Generate docker-compose.yml (or skip it) | prompted or `true` |
| `--skip-deps` | | Skip installing database driver | `false` |
| `--yes` | `-y` | Skip all prompts, use detected/default values | `false` |

### Usage Examples

```bash
# Interactive mode (auto-detects and asks)
npx @strapi-community/dockerize

# Non-interactive with defaults
npx @strapi-community/dockerize --yes

# Override database
npx @strapi-community/dockerize --yes -d postgres

# Production only
npx @strapi-community/dockerize --yes --env=production

# Both environments (generates dev + prod Dockerfiles and Compose files)
npx @strapi-community/dockerize --yes --env=both

# Skip database driver install
npx @strapi-community/dockerize --yes --skip-deps

# Custom path
npx @strapi-community/dockerize --path ./my-strapi-project

# Reset (remove all generated files)
npx @strapi-community/dockerize reset
```

## Auto-Detection

When the tool runs, it scans your project and resolves as much as possible before asking any questions. With `--yes`, detected values are used directly. Missing values fall back to sensible defaults (`postgres`, `npm`, `development`).

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

Existing `.env` values for database host, port, name, username, and password are read and used to pre-populate prompts (or applied directly in `--yes` mode).

## Generated Files

| File | When Generated | Description |
|------|---------------|-------------|
| `Dockerfile` | `--env=development` or `--env=both` | Development image with hot-reload support |
| `Dockerfile.prod` | `--env=production` or `--env=both` | Production multi-stage image (4-stage build) |
| `docker-compose.yml` | `--env=development` or `--env=both` | Development Compose with database service and health checks |
| `docker-compose.prod.yml` | `--env=both` | Production Compose with Docker secrets |
| `.dockerignore` | Always | Comprehensive exclusion list |
| `.env` | Always | Environment variables (appended with markers, preserves existing content) |
| `config/env/{dev,prod}/database.{ts,js}` | Always | Strapi database config wired to environment variables |

## Production Dockerfile

The production Dockerfile (`Dockerfile.prod`) uses a 4-stage multi-stage build:

1. **base** - System dependencies, non-root user setup
2. **deps** - Install all dependencies (including devDependencies for the build step)
3. **build** - Compile Strapi with `strapi build`
4. **production-deps** - Install only production dependencies
5. **runtime** - Minimal Alpine image with only built output and production node_modules

All images run as a non-root `strapi` user with a health check on `/_health`.

## Package Manager Support

| Manager | Lock File | Docker Base Image | Install Command |
|---------|-----------|-------------------|----------------|
| npm | `package-lock.json` | `node:{version}-alpine` | `npm ci` |
| yarn | `yarn.lock` | `node:{version}-alpine` | `yarn install --frozen-lockfile` |
| pnpm | `pnpm-lock.yaml` | `node:{version}-alpine` | `pnpm install --frozen-lockfile` |
| bun | `bun.lockb` / `bun.lock` | `oven/bun:1-alpine` | `bun install --frozen-lockfile` |

Node version is selected based on Strapi version: v5 uses Node 22, v4 uses Node 20.

## Database Support

| Database | Docker Image | Health Check | Driver Package |
|----------|-------------|-------------|----------------|
| PostgreSQL | `postgres:16-alpine` | `pg_isready` | `pg` |
| MySQL | `mysql:8.4` | `mysqladmin ping` | `mysql2` |
| MariaDB | `mariadb:11` | `healthcheck.sh --connect --innodb_initialized` | `mysql2` |
| SQLite | N/A (no container) | N/A | `better-sqlite3` |

SQLite runs inside the Strapi container with a volume mount for the `.tmp` data directory. No separate database service is needed.

For SQLite with ESM projects, a `__dirname` polyfill is included in the generated database config to ensure compatibility.

Database drivers are installed automatically unless `--skip-deps` is passed.

## Docker Compose

Compose files include:

- **Database service** with health checks and `depends_on: condition: service_healthy`
- **Named volumes** for database persistence and uploads
- **Bridge networking** between Strapi and the database
- **Log rotation** (`json-file` driver, 10MB max, 3 files)
- **Optional [Adminer](https://www.adminer.org/)** for database management in development (prompted interactively)

### Docker Secrets (Production)

Production compose files use Docker secrets for database passwords instead of plain `.env` values.

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

See the [Docker Secrets documentation](https://docs.docker.com/compose/how-tos/use-secrets/) for more details.

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
- Automatic database driver installation.
- Existing Docker files are backed up before overwriting.
- Docker secrets in production compose.
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
bun test           # run tests
bun run lint       # lint with ultracite (biome)
bun run lint:fix   # auto-fix lint issues
```

Found a bug or have a feature request? [Open an issue](https://github.com/strapi-community/strapi-tool-dockerize/issues) on GitHub.

If interested in contributing or maintaining, email simen@dehlin.dev or ping on [Discord](https://discord.strapi.io/).

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
