import { Question } from '../../core/types';

export function getQuestions(): Question[] {
  return [
    {
      type: 'text',
      name: 'MARIADB_DATABASE',
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
      name: 'MARIADB_USER',
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
      type: 'text',
      name: 'MARIADB_PASSWORD',
      message: 'What is your database password?',
      validate: (value) => {
        if (!value) return 'Database password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return true;
      }
    },
    {
      type: 'text',
      name: 'MARIADB_ROOT_PASSWORD',
      message: 'What is your MariaDB root password?',
      validate: (value) => {
        if (!value) return 'Root password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return true;
      }
    },
    {
      type: 'text',
      name: 'MARIADB_PORT',
      message: 'Which port should MariaDB use?',
      default: '3306',
      validate: (value) => {
        const port = parseInt(value);
        if (isNaN(port)) return 'Port must be a number';
        if (port < 1024 || port > 65535) return 'Port must be between 1024 and 65535';
        return true;
      }
    },
    {
      type: 'select',
      name: 'MARIADB_VERSION',
      message: 'Which MariaDB version would you like to use?',
      choices: [
        '10.11-lts',  // LTS version
        '10.6-lts',   // Previous LTS
        '11.2'        // Latest
      ],
      default: '10.11-lts'
    }
  ];
} 