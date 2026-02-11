import type { ResolvedConfig } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"

export const sqlitePlugin: DatabasePlugin = {
	id: "sqlite",
	displayName: "SQLite",
	defaultPort: 0,
	driverPackage: "better-sqlite3",
	v4DriverPackage: "better-sqlite3",
	v5DriverPackage: "better-sqlite3",
	strapiClient: "sqlite",

	composeService(_config: ResolvedConfig): ComposeService {
		return {
			image: "",
			environment: {},
			ports: [],
			volumes: [],
			healthcheck: this.healthcheck(),
			restart: "",
		}
	},

	envVars(_config: ResolvedConfig): Record<string, string> {
		return {
			DATABASE_CLIENT: this.strapiClient,
			DATABASE_FILENAME: ".tmp/data.db",
		}
	},

	healthcheck(): HealthCheck {
		return {
			test: [],
			interval: "0s",
			timeout: "0s",
			retries: 0,
		}
	},
}
