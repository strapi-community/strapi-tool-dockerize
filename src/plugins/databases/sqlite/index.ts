import { BaseDatabasePlugin } from '../core/base-plugin';
import { DatabasePluginConfig, DatabaseAnswers } from '../core/types';

export class SQLitePlugin extends BaseDatabasePlugin {
  constructor() {
    const config: DatabasePluginConfig = {
      name: 'SQLite',
      defaultPort: 0,  // SQLite doesn't use a port
      containerName: 'strapi',  // SQLite runs in the Strapi container
      volumePath: '/app/.tmp',  // Default SQLite data directory
      envPrefix: 'SQLITE',
      defaultVersion: 'latest',  // SQLite is bundled with Node.js
      image: {
        name: 'node'  // We use the Node.js image for SQLite
      },
      additionalQuestions: [
        {
          type: 'select',
          name: 'SQLITE_STORAGE_TYPE',
          message: 'How would you like to store SQLite data?',
          choices: [
            { 
              value: 'volume', 
              label: 'Docker Volume', 
              hint: 'Recommended for production'
            },
            { 
              value: 'bind', 
              label: 'Bind Mount', 
              hint: 'Good for development'
            }
          ],
          default: 'volume'
        },
        {
          type: 'text',
          name: 'SQLITE_MOUNT_PATH',
          message: 'Where would you like to mount the SQLite data directory?',
          default: './.tmp/data',
          when: (answers) => answers.SQLITE_STORAGE_TYPE === 'bind',
          validate: (value) => {
            if (!value) return 'Mount path is required';
            if (!/^[a-zA-Z0-9\/_.-]+$/.test(value)) {
              return 'Mount path can only contain letters, numbers, underscores, hyphens, dots, and forward slashes';
            }
            return true;
          }
        }
      ]
    };
    super(config);
  }

  getTemplateVariables(answers: DatabaseAnswers): Record<string, any> {
    const baseVars = super.getTemplateVariables(answers);
    return {
      ...baseVars,
      sqlite: {
        storageType: answers.SQLITE_STORAGE_TYPE || 'volume',
        mountPath: answers.SQLITE_MOUNT_PATH || './.tmp/data',
        filename: 'strapi.db'
      }
    };
  }
} 