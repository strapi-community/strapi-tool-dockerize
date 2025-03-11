// Base types for all plugins
export interface Plugin {
  type: string;
  name: string;
  version: string;
}

// Question type for prompts
export interface Question {
  type: 'text' | 'select' | 'password' | 'confirm';
  name: string;
  message: string;
  default?: string | number | boolean;
  choices?: Array<{ value: string; label: string; hint?: string }>;
  validate?: (value: any) => boolean | string;
  when?: (answers: Record<string, any>) => boolean;
}

// Environment types
export type Environment = 'development' | 'production' | 'both';

// Docker related types
export interface DockerConfig {
  environment: Environment;
  database?: DatabaseConfig;
  node: {
    version: string;
  };
}

// Database specific types
export interface DatabaseConfig {
  type: string;
  config: Record<string, any>;
}

// Base types
export interface DatabaseAnswers {
  database: string;
  username: string;
  password: string;
  port: string;
  version?: string;
  charset?: string;
  collation?: string;
  rootPassword?: string;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

// Plugin configuration types
export interface DatabasePluginConfig {
  name: string;
  defaultPort: number;
  containerName: string;
  volumePath: string;
  image: {
    name: string;
    tag?: string;
  };
  defaultVersion: string;
  envPrefix: string;
  healthcheck?: {
    command: string;
    interval?: string;
    timeout?: string;
    retries?: number;
  };
  validations?: Record<string, ValidationRules>;
  additionalQuestions?: Question[];
}

export interface DatabasePlugin extends DatabasePluginConfig {
  validateConfig: (config: DatabaseAnswers) => ValidationResult;
  validateConnectionString: (connectionString: string) => boolean;
  getTemplateVariables: (config: DatabaseAnswers) => TemplateVariables;
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, any>) => DatabaseAnswers;
}

export interface TemplateVariables {
  database: {
    type: string;
    name: string;
    user: string;
    password: string;
    port: string;
    host: string;
  };
  environment: Record<string, string>;
  volumes: {
    data: string;
  };
  image: {
    name: string;
    tag: string;
  };
}

// Remove duplicate exports
export * from './cli';
