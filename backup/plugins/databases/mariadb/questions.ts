import { Question } from '../core/types';

export const questions: Question[] = [
  {
    type: 'select',
    name: 'MARIADB_CHARACTER_SET',
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
    name: 'MARIADB_ROOT_PASSWORD_TYPE',
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
    name: 'MARIADB_ROOT_PASSWORD',
    message: 'Enter MariaDB root password:',
    when: (answers) => answers.MARIADB_ROOT_PASSWORD_TYPE === 'custom',
    validate: (value) => {
      if (!value) return 'Root password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      return true;
    }
  }
]; 