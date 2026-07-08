import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"
import {
	standardDatabaseComposeService,
	standardDatabaseEnvVars,
	standardDatabaseHealthcheck,
} from "./shared"

export const mysqlPlugin: DatabasePlugin = {
	id: "mysql",
	displayName: "MySQL",
	defaultPort: DEFAULT_PORTS.mysql,
	driverPackage: "mysql2",
	v4DriverPackage: "mysql2@^3.10.0",
	v5DriverPackage: "mysql2@^3.9.8",
	strapiClient: "mysql",

	composeService(config: ResolvedConfig): ComposeService {
		return standardDatabaseComposeService(config, {
			image: DEFAULT_DATABASE_IMAGES.mysql,
			environment: {
				MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}",
				MYSQL_DATABASE: "${DATABASE_NAME}",
				MYSQL_USER: "${DATABASE_USERNAME}",
				MYSQL_PASSWORD: "${DATABASE_PASSWORD}",
			},
			containerPort: 3306,
			volumePath: "/var/lib/mysql",
			healthcheck: this.healthcheck(),
		})
	},

	envVars(config: ResolvedConfig): Record<string, string> {
		return standardDatabaseEnvVars(config, this.strapiClient)
	},

	healthcheck(): HealthCheck {
		return standardDatabaseHealthcheck([
			"CMD-SHELL",
			"mysqladmin ping -h localhost -u root -p$${MYSQL_ROOT_PASSWORD}",
		])
	},
}
