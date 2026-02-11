import { Liquid } from "liquidjs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, "files")

const engine = new Liquid({
	root: [TEMPLATES_DIR],
	extname: ".liquid",
	strictFilters: true,
	strictVariables: false,
})

export async function renderTemplate(templateName: string, context: Record<string, unknown>): Promise<string> {
	const result = await engine.renderFile(templateName, context)
	return result.toString()
}
