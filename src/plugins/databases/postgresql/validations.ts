import { DatabaseAnswers } from '../core/types';
import { ValidationRules } from '@types';

export function validateConnectionString(url: string): boolean {
  try {
    const pattern = /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
    return pattern.test(url);
  } catch {
    return false;
  }
}

export function validateConfig(answers: DatabaseAnswers): boolean {
  return !!(
    answers.database &&
    answers.username &&
    answers.password &&
    answers.port &&
    parseInt(answers.port) > 0 &&
    parseInt(answers.port) < 65536
  );
}

export function validateSchema(schema: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(schema);
}

export const validateDatabase: ValidationRules = {
  required: true,
  pattern: /^[a-zA-Z0-9_]+$/,
  minLength: 1
};

export const validateUsername: ValidationRules = {
  required: true,
  pattern: /^[a-zA-Z0-9_]+$/,
  minLength: 1
};

export const validatePassword: ValidationRules = {
  required: true,
  minLength: 8
};

export const validateSSLMode: ValidationRules = {
  required: false,
  custom: (value: string) => ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'].includes(value)
}; 