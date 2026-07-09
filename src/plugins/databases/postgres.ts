import type { ResolvedConfig } from "../../config"
import { DEFAULT_DATABASE_IMAGES, DEFAULT_PORTS } from "../../config"
import type { ComposeService, DatabasePlugin, HealthCheck } from "../types"
import {
	standardDatabaseComposeService,
	standardDatabaseEnvVars,
	standardDatabaseHealthcheck,
} from "./shared"

export const postgresPlugin: DatabasePlugin = {
	id: "postgres",
	displayName: "PostgreSQL",
	defaultPort: DEFAULT_PORTS.postgres,
	driverPackage: "pg",
	v4DriverPackage: "pg@^8.8.0",
	v5DriverPackage: "pg@^8.8.0",
	strapiClient: "postgres",

	composeService(config: ResolvedConfig): ComposeService {
		return standardDatabaseComposeService(config, {
			image: DEFAULT_DATABASE_IMAGES.postgres,
			environment: {
				POSTGRES_USER: "${DATABASE_USERNAME}",
				POSTGRES_PASSWORD: "${DATABASE_PASSWORD}",
				POSTGRES_DB: "${DATABASE_NAME}",
			},
			containerPort: 5432,
			volumePath: "/var/lib/postgresql/data",
			healthcheck: this.healthcheck(),
		})
	},

	envVars(config: ResolvedConfig): Record<string, string> {
		return standardDatabaseEnvVars(config, this.strapiClient)
	},

	healthcheck(): HealthCheck {
		return standardDatabaseHealthcheck([
			"CMD-SHELL",
			"pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}",
		])
	},
}
