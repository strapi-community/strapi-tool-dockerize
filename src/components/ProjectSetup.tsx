import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ProjectInfo } from '../utils/detection/index.js';
import { detectNodeVersion, NodeVersions } from '../utils/detection/node-version.js';
import { MenuItem } from '../types/cli.js';

interface ProjectSetupProps {
	projectInfo: ProjectInfo;
}

type EnvironmentType = `development` | `production` | `both`;
type DockerType = `dockerfile` | `compose`;
type DatabaseType = `postgresql` | `mysql` | `mariadb` | `sqlite`;
type StorageType = `volume` | `bind` | `tmpfs`;

type SetupStep = 
	| `review`           // Initial project review
	| `environment`      // Dev/Prod/Both choice
	| `docker-setup`     // Docker configuration
	| `database`         // Database selection if needed
	| `storage-setup`    // Storage configuration for SQLite
	| `database-config`  // Database configuration if needed
	| `node-version`     // Node.js version selection
	| `node-version-custom`  // Add new step for custom version input
	| `generate`;        // Final generation step

interface DatabaseConfig {
	host: string;
	port: number;
	name: string;
	username: string;
	password: string;
}

interface SetupConfig {
	environment: EnvironmentType | null;
	dockerType: DockerType | null;
	database: DatabaseType | null;
	storageType?: StorageType;
	nodeVersion?: string;
	databaseConfig?: DatabaseConfig;
}

interface DatabaseFormState {
	host: string;
	port: string;
	database: string;
	username: string;
	password: string;
}

