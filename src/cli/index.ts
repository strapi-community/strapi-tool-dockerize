import { defineCommand, runMain } from "citty"
import { defaultCommand } from "./commands/default"
import { resetCommand } from "./commands/reset"

const main = defineCommand({
	meta: {
		name: "strapi-dockerize",
		version: "2.5.0",
		description: "Generate Docker configuration for Strapi projects",
	},
	subCommands: {
		reset: resetCommand,
	},
	...defaultCommand,
})

export function runCli() {
	runMain(main)
}
