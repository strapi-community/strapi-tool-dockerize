import { DatabaseAnswers, ValidationResult } from '@types';

export function validateConfig(config: DatabaseAnswers): ValidationResult {
  const errors: string[] = [];

  const requiredFields = ['database', 'username', 'password', 'port'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (config.port) {
    const port = parseInt(config.port);
    if (isNaN(port) || port < 1024 || port > 65535) {
      errors.push('Port must be a number between 1024 and 65535');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateConnectionString(url: string): boolean {
  const pattern = /^mariadb:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
  return pattern.test(url);
} 