# Roadmap

A rough plan for where `@strapi-community/dockerize` is headed. Priorities shift based on community feedback, so nothing here is set in stone. Items marked with *(speculative)* are ideas under consideration, not commitments.

## v2.5 - TypeScript Rewrite *(current, in development)*

Complete ground-up rewrite in TypeScript with Bun. The v1 codebase is gone.

**What's done:**

- Plugin architecture for databases (PostgreSQL, MySQL, MariaDB, SQLite) and package managers (npm, yarn, pnpm, bun)
- Secret manager plugin system (`--secrets docker-secrets`) with `none` and `docker-secrets` backends
- LiquidJS template engine for all Dockerfile and Compose generation
- Smart auto-detection of Strapi version, database, package manager, ESM/CJS, installed Strapi plugins, and existing `.env` values
- Strapi v4 and v5 support with database drivers pinned to compatible versions
- Multi-stage production Dockerfiles (4-stage build for minimal images)
- Docker secrets wired into production Compose files
- Dual environment support (`--env=both` generates dev + prod Dockerfiles and Compose files)
- Named presets (`--preset local-dev|production|ci`)
- Container resource limits (memory, CPU) with environment-aware defaults
- Configurable health checks for both Strapi and database services
- Database backup sidecar for automated production backups
- Dry-run preview mode (`--dry-run`) to inspect output without writing to disk
- Verbose diagnostics (`--verbose`) for detection, config resolution, and file writes
- Interactive CLI with @clack/prompts, per-field pre-fill from detected values
- Reset command for clean removal of all generated files
- 469 tests across 36 test files, 1013 expect() calls

**Status:** In development on the `v2.5` branch. Not yet published to npm. Collecting feedback before the first release. All tracked bugs on the [project board](https://github.com/orgs/strapi-community/projects/8) are resolved (40+ issues closed).

---

## v2.1 - Quality of Life

Polish and power-user features after v2.5 stabilizes.

- **Additional secret backends** ([#149](https://github.com/strapi-community/strapi-tool-dockerize/issues/149)) - The `docker-secrets` backend shipped in v2.5. Vault and AWS Secrets Manager are the next candidates on the same plugin interface.
- **Reverse proxy templates** - Optional Traefik or nginx configs for SSL termination and routing *(speculative)*
- **Custom template overrides** - Drop a `dockerize/templates/` directory in your project to override built-in Liquid templates *(speculative)*
- **Config file support** - `.dockerizerc` or `dockerize` key in `package.json` for persisting preferences across runs *(speculative)*

---

## v2.2 - Ecosystem

Integrations beyond the CLI.

- **GitHub Action** - Reusable workflow for CI/CD Docker builds using dockerize output *(speculative)*
- **npx one-liner improvements** - Faster cold starts, smaller published bundle, better error messages for non-Strapi projects
- **Strapi marketplace integration** - Listing as an official community tool *(speculative)*
- **VS Code extension** - GUI for running dockerize, previewing generated files, managing configs *(speculative)*

---

## v3.0 - Future

Bigger scope changes. These depend on demand and contributor interest.

- **Kubernetes manifests** - Generate Deployment, Service, ConfigMap, and Ingress YAML alongside Docker files *(speculative)*
- **Docker Swarm configs** - Stack files for Swarm deployments *(speculative)*
- **Multi-service orchestration** - Strapi + Redis + S3 (MinIO) in a single Compose setup *(speculative)*
- **Cloud deployment templates** - fly.io, Railway, Render config files generated from the same detection pipeline *(speculative)*

---

## Contributing

Have ideas? Disagree with priorities? Want to pick something up?

Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started, or [open an issue](https://github.com/strapi-community/strapi-tool-dockerize/issues) to start a discussion.
