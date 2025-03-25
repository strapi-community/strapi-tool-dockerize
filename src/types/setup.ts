export type EnvironmentType = 'development' | 'production' | 'both';
export type DockerType = 'dockerfile' | 'compose';
export type DatabaseType = 'postgresql' | 'mysql' | 'mariadb' | 'sqlite';
export type StorageType = 'volume' | 'bind' | 'tmpfs';

export type SetupStep = 
  | 'review'           // Initial project review
  | 'environment'      // Dev/Prod/Both choice
  | 'docker-setup'     // Docker configuration
  | 'database'         // Database selection if needed
  | 'storage-setup'    // Storage configuration for SQLite
  | 'database-config'  // Database configuration if needed
  | 'node-version'     // Node.js version selection
  | 'node-version-custom'  // Custom version input
  | 'generate';        // Final generation step

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
}

export interface SetupConfig {
  environment: EnvironmentType | null;
  dockerType: DockerType | null;
  database: DatabaseType | null;
  storageType?: StorageType;
  nodeVersion?: string;
  databaseConfig?: DatabaseConfig;
}

export interface DatabaseFormState {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export interface GenerationSubtask {
  message: string;
  status: 'pending' | 'running' | 'done';
}

export interface GenerationStep {
  step: 'dockerfile' | 'compose' | 'env' | 'done';
  message: string;
  subtasks: GenerationSubtask[];
}

export interface GenerationStatus {
  step: GenerationStep['step'];
  currentSubtask: number;
} 