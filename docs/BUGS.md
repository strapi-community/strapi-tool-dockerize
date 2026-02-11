# Bug Tracker

Discovered during dev testing of the v2.5 rewrite.

## Resolved

### 1. SQLite crashes on Zod validation (interactive mode) - FIXED

**Was:** `resolvedConfigSchema` required `databasePort: z.number().positive()` rejecting port `0` for SQLite.

**Fix:** Changed to `.nonnegative()` in `src/config/schema.ts`. Added test case for port 0.

---

### 2. `.env` duplicate keys when project has existing env vars - FIXED

**Was:** `generateEnv()` appended managed block without removing original `DATABASE_*` keys. First-value-wins parsers (Docker Compose) would use `localhost` instead of the compose service name.

**Fix:** Added `commentOutDuplicateKeys()` in `src/generators/env.ts` that prefixes conflicting keys outside the managed block with `#`.

---

### 3. Database override flag doesn't update port - FIXED

**Was:** `-d=mysql` on a postgres project kept port 5432 in `.env` and compose.

**Fix:** When `args.database` is set, also update `detected.databasePort` from `DEFAULT_PORTS` in `src/cli/commands/default.ts`.

---

### 4. Invalid path passes detection, crashes during generation - FIXED

**Was:** Nonexistent paths passed detection ("Project scanned") then crashed writing files.

**Fix:** Early `access()` check for `package.json` at the start of `run()` in `src/cli/commands/default.ts`.

---

### 5. `--env=production` and `--env=both` crash on template lookup - FIXED

**Was:** LiquidJS `extname` option uses `path.extname()` which treats `.prod` in `Dockerfile.prod` as the extension, skipping the `.liquid` append.

**Fix:** Removed `extname` from engine config, explicitly append `.liquid` in `renderTemplate()` in `src/templates/renderer.ts`.

---

### 6. Compose YAML has extra blank lines - FIXED

**Was:** Liquid control flow tags produced extra newlines in generated YAML.

**Fix:** Added `{%-` whitespace control to all control flow tags in `src/templates/files/docker-compose.liquid`.

---

### 7. SQLite path.join goes up 2 levels instead of 3 - FIXED

**Was:** All SQLite config templates had `path.join(__dirname, "..", "..")` but the file lives at `config/env/development/database.js`, which is 3 levels deep from the project root.

**Fix:** Changed to `path.join(__dirname, "..", "..", "..")` in all 4 SQLite templates in `src/generators/database-config.ts`.

---

### 8. `npm ci --only=production` deprecated on npm 7+ - FIXED

**Was:** `dockerInstallStep` in `npm.ts` used `--only=production` which is deprecated since npm 7 and removed in newer versions.

**Fix:** Changed to `npm ci --omit=dev` in `src/plugins/package-managers/npm.ts`.

---

### 9. v5 ESM projects break with `module.exports` - FIXED

**Was:** v5 JS config templates used `module.exports` and `require()`, but Strapi v5 defaults to `"type": "module"` in package.json which requires ESM syntax.

**Fix:** Added `isESM` detection from `package.json` `"type"` field in `src/detection/strapi.ts`. Added ESM variants (`V5_ESM_JS_CONFIG`, `V5_ESM_SQLITE_JS_CONFIG`) using `export default` and `import` syntax with `import.meta.url` for `__dirname` polyfill. Added `isESM` field to both schemas.

---

### 10. Compose healthcheck vars interpolated by Compose instead of container shell - FIXED

**Was:** `${POSTGRES_USER}` and `${POSTGRES_DB}` in healthcheck commands were interpolated by Docker Compose (resolving to empty), not by the container shell where those env vars are actually set.

**Fix:** Escaped with `$$` prefix (`$${POSTGRES_USER}`, `$${POSTGRES_DB}`) in `src/plugins/databases/postgres.ts`. Same fix for `$${MYSQL_ROOT_PASSWORD}` in `src/plugins/databases/mysql.ts`.

---

### 11. Database config always written to `config/env/development/` - FIXED

**Was:** `generateDatabaseConfig()` hardcoded the `development` environment directory regardless of `--env` flag value.

**Fix:** Made environment directory dynamic based on `config.environment`. When `--env=both`, writes to both `development/` and `production/`. Updated generated files output in `default.ts` to reflect actual paths.

---

## Open (medium/low severity)

### 12. Zod validation errors printed twice

When validation fails in `--yes` mode, the ZodError gets printed twice (once from the throw, once from the catch handler).

### 13. Reset deletes `config/env/` on non-dockerized projects

The reset command removes `config/env/` even if it wasn't created by dockerize. Should check for the presence of docker files first or only remove specific database config files.

### 14. `.bak` files not cleaned by reset

When files are backed up before regeneration, the `.bak` copies are never cleaned up by the reset command.

### 15. Docker secrets declared but not consumed

The compose template declares secrets but the Strapi service doesn't mount or reference them.

### 16. No detection summary in `--yes` mode

Non-interactive mode skips the detection confirmation, so there's no visibility into what was auto-detected before generation starts.

### 17. Unnecessary network for SQLite

SQLite projects with compose still get a dedicated bridge network even though there's no database service to connect to.

### 18. Dev Dockerfile ships build tools in runtime

The development Dockerfile runtime stage inherits from `base` which includes `build-base gcc autoconf automake` etc. These are only needed for the deps/build stages.
