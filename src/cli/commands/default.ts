import { defineCommand } from "citty"
import { resolve } from "node:path"
import type { DetectedConfig, Environment } from "../../config"
import { resolvedConfigSchema } from "../../config"
import { detectAll } from "../../detection"
import { generateCompose, generateDatabaseConfig, generateDockerfiles, generateDockerignore, generateEnv } from "../../generators"
import { pluginRegistry } from "../../plugins"
import { runPrompts } from "../../prompts"
import { showBanner, createSpinner, log } from "../../ui"
import { backupDockerFiles } from "../../utils"
import { installDatabaseDriver } from "../../actions"
import { sharedFlags } from "../flags"

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		const cwd = resolve(args.path)

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

		const config = args.yes
			? resolvedConfigSchema.parse({
					strapiVersion: detected.strapiVersion ?? "v5",
					projectType: detected.projectType ?? "ts",
					databaseClient: detected.databaseClient ?? "postgres",
					packageManager: detected.packageManager ?? "npm",
					environment: detected.environment ?? "development",
					projectName: detected.projectName ?? "strapi",
					databaseHost: detected.databaseHost ?? "localhost",
					databasePort: detected.databasePort ?? 5432,
					databaseName: detected.databaseName ?? "strapi",
					databaseUsername: detected.databaseUsername ?? "strapi",
					databasePassword: detected.databasePassword ?? "strapi",
					useCompose: detected.useCompose ?? true,
					useAdminer: detected.useAdminer ?? false,
					envVars: detected.envVars ?? {},
				})
			: await runPrompts(detected)

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

		const generated = ["Dockerfile", ".dockerignore"]
		if (config.environment === "production" || config.environment === "both") {
			generated.push("Dockerfile.prod")
		}
		if (config.useCompose) {
			generated.push("docker-compose.yml")
		}
		generated.push(".env")
		generated.push(`config/env/development/database.${config.projectType === "ts" ? "ts" : "js"}`)

		log.success("Docker configuration complete!")
		log.info("Generated files:")
		for (const file of generated) {
			log.info(`  ${file}`)
		}

		if (config.useCompose) {
			log.info("Next: docker compose up -d")
		} else {
			log.info(`Next: docker build -t ${config.projectName} .`)
		}
		log.info("Docs: https://github.com/strapi-community/strapi-tool-dockerize")
	},
})
