import { DatabaseAnswers } from '../core/types';

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

export function validateSSLMode(mode: string): boolean {
  const validModes = ['disable', 'require', 'verify-ca', 'verify-full'];
  return validModes.includes(mode);
} 