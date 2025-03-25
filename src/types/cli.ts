import type { ValidationResult } from './validation';

export interface CLIOptions {
  debug?: boolean;
  color?: boolean;
  yes?: boolean;
}

export interface MenuItem {
  label: string;
  value: string;
  hint?: string;
}

export interface Question {
  name: string;
  type: string;
  message: string;
  choices?: MenuItem[];
  default?: unknown;
}

export interface Template {
  name: string;
  content: string;
  path: string;
}

export interface EnvVar {
  key: string;
  value: string;
  description?: string;
}

export interface CLIPlugin {
  getQuestions: () => Question[];
  validateAnswers: (answers: Record<string, unknown>) => ValidationResult;
  getTemplates: (answers: Record<string, unknown>) => Template[];
  getEnvironmentVariables: (answers: Record<string, unknown>) => EnvVar[];
}

export interface GenerationSubtask {
  message: string;
  status: `pending` | `running` | `done`;
}

export interface GenerationStep {
  step: `dockerfile` | `compose` | `env` | `done`;
  message: string;
  subtasks: GenerationSubtask[];
}

export interface GenerationStatus {
  step: GenerationStep[`step`];
  currentSubtask: number;
}

export type EnvironmentType = `development` | `production` | `both`;
export type DockerType = `dockerfile` | `compose`;
export type DatabaseType = `postgresql` | `mysql` | `mariadb` | `sqlite`;
export type StorageType = `volume` | `bind` | `tmpfs`;

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