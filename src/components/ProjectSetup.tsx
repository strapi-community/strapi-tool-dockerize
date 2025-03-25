import { ProjectInfo } from "@/core/types";
import { DockerSetupTask } from "@/plugins";
import { BaseDockerTasks } from "@/plugins/core/docker-tasks";
import { getDatabasePlugin } from "@/plugins/databases";
import { MenuItem } from "@/types/cli";
import { NodeVersions, detectNodeVersion } from "@/utils/detection/node-version";
import { generateDockerConfiguration } from "@/utils/generation";
import { Box, Text, useApp } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import React, { useState, useEffect } from "react";

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

interface GenerationSubtask {
	message: string;
	status: `pending` | `running` | `done`;
}

interface GenerationStep {
	step: `dockerfile` | `compose` | `env` | `done`;
	message: string;
	subtasks: GenerationSubtask[];
}

interface GenerationStatus {
	step: GenerationStep[`step`];
	currentSubtask: number;
}

export const ProjectSetup: React.FC<ProjectSetupProps> = ({ projectInfo }) => {
	const { exit } = useApp();
	const [currentStep, setCurrentStep] = useState<SetupStep>('review');
	const [config, setConfig] = useState<SetupConfig>({
		environment: null,
		dockerType: null,
		database: projectInfo.databaseType as DatabaseType || null,
		storageType: undefined,
		nodeVersion: undefined,
		databaseConfig: projectInfo?.envFile?.databaseConfig ? {
			host: projectInfo?.envFile?.databaseConfig?.connection?.host || 'localhost',
			port: projectInfo?.envFile?.databaseConfig?.connection?.port || 5432,
			name: projectInfo?.envFile?.databaseConfig?.connection?.database || 'strapi',
			username: projectInfo?.envFile?.databaseConfig?.connection?.username || 'strapi',
			password: projectInfo?.envFile?.databaseConfig?.connection?.password || ''
		} : undefined
	});

	const [nodeVersions, setNodeVersions] = useState<NodeVersions>({
		availableVersions: {
			ltsVersions: [{
				majorVersion: 20,
				version: '20.11.1',
				name: 'Hydrogen',
				date: '2024-02-14'
			}],
			current: '21.7.1',
			recommended: '20.11.1'
		}
	});

	const [customVersion, setCustomVersion] = useState('');
	const [dbForm, setDbForm] = useState<DatabaseFormState>({
		host: '',
		port: '',
		database: '',
		username: '',
		password: ''
	});
	const [currentField, setCurrentField] = useState<keyof DatabaseFormState>('host');
	const [error, setError] = useState<string | null>(null);
	const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
		step: 'dockerfile',
		currentSubtask: 0
	});
	const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);

	// Load node versions
	useEffect(() => {
		const loadNodeVersions = async () => {
			const versions = await detectNodeVersion(projectInfo.projectPath);
			setNodeVersions(versions);
		};
		void loadNodeVersions();
	}, [projectInfo.projectPath]);

	// Handle generation steps
	useEffect(() => {
		if (currentStep !== 'generate') return;

		const generateFiles = async () => {
			try {
				const steps = await getGenerationSteps();
				// Initialize the first step as running and others as pending
				const initialSteps = steps.map((step, stepIndex) => ({
					...step,
					subtasks: step.subtasks.map((subtask, subtaskIndex) => ({
						...subtask,
						status: (stepIndex === 0 && subtaskIndex === 0 ? 'running' : 'pending') as 'pending' | 'running' | 'done'
					}))
				}));
				setGenerationSteps(initialSteps);
				setGenerationStatus({ step: steps[0].step, currentSubtask: 0 });
				
				await generateDockerConfiguration({
					config,
					updateStatus: (newStatus: GenerationStatus | ((prev: GenerationStatus) => GenerationStatus)) => {
						setGenerationStatus(prev => {
							const updatedStatus = typeof newStatus === 'function' ? newStatus(prev) : newStatus;
							
							// Update the steps immediately after updating status
							setGenerationSteps(prevSteps => {
								const newSteps = prevSteps.map(step => {
									// If this is the current step
									if (step.step === updatedStatus.step) {
										return {
											...step,
											subtasks: step.subtasks.map((subtask, index) => ({
												...subtask,
												status: index < updatedStatus.currentSubtask ? ('done' as const)
													: index === updatedStatus.currentSubtask ? ('running' as const)
													: ('pending' as const)
											}))
										};
									}
									
									// If this step is complete (we've moved past it)
									if (prevSteps.findIndex(s => s.step === updatedStatus.step) > prevSteps.findIndex(s => s.step === step.step)) {
										return {
											...step,
											subtasks: step.subtasks.map(subtask => ({
												...subtask,
												status: 'done' as const
											}))
										};
									}
									
									// If this is a future step
									if (prevSteps.findIndex(s => s.step === updatedStatus.step) < prevSteps.findIndex(s => s.step === step.step)) {
										return {
											...step,
											subtasks: step.subtasks.map(subtask => ({
												...subtask,
												status: 'pending' as const
											}))
										};
									}
									
									return step;
								});
								
								return newSteps;
							});
							
							return updatedStatus;
						});
					}
				});
			} catch (err) {
				console.error('Failed to generate Docker configuration:', err);
				setError('Failed to generate Docker configuration. Please check the logs and try again.');
			}
		};

		void generateFiles();
	}, [currentStep, config]);

	const getGenerationSteps = async (): Promise<GenerationStep[]> => {
		// Get base Docker tasks
		const baseTasks = BaseDockerTasks.getBaseTasks();
		
		// Get database-specific tasks if needed
		let databaseTasks: DockerSetupTask[] = [];
		if (config.dockerType === `compose` && config.database) {
			const dbPlugin = getDatabasePlugin(config.database);
			if (dbPlugin) {
				databaseTasks = await dbPlugin.getDockerTasks();
			}
		}

		// Convert tasks to generation steps
		const convertTaskToStep = (task: DockerSetupTask): GenerationStep => ({
			step: task.id as `dockerfile` | `compose` | `env` | `done`,
			message: task.title,
			subtasks: (task.subtasks || []).map(subtask => ({
				message: subtask.title,
				status: `pending`
			}))
		});

		// Combine and convert all tasks
		const allTasks = [...baseTasks, ...databaseTasks];
		return allTasks.map(convertTaskToStep);
	};

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
			hint: `Hot-reload enabled, optimized for local development`
		},
		{
			label: `Production`,
			value: `production`,
			hint: `Optimized for performance and security`
		},
		{
			label: `Both (Development + Production)`,
			value: `both`,
			hint: `Separate configs for dev and prod environments`
		}
	];

	const dockerItems: MenuItem[] = [
		{
			label: `Simple Dockerfile`,
			value: `dockerfile`,
			hint: config.environment && config.environment === `both`
				? `Single Dockerfile with dev/prod stages`
				: `Lightweight, single container setup`
		},
		{
			label: `Docker Compose Setup`,
			value: `compose`,
			hint: config.environment && config.environment === `both`
				? `Separate compose files for dev/prod with databases`
				: `Multi-container setup with database`
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
		...nodeVersions.availableVersions.ltsVersions.map((lts: { majorVersion: number; version: string; name: string }) => ({
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

		case `generate`: {
			const currentStepIndex = generationSteps.findIndex(s => s.step === generationStatus.step);

			return (
				<Box flexDirection="column">
					<Text>Configuration Summary:</Text>
					<Text>• Environment: {config.environment}</Text>
					<Text>• Docker Setup: {config.dockerType === `dockerfile` ? `Dockerfile only` : `Docker Compose`}</Text>
					{config.database && <Text>• Database: {config.database}</Text>}
					{config.database === `sqlite` && (
						<Text>• Storage: {config.storageType}</Text>
					)}
					<Text>• Node.js: {config.nodeVersion}</Text>
					
					<Box marginTop={1} flexDirection="column">
						{error ? (
							<Box flexDirection="column" marginY={1}>
								<Text color="red">⚠️ Error during generation:</Text>
								<Text>{error}</Text>
								<Text dimColor>Please check the logs and try again</Text>
								<SelectInput
									items={[
										{ label: `Try Again`, value: `retry` },
										{ label: `Exit`, value: `exit` }
									]}
									onSelect={({ value }) => {
										if (value === `retry`) {
											setError(null);
											void getGenerationSteps();
										} else {
											exit();
										}
									}}
								/>
							</Box>
						) : generationStatus.step === `done` ? (
							<>
								<Text color="green">✨ Configuration complete! ✨</Text>
								<Box marginY={1}>
									<Text>Your Docker configuration has been generated successfully.</Text>
								</Box>
								
								<Box marginY={1} flexDirection="column">
									<Text bold>Generated files:</Text>
									<Text>• Dockerfile - Base container configuration</Text>
									{config.environment === `both` && (
										<>
											<Text>• .env.development - Development environment variables</Text>
											<Text>• .env.production - Production environment variables</Text>
										</>
									)}
									{config.dockerType === `compose` ? (
										<>
											<Text>• docker-compose.yml - Development services configuration</Text>
											{config.environment === `both` && (
												<Text>• docker-compose.prod.yml - Production services configuration</Text>
											)}
										</>
									) : (
										<Text>• .env - Environment configuration</Text>
									)}
								</Box>

								<Box marginY={1} flexDirection="column">
									<Text bold>Quick Start Guide:</Text>
									{config.environment && config.environment === `both` ? (
										<>
											<Text>Development:</Text>
											<Text color="cyan">1. docker compose up</Text>
											<Text dimColor>   Hot-reload enabled, best for development</Text>
											
											<Text>Production:</Text>
											<Text color="cyan">1. docker compose -f docker-compose.prod.yml up -d</Text>
											<Text dimColor>   Optimized for performance</Text>
											
											<Text bold>Switching Environments:</Text>
											<Text>• Use .env.development for development settings</Text>
											<Text>• Use .env.production for production settings</Text>
										</>
									) : (
										<>
											<Text>1. Review the generated files</Text>
											{config.dockerType === `compose` ? (
												<>
													<Text>2. Start your containers:</Text>
													<Text>   <Text color="cyan">docker compose up</Text></Text>
													<Text>3. Visit <Text color="cyan">http://localhost:1337</Text></Text>
												</>
											) : (
												<>
													<Text>2. Build your image:</Text>
													<Text>   <Text color="cyan">docker build -t my-strapi-app .</Text></Text>
													<Text>3. Run the container:</Text>
													<Text>   <Text color="cyan">docker run -p 1337:1337 my-strapi-app</Text></Text>
												</>
											)}
										</>
									)}
								</Box>

								{config.environment === `production` && (
									<Box marginY={1} flexDirection="column">
										<Text bold>Production Optimizations:</Text>
										<Text>• Enable build cache: <Text color="cyan">DOCKER_BUILDKIT=1 docker build .</Text></Text>
										<Text>• Use multi-stage builds to reduce image size</Text>
										<Text>• Consider using Docker volumes for uploads</Text>
										{config.database === `postgresql` && (
											<Text>• Configure PostgreSQL for production use</Text>
										)}
									</Box>
								)}

								{config.dockerType === `compose` && (
									<Box marginY={1} flexDirection="column">
										<Text bold>Pro Tips:</Text>
										<Text>• Scale your app: <Text color="cyan">docker compose up -d --scale strapi=2</Text></Text>
										<Text>• View logs: <Text color="cyan">docker compose logs -f</Text></Text>
										<Text>• Database backup: <Text color="cyan">docker compose exec db pg_dump...</Text></Text>
									</Box>
								)}

								<Box marginY={1} flexDirection="column">
									<Text bold>Documentation & Resources:</Text>
									<Text>• Full guide: <Text color="blue">https://docs.strapi.io/dev-docs/deployment/docker</Text></Text>
									<Text>• Community: <Text color="blue">https://discord.strapi.io</Text></Text>
									<Text>• Examples: <Text color="blue">https://github.com/strapi/strapi-docker-examples</Text></Text>
								</Box>

								<Box marginY={1} flexDirection="column">
									<Text bold>Support the project:</Text>
									<Text>• Star us on GitHub: <Text color="blue">https://github.com/strapi/strapi-tool-dockerize</Text></Text>
									<Text>• Buy me a coffee: <Text color="yellow">https://buymeacoffee.com/simendaehlin</Text></Text>
									<Text>• Report issues: <Text color="blue">https://github.com/strapi/strapi-tool-dockerize/issues</Text></Text>
								</Box>

								<Box marginTop={1}>
									<Text dimColor>Press <Text color="green">Enter</Text> to exit</Text>
								</Box>

								<SelectInput
									items={[{ label: `Exit`, value: `exit` }]}
									onSelect={() => exit()}
								/>
							</>
						) : (
							generationSteps.map((step, index) => {
								if (index < currentStepIndex) {
									return (
										<Box key={step.step} flexDirection="column">
											<Text>✓ {step.message}</Text>
											{step.subtasks.map((subtask, i) => (
												<Box key={i} marginLeft={2}>
													<Text>✓ {subtask.message}</Text>
												</Box>
											))}
										</Box>
									);
								}
								if (index === currentStepIndex) {
									return (
										<Box key={step.step} flexDirection="column">
											<Box>
												<Text color="green"><Spinner type="dots" /></Text>
												<Text> {step.message}</Text>
											</Box>
											{step.subtasks.map((subtask, i) => (
												<Box key={i} marginLeft={2}>
													{subtask.status === 'done' && (
														<Text>✓ {subtask.message}</Text>
													)}
													{subtask.status === 'running' && (
														<Box>
															<Text color="yellow"><Spinner type="dots" /></Text>
															<Text> {subtask.message}</Text>
														</Box>
													)}
													{subtask.status === 'pending' && (
														<Text dimColor>⋯ {subtask.message}</Text>
													)}
												</Box>
											))}
										</Box>
									);
								}
								return (
									<Box key={step.step} flexDirection="column">
										<Text dimColor>⋯ {step.message}</Text>
										{step.subtasks.map((subtask, i) => (
											<Box key={i} marginLeft={2}>
												<Text dimColor>⋯ {subtask.message}</Text>
											</Box>
										))}
									</Box>
								);
							})
						)}
					</Box>
				</Box>
			);
		}

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