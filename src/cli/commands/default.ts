import { access } from "node:fs/promises"
import { join, resolve } from "node:path"
import { defineCommand } from "citty"
import { runPrompts } from "../../prompts"
import { log, showBanner } from "../../ui"
import { backupDockerFiles } from "../../utils"
import { sharedFlags } from "../flags"
import {
	listGeneratedFiles,
	maybeInstallDriver,
	printOutcome,
	runDryRun,
	writeGeneratedFiles,
} from "./generate"
import {
	applyPresetAndOverrides,
	buildDetectionSummary,
	buildHealthCheckOverrides,
	buildResourceLimitOverrides,
	detectProject,
	resolveYesConfig,
} from "./resolve"

async function preflight(cwd: string, yes: boolean): Promise<void> {
	try {
		await access(join(cwd, "package.json"))
	} catch {
		log.error(`No Strapi project found at ${cwd}`)
		process.exit(1)
	}

	if (!process.stdin.isTTY && !yes) {
		log.error("Non-interactive environment detected. Use --yes flag for non-interactive mode.")
		process.exit(1)
	}
}

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		log.setVerbose(Boolean(args.verbose))
		const cwd = resolve(args.path)
		await preflight(cwd, Boolean(args.yes))

		showBanner()
		log.debug(`Project path: ${cwd}`)

		const detected = applyPresetAndOverrides(await detectProject(cwd), args)
		if (args.yes) {
			log.info(`Detected: ${buildDetectionSummary(detected)}`)
		}

		const config = args.yes ? resolveYesConfig(detected) : await runPrompts(detected)
		log.debug(
			`Resolved: strapi ${config.strapiVersion} | ${config.projectType} | ${config.databaseClient} | ${config.packageManager} | env=${config.environment} | compose=${config.useCompose} | backups=${config.useBackups}`,
		)

		const healthCheckOverrides = buildHealthCheckOverrides(args)
		const resourceLimits = buildResourceLimitOverrides(args)
		if (healthCheckOverrides) {
			log.debug(`Health check overrides: ${JSON.stringify(healthCheckOverrides)}`)
		}
		if (resourceLimits) {
			log.debug(`Resource limit overrides: ${JSON.stringify(resourceLimits)}`)
		}

		if (args["dry-run"]) {
			await runDryRun(config, healthCheckOverrides, resourceLimits)
			return
		}

		const backedUp = await backupDockerFiles(cwd)
		if (backedUp.length > 0) {
			log.warn(`Backed up existing files: ${backedUp.join(", ")}`)
		}

		await writeGeneratedFiles(config, cwd, healthCheckOverrides, resourceLimits)

		await maybeInstallDriver(config, cwd, Boolean(args["skip-deps"]))

		printOutcome(config, listGeneratedFiles(config))
		log.success("Docker configuration generated successfully!")
	},
})
