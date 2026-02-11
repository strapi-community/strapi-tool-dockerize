import * as p from "@clack/prompts"
import type { DetectedConfig } from "../config"

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

const SECRET_BACKEND_LABELS: Record<string, string> = {
	none: "None",
	"docker-secrets": "Docker Secrets",
}

export { DB_LABELS, PM_LABELS, LANG_LABELS, SECRET_BACKEND_LABELS }

export function buildDetectionSummary(detected: DetectedConfig): string {
	const parts: string[] = []

	if (detected.strapiVersion) parts.push(`Strapi ${detected.strapiVersion}`)
	if (detected.projectType) parts.push(LANG_LABELS[detected.projectType] ?? detected.projectType)
	if (detected.databaseClient)
		parts.push(DB_LABELS[detected.databaseClient] ?? detected.databaseClient)
	if (detected.packageManager)
		parts.push(PM_LABELS[detected.packageManager] ?? detected.packageManager)

	return parts.join(" | ")
}

export function logDetectedSummary(detected: DetectedConfig): void {
	const summary = buildDetectionSummary(detected)
	if (summary) {
		p.log.info(`Auto-detected: ${summary}`)
	}
}
