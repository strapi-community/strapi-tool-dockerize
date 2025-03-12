import { DatabaseAnswers, ValidationResult } from '@types';
import { validateRequired, validatePort } from '../../core/utils';

export function validateConfig(answers: DatabaseAnswers): ValidationResult {
  const errors: string[] = [];

  // Base validation
  const requiredValidation = validateRequired(answers.database, 'database');
  const portValidation = validatePort(answers.port);

  errors.push(...requiredValidation.errors, ...portValidation.errors);

  // MySQL specific validation
  if (answers.charset && !['utf8mb4', 'utf8', 'latin1'].includes(answers.charset)) {
    errors.push('Invalid character set');
  }

  if (answers.collation && !answers.collation.startsWith(answers.charset || '')) {
    errors.push('Collation must match character set');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateConnectionString(url: string): boolean {
  const pattern = /^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
  return pattern.test(url);
} 