export interface DatabaseImage {
  name: string;
  registry?: string;
  defaultTag?: string;
}

export interface DatabaseHealthcheck {
  test: (answers: DatabaseAnswers) => string;
  interval?: string;
  timeout?: string;
  retries?: number;
}

export interface DatabaseAnswers {
  database: string;
  username: string;
  password: string;
  port: string;
  version: string;
  [key: string]: any;
}

export interface Question {
  type: 'text' | 'select' | 'confirm';
  name: string;
  message: string;
  default?: string | number | boolean;
  choices?: Array<string | { label: string; value: string; hint?: string }>;
  validate?: (value: any) => boolean | string;
  when?: (answers: Record<string, any>) => boolean;
}

export interface DatabaseValidations {
  config: (answers: DatabaseAnswers) => boolean;
  connectionString?: (url: string) => boolean;
  [key: string]: ((value: any) => boolean) | undefined;
}

export interface DatabasePluginConfig {
  name: string;
  defaultPort: number;
  containerName: string;
  volumePath: string;
  envPrefix: string;
  defaultVersion: string;
  image: {
    name: string;
    tag?: string;
  };
  healthcheck?: {
    test: (answers: DatabaseAnswers) => string;
    interval: string;
    timeout: string;
    retries: number;
  };
  additionalEnvVars?: string[];
  validations?: DatabaseValidations;
  additionalQuestions?: Question[];
} 