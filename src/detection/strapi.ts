import { readFile } from "node:fs/promises"
import type { DetectedConfig, ProjectType, StrapiVersion } from "../config"

interface PackageJson {
	name?: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
}

function detectStrapiVersion(deps: Record<string, string>): StrapiVersion | undefined {
	const strapiVersion = deps["@strapi/strapi"] || deps["@strapi/core"]
	if (!strapiVersion) return undefined

	const cleaned = strapiVersion.replace(/[\^~>=<]/g, "")
	const major = Number.parseInt(cleaned.split(".")[0], 10)

	if (major >= 5) return "v5"
	if (major >= 4) return "v4"
	return undefined
}

function detectProjectType(deps: Record<string, string>): ProjectType | undefined {
	if (deps.typescript || deps["@strapi/typescript-utils"]) return "ts"
	return "js"
}

export async function detectStrapi(cwd: string): Promise<Partial<DetectedConfig>> {
	try {
		const raw = await readFile(`${cwd}/package.json`, "utf-8")
		const pkg: PackageJson = JSON.parse(raw)
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

		return {
			strapiVersion: detectStrapiVersion(allDeps),
			projectType: detectProjectType(allDeps),
			projectName: pkg.name,
		}
	} catch {
		return {}
	}
}
