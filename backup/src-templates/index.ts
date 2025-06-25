import { Environment } from './environments';
import { 
  createComposeConfig, 
  addDatabaseService, 
  applyCustomModifications,
  generateComposeFile 
} from './compose-manager';
import { DatabasePlugin } from "@/plugins/core/types";
import { ProjectInfo } from '../types';
import { writeConfigurationFiles } from '../utils/file-utils';
import { updateEnvFile } from '../utils/env-utils';

type GenerateOptions = {
  projectInfo: ProjectInfo;
  answers: {
    environment: 'development' | 'production';
    database?: string;
    databaseConfig?: any;
    nodeVersion: string;
  };
  selectedPlugin?: DatabasePlugin;
};

export async function generateConfiguration(options: GenerateOptions) {
  // 1. Generate docker-compose file based on environment
  const composeConfig = await generateDockerCompose({
    nodeVersion: options.answers.nodeVersion,
    environment: options.answers.environment,
    database: options.selectedPlugin ? {
      plugin: options.selectedPlugin,
      config: options.answers.databaseConfig
    } : undefined
  });

  // 2. Write configuration files
  await writeConfigurationFiles({
    composeConfig,
    environment: options.answers.environment
  });

  // 3. Generate or update .env file if needed
  if (options.selectedPlugin) {
    await updateEnvFile(options.selectedPlugin, options.answers.databaseConfig);
  }
}

type DockerComposeOptions = {
  nodeVersion: string;
  environment: Environment;
  database?: {
    plugin: DatabasePlugin;
    config: any;
  };
  customModifications?: Array<{
    service: string;
    config: Record<string, any>;
  }>;
};

export async function generateDockerCompose(options: DockerComposeOptions): Promise<string> {
  // Create environment-specific base config
  let compose = createComposeConfig(options.nodeVersion, options.environment);

  // Add database if configured
  if (options.database) {
    compose = addDatabaseService(
      compose,
      options.database.plugin,
      options.database.config,
      options.environment
    );
  }

  // Apply any custom modifications
  if (options.customModifications) {
    compose = applyCustomModifications(compose, options.customModifications);
  }

  // Generate final compose file
  return generateComposeFile(compose, options.environment);
} 