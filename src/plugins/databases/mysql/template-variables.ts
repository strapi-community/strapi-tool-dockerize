import { DatabaseAnswers } from '../core/types';
import { generateSecurePassword } from '../../../utils/passwords';

export function getTemplateVariables(answers: DatabaseAnswers) {
  const rootPassword = answers.MYSQL_ROOT_PASSWORD_TYPE === 'custom' 
    ? answers.MYSQL_ROOT_PASSWORD
    : answers.MYSQL_ROOT_PASSWORD_TYPE === 'random'
      ? generateSecurePassword()
      : answers.MYSQL_ROOT_PASSWORD_TYPE === 'empty'
        ? ''
        : answers.password;

  return {
    mysql: {
      charset: answers.MYSQL_CHARACTER_SET || 'utf8mb4',
      collation: answers.MYSQL_COLLATION || 'utf8mb4_unicode_ci',
      rootPassword,
      allowEmptyPassword: answers.MYSQL_ROOT_PASSWORD_TYPE === 'empty',
      randomRootPassword: answers.MYSQL_ROOT_PASSWORD_TYPE === 'random'
    }
  };
} 