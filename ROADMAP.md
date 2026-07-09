# Roadmap

A plan for where `@strapi-community/dockerize` is headed, written so a contributor (human or agent) can pick up an item and build it without extra context. Items marked *(speculative)* are ideas under consideration, not commitments.

## What this tool is (and is not)

It **scaffolds a secure Docker setup for an existing Strapi project and documents how to run it.** It is not a deployment platform, a secret manager, or a replacement for the project's own config. Read the design principles below before building anything — they are the guardrails that keep the tool coherent.

## Design principles

These are decisions, not preferences. Don't violate them without changing this section first.

1. **Scaffold and document, never replace the user's setup.** Generate `Dockerfile`, `Dockerfile.prod`, `docker-compose*.yml`, `.dockerignore`, and update `.env`. Document how to run/deploy. Do not impose a mechanism the user's environment might not want.
2. **Never overwrite `config/database.ts` (or any Strapi config).** Strapi's own config already reads connection details from env vars (including `DATABASE_URL`). The tool sets those values in `.env`; Strapi consumes them. The tool does not generate database config.
3. **Update `.env` non-destructively.** Managed values live between `# --- Dockerize Start ---` / `# --- Dockerize End ---` markers. Existing user values are preserved; duplicates are commented, not deleted. `reset` restores the original.
4. **No secret magic.** Secrets are the user's concern. The tool never hides values, injects entrypoints, or mounts secret files automatically. Runtime secrets = env injection (`.env`, platform, or a documented compose-secrets recipe). Build secrets = BuildKit `--mount=type=secret`. Never `ARG`/`ENV` for secrets (they bake into layers).
5. **Detection reads, generation writes artifacts.** Detect from `package.json`, `config/database.*`, and `.env`. Generate Docker files and update `.env`. Adapt to what the project already expresses.
6. **Plugins are an internal, build-time architecture.** Databases and package managers are plugins in `src/plugins/`. Contributors add one via a PR (new file + register in the category's `index.ts`), not a runtime API. See CONTRIBUTING.md.
7. **Quality gates are enforced.** `bun run typecheck`, `bun test`, `bun run lint`, `bun run build` must pass. A fallow pre-commit hook gates new dead code / duplication / complexity on changed files.

## v2.5 — TypeScript rewrite *(current, in development, not yet published)*

Complete ground-up rewrite in TypeScript with Bun. v1 is gone.

**Done:**

- Plugin architecture for databases (PostgreSQL, MySQL, MariaDB, SQLite) and package managers (npm, yarn, pnpm, bun), built from shared factories
- Strapi v4 and v5 support; database drivers pinned to compatible versions and auto-installed
- Auto-detection of Strapi version, database, package manager, ESM/CJS, installed Strapi plugins, and existing `.env` values
- LiquidJS templates for all Dockerfile and Compose generation; single render path shared by real generation and `--dry-run`
- Multi-stage production Dockerfile (base → deps → build → production-deps → runtime), non-root user, `/_health` healthcheck
- Dev Dockerfile + dev compose with bind-mounted `./src`/`./config` for hot-reload; compose reads runtime config via `env_file: .env`
- `.env` generation with managed markers, plus generation of missing Strapi app secrets (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`) — idempotent, never overwrites existing
- `--env=both`, named presets (`local-dev`/`production`/`ci`), container resource limits, configurable health checks, database backup sidecar
- `--dry-run`, `--verbose`, and a `reset` command
- CI runs typecheck + tests + build; fallow analysis wired in

**Before first release (blocking):**

- [ ] **Real end-to-end verification.** Everything is unit-tested, but nothing has actually built an image and booted Strapi. For each database, run `docker compose up` against a real Strapi 5 project and confirm: image builds, Strapi boots, `/_health` returns 204, DB connects, and dev hot-reload works. The `dev:setup` / `dev:fixtures` / `dev:scenario:*` npm scripts are the harness. Fix whatever this surfaces.
- [ ] **Warn when Strapi is not detected.** Running against a non-Strapi or misdetected project currently generates files silently. Add a warning (mirror the existing "No database detected, defaulting to postgres" warning in `src/cli/commands/resolve.ts`).

## Open decisions (need a maintainer call before building)

An agent should **not** guess these — they change the shape of the work.

- **Is `docker-compose` dev-only?** The tool generates `docker-compose.prod.yml`. If compose is meant purely for development, drop the prod compose and treat the Dockerfile as the production artifact (deployed by the platform). Otherwise keep it for self-hosters who deploy with compose.
- **Hot-reload mechanism.** Dev compose bind-mounts `./src`/`./config`. Move to `docker compose watch` (file sync, better on macOS) or keep bind mounts?
- **`DATABASE_URL` handling.** Strapi 5's default config reads `connectionString: env('DATABASE_URL')`. Decide whether detection should recognise a URL-based setup and, when present, set `DATABASE_URL` in `.env` instead of the individual `DATABASE_*` vars (and not clobber an existing one).

## v2.1 — Quality of life *(after v2.5 ships)*

- **Deployment & secrets guides** ([#149](https://github.com/strapi-community/strapi-tool-dockerize/issues/149)) — per-platform docs (DigitalOcean, Railway, Render, Fly, Kubernetes) for injecting runtime env/secrets, plus BuildKit build-secret recipes. Docs, not code. The tool scaffolds and documents; it does not manage secrets.
- **Reverse proxy templates** — optional Traefik or nginx configs for SSL termination and routing *(speculative)*
- **Custom template overrides** — drop a `dockerize/templates/` directory to override built-in Liquid templates *(speculative)*
- **Config file support** — `.dockerizerc` or a `dockerize` key in `package.json` for persisting preferences *(speculative)*

## v2.2 — Ecosystem *(speculative)*

- **GitHub Action** — reusable workflow for CI/CD Docker builds using dockerize output
- **npx one-liner improvements** — faster cold starts, smaller published bundle, clearer errors for non-Strapi projects
- **Strapi marketplace listing** as an official community tool
- **VS Code extension** — GUI for running dockerize and previewing output

## v3.0 — Future *(speculative)*

- **Kubernetes manifests** — Deployment, Service, ConfigMap, Ingress alongside the Docker files
- **Docker Swarm stack files**
- **Multi-service orchestration** — Strapi + Redis + S3 (MinIO) in one compose setup
- **Cloud deployment templates** — fly.io / Railway / Render config generated from the same detection pipeline

## Contributing

Have ideas? Disagree with priorities? Want to pick something up? See [CONTRIBUTING.md](./CONTRIBUTING.md), or [open an issue](https://github.com/strapi-community/strapi-tool-dockerize/issues) to discuss.
