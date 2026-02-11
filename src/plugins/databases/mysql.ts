import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"

export const mysqlPlugin: DatabasePlugin = {
	id: "mysql",
	displayName: "MySQL",
	defaultPort: DEFAULT_PORTS.mysql,
	driverPackage: "mysql2",
	v4DriverPackage: "mysql2",
	v5DriverPackage: "mysql2",
	strapiClient: "mysql",

	composeService(config: ResolvedConfig): ComposeService {
		return {
			image: DEFAULT_DATABASE_IMAGES.mysql,
			environment: {
				MYSQL_ROOT_PASSWORD: config.databasePassword,
				MYSQL_DATABASE: config.databaseName,
				MYSQL_USER: config.databaseUsername,
				MYSQL_PASSWORD: config.databasePassword,
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
			test: [
				"CMD-SHELL",
				"mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD}",
			],
			interval: "10s",
			timeout: "5s",
			retries: 5,
			startPeriod: "30s",
		}
	},
}
