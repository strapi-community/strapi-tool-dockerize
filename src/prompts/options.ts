import * as p from "@clack/prompts"
import type { Environment, SecretBackend } from "../config"

export async function promptProjectName(detected?: string): Promise<string> {
	const name = await p.text({
		message: "Project name",
		placeholder: detected ?? "strapi",
		defaultValue: detected ?? "strapi",
		validate: (value) => {
			if (!value.trim()) return "Project name cannot be empty"
			if (!/^[a-z0-9][a-z0-9._-]*$/i.test(value))
				return "Project name must start with alphanumeric and contain only letters, numbers, dots, hyphens, underscores"
		},
	})
	if (p.isCancel(name)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}
	return name as string
}

export async function promptEnvironment(detected?: Environment): Promise<Environment> {
	const selected = await p.select({
		message: "Which environment(s) should the Dockerfile target?",
		initialValue: detected,
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

export async function promptSecretBackend(detected?: SecretBackend): Promise<SecretBackend> {
	const selected = await p.select({
		message: "How should secrets be managed?",
		initialValue: detected ?? "none",
		options: [
			{ value: "none", label: "None", hint: "plain env vars" },
			{
				value: "docker-secrets",
				label: "Docker Secrets",
				hint: "file-based, more secure",
			},
		],
	})

	if (p.isCancel(selected)) {
		p.cancel("Setup cancelled.")
		process.exit(0)
	}

	return selected as SecretBackend
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
