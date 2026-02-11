import type { ArgsDef } from "citty"

export const sharedFlags = {
	path: {
		type: "string",
		description: "Path to Strapi project",
		default: ".",
		alias: "p",
	},
	database: {
		type: "string",
		description: "Database client (postgres, mysql, mariadb, sqlite)",
		alias: "d",
	},
	"package-manager": {
		type: "string",
		description: "Package manager (npm, yarn, pnpm, bun)",
		alias: "pm",
	},
	env: {
		type: "string",
		description: "Environment (development, production, both)",
		alias: "e",
	},
	compose: {
		type: "boolean",
		description: "Generate docker-compose.yml (use --no-compose to skip)",
	},
	"skip-deps": {
		type: "boolean",
		description: "Skip installing database driver",
		default: false,
	},
	yes: {
		type: "boolean",
		description: "Skip prompts and use detected/default values",
		default: false,
		alias: "y",
	},
} satisfies ArgsDef
