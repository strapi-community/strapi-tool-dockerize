import { dim, error, info, success, warn } from "./colors"

let verbose = false

export const log = {
	setVerbose(value: boolean) {
		verbose = value
	},
	isVerbose() {
		return verbose
	},
	info(message: string) {
		console.log(`${info("ℹ")} ${message}`)
	},
	success(message: string) {
		console.log(`${success("✔")} ${message}`)
	},
	warn(message: string) {
		console.log(`${warn("⚠")} ${message}`)
	},
	error(message: string) {
		console.log(`${error("✖")} ${message}`)
	},
	debug(message: string) {
		if (!verbose) return
		console.log(`${dim("○")} ${dim(message)}`)
	},
}
