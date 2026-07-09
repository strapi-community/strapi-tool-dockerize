import type { ResolvedConfig } from "../../config"
import type { ComposeService, HealthCheck } from "../types"

interface DatabaseServiceSpec {
	image: string
	environment: Record<string, string>
	containerPort: number
	volumePath: string
	healthcheck: HealthCheck
}

export function standardDatabaseComposeService(
	config: ResolvedConfig,
	spec: DatabaseServiceSpec,
): ComposeService {
	return {
		image: spec.image,
		environment: spec.environment,
		ports: [`${config.databasePort}:${spec.containerPort}`],
		volumes: [`${config.projectName}-data:${spec.volumePath}`],
		healthcheck: spec.healthcheck,
		restart: "unless-stopped",
	}
}

export function standardDatabaseEnvVars(
	config: ResolvedConfig,
	strapiClient: string,
): Record<string, string> {
	return {
		DATABASE_CLIENT: strapiClient,
		DATABASE_HOST: config.databaseHost,
		DATABASE_PORT: String(config.databasePort),
		DATABASE_NAME: config.databaseName,
		DATABASE_USERNAME: config.databaseUsername,
		DATABASE_PASSWORD: config.databasePassword,
	}
}

export function standardDatabaseHealthcheck(test: string[]): HealthCheck {
	return {
		test,
		interval: "10s",
		timeout: "5s",
		retries: 5,
		startPeriod: "30s",
	}
}
