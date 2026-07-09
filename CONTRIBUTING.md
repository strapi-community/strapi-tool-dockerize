# Contributing to @strapi-community/dockerize

## Getting Started

```bash
# fork and clone the repo
git clone https://github.com/<your-username>/strapi-tool-dockerize.git
cd strapi-tool-dockerize

# install dependencies (bun is required)
bun install

# run locally against a test project
bun run dev

# run tests
bun test

# lint (biome)
bun run lint
bun run lint:fix
```

### Setting Up a Test Project

The `dev:setup` script scaffolds a fresh Strapi project in `tmp/test-strapi/` for local development:

```bash
bun run dev:setup
```

Then run the tool against it:

```bash
bun run dev:test       # interactive mode
bun run dev:test:yes   # non-interactive, accept defaults
bun run dev:test:pg    # non-interactive, force postgres
bun run dev:reset      # clean up generated files
```

### Dev Fixtures

Pre-built fixture projects live in `tmp/fixtures/`. Generate them with:

```bash
bun run dev:fixtures
```

Then run scenario scripts to generate files and inspect output:

```bash
bun run dev:scenario:pg
bun run dev:scenario:mysql
bun run dev:scenario:sqlite
bun run dev:scenario:v4
```

Each scenario runs `reset`, then generates files with `--yes --skip-deps`, then runs `dev:inspect` to dump the generated files to stdout.

---

## Project Structure

```
src/
  index.ts              # CLI entry point (citty)
  cli/                  # command definitions (default, reset)
  config/               # zod schemas, types, defaults
  detection/            # auto-detection logic (strapi, database, package-manager, environment)
  generators/           # file generators (dockerfile, compose, env, database-config)
  plugins/              # plugin system (databases + package managers)
    types.ts            # DatabasePlugin and PackageManagerPlugin interfaces
    index.ts            # plugin registry
    databases/          # one file per database (postgres, mysql, mariadb, sqlite)
    package-managers/   # one file per package manager (npm, yarn, pnpm, bun)
  prompts/              # interactive prompts (@clack/prompts)
  templates/            # LiquidJS template renderer
    files/              # .liquid templates (Dockerfile, Dockerfile.prod, docker-compose)
  ui/                   # terminal output helpers
  utils/                # shared utilities (fs, env parser)

tests/
  setup.ts              # test helpers (temp dirs, fixture paths)
  fixtures/             # static fixture projects for detection tests
  unit/                 # unit tests mirroring src/ structure
  integration/          # integration tests

scripts/
  dev-fixtures.ts       # generates tmp/fixtures/ for scenario testing
  dev-inspect.ts        # dumps generated files to stdout
```

---

## Development Workflow

### Branching

Branch from `v2.5` (the active development branch). `main` is the stable release branch.

```bash
git checkout v2.5
git pull origin v2.5
git checkout -b feat/my-feature
```

### Commits

Conventional commits are required. Commitlint enforces this.

