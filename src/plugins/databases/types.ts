import { Plugin, TemplateVariables } from '../core/types';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  url?: string;  // For SQLite or connection strings
}

export interface DatabasePlugin extends Plugin {
  type: 'database';
  
  // Database-specific methods
  getConnectionString(config: DatabaseConfig): string;
  getDefaultPort(): number;
  getDefaultConfig(): Partial<DatabaseConfig>;
  
  // Docker-specific methods
  getDockerServiceName(): string;
  getDockerImage(): string;
  getDockerImageTag(): string;
  
  // Validation methods
  validateConnectionString(url: string): boolean;
  validateConfig(config: DatabaseConfig): boolean;
}

export interface DatabaseTemplateVariables extends TemplateVariables {
  serviceName: string;
  image: string;
  tag: string;
  port: number;
  volume?: {
    name: string;
    mountPath: string;
  };
  environment: Record<string, string>;
  connectionString: string;
  [key: string]: any; // Allow additional properties
} 