import * as p from "@clack/prompts"
import type { DatabaseClient, DetectedConfig } from "../config"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../config"

export async function selectDatabase(detected?: DatabaseClient): Promise<DatabaseClient> {
	const selected = await p.select({
		message: "Which database do you want to use?",
		initialValue: detected,
		options: [
			{ value: "postgres", label: "PostgreSQL", hint: "recommended" },
			{ value: "mysql", label: "MySQL" },
			{ value: "mariadb", label: "MariaDB", hint: "MySQL-compatible" },
			{ value: "sqlite", label: "SQLite", hint: "no external server needed" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as DatabaseClient
}

interface DatabaseConnection {
	databaseHost: string
	databasePort: number
	databaseName: string
	databaseUsername: string
	databasePassword: string
}

function connectionDefaults(
	dbClient: DatabaseClient,
	detected: Partial<DetectedConfig> = {},
): DatabaseConnection {
	return {
		databaseHost: detected.databaseHost ?? DEFAULT_DATABASE_HOST,
		databasePort: detected.databasePort ?? DEFAULT_PORTS[dbClient],
		databaseName: detected.databaseName ?? DEFAULT_DATABASE_NAME,
		databaseUsername: detected.databaseUsername ?? DEFAULT_DATABASE_USERNAME,
		databasePassword: detected.databasePassword ?? DEFAULT_DATABASE_PASSWORD,
	}
}

function validatePort(value: string): string | undefined {
	const num = Number.parseInt(value, 10)
	if (Number.isNaN(num) || num < 1 || num > 65535) {
		return "Port must be a number between 1 and 65535"
	}
}

function collectConnectionInput(defaults: DatabaseConnection) {
	return p.group(
		{
			databaseHost: () =>
				p.text({
					message: "Database host",
					placeholder: defaults.databaseHost,
					defaultValue: defaults.databaseHost,
				}),
			databasePort: () =>
				p.text({
					message: "Database port",
					placeholder: String(defaults.databasePort),
					defaultValue: String(defaults.databasePort),
					validate: validatePort,
				}),
			databaseName: () =>
				p.text({
					message: "Database name",
					placeholder: defaults.databaseName,
					defaultValue: defaults.databaseName,
				}),
			databaseUsername: () =>
				p.text({
					message: "Database username",
					placeholder: defaults.databaseUsername,
					defaultValue: defaults.databaseUsername,
				}),
			databasePassword: () =>
				p.password({
					message: `Database password (press Enter for '${defaults.databasePassword}')`,
					mask: "*",
				}),
		},
		{
			onCancel: () => {
				p.cancel("Setup cancelled.")
				process.exit(0)
			},
		},
	)
}

export async function promptDatabaseConnection(
	dbClient: DatabaseClient,
	detected?: Partial<DetectedConfig>,
): Promise<DatabaseConnection> {
	if (dbClient === "sqlite") {
		return {
			databaseHost: DEFAULT_DATABASE_HOST,
			databasePort: 0,
			databaseName: DEFAULT_DATABASE_NAME,
			databaseUsername: DEFAULT_DATABASE_USERNAME,
			databasePassword: DEFAULT_DATABASE_PASSWORD,
		}
	}

	const defaults = connectionDefaults(dbClient, detected)
	const result = await collectConnectionInput(defaults)

	return {
		databaseHost: result.databaseHost,
		databasePort: Number.parseInt(result.databasePort, 10),
		databaseName: result.databaseName,
		databaseUsername: result.databaseUsername,
		databasePassword: result.databasePassword || defaults.databasePassword,
	}
}
