import { z } from "zod"

export const databaseClientSchema = z.enum(["postgres", "mysql", "mariadb", "sqlite"])
export type DatabaseClient = z.infer<typeof databaseClientSchema>

export const packageManagerSchema = z.enum(["npm", "yarn", "pnpm", "bun"])
export type PackageManager = z.infer<typeof packageManagerSchema>

export const environmentSchema = z.enum(["development", "production", "both"])
export type Environment = z.infer<typeof environmentSchema>

export const projectTypeSchema = z.enum(["js", "ts"])
export type ProjectType = z.infer<typeof projectTypeSchema>

export const strapiVersionSchema = z.enum(["v4", "v5"])
export type StrapiVersion = z.infer<typeof strapiVersionSchema>

export const detectedPluginSchema = z.object({
	name: z.string(),
	envVars: z.record(z.string()),
})

export type DetectedPlugin = z.infer<typeof detectedPluginSchema>

export const detectedConfigSchema = z.object({
	strapiVersion: strapiVersionSchema.optional(),
	projectType: projectTypeSchema.optional(),
	databaseClient: databaseClientSchema.optional(),
	packageManager: packageManagerSchema.optional(),
	environment: environmentSchema.optional(),
	projectName: z.string().optional(),
	databaseHost: z.string().optional(),
	databasePort: z.number().optional(),
	databaseName: z.string().optional(),
	databaseUsername: z.string().optional(),
	databasePassword: z.string().optional(),
	useCompose: z.boolean().optional(),
	useAdminer: z.boolean().optional(),
	useBackups: z.boolean().optional(),
	isESM: z.boolean().optional(),
	envVars: z.record(z.string()).optional(),
	detectedPlugins: z.array(detectedPluginSchema).optional(),
})

export type DetectedConfig = z.infer<typeof detectedConfigSchema>

export const resolvedConfigSchema = z.object({
	strapiVersion: strapiVersionSchema,
	projectType: projectTypeSchema,
	databaseClient: databaseClientSchema,
	packageManager: packageManagerSchema,
	environment: environmentSchema,
	projectName: z.string().min(1),
	databaseHost: z.string().min(1),
	databasePort: z.number().nonnegative(),
	databaseName: z.string().min(1),
	databaseUsername: z.string().min(1),
	databasePassword: z.string().min(1),
	useCompose: z.boolean(),
	useAdminer: z.boolean(),
	useBackups: z.boolean().default(false),
	isESM: z.boolean(),
	envVars: z.record(z.string()),
	detectedPlugins: z.array(detectedPluginSchema).default([]),
})

export type ResolvedConfig = z.infer<typeof resolvedConfigSchema>
