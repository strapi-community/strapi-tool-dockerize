import { DatabaseAnswers } from '../core/types';

export function validateConnectionString(url: string): boolean {
  try {
    const pattern = /^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
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

export function validateCharset(charset: string): boolean {
  const validCharsets = ['utf8mb4', 'utf8', 'latin1'];
  return validCharsets.includes(charset);
}

export function validateCollation(collation: string): boolean {
  const validCollations = [
    'utf8mb4_unicode_ci',
    'utf8mb4_general_ci',
    'utf8mb4_bin',
    'utf8_unicode_ci',
    'utf8_general_ci',
    'latin1_swedish_ci'
  ];
  return validCollations.includes(collation);
}

export function validateRootPassword(password: string): boolean {
  return password.length >= 8;
} 