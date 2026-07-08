import { readFile } from "node:fs/promises"

export async function parseEnvFile(filePath: string): Promise<Record<string, string>> {
	try {
		const content = await readFile(filePath, "utf-8")
		return parseEnvContent(content)
	} catch {
		return {}
	}
}

function readQuotedValue(
	firstChunk: string,
	quoteChar: string,
	lines: string[],
	startIndex: number,
): { value: string; nextIndex: number } {
	let value = firstChunk.slice(1)
	let i = startIndex

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

	return { value, nextIndex: i }
}

function stripInlineComment(value: string): string {
	const commentIndex = value.indexOf(" #")
	return commentIndex !== -1 ? value.slice(0, commentIndex).trim() : value
}

export function parseEnvContent(content: string): Record<string, string> {
	const result: Record<string, string> = {}
	const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
	let i = 0

	while (i < lines.length) {
		const line = lines[i].trim()
		i++

		if (!line || line.startsWith("#")) continue

		const eqIndex = line.indexOf("=")
		if (eqIndex === -1) continue

		const key = line.slice(0, eqIndex).trim()
		if (!key) continue

		const rawValue = line.slice(eqIndex + 1).trim()
		const quoteChar = rawValue[0]

		if (quoteChar === '"' || quoteChar === "'") {
			const parsed = readQuotedValue(rawValue, quoteChar, lines, i)
			result[key] = parsed.value
			i = parsed.nextIndex
		} else {
			result[key] = stripInlineComment(rawValue)
		}
	}

	return result
}
