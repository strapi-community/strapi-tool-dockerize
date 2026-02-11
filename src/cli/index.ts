import { defineCommand, runMain } from "citty"
import { defaultCommand } from "./commands/default"
import { resetCommand } from "./commands/reset"
import { sharedFlags } from "./flags"

const SUBCOMMANDS = new Set(["reset"])

const main = defineCommand({
	meta: {
		name: "strapi-dockerize",
		version: "2.5.0",
		description: "Generate Docker configuration for Strapi projects",
	},
	args: sharedFlags,
	subCommands: {
		reset: resetCommand,
	},
	async run(ctx) {
		const hasSubCommand = ctx.rawArgs.some((arg) => SUBCOMMANDS.has(arg))
		if (hasSubCommand) {
			return
		}
		const resolved = await defaultCommand
		await resolved.run!(ctx)
	},
})

export function runCli() {
	runMain(main)
}
