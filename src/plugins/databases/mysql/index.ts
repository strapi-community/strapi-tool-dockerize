import { BaseDatabasePlugin } from '../base';
import { DatabaseConfig } from '../types';
import { Question } from '../../core/types';

export class MySQLPlugin extends BaseDatabasePlugin {
  name = 'mysql';
  version = '1.0.0';
  description = 'MySQL database plugin for Strapi';

  // Override getQuestions to add MySQL-specific options
  getQuestions(): Question[] {
    return [
      ...super.getQuestions(),
      {
        type: 'select',
        name: 'charset',
        message: 'Select character set:',
        default: 'utf8mb4',
        choices: [
          { label: 'UTF8MB4 (Recommended)', value: 'utf8mb4', hint: 'Full Unicode support' },
          { label: 'UTF8', value: 'utf8', hint: 'Basic Unicode support' },
          { label: 'Latin1', value: 'latin1', hint: 'Legacy encoding' }
        ]
      },
      {
        type: 'select',
        name: 'collation',
        message: 'Select collation:',
        default: 'utf8mb4_unicode_ci',
        choices: [
          { label: 'UTF8MB4 Unicode CI', value: 'utf8mb4_unicode_ci', hint: 'Recommended for most applications' },
          { label: 'UTF8MB4 General CI', value: 'utf8mb4_general_ci', hint: 'Slightly faster, less accurate' },
          { label: 'UTF8MB4 Binary', value: 'utf8mb4_bin', hint: 'Binary comparison' }
        ]
      }
    ];
  }

  getConnectionString(config: DatabaseConfig): string {
    return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  getDefaultPort(): number {
    return 3306;
  }

  getDefaultConfig(): Partial<DatabaseConfig> {
    return {
      host: 'localhost',
      port: this.getDefaultPort(),
      database: 'strapi',
      username: 'strapi'
    };
  }

  getDockerServiceName(): string {
    return 'strapi-mysql';
  }

  getDockerImage(): string {
    return 'mysql';
  }

  getDockerImageTag(): string {
    return '8.0';
  }

  validateConnectionString(url: string): boolean {
    try {
      const pattern = /^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
      return pattern.test(url);
    } catch {
      return false;
    }
  }

  validateConfig(config: DatabaseConfig): boolean {
    return !!(
      config.host &&
      config.port &&
      config.port > 0 &&
      config.port < 65536 &&
      config.database &&
      config.username &&
      config.password
    );
  }

  getEnvironmentVariables(answers: Record<string, any>): Record<string, string> {
    return {
      MYSQL_DATABASE: answers.database,
      MYSQL_USER: answers.username,
      MYSQL_PASSWORD: answers.password,
      MYSQL_ROOT_PASSWORD: answers.password, // For initial setup
      MYSQL_CHARACTER_SET_SERVER: answers.charset || 'utf8mb4',
      MYSQL_COLLATION_SERVER: answers.collation || 'utf8mb4_unicode_ci'
    };
  }
} 