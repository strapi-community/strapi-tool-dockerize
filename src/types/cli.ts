export interface CLIOptions {
  debug?: boolean;
  color?: boolean;
  yes?: boolean;
}

export interface Plugin {
  type: 'database' | 'provider' | 'template';
  name: string;
  version: string;
  getQuestions: () => Question[];
  validateAnswers: (answers: Record<string, unknown>) => ValidationResult;
  getTemplates: (answers: Record<string, unknown>) => Template[];
  getEnvironmentVariables: (answers: Record<string, unknown>) => EnvVar[];
}

export interface Question {
  type: 'text' | 'password' | 'select' | 'multiselect' | 'confirm';
  name: string;
  message: string;
  choices?: Choice[];
  default?: string | boolean | number;
  validate?: (value: string) => true | string;
}

export interface Choice {
  title: string;
  value: string;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface Template {
  name: string;
  content: string;
  path: string;
}

export interface EnvVar {
  key: string;
  value: string;
  description?: string;
} 