// Environment types
export type Environment = 'development' | 'production' | 'both';

// Docker related types
export interface DockerConfig {
  environment: Environment;
  database?: import('./database').DatabasePluginConfig;
  node: {
    version: string;
  };
}

// Import the DatabasePluginConfig type directly to avoid circular dependencies
import { DatabasePluginConfig } from './database';

