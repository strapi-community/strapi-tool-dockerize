import { Question } from '../core/types';

export const questions: Question[] = [
  {
    type: 'select',
    name: 'MYSQL_CHARACTER_SET',
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
    name: 'MYSQL_COLLATION',
    message: 'Select collation:',
    default: 'utf8mb4_unicode_ci',
    choices: [
      { label: 'UTF8MB4 Unicode CI', value: 'utf8mb4_unicode_ci', hint: 'Recommended for most applications' },
      { label: 'UTF8MB4 General CI', value: 'utf8mb4_general_ci', hint: 'Slightly faster, less accurate' },
      { label: 'UTF8MB4 Binary', value: 'utf8mb4_bin', hint: 'Binary comparison' }
    ]
  },
  {
    type: 'select',
    name: 'MYSQL_ROOT_PASSWORD_TYPE',
    message: 'How would you like to handle root password?',
    choices: [
      { label: 'Same as User', value: 'same', hint: 'Use same password as database user' },
      { label: 'Custom', value: 'custom', hint: 'Set a different root password' },
      { label: 'Random', value: 'random', hint: 'Generate a random root password' },
      { label: 'Empty', value: 'empty', hint: 'Allow empty root password (not recommended)' }
    ],
    default: 'same'
  },
  {
    type: 'text',
    name: 'MYSQL_ROOT_PASSWORD',
    message: 'Enter MySQL root password:',
    when: (answers) => answers.MYSQL_ROOT_PASSWORD_TYPE === 'custom',
    validate: (value) => {
      if (!value) return 'Root password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      return true;
    }
  },
  {
    type: 'text',
    name: 'MYSQL_DATABASE',
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
    name: 'MYSQL_USER',
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
    name: 'MYSQL_PASSWORD',
    message: 'What is your database password?',
    validate: (value) => {
      if (!value) return 'Database password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      return true;
    }
  },
  {
    type: 'text',
    name: 'MYSQL_PORT',
    message: 'Which port should MySQL use?',
    default: '3306',
    validate: (value) => {
      const port = parseInt(value);
      if (isNaN(port)) return 'Port must be a number';
      if (port < 1024 || port > 65535) return 'Port must be between 1024 and 65535';
      return true;
    }
  }
]; 