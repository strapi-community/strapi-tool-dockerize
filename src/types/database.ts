import { BasePluginConfig } from './core-plugin';
import { ValidationResult, ValidationRules } from './validation';
import { Question } from './cli';

export interface DatabasePluginConfig extends BasePluginConfig {
  type: 'database';
  defaultPort: number;
  containerName: string;
  volumePath: string;
  envPrefix: string;
  defaultVersion: string;
  image: {
    name: string;
    tag: string;
  };
  healthcheck?: {
    test: string[] | string;
    interval: string;
    timeout: string;
    retries: number;
  };
  validations?: Record<string, ValidationRules>;
  additionalQuestions?: Question[];
}

export interface DatabaseAnswers {
  database: string;
  username: string;
  password: string;
  port: string;
  version?: string;
  charset?: string;
  collation?: string;
  rootPassword?: string;
  [key: string]: string | undefined;
}

export interface DatabaseTemplateVariables {
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

export interface DatabasePlugin extends DatabasePluginConfig {
  getTemplateVariables(answers: DatabaseAnswers): DatabaseTemplateVariables;
  validateConfig(answers: DatabaseAnswers): ValidationResult;
  validateConnectionString(url: string): boolean;
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, any>) => DatabaseAnswers;
}