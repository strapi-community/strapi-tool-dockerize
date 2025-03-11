import { ValidationResult } from '../../core/types';

export function validateConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  const requiredFields = [
    'MARIADB_DATABASE',
    'MARIADB_USER',
    'MARIADB_PASSWORD',
    'MARIADB_ROOT_PASSWORD',
    'MARIADB_VERSION'
  ];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Port validation
  if (config.MARIADB_PORT) {
    const port = parseInt(config.MARIADB_PORT);
    if (isNaN(port) || port < 1024 || port > 65535) {
      errors.push('Port must be a number between 1024 and 65535');
    }
  }

  // Password strength
  const passwords = ['MARIADB_PASSWORD', 'MARIADB_ROOT_PASSWORD'];
  for (const field of passwords) {
    if (config[field] && config[field].length < 8) {
      errors.push(`${field} must be at least 8 characters long`);
    }
  }

  // Version validation
  const validVersions = ['10.11-lts', '10.6-lts', '11.2'];
  if (config.MARIADB_VERSION && !validVersions.includes(config.MARIADB_VERSION)) {
    errors.push('Invalid MariaDB version selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 