import type { Question } from './cli';
import type { DockerSetupTask } from './docker';
import type { ValidationRules } from './validation';

interface DatabaseConfig {
  type: string;
  connection?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  database?: string;
  username?: string;
  password?: string;
  port?: string;
  host?: string;
  filename?: string;
}

interface DatabaseAnswers {
  database?: DatabaseConfig;
  docker?: {
    type: 'dockerfile' | 'compose';
    environment: 'development' | 'production' | 'both';
  };
}

interface DatabasePlugin {
  name: string;
  description: string;
  version: string;
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, unknown>) => DatabaseAnswers;
  validateConfig: (config: DatabaseAnswers) => Promise<boolean>;
  getDockerTasks: () => Promise<DockerSetupTask[]>;
  validateDockerTask: (taskId: string, config: DatabaseAnswers) => boolean;
  updateTaskStatus: (tasks: DockerSetupTask[], taskId: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped') => void;
}

interface DatabasePluginConfig {
  validations?: Record<string, ValidationRules>;
  additionalQuestions?: Question[];
}

interface DatabaseTemplateVariables {
  database: {
    type: string;
    version: string;
    port: number;
    host: string;
    name: string;
    user: string;
    charset?: string;
    collation?: string;
    [key: string]: unknown;
  };
}

export type { DatabasePlugin };
export type { DatabaseAnswers };
export type { DatabaseConfig };
export type { DatabasePluginConfig };
export type { DatabaseTemplateVariables };