export const ProjectSetup: React.FC<ProjectSetupProps> = ({ projectInfo }) => {
	const [currentStep, setCurrentStep] = useState<SetupStep>(`review`);
	const [config, setConfig] = useState<SetupConfig>({
		environment: null,
		dockerType: null,
		database: projectInfo.databaseType as DatabaseType || null,
		storageType: undefined,
		nodeVersion: undefined,
		databaseConfig: projectInfo.envFile.databaseConfig ? {
			host: projectInfo.envFile.databaseConfig.connection.host || `localhost`,
			port: projectInfo.envFile.databaseConfig.connection.port || 5432,
			name: projectInfo.envFile.databaseConfig.connection.database || `strapi`,
			username: projectInfo.envFile.databaseConfig.connection.username || `strapi`,
			password: projectInfo.envFile.databaseConfig.connection.password || ``
		} : undefined
	});

	const [nodeVersions, setNodeVersions] = useState<NodeVersions>({
		availableVersions: {
			ltsVersions: [{
				majorVersion: 20,
				version: `20.11.1`,
				name: `Hydrogen`,
				date: `2024-02-14`
			}],
			current: `21.7.1`,
			recommended: `20.11.1`
		}
	});

	const [customVersion, setCustomVersion] = useState(``);

	const [dbForm, setDbForm] = useState<DatabaseFormState>({
		host: ``,
		port: ``,
		database: ``,
		username: ``,
		password: ``
	});

	const [currentField, setCurrentField] = useState<keyof DatabaseFormState>(`host`);

	useEffect(() => {
		const loadNodeVersions = async () => {
			const versions = await detectNodeVersion(projectInfo.projectPath);
			setNodeVersions(versions);
		};
		loadNodeVersions();
	}, [projectInfo.projectPath]);

	const handleEnvironmentSelect = ({ value }: { value: string }) => {
		const envType = value as EnvironmentType;
		setConfig(prev => ({ ...prev, environment: envType }));
		setCurrentStep(`docker-setup`);
	};

	const handleDockerSetup = ({ value }: { value: string }) => {
		const dockerType = value as DockerType;
		setConfig(prev => ({ ...prev, dockerType }));
		
		// Skip database setup for simple Dockerfile
		if (dockerType === `dockerfile`) {
			setCurrentStep(`node-version`);
		} else {
			setCurrentStep(`database`);
		}
	};

	const handleDatabaseSelect = ({ value }: { value: string }) => {
		let dbType: DatabaseType;
		if (value.startsWith(`current_`)) {
			dbType = value.replace(`current_`, ``) as DatabaseType;
			// Keep existing configuration
			setCurrentStep(`node-version`);
		} else {
			dbType = value as DatabaseType;
			setConfig(prev => ({ ...prev, database: dbType }));
			
			if (dbType === `sqlite`) {
				setCurrentStep(`storage-setup`);
			} else {
				setCurrentStep(`database-config`);
			}
		}
	};

	const handleStorageSetup = ({ value }: { value: string }) => {
		const storageType = value as StorageType;
		setConfig(prev => ({ ...prev, storageType }));
		setCurrentStep(`node-version`);
	};

	const handleNodeVersionSelect = ({ value }: { value: string }) => {
		if (value === `custom`) {
			setCurrentStep(`node-version-custom`);
		} else {
			setConfig(prev => ({ ...prev, nodeVersion: value }));
			setCurrentStep(`generate`);
		}
	};

	const handleCustomVersionChange = (value: string) => {
		setCustomVersion(value);
	};

	const handleCustomVersionSubmit = (value: string) => {
		// Basic semver validation
		const versionRegex = /^\d+\.\d+\.\d+$/;
		if (!versionRegex.test(value)) {
			// You might want to add error handling here
			return;
		}
		setConfig(prev => ({ ...prev, nodeVersion: value }));
		setCurrentStep(`generate`);
	};

	const handleDbFormChange = (field: keyof DatabaseFormState, value: string) => {
		setDbForm(prev => ({
			...prev,
			[field]: value
		}));
	};

	const environmentItems: MenuItem[] = [
		{
			label: `Development`,
			value: `development`,
			hint: `Optimized for local development with hot-reload`
		},
		{
			label: `Production`,
			value: `production`,
			hint: `Optimized for deployment`
		},
		{
			label: `Both`,
			value: `both`,
			hint: `Development + Production setup`
		}
	];

	const dockerItems: MenuItem[] = [
		{
			label: `Simple Dockerfile only`,
			value: `dockerfile`,
			hint: `Lightweight, single container deployment`
		},
		{
			label: `Dockerfile with Docker Compose`,
			value: `compose`,
			hint: `Multi-container setup with database`
		}
	];

	const databaseItems: MenuItem[] = [
		...(projectInfo.databaseType ? [{
			label: `Keep ${projectInfo.databaseType} (Current)`,
			value: `current_${projectInfo.databaseType}`,
			hint: `Keep current database setup`
		}] : []),
		{
			label: `PostgreSQL`,
			value: `postgresql`,
			hint: `Recommended for production`
		},
		{
			label: `MySQL`,
			value: `mysql`,
			hint: `Popular open-source database`
		},
		{
			label: `MariaDB`,
			value: `mariadb`,
			hint: `MySQL fork with enhanced features`
		},
		{
			label: `SQLite`,
			value: `sqlite`,
			hint: config.environment === `production` 
				? `⚠️ Requires careful configuration for production`
				: `Simple file-based database`
		}
	];

	const storageItems: MenuItem[] = [
		{
			label: `Named Volume`,
			value: `volume`,
			hint: `Recommended - Persistent and managed by Docker`
		},
		{
			label: `Bind Mount`,
			value: `bind`,
			hint: `Direct access to host filesystem`
		},
		{
			label: `tmpfs (Memory)`,
			value: `tmpfs`,
			hint: `⚠️ Data lost on container restart`
		}
	];

	const nodeVersionItems: MenuItem[] = [
		...(nodeVersions.projectVersion ? [{
			label: `Project Version (v${nodeVersions.projectVersion})`,
			value: nodeVersions.projectVersion,
			hint: `Currently used in project`
		}] : []),
		...nodeVersions.availableVersions.ltsVersions.map((lts) => ({
			label: `Node ${lts.majorVersion} LTS (v${lts.version})`,
			value: lts.version,
			hint: `${lts.name} - Latest minor version`
		})),
		{
			label: `Latest (v${nodeVersions.availableVersions?.current || `21.x`})`,
			value: nodeVersions.availableVersions?.current || `21.7.1`,
			hint: `Latest available version - Not LTS`
		},
		{
			label: `Custom Version`,
			value: `custom`,
			hint: `Specify a custom Node.js version`
		}
	];

	const renderStep = () => {
		switch (currentStep) {
		case `review`:
			return (
				<Box flexDirection="column">
					<Text>✓ Strapi {projectInfo.strapiVersion} detected</Text>
					<Text>✓ Project type: {projectInfo.type}</Text>
					{projectInfo.databaseType && (
						<Text>✓ Database: {projectInfo.databaseType} detected</Text>
					)}
					<Text>✓ Docker files: {projectInfo.hasDockerfile || projectInfo.hasDockerCompose ? `Found` : `None`}</Text>
					<Text>Press Enter to start setup...</Text>
					<SelectInput
						items={[{ label: `Start Setup`, value: `start` }]}
						onSelect={() => setCurrentStep(`environment`)}
					/>
				</Box>
			);

		case `environment`:
			return (
				<Box flexDirection="column">
					<Text>Select environment setup:</Text>
					<SelectInput items={environmentItems} onSelect={handleEnvironmentSelect} />
				</Box>
			);

		case `docker-setup`:
			return (
				<Box flexDirection="column">
					<Text>How would you like to containerize your application?</Text>
					{config.environment === `production` ? (
						<Text dimColor>Note: Simple Dockerfile is recommended for production deployments</Text>
					) : (
						<Text dimColor>Note: Docker Compose is recommended for development</Text>
					)}
					<SelectInput items={dockerItems} onSelect={handleDockerSetup} />
				</Box>
			);

		case `database`:
			if (config.dockerType === `dockerfile`) {
				// Skip database setup for simple Dockerfile
				setCurrentStep(`node-version`);
				return null;
			}
			return (
				<Box flexDirection="column">
					<Text>Select database setup:</Text>
					<SelectInput items={databaseItems} onSelect={handleDatabaseSelect} />
				</Box>
			);

		case `storage-setup`:
			return (
				<Box flexDirection="column">
					<Text>SQLite storage configuration:</Text>
					{config.environment === `production` && (
						<Text color="yellow">
                ⚠️  Warning: Using SQLite in production requires careful configuration
						</Text>
					)}
					<SelectInput items={storageItems} onSelect={handleStorageSetup} />
				</Box>
			);

		case `database-config`: {
			const getDefaultHost = () => {
				if (config.dockerType === `compose`) {
					switch (config.database) {
					case `postgresql`: return `postgres`;
					case `mysql`: return `mysql`;
					case `mariadb`: return `mariadb`;
					default: return `localhost`;
					}
				}
				return `localhost`;
			};

			const getDefaultPort = () => {
				switch (config.database) {
				case `postgresql`: return `5432`;
				case `mysql`:
				case `mariadb`: return `3306`;
				default: return `5432`;
				}
			};

			const fieldLabels = {
				host: `Host`,
				port: `Port`,
				database: `Database`,
				username: `Username`,
				password: `Password`
			};

			const fieldPlaceholders = {
				host: getDefaultHost(),
				port: getDefaultPort(),
				database: `strapi`,
				username: `strapi`,
				password: `enter password`
			};

			const handleFieldSubmit = (value: string) => {
				const nextFields: Record<keyof DatabaseFormState, keyof DatabaseFormState | `done`> = {
					host: `port`,
					port: `database`,
					database: `username`,
					username: `password`,
					password: `done`
				};

				const next = nextFields[currentField];

				if (next === `done`) {
					setConfig(prev => ({
						...prev,
						databaseConfig: {
							host: dbForm.host || getDefaultHost(),
							port: parseInt(dbForm.port || getDefaultPort(), 10),
							name: dbForm.database || `strapi`,
							username: dbForm.username || `strapi`,
							password: dbForm.password
						}
					}));
					setCurrentStep(`node-version`);
					return;
				}

				setCurrentField(next);
			};

			return (
				<Box flexDirection="column">
					<Text>Configure {config.database} database:</Text>
					<Text dimColor>Note: When using Docker Compose, the database will be available at {getDefaultHost()}:{getDefaultPort()}</Text>
					
					<Box marginTop={1}>
						<Box width={12}><Text>{fieldLabels[currentField]}:</Text></Box>
						<TextInput
							value={dbForm[currentField]}
							onChange={(value) => handleDbFormChange(currentField, value)}
							onSubmit={handleFieldSubmit}
							placeholder={fieldPlaceholders[currentField]}
							showCursor={currentField !== `password`}
						/>
						<Box marginLeft={1}>
							<Text dimColor>(Press Enter to continue)</Text>
						</Box>
					</Box>

					{currentField === `host` && config.dockerType === `compose` && (
						<Box marginTop={1} flexDirection="column">
							<Text dimColor>ℹ️  Using Docker Compose? The service name &apos;{getDefaultHost()}&apos; will be your host</Text>
							<Text dimColor>   External database? Make sure it&apos;s accessible from the container network</Text>
						</Box>
					)}
				</Box>
			);
		}

		case `node-version`:
			return (
				<Box flexDirection="column">
					<Text>Select Node.js version:</Text>
					<SelectInput items={nodeVersionItems} onSelect={handleNodeVersionSelect} />
				</Box>
			);

		case `node-version-custom`:
			return (
				<Box flexDirection="column">
					<Text>Enter Node.js version (format: x.y.z):</Text>
					<TextInput
						value={customVersion}
						onChange={handleCustomVersionChange}
						onSubmit={handleCustomVersionSubmit}
						placeholder="20.11.1"
					/>
					<Text dimColor>Press Enter to confirm, or Escape to go back</Text>
				</Box>
			);

		case `generate`:
			return (
				<Box flexDirection="column">
					<Text>Configuration Summary:</Text>
					<Text>• Environment: {config.environment}</Text>
					<Text>• Docker Setup: {config.dockerType === `dockerfile` ? `Dockerfile only` : `Docker Compose`}</Text>
					<Text>• Database: {config.database}</Text>
					{config.database === `sqlite` && (
						<Text>• Storage: {config.storageType}</Text>
					)}
					<Text>• Node.js: {config.nodeVersion}</Text>
					<Text>Generating Docker configuration...</Text>
				</Box>
			);

		default:
			return <Text>Setting up your Docker environment...</Text>;
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			{renderStep()}
		</Box>
	);
};

export default ProjectSetup; 