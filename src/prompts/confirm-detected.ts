import * as p from "@clack/prompts"
import type { DetectedConfig } from "../config"
import { DEFAULT_PORTS } from "../config"
import { bold, dim, highlight, info } from "../ui/colors"

const DB_LABELS: Record<string, string> = {
	postgres: "PostgreSQL",
	mysql: "MySQL",
	mariadb: "MariaDB",
	sqlite: "SQLite",
}

const PM_LABELS: Record<string, string> = {
	npm: "npm",
	yarn: "Yarn",
	pnpm: "pnpm",
	bun: "Bun",
}

const LANG_LABELS: Record<string, string> = {
	ts: "TypeScript",
	js: "JavaScript",
}

function formatDetectedSummary(detected: DetectedConfig): string {
	const lines: string[] = []

	if (detected.strapiVersion || detected.projectType) {
		const version = detected.strapiVersion ? `Strapi ${detected.strapiVersion}` : "Strapi"
		const lang = detected.projectType ? ` (${LANG_LABELS[detected.projectType]})` : ""
		lines.push(`${bold(version)}${lang}`)
	}

	if (detected.packageManager) {
		lines.push(`Package Manager: ${info(PM_LABELS[detected.packageManager])}`)
	}

	if (detected.databaseClient) {
		const dbName = DB_LABELS[detected.databaseClient]
		if (detected.databaseClient === "sqlite") {
			lines.push(`Database: ${info(dbName)}`)
		} else {
			const host = detected.databaseHost ?? "localhost"
			const port = detected.databasePort ?? DEFAULT_PORTS[detected.databaseClient]
			lines.push(`Database: ${info(dbName)} on ${dim(`${host}:${port}`)}`)
		}
	}

	if (detected.projectName) {
		lines.push(`Project: ${highlight(detected.projectName)}`)
	}

	if (detected.environment) {
		lines.push(`Environment: ${info(detected.environment)}`)
	}

	return lines.map((line) => `  ${line}`).join("\n")
}

export async function confirmDetected(detected: DetectedConfig): Promise<boolean> {
	const summary = formatDetectedSummary(detected)

	if (summary) {
		p.note(summary, "Detected Configuration")
	}

	const confirmed = await p.confirm({
		message: "Is this correct?",
		initialValue: true,
	})

	if (p.isCancel(confirmed)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return confirmed
}
