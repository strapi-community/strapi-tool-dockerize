import { describe, expect, it } from "bun:test"
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
	healthInterval: "30s",
	healthTimeout: "10s",
	healthStartPeriod: "40s",
	healthRetries: 3,
}

function extractStage(dockerfile: string, stageName: string): string {
	const lines = dockerfile.split("\n")
	const stageStart = lines.findIndex((l) => l.match(new RegExp(`^FROM .+ AS ${stageName}$`)))
	if (stageStart === -1) return ""
	const stageEnd = lines.findIndex((l, i) => i > stageStart && l.startsWith("FROM "))
	return lines.slice(stageStart, stageEnd === -1 ? undefined : stageEnd).join("\n")
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
		expect(result).toMatch(/RUN npm ci\n\nFROM deps AS build/)
		expect(result).toMatch(/RUN npm run build\n\nFROM base AS production-deps/)
		expect(result).toMatch(/RUN npm ci --omit=dev\n\nFROM node:20-alpine AS runtime/)
	})

	it("has a production-deps stage", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).not.toBe("")
		expect(prodDeps).toMatch(/^FROM base AS production-deps/)
	})

	it("deps stage uses full install without production flags", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const deps = extractStage(result, "deps")
		expect(deps).toContain("RUN npm ci")
		expect(deps).not.toContain("--omit=dev")
		expect(deps).not.toContain("--production")
		expect(deps).not.toContain("--prod")
	})

	it("production-deps stage uses production-only install", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).toContain("RUN npm ci --omit=dev")
	})

	it("runtime copies node_modules from production-deps", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain(
			"COPY --chown=strapi:strapi --from=production-deps /opt/app/node_modules ./node_modules",
		)
	})

	it("runtime copies built output from build stage", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const runtime = extractStage(result, "runtime")
		expect(runtime).toContain("COPY --chown=strapi:strapi --from=build /opt/app .")
	})

	it("production-deps stage uses pnpm prod install", async () => {
		const ctx = {
			...baseContext,
			pmInstallStep: "pnpm install --frozen-lockfile",
			pmInstallStepProd: "pnpm install --frozen-lockfile --prod",
			pmCopyFiles: ["package.json", "pnpm-lock.yaml"],
		}
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const deps = extractStage(result, "deps")
		expect(deps).toContain("RUN pnpm install --frozen-lockfile")
		expect(deps).not.toContain("--prod")
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).toContain("RUN pnpm install --frozen-lockfile --prod")
	})

	it("production-deps stage uses yarn prod install", async () => {
		const ctx = {
			...baseContext,
			pmInstallStep: "yarn install --frozen-lockfile",
			pmInstallStepProd: "yarn install --frozen-lockfile --production",
			pmCopyFiles: ["package.json", "yarn.lock"],
		}
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const deps = extractStage(result, "deps")
		expect(deps).toContain("RUN yarn install --frozen-lockfile")
		expect(deps).not.toContain("--production")
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).toContain("RUN yarn install --frozen-lockfile --production")
	})

	it("production-deps stage uses bun prod install", async () => {
		const ctx = {
			...baseContext,
			pmInstallStep: "bun install --frozen-lockfile",
			pmInstallStepProd: "bun install --frozen-lockfile --production",
			pmCopyFiles: ["package.json", "bun.lockb"],
		}
		const result = await renderTemplate("Dockerfile.prod", ctx)
		const deps = extractStage(result, "deps")
		expect(deps).toContain("RUN bun install --frozen-lockfile")
		expect(deps).not.toContain("--production")
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).toContain("RUN bun install --frozen-lockfile --production")
	})

	it("has no extra blank lines within production-deps stage", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const prodDeps = extractStage(result, "production-deps")
		expect(prodDeps).not.toMatch(/\n\n\n/)
	})

	it("build stage sets NODE_ENV to production", async () => {
		const result = await renderTemplate("Dockerfile.prod", baseContext)
		const build = extractStage(result, "build")
		expect(build).toContain("ENV NODE_ENV=production")
	})
})
