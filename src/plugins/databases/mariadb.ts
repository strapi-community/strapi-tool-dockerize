import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"
import {
	standardDatabaseComposeService,
	standardDatabaseEnvVars,
	standardDatabaseHealthcheck,
} from "./shared"

export const mariadbPlugin: DatabasePlugin = {
	id: "mariadb",
	displayName: "MariaDB",
	defaultPort: DEFAULT_PORTS.mariadb,
	driverPackage: "mysql2",
	v4DriverPackage: "mysql2@^3.10.0",
	v5DriverPackage: "mysql2@^3.9.8",
	strapiClient: "mysql",

	composeService(config: ResolvedConfig): ComposeService {
		return standardDatabaseComposeService(config, {
			image: DEFAULT_DATABASE_IMAGES.mariadb,
			environment: {
				MARIADB_ROOT_PASSWORD: "${DATABASE_PASSWORD}",
				MARIADB_DATABASE: "${DATABASE_NAME}",
				MARIADB_USER: "${DATABASE_USERNAME}",
				MARIADB_PASSWORD: "${DATABASE_PASSWORD}",
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
			"healthcheck.sh --connect --innodb_initialized",
		])
	},
}
