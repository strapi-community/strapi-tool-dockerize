import { ValidationResult } from '@types';

export const validatePort = (port: string): ValidationResult => {
  const errors: string[] = [];
  const portNum = parseInt(port);
  
  if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
    errors.push('Port must be a number between 1024 and 65535');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  return {
    isValid: !!value,
    errors: value ? [] : [`${fieldName} is required`]
  };
}; 