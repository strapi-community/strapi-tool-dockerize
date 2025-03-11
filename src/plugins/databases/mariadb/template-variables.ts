import { DatabaseAnswers } from '../core/types';
import { generateSecurePassword } from '../../../utils/passwords';

export function getTemplateVariables(answers: DatabaseAnswers) {
  const rootPassword = answers.MARIADB_ROOT_PASSWORD_TYPE === 'custom' 
    ? answers.MARIADB_ROOT_PASSWORD
    : answers.MARIADB_ROOT_PASSWORD_TYPE === 'random'
      ? generateSecurePassword()
      : answers.MARIADB_ROOT_PASSWORD_TYPE === 'empty'
        ? ''
        : answers.password;

  return {
    mariadb: {
      charset: answers.MARIADB_CHARACTER_SET || 'utf8mb4',
      collation: `${answers.MARIADB_CHARACTER_SET || 'utf8mb4'}_unicode_ci`,
      rootPassword,
      allowEmptyPassword: answers.MARIADB_ROOT_PASSWORD_TYPE === 'empty',
      randomRootPassword: answers.MARIADB_ROOT_PASSWORD_TYPE === 'random'
    }
  };
} 