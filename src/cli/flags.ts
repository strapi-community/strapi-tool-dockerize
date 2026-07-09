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
	verbose: {
		type: "boolean",
		description: "Print detection, resolution, and file write diagnostics",
		default: false,
	},
	preset: {
		type: "string",
		description: "Named preset (local-dev, production, ci)",
	},
	backups: {
		type: "boolean",
		description: "Include database backup sidecar in production compose",
	},
	"dry-run": {
		type: "boolean",
		description: "Preview generated files without writing to disk",
		default: false,
	},
	"health-interval": {
		type: "string",
		description: "Strapi health check interval (e.g. 30s, 1m)",
	},
	"health-timeout": {
		type: "string",
		description: "Strapi health check timeout (e.g. 10s, 30s)",
	},
	"health-start-period": {
		type: "string",
		description: "Strapi health check start period (e.g. 40s, 2m)",
	},
	"health-retries": {
		type: "string",
		description: "Strapi health check retry count",
	},
	memory: {
		type: "string",
		description: "Container memory limit (e.g. 2g, 512m)",
	},
	cpus: {
		type: "string",
		description: "Container CPU limit (e.g. 2, 0.5)",
	},
} satisfies ArgsDef
