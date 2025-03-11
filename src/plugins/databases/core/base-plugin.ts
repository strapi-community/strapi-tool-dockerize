import { DatabasePluginConfig, DatabaseAnswers, Question } from './types';
import { generateSecurePassword } from '../../../utils/passwords';
import { getDockerImageVersions } from '../../../utils/docker-versions';

export class BaseDatabasePlugin {
  protected config: DatabasePluginConfig;
  private cachedVersions: string[] = [];

  constructor(config: DatabasePluginConfig) {
    this.config = config;
  }

  protected async getVersions(): Promise<string[]> {
    if (this.cachedVersions.length === 0) {
      try {
        this.cachedVersions = await getDockerImageVersions(this.config.image.name);
      } catch (error) {
        // If we can't fetch versions, return a default list
        this.cachedVersions = [this.config.defaultVersion];
      }
    }
    return this.cachedVersions;
  }

  async getQuestions(): Promise<Question[]> {
    const versions = await this.getVersions();
    const prefix = this.config.envPrefix;

    const baseQuestions: Question[] = [
      {
        type: 'text',
        name: `${prefix}_DATABASE`,
        message: 'What is your database name?',
        default: 'strapi',
        validate: (value) => {
          if (!value) return 'Database name is required';
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Database name can only contain letters, numbers, underscores and hyphens';
          }
          return true;
        }
      },
      {
        type: 'text',
        name: `${prefix}_USER`,
        message: 'What is your database user?',
        default: 'strapi',
        validate: (value) => {
          if (!value) return 'Database user is required';
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Username can only contain letters, numbers, underscores and hyphens';
          }
          return true;
        }
      },
      {
        type: 'select',
        name: 'PASSWORD_TYPE',
        message: 'How would you like to set the database password?',
        choices: [
          'generate',    // Generate a secure password
          'custom',      // Use a custom password
          'existing'     // Use existing password from .env
        ],
        default: 'generate'
      },
      {
        type: 'text',
        name: `${prefix}_PASSWORD`,
        message: 'Enter your database password:',
        when: (answers) => answers.PASSWORD_TYPE === 'custom',
        validate: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters long';
          return true;
        }
      },
      {
        type: 'text',
        name: `${prefix}_PORT`,
        message: `Which port should ${this.config.name} use? (Press enter for default ${this.config.defaultPort})`,
        default: this.config.defaultPort.toString()
      },
      {
        type: 'select',
        name: `${prefix}_VERSION`,
        message: `Which ${this.config.name} version would you like to use?`,
        choices: versions.map(version => ({
          value: version,
          label: `${this.config.name} ${version}`,
          hint: version.includes('alpine') ? 'Recommended for production' : undefined
        })),
        default: versions.find(v => v === this.config.defaultVersion) || versions[0]
      }
    ];

    return [...baseQuestions, ...(this.config.additionalQuestions || [])];
  }

  processAnswers(answers: Record<string, any>): DatabaseAnswers {
    const prefix = this.config.envPrefix;
    const processed: DatabaseAnswers = {
      database: answers[`${prefix}_DATABASE`],
      username: answers[`${prefix}_USER`],
      password: answers.PASSWORD_TYPE === 'generate' 
        ? generateSecurePassword()
        : answers[`${prefix}_PASSWORD`],
      port: answers[`${prefix}_PORT`] || this.config.defaultPort.toString(),
      version: answers[`${prefix}_VERSION`] || this.config.defaultVersion
    };

    // Remove helper fields
    delete answers.PASSWORD_TYPE;

    return processed;
  }

  getTemplateVariables(answers: DatabaseAnswers): Record<string, any> {
    return {
      database: {
        type: this.config.name.toLowerCase(),
        name: answers.database,
        user: answers.username,
        password: answers.password,
        port: answers.port,
        host: this.config.containerName
      },
      volumes: {
        data: this.config.volumePath
      },
      image: {
        name: this.config.image.name,
        tag: answers.version
      },
      healthcheck: this.config.healthcheck
    };
  }
} 