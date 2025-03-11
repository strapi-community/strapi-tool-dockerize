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

export interface DatabasePluginConfig {
  name: string;
  defaultPort: number;
  containerName: string;
  volumePath: string;
  envPrefix: string;
  defaultVersion: string;
  image: DatabaseImage;
  healthcheck?: DatabaseHealthcheck;
  additionalQuestions?: Question[];
  additionalEnvVars?: string[];
}

export interface DatabaseAnswers {
  database: string;
  username: string;
  password: string;
  port: string;
  version: string;
  [key: string]: string;
}

export interface Question {
  type: 'text' | 'select' | 'confirm' | 'password';
  name: string;
  message: string;
  choices?: Array<string | { value: string; label: string; hint?: string }>;
  default?: string | boolean | number;
  when?: (answers: Record<string, any>) => boolean;
  validate?: (value: string) => true | string;
} 