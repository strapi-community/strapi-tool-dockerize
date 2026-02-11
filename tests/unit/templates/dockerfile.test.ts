import { describe, it, expect } from "bun:test"
import { renderTemplate } from "../../../src/templates"

const baseContext = {
	baseImage: "node:20-alpine",
	runtimeImage: "node:20-alpine",
	pmSetupSteps: [],
	pmCopyFiles: ["package.json", "package-lock.json"],
	pmInstallStep: "npm ci",
	pmInstallStepProd: "npm ci --omit=dev",
	pmBuildStep: "npm run build",
	pmStartStep: '["npm", "start"]',
	pmDevStep: '["npm", "run", "develop"]',
	projectName: "test-project",
	strapiPort: 1337,
}

function extractStage(dockerfile: string, stageName: string): string {
	const lines = dockerfile.split("\n")
	const stageStart = lines.findIndex((l) =>
		l.match(new RegExp(`^FROM .+ AS ${stageName}$`)),
	)
	if (stageStart === -1) return ""
	const stageEnd = lines.findIndex(
		(l, i) => i > stageStart && l.startsWith("FROM "),
	)
	return lines
		.slice(stageStart, stageEnd === -1 ? undefined : stageEnd)
		.join("\n")
}

describe("Dockerfile dev template", () => {
	it("base stage includes build tools", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const base = extractStage(result, "base")
		expect(base).toContain("build-base")
		expect(base).toContain("gcc")
		expect(base).toContain("vips-dev")
	})

	it("runtime stage does not include build tools", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toContain("build-base")
		expect(runtime).not.toContain("gcc")
		expect(runtime).not.toContain("autoconf")
		expect(runtime).not.toContain("automake")
		expect(runtime).not.toContain("zlib-dev")
		expect(runtime).not.toContain("libpng-dev")
		expect(runtime).not.toContain("vips-dev")
	})

	it("runtime stage installs vips runtime library", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("apk add --no-cache vips")
	})

	it("runtime stage uses runtimeImage not base", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toMatch(/^FROM node:20-alpine AS runtime/)
		expect(runtime).not.toContain("FROM base")
	})

	it("runtime stage creates strapi user", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("addgroup -S strapi")
		expect(runtime).toContain("adduser -S strapi -G strapi")
	})

	it("runtime stage sets NODE_ENV to development", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("NODE_ENV=development")
	})

	it("runtime stage includes pm setup steps when present", async () => {
		const ctx = { ...baseContext, pmSetupSteps: ["RUN corepack enable"] }
		const result = await renderTemplate("Dockerfile", ctx)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("RUN corepack enable")
	})

	it("runtime stage omits pm setup steps when empty", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toContain("corepack")
	})

	it("has no extra blank lines within stages when pmSetupSteps is empty", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		const base = extractStage(result, "base")
		expect(base).not.toMatch(/\n\n\n/)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toMatch(/\n\n\n/)
	})

	it("has no extra blank lines within stages when pmSetupSteps has values", async () => {
		const ctx = { ...baseContext, pmSetupSteps: ["RUN corepack enable"] }
		const result = await renderTemplate("Dockerfile", ctx)
		const base = extractStage(result, "base")
		expect(base).not.toMatch(/\n\n\n/)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toMatch(/\n\n\n/)
	})

	it("preserves single blank lines between stages", async () => {
		const result = await renderTemplate("Dockerfile", baseContext)
		expect(result).toMatch(/WORKDIR \/opt\/app\n\nFROM base AS deps/)
		expect(result).toMatch(/RUN npm ci\n\nFROM deps AS build/)
		expect(result).toMatch(/RUN npm run build\n\nFROM node:20-alpine AS runtime/)
	})
})

describe("Dockerfile prod template", () => {
	it("base stage includes build tools", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const base = extractStage(result, "base")
		expect(base).toContain("build-base")
		expect(base).toContain("gcc")
		expect(base).toContain("vips-dev")
	})

	it("runtime stage does not include build tools", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toContain("build-base")
		expect(runtime).not.toContain("gcc")
		expect(runtime).not.toContain("autoconf")
		expect(runtime).not.toContain("automake")
		expect(runtime).not.toContain("zlib-dev")
		expect(runtime).not.toContain("libpng-dev")
		expect(runtime).not.toContain("vips-dev")
	})

	it("runtime stage installs vips runtime library", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("apk add --no-cache vips")
	})

	it("runtime stage uses runtimeImage not base", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toMatch(/^FROM node:20-alpine AS runtime/)
		expect(runtime).not.toContain("FROM base")
	})

	it("runtime stage includes pm setup steps for pnpm", async () => {
		const ctx = { ...baseContext, pmSetupSteps: ["RUN corepack enable"] }
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("RUN corepack enable")
	})

	it("runtime stage includes pm setup steps for yarn", async () => {
		const ctx = { ...baseContext, pmSetupSteps: ["RUN corepack enable"] }
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("RUN corepack enable")
	})

	it("runtime stage omits pm setup steps for npm", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toContain("corepack")
	})

	it("runtime stage omits pm setup steps for bun", async () => {
		const ctx = { ...baseContext, pmSetupSteps: [] }
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toContain("corepack")
	})

	it("has no extra blank lines within stages when pmSetupSteps is empty", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const base = extractStage(result, "base")
		expect(base).not.toMatch(/\n\n\n/)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toMatch(/\n\n\n/)
	})

	it("has no extra blank lines within stages when pmSetupSteps has values", async () => {
		const ctx = { ...baseContext, pmSetupSteps: ["RUN corepack enable"] }
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const base = extractStage(result, "base")
		expect(base).not.toMatch(/\n\n\n/)
		const runtime = extractStage(result, "runtime")
		expect(runtime).not.toMatch(/\n\n\n/)
	})

	it("preserves single blank lines between stages", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		expect(result).toMatch(/WORKDIR \/opt\/app\n\nFROM base AS deps/)
		expect(result).toMatch(/RUN npm ci --omit=dev\n\nFROM deps AS build/)
		expect(result).toMatch(/RUN npm run build\n\nFROM node:20-alpine AS runtime/)
	})
})
