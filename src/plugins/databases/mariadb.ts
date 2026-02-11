import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"

export const mariadbPlugin: DatabasePlugin = {
	id: "mariadb",
	displayName: "MariaDB",
	defaultPort: DEFAULT_PORTS.mariadb,
	driverPackage: "mysql2",
	v4DriverPackage: "mysql2",
	v5DriverPackage: "mysql2",
	strapiClient: "mysql",

	composeService(config: ResolvedConfig): ComposeService {
		return {
			image: DEFAULT_DATABASE_IMAGES.mariadb,
			environment: {
				MARIADB_ROOT_PASSWORD: "${DATABASE_PASSWORD}",
				MARIADB_DATABASE: "${DATABASE_NAME}",
				MARIADB_USER: "${DATABASE_USERNAME}",
				MARIADB_PASSWORD: "${DATABASE_PASSWORD}",
			},
			ports: [`${config.databasePort}:3306`],
			volumes: [`${config.projectName}-data:/var/lib/mysql`],
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
			test: ["CMD-SHELL", "healthcheck.sh --connect --innodb_initialized"],
			interval: "10s",
			timeout: "5s",
			retries: 5,
			startPeriod: "30s",
		}
	},
}
