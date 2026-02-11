import { join } from "node:path"
import type { ResolvedConfig } from "../config"
import { ensureDir, writeFile } from "../utils/fs"

const V4_TS_CONFIG = `export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
  },
})
`

const V4_JS_CONFIG = `module.exports = ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
  },
})
`

const V4_SQLITE_TS_CONFIG = `import path from "path"

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`

const V4_SQLITE_JS_CONFIG = `const path = require("path")

module.exports = ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`

const V5_TS_CONFIG = `export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
})
`

const V5_JS_CONFIG = `module.exports = ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT"),
    connection: {
      host: env("DATABASE_HOST"),
      port: env.int("DATABASE_PORT"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL", false),
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
})
`

const V5_SQLITE_TS_CONFIG = `import path from "path"

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`

const V5_SQLITE_JS_CONFIG = `const path = require("path")

module.exports = ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
    },
    useNullAsDefault: true,
  },
})
`

function getConfigContent(config: ResolvedConfig): string {
	const isSqlite = config.databaseClient === "sqlite"
	const isTs = config.projectType === "ts"

	if (config.strapiVersion === "v4") {
		if (isSqlite) return isTs ? V4_SQLITE_TS_CONFIG : V4_SQLITE_JS_CONFIG
		return isTs ? V4_TS_CONFIG : V4_JS_CONFIG
	}

	if (isSqlite) return isTs ? V5_SQLITE_TS_CONFIG : V5_SQLITE_JS_CONFIG
	return isTs ? V5_TS_CONFIG : V5_JS_CONFIG
}

export async function generateDatabaseConfig(config: ResolvedConfig, cwd: string): Promise<void> {
	const ext = config.projectType === "ts" ? "ts" : "js"
	const configDir = join(cwd, "config", "env", "development")
	await ensureDir(configDir)
	await writeFile(join(configDir, `database.${ext}`), getConfigContent(config))
}
