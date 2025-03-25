import { ProjectInfo } from '../core/types';
import { select, confirm } from '@inquirer/prompts';

export async function getEnvironmentConfig(projectInfo: ProjectInfo) {
	const detectedEnv = projectInfo.environment;

	const environment = await select({
		message: `Select environment setup:`,
		default: detectedEnv || `development`,
		choices: [
			{
				name: `Development (Optimized for local development with hot-reload)`,
				value: `development`,
				description: `Sets up docker-compose with hot-reload and development tools`
			},
			{
				name: `Production (Optimized for deployment)`,
				value: `production`,
				description: `Production-ready setup with optimizations`
			},
			{
				name: `Both (Development + Production setup)`,
				value: `both`,
				description: `Creates both development and production configurations`
			}
		]
	});

	// If production or both, ask for deployment setup
	let deploymentType = null;
	if (environment === `production` || environment === `both`) {
		deploymentType = await select({
			message: `Choose deployment setup:`,
			choices: [
				{
					name: `Docker Compose (Multi-container setup, good for custom servers)`,
					value: `compose`,
					description: `Better for complex setups with multiple services`
				},
				{
					name: `Single Dockerfile (Simple deployment, good for platforms like Heroku)`,
					value: `dockerfile`,
					description: `Simpler deployment, everything in one container`
				}
			]
		});
	}

	// Development tools configuration if development or both
	let devTools = null;
	if (environment === `development` || environment === `both`) {
		const enableDebug = await confirm({
			message: `Enable Node.js debugging?`,
			default: false
		});

		const debugPort = enableDebug ? 9229 : null;

		devTools = {
			debug: enableDebug,
			debugPort,
			watchPaths: [`src/`, `config/`]
		};
	}

	return {
		environment,
		deploymentType: deploymentType || `compose`,
		devTools
	};
} 