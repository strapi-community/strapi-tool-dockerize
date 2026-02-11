# Bug Tracker

Discovered during dev testing of the v2.5 rewrite. All resolved.

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
