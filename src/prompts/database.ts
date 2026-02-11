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

	const defaultHost = detected?.databaseHost ?? DEFAULT_DATABASE_HOST
	const defaultPort = detected?.databasePort ?? DEFAULT_PORTS[dbClient]
	const defaultName = detected?.databaseName ?? DEFAULT_DATABASE_NAME
	const defaultUsername = detected?.databaseUsername ?? DEFAULT_DATABASE_USERNAME
	const defaultPassword = detected?.databasePassword ?? DEFAULT_DATABASE_PASSWORD

	const result = await p.group(
		{
			databaseHost: () =>
				p.text({
					message: "Database host",
					placeholder: defaultHost,
					defaultValue: defaultHost,
				}),
			databasePort: () =>
				p.text({
					message: "Database port",
					placeholder: String(defaultPort),
					defaultValue: String(defaultPort),
					validate: (value) => {
						const num = Number.parseInt(value, 10)
						if (Number.isNaN(num) || num < 1 || num > 65535) {
							return "Port must be a number between 1 and 65535"
						}
					},
				}),
			databaseName: () =>
				p.text({
					message: "Database name",
					placeholder: defaultName,
					defaultValue: defaultName,
				}),
			databaseUsername: () =>
				p.text({
					message: "Database username",
					placeholder: defaultUsername,
					defaultValue: defaultUsername,
				}),
			databasePassword: () =>
				p.password({
					message: `Database password (press Enter for '${defaultPassword}')`,
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

	return {
		databaseHost: result.databaseHost,
		databasePort: Number.parseInt(result.databasePort, 10),
		databaseName: result.databaseName,
		databaseUsername: result.databaseUsername,
		databasePassword: result.databasePassword || defaultPassword,
	}
}