```
feat: add cockroachdb database plugin
fix: handle missing lock file during detection
refactor: simplify compose template context
test: add mariadb healthcheck assertions
docs: update cli flags table
chore: bump liquidjs dependency
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Subject must be lowercase. Max header length is 100 characters.

### Pull Requests

- PR titles are validated by CI (same conventional commit format).
- Squash merge only.
- Target `v2.5` for new work.
- Run `bun test` and `bun run lint` before submitting.

### Before Submitting

```bash
bun test
bun run lint
```

Fix lint issues automatically with `bun run lint:fix`.

---

## Writing Plugins

The plugin system is the core extension point. Two interfaces exist: `DatabasePlugin` and `PackageManagerPlugin`. Both are defined in `src/plugins/types.ts`.

Plugins are registered at build time in the `Map` inside each category's `index.ts` (`src/plugins/databases/`, `src/plugins/package-managers/`). There is no runtime registration API. Adding a backend means adding a file and wiring it into the map, then submitting a PR. The steps below walk through each category.

### Database Plugins

Every database plugin implements the `DatabasePlugin` interface:

```typescript
interface DatabasePlugin {
  id: DatabaseClient
  displayName: string
  defaultPort: number
  driverPackage: string
  v4DriverPackage: string
  v5DriverPackage: string
  strapiClient: string
  composeService(config: ResolvedConfig): ComposeService
  envVars(config: ResolvedConfig): Record<string, string>
  healthcheck(): HealthCheck
}
```

| Field | Purpose |
|-------|---------|
| `id` | Matches the `DatabaseClient` enum value (`postgres`, `mysql`, `mariadb`, `sqlite`) |
| `displayName` | Human-readable name shown in prompts |
| `defaultPort` | Default port for this database |
| `driverPackage` | npm package name for the database driver |
| `v4DriverPackage` | Driver package for Strapi v4 |
| `v5DriverPackage` | Driver package for Strapi v5 |
| `strapiClient` | Value used in Strapi's `DATABASE_CLIENT` env var |
| `composeService()` | Returns Docker Compose service config (image, env, ports, volumes, healthcheck) |
| `envVars()` | Returns `.env` variables for this database |
| `healthcheck()` | Returns Docker healthcheck configuration |

### Package Manager Plugins

Every package manager plugin implements the `PackageManagerPlugin` interface:

```typescript
interface PackageManagerPlugin {
  id: PackageManager
  displayName: string
  lockFile: string
  installCommand: string
  buildCommand: string
  startCommand: string
  devCommand: string
  addPackageCommand(pkg: string): string
  removePackageCommand(pkg: string): string
  dockerBaseImage(nodeVersion: string): string
  dockerSetupSteps(): string[]
  dockerCopyFiles(): string[]
  dockerInstallStep(production: boolean): string
  dockerBuildStep(): string
  dockerStartStep(dev: boolean): string
}
```

| Field / Method | Purpose |
|----------------|---------|
| `id` | Matches the `PackageManager` enum value (`npm`, `yarn`, `pnpm`, `bun`) |
| `lockFile` | Lock file name used for detection and Docker COPY |
| `installCommand` | Local install command (shown to users) |
| `dockerBaseImage()` | Docker base image for this manager (e.g. `node:22-alpine` or `oven/bun:1-alpine`) |
| `dockerSetupSteps()` | Extra Dockerfile steps before install (e.g. `RUN corepack enable` for pnpm) |
| `dockerCopyFiles()` | Files to COPY into Docker before install |
| `dockerInstallStep()` | Install command in Docker, with production flag support |
| `dockerBuildStep()` | Build command in Docker |
| `dockerStartStep()` | CMD for Dockerfile, dev or prod |

### Step by Step: Adding a New Database

Example: adding CockroachDB support.

**1. Add the client to the schema**

In `src/config/schema.ts`, add `"cockroachdb"` to the `databaseClientSchema` enum:

```typescript
export const databaseClientSchema = z.enum(["postgres", "mysql", "mariadb", "sqlite", "cockroachdb"])
```

**2. Add defaults**

In `src/config/defaults.ts`, add entries for the new client:

```typescript
export const DEFAULT_PORTS: Record<DatabaseClient, number> = {
  postgres: 5432,
  mysql: 3306,
  mariadb: 3306,
  sqlite: 0,
  cockroachdb: 26257,
}

export const DEFAULT_DATABASE_IMAGES: Record<DatabaseClient, string> = {
  postgres: "postgres:16-alpine",
  mysql: "mysql:8.4",
  mariadb: "mariadb:11",
  sqlite: "",
  cockroachdb: "cockroachdb/cockroach:latest-v24.1",
}
```

**3. Create the plugin file**

Create `src/plugins/databases/cockroachdb.ts`:

```typescript
import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"

export const cockroachdbPlugin: DatabasePlugin = {
  id: "cockroachdb",
  displayName: "CockroachDB",
  defaultPort: DEFAULT_PORTS.cockroachdb,
  driverPackage: "pg",
  v4DriverPackage: "pg",
  v5DriverPackage: "pg",
  strapiClient: "postgres",

  composeService(config: ResolvedConfig): ComposeService {
    return {
      image: DEFAULT_DATABASE_IMAGES.cockroachdb,
      environment: {
        COCKROACH_DATABASE: "${DATABASE_NAME}",
        COCKROACH_USER: "${DATABASE_USERNAME}",
      },
      ports: [`${config.databasePort}:26257`],
      volumes: [`${config.projectName}-data:/cockroach/cockroach-data`],
      healthcheck: this.healthcheck(),
      restart: "unless-stopped",
    }
  },

  envVars(config: ResolvedConfig): Record<string, string> {
    return {
      DATABASE_CLIENT: this.strapiClient,
      DATABASE_HOST: config.databaseHost,
      DATABASE_PORT: String(config.databasePort),
      DATABASE_NAME: config.databaseName,
      DATABASE_USERNAME: config.databaseUsername,
      DATABASE_PASSWORD: config.databasePassword,
    }
  },

  healthcheck(): HealthCheck {
    return {
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health?ready=1 || exit 1"],
      interval: "10s",
      timeout: "5s",
      retries: 5,
      startPeriod: "30s",
    }
  },
}
```

**4. Register the plugin**

In `src/plugins/databases/index.ts`, import and add it to the map:

```typescript
import { cockroachdbPlugin } from "./cockroachdb"

