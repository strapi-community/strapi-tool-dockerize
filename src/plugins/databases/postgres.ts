import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"

export const postgresPlugin: DatabasePlugin = {
	id: "postgres",
	displayName: "PostgreSQL",
	defaultPort: DEFAULT_PORTS.postgres,
	driverPackage: "pg",
	v4DriverPackage: "pg@^8.8.0",
	v5DriverPackage: "pg@^8.8.0",
	strapiClient: "postgres",

	composeService(config: ResolvedConfig): ComposeService {
		return {
			image: DEFAULT_DATABASE_IMAGES.postgres,
			environment: {
				POSTGRES_USER: "${DATABASE_USERNAME}",
				POSTGRES_PASSWORD: "${DATABASE_PASSWORD}",
				POSTGRES_DB: "${DATABASE_NAME}",
			},
			ports: [`${config.databasePort}:5432`],
			volumes: [`${config.projectName}-data:/var/lib/postgresql/data`],
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
			test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"],
			interval: "10s",
			timeout: "5s",
			retries: 5,
			startPeriod: "30s",
		}
	},
}
