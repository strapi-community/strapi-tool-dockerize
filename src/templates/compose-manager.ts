import yaml from 'yaml';
import { DatabasePlugin } from '../core/types';
import { Environment, environmentConfigs } from './environments';

type ComposeConfig = {
  version: string;
  services: Record<string, any>;
};

type CustomModification = {
  service: string;
  config: Record<string, any>;
};

export function createComposeConfig(
  nodeVersion: string, 
  environment: Environment
): ComposeConfig {
  const envConfig = environmentConfigs[environment];
  
  return {
    version: '3',
    services: {
      strapi: {
        container_name: 'strapi',
        image: `node:${nodeVersion}`,
        working_dir: '/app',
        volumes: envConfig.volumes,
        ports: ['1337:1337'],
        command: envConfig.command,
        environment: {
          NODE_ENV: envConfig.nodeEnv
        }
      }
    }
  };
}

export function addDatabaseService(
  compose: ComposeConfig, 
  plugin: DatabasePlugin, 
  config: any,
  environment: Environment
) {
  const variables = plugin.getTemplateVariables(config);
  
  const databaseService = {
    container_name: plugin.containerName,
    image: `${plugin.name.toLowerCase()}:latest`,
    environment: variables,
    volumes: [`${plugin.volumePath}:/data`],
    ports: [`${variables.port}:${variables.port}`]
  };

  // Add production-specific configurations
  if (environment === 'production') {
    databaseService.restart = 'unless-stopped';
    // Add any other production-specific settings
  }

  compose.services[plugin.containerName] = databaseService;
  compose.services.strapi.depends_on = [plugin.containerName];

  return compose;
}

export function applyCustomModifications(
  compose: ComposeConfig,
  modifications: CustomModification[]
) {
  for (const mod of modifications) {
    if (!compose.services[mod.service]) {
      compose.services[mod.service] = {};
    }
    
    // Deep merge the modification config
    compose.services[mod.service] = deepMerge(
      compose.services[mod.service],
      mod.config
    );
  }

  return compose;
}

// Helper function for deep merging objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = { ...source[key] };
      }
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

export function generateComposeFile(
  compose: ComposeConfig,
  environment: Environment
): string {
  const filename = environment === 'production' 
    ? 'docker-compose.prod.yml' 
    : 'docker-compose.yml';
    
  return yaml.stringify(compose);
} 