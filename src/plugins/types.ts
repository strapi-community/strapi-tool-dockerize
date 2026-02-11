import type { DatabaseClient, PackageManager, ResolvedConfig, SecretBackend } from "../config"

export interface HealthCheck {
	test: string[]
	interval: string
	timeout: string
	retries: number
	startPeriod?: string
}

export interface ComposeService {
	image: string
	environment: Record<string, string>
	ports: string[]
	volumes: string[]
	healthcheck: HealthCheck
	restart: string
}

export interface DatabasePlugin {
	id: DatabaseClient
	displayName: string
	defaultPort: number
	driverPackage: string
	v4DriverPackage: string
	v5DriverPackage: string
	strapiClient: string
	composeService(config: ResolvedConfig): ComposeService
	envVars(config: ResolvedConfig): Record<string, string>
	healthcheck(): HealthCheck
}

export interface PackageManagerPlugin {
	id: PackageManager
	displayName: string
	lockFile: string
	installCommand: string
	buildCommand: string
	startCommand: string
	devCommand: string
	addPackageCommand(pkg: string): string
	removePackageCommand(pkg: string): string
	dockerBaseImage(nodeVersion: string): string
	dockerSetupSteps(): string[]
	dockerCopyFiles(): string[]
	dockerInstallStep(production: boolean): string
	dockerBuildStep(): string
	dockerStartStep(dev: boolean): string
}

export interface ComposeSecret {
	name: string
	file: string
}

export interface SecretManagerPlugin {
	id: SecretBackend
	displayName: string
	composeSecrets(config: ResolvedConfig): ComposeSecret[]
	serviceSecrets(config: ResolvedConfig): string[]
	envOverrides(config: ResolvedConfig): Record<string, string>
	generateFiles(config: ResolvedConfig, cwd: string): Promise<string[]>
}

export interface PluginRegistry {
	databases: Map<DatabaseClient, DatabasePlugin>
	packageManagers: Map<PackageManager, PackageManagerPlugin>
	secretManagers: Map<SecretBackend, SecretManagerPlugin>
	getDatabase(id: DatabaseClient): DatabasePlugin
	getPackageManager(id: PackageManager): PackageManagerPlugin
	getSecretManager(id: SecretBackend): SecretManagerPlugin
}
