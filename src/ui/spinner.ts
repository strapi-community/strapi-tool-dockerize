import { createSpinner as nano } from "nanospinner"

export function createSpinner(text: string) {
	const spinner = nano(text).start()

	return {
		success(message?: string) {
			spinner.success({ text: message })
		},
		error(message?: string) {
			spinner.error({ text: message })
		},
		update(message: string) {
			spinner.update({ text: message })
		},
	}
}