export const databasePlugins = new Map<DatabaseClient, DatabasePlugin>([
  ["postgres", postgresPlugin],
  ["mysql", mysqlPlugin],
  ["mariadb", mariadbPlugin],
  ["sqlite", sqlitePlugin],
  ["cockroachdb", cockroachdbPlugin],
])
```

**5. Add detection logic (optional)**

If CockroachDB can be detected from dependencies or env vars, update `src/detection/database.ts`:

- Add to `DEP_TO_CLIENT` if there's a unique npm package
- Add to `CLIENT_REGEX` pattern matching
- Add to the env var detection list

**6. Write tests**

Create `tests/unit/plugins/databases/cockroachdb.test.ts` following the pattern in `postgres.test.ts`:

```typescript
import { describe, it, expect } from "bun:test"
import { cockroachdbPlugin } from "../../../../src/plugins/databases/cockroachdb"
import type { ResolvedConfig } from "../../../../src/config"

const baseConfig: ResolvedConfig = {
  strapiVersion: "v5",
  projectType: "ts",
  databaseClient: "cockroachdb",
  packageManager: "npm",
  environment: "production",
  projectName: "my-project",
  databaseHost: "db",
  databasePort: 26257,
  databaseName: "strapi",
  databaseUsername: "strapi",
  databasePassword: "secret",
  useCompose: true,
  useAdminer: false,
  isESM: false,
  envVars: {},
}

