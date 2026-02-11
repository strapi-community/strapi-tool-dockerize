import * as p from "@clack/prompts"
import type { Environment } from "../config"

export async function promptEnvironment(): Promise<Environment> {
	const selected = await p.select({
		message: "Which environment(s) should the Dockerfile target?",
		options: [
			{ value: "development", label: "Development", hint: "hot-reload, debug friendly" },
			{ value: "production", label: "Production", hint: "optimized, multi-stage build" },
			{ value: "both", label: "Both", hint: "generates dev + prod Dockerfiles and compose files" },
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as Environment
}

export async function promptUseCompose(): Promise<boolean> {
	const result = await p.confirm({
		message: "Generate a docker-compose.yml?",
		initialValue: true,
	})

	if (p.isCancel(result)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return result
}

export async function promptUseAdminer(): Promise<boolean> {
	const result = await p.confirm({
		message: "Include Adminer (database web UI)?",
		initialValue: false,
	})

	if (p.isCancel(result)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return result
}
