import { defineCommand } from "citty"
import { access } from "node:fs/promises"
import { join, resolve } from "node:path"
import { ZodError } from "zod"
import type { DetectedConfig, Environment } from "../../config"
import { DEFAULT_PORTS, resolvedConfigSchema } from "../../config"
import { detectAll } from "../../detection"
import { generateCompose, generateDatabaseConfig, generateDockerfiles, generateDockerignore, generateEnv } from "../../generators"
import { pluginRegistry } from "../../plugins"
import { runPrompts } from "../../prompts"
import { showBanner, createSpinner, log } from "../../ui"
import { backupDockerFiles } from "../../utils"
import { installDatabaseDriver } from "../../actions"
import { sharedFlags } from "../flags"

export function formatZodErrors(error: ZodError): string[] {
	return error.issues.map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join(".") : "config"
		return `${path}: ${issue.message}`
	})
}

export function shouldWarnDatabaseDefault(detected: DetectedConfig): boolean {
	return !detected.databaseClient
}

export function buildDetectionSummary(detected: DetectedConfig): string {
	const parts: string[] = []
	parts.push(`strapi ${detected.strapiVersion ?? "unknown"}`)
	parts.push(detected.projectType ?? "unknown")
	parts.push(detected.databaseClient ?? "not detected")
	parts.push(detected.packageManager ?? "unknown")
	return parts.join(" | ")
}

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		const cwd = resolve(args.path)

		try {
			await access(join(cwd, "package.json"))
		} catch {
			log.error(`No Strapi project found at ${cwd}`)
			process.exit(1)
		}

		if (!process.stdin.isTTY && !args.yes) {
			log.error("Non-interactive environment detected. Use --yes flag for non-interactive mode.")
			process.exit(1)
		}

		showBanner()

		const detectSpinner = createSpinner("Detecting project configuration...")
		let detected: DetectedConfig
		try {
			detected = await detectAll(cwd)
			detectSpinner.success("Project scanned")
		} catch (err) {
			detectSpinner.error("Failed to detect project configuration")
			log.error(err instanceof Error ? err.message : String(err))
			process.exit(1)
		}

		if (args.database) {
			detected.databaseClient = args.database as DetectedConfig["databaseClient"]
			detected.databasePort = DEFAULT_PORTS[detected.databaseClient]
		}
		if (args["package-manager"]) {
			detected.packageManager = args["package-manager"] as DetectedConfig["packageManager"]
		}
		if (args.env) {
			detected.environment = args.env as Environment
		}
		if (args.compose !== undefined) {
			detected.useCompose = args.compose
		}

		if (args.yes) {
			log.info(`Detected: ${buildDetectionSummary(detected)}`)
		}

		let config
		if (args.yes) {
			if (shouldWarnDatabaseDefault(detected)) {
				log.warn("No database detected, defaulting to postgres")
			}
			try {
				const resolvedClient = detected.databaseClient ?? "postgres"
				config = resolvedConfigSchema.parse({
					strapiVersion: detected.strapiVersion ?? "v5",
					projectType: detected.projectType ?? "ts",
					databaseClient: resolvedClient,
					packageManager: detected.packageManager ?? "npm",
					environment: detected.environment ?? "development",
					projectName: detected.projectName ?? "strapi",
					databaseHost: detected.databaseHost ?? "localhost",
					databasePort: detected.databasePort ?? DEFAULT_PORTS[resolvedClient],
					databaseName: detected.databaseName ?? "strapi",
					databaseUsername: detected.databaseUsername ?? "strapi",
					databasePassword: detected.databasePassword ?? "strapi",
					useCompose: detected.useCompose ?? true,
					useAdminer: detected.useAdminer ?? false,
					isESM: detected.isESM ?? false,
					envVars: detected.envVars ?? {},
				})
			} catch (err) {
				if (err instanceof ZodError) {
					log.error("Invalid configuration:")
					for (const msg of formatZodErrors(err)) {
						log.error(`  ${msg}`)
					}
					process.exit(1)
				}
				throw err
			}
		} else {
			config = await runPrompts(detected)
		}

		const backedUp = await backupDockerFiles(cwd)
		if (backedUp.length > 0) {
			log.warn(`Backed up existing files: ${backedUp.join(", ")}`)
		}

		const genSpinner = createSpinner("Generating Docker configuration...")

		try {
			await generateDockerfiles(config, pluginRegistry, cwd)
			genSpinner.update("Generating .dockerignore...")
			await generateDockerignore(cwd)

			if (config.useCompose) {
				genSpinner.update("Generating docker-compose.yml...")
				await generateCompose(config, pluginRegistry, cwd)
			}

			genSpinner.update("Updating .env...")
			await generateEnv(config, pluginRegistry, cwd)

			genSpinner.update("Generating database config...")
			await generateDatabaseConfig(config, cwd)

			genSpinner.success("Files generated")
		} catch (err) {
			genSpinner.error("Generation failed")
			log.error(err instanceof Error ? err.message : String(err))
			process.exit(1)
		}

		if (config.databaseClient !== "sqlite" && !args["skip-deps"]) {
			const depsSpinner = createSpinner("Installing database driver...")
			try {
				await installDatabaseDriver(config, pluginRegistry, cwd)
				depsSpinner.success("Database driver installed")
			} catch (err) {
				depsSpinner.error("Failed to install database driver")
				log.warn(err instanceof Error ? err.message : String(err))
			}
		}

		const generated: string[] = []
		if (config.environment === "development" || config.environment === "both") {
			generated.push("Dockerfile")
		}
		if (config.environment === "production" || config.environment === "both") {
			generated.push("Dockerfile.prod")
		}
		generated.push(".dockerignore")
		if (config.useCompose) {
			if (config.environment === "both") {
				generated.push("docker-compose.yml")
				generated.push("docker-compose.prod.yml")
			} else {
				generated.push("docker-compose.yml")
			}
		}
		generated.push(".env")
		const dbExt = config.projectType === "ts" ? "ts" : "js"
		const envDirs = config.environment === "both"
			? ["development", "production"]
			: [config.environment]
		for (const envDir of envDirs) {
			generated.push(`config/env/${envDir}/database.${dbExt}`)
		}

		log.success("Docker configuration complete!")
		log.info("Generated files:")
		for (const file of generated) {
			log.info(`  ${file}`)
		}

		if (config.useCompose) {
			if (config.environment === "both") {
				log.info("Dev:  docker compose up -d")
				log.info("Prod: docker compose -f docker-compose.prod.yml up -d")
			} else {
				log.info("Next: docker compose up -d")
			}
		} else {
			log.info(`Next: docker build -t ${config.projectName} .`)
		}
		log.info("Docs: https://github.com/strapi-community/strapi-tool-dockerize")
	},
})
