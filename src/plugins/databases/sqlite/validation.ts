import { ValidationResult } from '../../core/types';

export function validateConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  const requiredFields = ['DATABASE_FILENAME', 'STORAGE_TYPE', 'MOUNT_PATH'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Database filename validation
  if (config.DATABASE_FILENAME && !config.DATABASE_FILENAME.endsWith('.db')) {
    errors.push('Database filename must end with .db');
  }

  // Storage type validation
  if (config.STORAGE_TYPE && !['volume', 'bind-mount'].includes(config.STORAGE_TYPE)) {
    errors.push('Invalid storage type selected');
  }

  // Mount path validation
  if (config.MOUNT_PATH && !config.MOUNT_PATH.startsWith('/')) {
    errors.push('Mount path must be absolute (start with /)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 