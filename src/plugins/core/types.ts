export type Environment = 'development' | 'production' | 'both';

export interface DatabaseConfig {
  type: string;
  config: Record<string, any>;
}

export interface NodeConfig {
  version: string;
}

export interface DockerConfig {
  environment: Environment;
  database: DatabaseConfig;
  node: NodeConfig;
}

export interface Question {
  type: string;
  name: string;
  message: string;
  default?: any;
  choices?: string[];
  validate?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface Template {
  name: string;
  content: string;
  variables: Record<string, any>;
}

export interface DatabasePlugin {
  name: string;
  getQuestions: () => Question[];
  validateConfig: (config: Record<string, any>) => ValidationResult;
  getTemplateVariables: (config: Record<string, any>) => Record<string, any>;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | object;
}

export interface Plugin {
  type: string;
  name: string;
  version: string;
  description: string;

  // Get questions to ask user
  getQuestions(): Question[];

  // Validate user's answers
  validateAnswers(answers: Record<string, any>): ValidationResult;

  // Get templates with variables
  getTemplates(answers: Record<string, any>): Template[];

  // Get environment variables
  getEnvironmentVariables(answers: Record<string, any>): Record<string, string>;
} 