import { join } from "node:path"
import pc from "picocolors"
import { installDatabaseDriver } from "../../actions"
import type {
	ResolvedConfig,
	ResourceLimitOverrides,
	StrapiHealthCheckOverrides,
} from "../../config"
import {
	generateCompose,
	generateDockerfiles,
	generateDockerignore,
	generateEnv,
} from "../../generators"
import { pluginRegistry } from "../../plugins"
import { createSpinner, log } from "../../ui"
import { formatPreviewOutput, previewGeneration } from "../../utils"

export async function runDryRun(
	config: ResolvedConfig,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
	resourceLimits?: ResourceLimitOverrides,
): Promise<void> {
	try {
		const files = await previewGeneration(
			config,
			pluginRegistry,
			healthCheckOverrides,
			resourceLimits,
		)
		log.debug(`Dry-run previewed ${files.length} file(s)`)
		console.log(formatPreviewOutput(files))
	} catch (err) {
		log.error(err instanceof Error ? err.message : String(err))
		process.exit(1)
	}
}

export async function writeGeneratedFiles(
	config: ResolvedConfig,
	cwd: string,
	healthCheckOverrides?: StrapiHealthCheckOverrides,
	resourceLimits?: ResourceLimitOverrides,
): Promise<void> {
	const spinner = createSpinner("Generating Docker configuration...")
	try {
		await generateDockerfiles(config, pluginRegistry, cwd, healthCheckOverrides)
		spinner.update("Generating .dockerignore...")
		await generateDockerignore(cwd)

		if (config.useCompose) {
			spinner.update("Generating docker-compose.yml...")
			await generateCompose(config, pluginRegistry, cwd, resourceLimits)
		}

		spinner.update("Updating .env...")
		await generateEnv(config, pluginRegistry, cwd)

		spinner.success("Docker configuration ready!")
	} catch (err) {
		spinner.error("Generation failed")
		log.error(err instanceof Error ? err.message : String(err))
		process.exit(1)
	}
}

export async function maybeInstallDriver(
	config: ResolvedConfig,
	cwd: string,
	skipDeps: boolean,
): Promise<void> {
	if (config.databaseClient === "sqlite" || skipDeps) return

	const spinner = createSpinner("Installing database driver...")
	try {
		await installDatabaseDriver(config, pluginRegistry, cwd)
		spinner.success("Database driver installed")
	} catch (err) {
		spinner.error("Failed to install database driver")
		log.warn(err instanceof Error ? err.message : String(err))
	}
}

function dockerfileNames(config: ResolvedConfig): string[] {
	const names: string[] = []
	if (config.environment !== "production") names.push("Dockerfile")
	if (config.environment !== "development") names.push("Dockerfile.prod")
	return names
}

function composeNames(config: ResolvedConfig): string[] {
	if (!config.useCompose) return []
	return config.environment === "both"
		? ["docker-compose.yml", "docker-compose.prod.yml"]
		: ["docker-compose.yml"]
}

export function listGeneratedFiles(config: ResolvedConfig): string[] {
	return [...dockerfileNames(config), ".dockerignore", ...composeNames(config), ".env"]
}

export function printOutcome(config: ResolvedConfig, generated: string[]): void {
	const fileList = generated.map((f) => `  ${pc.dim(">")} ${f}`).join("\n")
	console.log()
	console.log(pc.bold("  Generated files:"))
	console.log(fileList)
	console.log()

	console.log(pc.bold("  Next steps:"))
	if (config.useCompose) {
		if (config.environment === "both") {
			console.log(
				`  ${pc.cyan("$")} ${pc.bold("docker compose up -d")}  ${pc.dim("(development)")}`,
			)
			console.log(
				`  ${pc.cyan("$")} ${pc.bold("docker compose -f docker-compose.prod.yml up -d")}  ${pc.dim("(production)")}`,
			)
		} else {
			console.log(`  ${pc.cyan("$")} ${pc.bold("docker compose up -d")}`)
		}
	} else {
		console.log(`  ${pc.cyan("$")} ${pc.bold(`docker build -t ${config.projectName} .`)}`)
	}
	console.log()
	console.log(
		`  ${pc.dim("Your Strapi app will be available at")} ${pc.cyan("http://localhost:1337")}`,
	)
	if (config.useAdminer) {
		console.log(`  ${pc.dim("Adminer database UI at")} ${pc.cyan("http://localhost:8080")}`)
	}
	console.log()
	console.log(
		`  ${pc.dim("Docs & issues:")} ${pc.dim("https://github.com/strapi-community/strapi-tool-dockerize")}`,
	)
	console.log()
}
