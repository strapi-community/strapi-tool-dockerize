import { defineCommand } from "citty"
import { resolve } from "node:path"
import pc from "picocolors"
import { detectAll } from "../../detection"
import { sharedFlags } from "../flags"

export const defaultCommand = defineCommand({
	meta: {
		name: "dockerize",
		description: "Generate Docker configuration for a Strapi project",
	},
	args: sharedFlags,
	async run({ args }) {
		const cwd = resolve(args.path)

		console.log(pc.bold(pc.blue("\nStrapi Dockerize v2.5\n")))
		console.log(pc.dim(`Scanning project at ${cwd}...\n`))

		const detected = await detectAll(cwd)

		if (args.database) {
			detected.databaseClient = args.database as DetectedConfig["databaseClient"]
		}
		if (args["package-manager"]) {
			detected.packageManager = args["package-manager"] as DetectedConfig["packageManager"]
		}

		console.log(pc.bold("Detected configuration:"))
		console.log(`  Strapi version:   ${formatValue(detected.strapiVersion)}`)
		console.log(`  Project type:     ${formatValue(detected.projectType)}`)
		console.log(`  Database:         ${formatValue(detected.databaseClient)}`)
		console.log(`  Package manager:  ${formatValue(detected.packageManager)}`)
		console.log(`  Project name:     ${formatValue(detected.projectName)}`)
		console.log(`  Environment:      ${formatValue(detected.environment)}`)
		console.log()
	},
})

function formatValue(value: string | number | boolean | undefined): string {
	if (value === undefined) return pc.yellow("not detected")
	return pc.green(String(value))
}

type DetectedConfig = Awaited<ReturnType<typeof detectAll>>
