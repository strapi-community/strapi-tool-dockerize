export interface DatabasePluginConfig {
  name: string;
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
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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

export interface DatabasePlugin {
  name: string;
  defaultPort: number;
  getTemplateVariables(answers: DatabaseAnswers): TemplateVariables;
  validateConfig(answers: DatabaseAnswers): ValidationResult;
  validateConnectionString(url: string): boolean;
}