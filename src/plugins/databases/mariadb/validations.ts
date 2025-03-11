import { DatabaseAnswers } from '../core/types';

export function validateConnectionString(url: string): boolean {
  try {
    const pattern = /^mariadb:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+$/;
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

export function validateRootPassword(password: string): boolean {
  return password.length >= 8;
} 