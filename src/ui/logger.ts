import { error, info, success, warn } from "./colors"

export const log = {
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
}
