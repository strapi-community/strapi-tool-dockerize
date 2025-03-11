import { Question, ValidationResult, Template } from '../core/types';
import { DatabasePlugin, DatabaseConfig, DatabaseTemplateVariables } from './types';

export abstract class BaseDatabasePlugin implements DatabasePlugin {
  type = 'database';
  abstract name: string;
  abstract version: string;
  abstract description: string;

  // Common questions for all databases
  getQuestions(): Question[] {
    return [
      {
        type: 'text',
        name: 'host',
        message: 'Database host:',
        default: 'localhost'
      },
      {
        type: 'text',
        name: 'port',
        message: 'Database port:',
        default: this.getDefaultPort().toString(),
        validate: (value: string) => {
          const port = parseInt(value, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Port must be a number between 1 and 65535';
          }
          return true;
        }
      },
      {
        type: 'text',
        name: 'database',
        message: 'Database name:',
        default: 'strapi'
      },
      {
        type: 'text',
        name: 'username',
        message: 'Database username:',
        default: 'strapi'
      },
      {
        type: 'text',
        name: 'password',
        message: 'Database password:',
        validate: (value: string) => {
          if (value.length < 8) {
            return 'Password must be at least 8 characters long';
          }
          return true;
        }
      }
    ];
  }

  // Common validation for all databases
  validateAnswers(answers: Record<string, any>): ValidationResult {
    const config: DatabaseConfig = {
      host: answers.host,
      port: parseInt(answers.port, 10),
      database: answers.database,
      username: answers.username,
      password: answers.password
    };

    if (!this.validateConfig(config)) {
      return {
        isValid: false,
        errors: ['Invalid database configuration']
      };
    }

    return { isValid: true };
  }

  // Template handling
  getTemplates(answers: Record<string, any>): Template[] {
    const config: DatabaseConfig = {
      host: answers.host,
      port: parseInt(answers.port, 10),
      database: answers.database,
      username: answers.username,
      password: answers.password
    };

    const variables: DatabaseTemplateVariables = {
      serviceName: this.getDockerServiceName(),
      image: this.getDockerImage(),
      tag: this.getDockerImageTag(),
      port: config.port,
      environment: this.getEnvironmentVariables(answers),
      connectionString: this.getConnectionString(config)
    };

    return [
      {
        name: 'docker-compose',
        content: '', // Will be loaded from liquid template
        variables,
        targetPath: 'docker-compose.yml'
      },
      {
        name: 'dockerfile',
        content: '', // Will be loaded from liquid template
        variables,
        targetPath: 'Dockerfile'
      }
    ];
  }

  // Abstract methods that must be implemented by specific database plugins
  abstract getConnectionString(config: DatabaseConfig): string;
  abstract getDefaultPort(): number;
  abstract getDefaultConfig(): Partial<DatabaseConfig>;
  abstract getDockerServiceName(): string;
  abstract getDockerImage(): string;
  abstract getDockerImageTag(): string;
  abstract validateConnectionString(url: string): boolean;
  abstract validateConfig(config: DatabaseConfig): boolean;
  abstract getEnvironmentVariables(answers: Record<string, any>): Record<string, string>;
} 