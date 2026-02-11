import { readFile } from "node:fs/promises"

export async function parseEnvFile(filePath: string): Promise<Record<string, string>> {
	try {
		const content = await readFile(filePath, "utf-8")
		return parseEnvContent(content)
	} catch {
		return {}
	}
}

export function parseEnvContent(content: string): Record<string, string> {
	const result: Record<string, string> = {}
	const lines = content.split("\n")
	let i = 0

	while (i < lines.length) {
		const line = lines[i].trim()
		i++

		if (!line || line.startsWith("#")) continue

		const eqIndex = line.indexOf("=")
		if (eqIndex === -1) continue

		const key = line.slice(0, eqIndex).trim()
		let value = line.slice(eqIndex + 1).trim()

		if (!key) continue

		const quoteChar = value[0]
		if (quoteChar === '"' || quoteChar === "'") {
			value = value.slice(1)
			if (value.endsWith(quoteChar)) {
				value = value.slice(0, -1)
			} else {
				while (i < lines.length) {
					const nextLine = lines[i]
					i++
					if (nextLine.trimEnd().endsWith(quoteChar)) {
						value += `\n${nextLine.trimEnd().slice(0, -1)}`
						break
					}
					value += `\n${nextLine}`
				}
			}
			if (quoteChar === '"') {
				value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
			}
		} else {
			const commentIndex = value.indexOf(" #")
			if (commentIndex !== -1) {
				value = value.slice(0, commentIndex).trim()
			}
		}

		result[key] = value
	}

	return result
}
