import { ValidationResult } from '../../core/types';

export function validateConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  const requiredFields = [
    'MYSQL_DATABASE',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_ROOT_PASSWORD'
  ];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Port validation
  if (config.MYSQL_PORT) {
    const port = parseInt(config.MYSQL_PORT);
    if (isNaN(port) || port < 1024 || port > 65535) {
      errors.push('Port must be a number between 1024 and 65535');
    }
  }

  // Password strength
  const passwords = ['MYSQL_PASSWORD', 'MYSQL_ROOT_PASSWORD'];
  for (const field of passwords) {
    if (config[field] && config[field].length < 8) {
      errors.push(`${field} must be at least 8 characters long`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 