describe("cockroachdbPlugin", () => {
  it("has correct id and metadata", () => {
    expect(cockroachdbPlugin.id).toBe("cockroachdb")
    expect(cockroachdbPlugin.displayName).toBe("CockroachDB")
    expect(cockroachdbPlugin.defaultPort).toBe(26257)
  })

  // ... test composeService, envVars, healthcheck
})
```

**7. Add a test fixture (optional)**

Create a fixture directory in `tests/fixtures/` or add an entry to `scripts/dev-fixtures.ts`.

**8. Update prompt options**

If the database should appear in the interactive prompt, update the database selection options in `src/prompts/`.

### Step by Step: Adding a New Package Manager

Example: adding Deno support.

**1. Add to the schema**

In `src/config/schema.ts`:

```typescript
export const packageManagerSchema = z.enum(["npm", "yarn", "pnpm", "bun", "deno"])
```

**2. Create the plugin file**

Create `src/plugins/package-managers/deno.ts` implementing `PackageManagerPlugin`.

**3. Register it**

In `src/plugins/package-managers/index.ts`, import and add to the map.

**4. Add detection logic**

In `src/detection/package-manager.ts`, add the lock file to `LOCK_FILE_ORDER`:

```typescript
const LOCK_FILE_ORDER: [string, PackageManager][] = [
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["deno.lock", "deno"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
]
```

**5. Write tests**

Follow the pattern in `tests/unit/plugins/package-managers/npm.test.ts`.

---

## Detection System

Detection runs at startup and populates a `DetectedConfig` object. Each detector is in `src/detection/`:

| File | Detects | How |
|------|---------|-----|
| `strapi.ts` | Strapi version, project type (TS/JS), project name, ESM mode | Reads `package.json` |
| `database.ts` | Database client and port | `.env` > `config/database.*` > `package.json` deps (priority order) |
| `package-manager.ts` | Package manager | Lock files > `which` on PATH |
| `environment.ts` | Database connection details, NODE_ENV | Reads `.env`, `.env.development`, `.env.local` |

All detectors run in parallel via `detectAll()` in `src/detection/index.ts`.

To add new detection logic, either extend an existing detector or create a new one. New detectors must:

1. Accept `cwd: string` as the project path
2. Return `Promise<Partial<DetectedConfig>>`
3. Be added to the `Promise.all` in `detectAll()`

If you add new fields, also add them to `DetectedConfig` in `src/config/schema.ts`.

---

## Templates

File generation uses [LiquidJS](https://liquidjs.com/) templates in `src/templates/files/`.

| Template | Output |
|----------|--------|
| `Dockerfile.liquid` | Development Dockerfile |
| `Dockerfile.prod.liquid` | Production multi-stage Dockerfile |
| `docker-compose.liquid` | Docker Compose (handles both dev and prod via `environment` variable) |
| `dockerignore` | Static `.dockerignore` (not a liquid template, just copied) |

### Template Context

Templates receive a context object built by the generators in `src/generators/`. The context is populated from `ResolvedConfig` and the relevant plugins.

For Dockerfiles, the context includes:

- `baseImage`, `runtimeImage` (from package manager plugin)
- `pmSetupSteps`, `pmCopyFiles`, `pmInstallStep`, `pmInstallStepProd` (from package manager plugin)
- `pmBuildStep`, `pmStartStep`, `pmDevStep`
- `projectName`, `strapiPort`

For Compose, the context includes:

- Database service config from `DatabasePlugin.composeService()`
- Adminer config, named volumes, healthcheck details
- `environment` ("development" or "production") controlling conditional blocks

### Modifying Templates

Liquid templates support conditionals, loops, and variable interpolation:

```liquid
{%- for step in pmSetupSteps %}
{{ step }}
{%- endfor %}
```

```liquid
{% if environment == "production" %}Dockerfile.prod{% else %}Dockerfile{% endif %}
```

The renderer is in `src/templates/renderer.ts`. It creates a LiquidJS engine pointing at the `files/` directory and renders `.liquid` files with the given context.

Templates are copied to `dist/files/` during build, so any new `.liquid` file is automatically included.

---

## Testing

Tests use Bun's built-in test runner (`bun:test`). Structure mirrors `src/`:

```
tests/
  setup.ts              # createTempDir(), cleanupTempDir(), createFixtureFiles(), fixturePath()
  fixtures/             # static project fixtures (package.json, .env, lock files)
  unit/
    plugins/databases/  # one test file per database plugin
    plugins/package-managers/  # one test file per pm plugin
    detection/          # detection logic tests
    generators/         # generator output tests
    config/             # schema validation tests
    templates/          # template rendering tests
    cli/                # command tests
    prompts/            # prompt logic tests
    utils/              # utility tests
  integration/          # end-to-end detection flow tests
```

### Writing Tests

Use `describe`/`it`/`expect` from `bun:test`:

```typescript
import { describe, it, expect } from "bun:test"

describe("myPlugin", () => {
  it("does the thing", () => {
    expect(result).toBe(expected)
  })
})
```

### Test Fixtures

Static fixtures in `tests/fixtures/` represent different Strapi project configurations. Each fixture is a minimal directory with a `package.json` and optionally `.env`, lock files, or config files.

For tests that need temporary, throwaway directories, use the helpers from `tests/setup.ts`:

```typescript
import { createTempDir, cleanupTempDir, createFixtureFiles } from "../../setup"

let tempDir: string

beforeEach(async () => {
  tempDir = await createTempDir()
})

afterEach(async () => {
  await cleanupTempDir(tempDir)
})

it("detects from .env", async () => {
  await createFixtureFiles(tempDir, {
    "package.json": JSON.stringify({ name: "test" }),
    ".env": "DATABASE_CLIENT=postgres",
  })

  const result = await detectDatabase(tempDir)
  expect(result.databaseClient).toBe("postgres")
})
```

### Running Tests

```bash
bun test                        # run all tests
bun test tests/unit/plugins     # run a subset
bun test --watch                # watch mode
```

---

## Release Process

Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release).

**v2.5 is not published to npm yet.** The publish workflow only runs on `main`; prerelease publishing from `v2.5` is intentionally paused while the rewrite stabilizes. The table below is how publishing will work once v2.5 lands on `main`.

| Branch | Channel | npm Tag |
|--------|---------|---------|
| `main` | stable | `latest` |
| `v2.5` | prerelease (paused) | `beta` |

### How It Works

1. Push commits to `main` or merge a PR into `main`.
2. CI runs semantic-release, which analyzes commit messages.
3. If releasable commits exist (`feat:`, `fix:`, `perf:`, `refactor:`), a new version is published.
4. Versions follow standard semver (`2.5.0`, `2.6.0`, etc.).
5. CHANGELOG.md is auto-generated and committed.
6. A GitHub release is created with release notes.

### What Triggers a Release

Based on `.releaserc.json`:

| Commit Type | Release |
|-------------|---------|
| `feat` | minor |
| `fix` | patch |
| `perf` | patch |
| `refactor` | patch |
| `docs`, `style`, `test`, `ci`, `chore` | no release |
| `BREAKING CHANGE` in footer | major |

### Promoting to Stable

When `v2.5` is ready for a stable release, merge it into `main`. Semantic-release will publish a stable version to the `latest` npm tag.

---

## Questions?

Open an [issue](https://github.com/strapi-community/strapi-tool-dockerize/issues) or ping on the [Strapi Discord](https://discord.strapi.io/).
