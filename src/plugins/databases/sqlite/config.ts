import { DatabasePluginConfig } from '../core/types';

export const config: DatabasePluginConfig = {
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

export function getTemplateVariables(config: Record<string, any>): Record<string, any> {
  return {
    database: {
      type: 'sqlite',
      filename: config.DATABASE_FILENAME,
      path: config.MOUNT_PATH
    },
    storage: {
      type: config.STORAGE_TYPE,
      volume: config.STORAGE_TYPE === 'volume' ? 'sqlite_data' : undefined,
      bindMount: config.STORAGE_TYPE === 'bind-mount' ? {
        source: './data',  // Local directory on host
        target: config.MOUNT_PATH
      } : undefined
    },
    // SQLite doesn't need a separate container, it runs within the Strapi service
    image: null,
    // Add warning for production use
    warnings: [
      config.STORAGE_TYPE === 'bind-mount' 
        ? 'Using bind mount for SQLite storage. Make sure the host directory exists and has proper permissions.'
        : 'Using Docker volume for SQLite storage. Data will persist but is managed by Docker.'
    ]
  };
} 