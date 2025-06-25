import { ValidationResult } from '../../core/types';

export function validateConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  const requiredFields = ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Port validation
  if (config.POSTGRES_PORT) {
    const port = parseInt(config.POSTGRES_PORT);
    if (isNaN(port) || port < 1024 || port > 65535) {
      errors.push('Port must be a number between 1024 and 65535');
    }
  }

  // Password strength
  if (config.POSTGRES_PASSWORD && config.POSTGRES_PASSWORD.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 