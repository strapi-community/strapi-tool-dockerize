import * as p from "@clack/prompts"
import type { DatabaseClient } from "../config"
import {
	DEFAULT_DATABASE_HOST,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_PASSWORD,
	DEFAULT_DATABASE_USERNAME,
	DEFAULT_PORTS,
} from "../config"

export async function selectDatabase(): Promise<DatabaseClient> {
	const selected = await p.select({
		message: "Which database do you want to use?",
		options: [
			{ value: "postgres", label: "PostgreSQL", hint: "recommended" },
			{ value: "mysql", label: "MySQL" },
			{ value: "mariadb", label: "MariaDB" },
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

export async function promptDatabaseConnection(dbClient: DatabaseClient): Promise<DatabaseConnection> {
	if (dbClient === "sqlite") {
		return {
			databaseHost: DEFAULT_DATABASE_HOST,
			databasePort: 0,
			databaseName: DEFAULT_DATABASE_NAME,
			databaseUsername: DEFAULT_DATABASE_USERNAME,
			databasePassword: DEFAULT_DATABASE_PASSWORD,
		}
	}

	const defaultPort = DEFAULT_PORTS[dbClient]

	const result = await p.group(
		{
			databaseHost: () =>
				p.text({
					message: "Database host",
					placeholder: DEFAULT_DATABASE_HOST,
					defaultValue: DEFAULT_DATABASE_HOST,
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
					placeholder: DEFAULT_DATABASE_NAME,
					defaultValue: DEFAULT_DATABASE_NAME,
				}),
			databaseUsername: () =>
				p.text({
					message: "Database username",
					placeholder: DEFAULT_DATABASE_USERNAME,
					defaultValue: DEFAULT_DATABASE_USERNAME,
				}),
			databasePassword: () =>
				p.password({
					message: `Database password (default: ${DEFAULT_DATABASE_PASSWORD})`,
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
		databasePassword: result.databasePassword || DEFAULT_DATABASE_PASSWORD,
	}
}
