import { PluginType, Plugin } from './core-plugin';
import { ValidationResult } from './validation';

export interface CLIOptions {
  debug?: boolean;
  color?: boolean;
  yes?: boolean;
}

export interface CLIPlugin extends Plugin {
  getQuestions: () => Question[];
  validateAnswers: (answers: Record<string, unknown>) => ValidationResult;
  getTemplates: (answers: Record<string, unknown>) => Template[];
  getEnvironmentVariables: (answers: Record<string, unknown>) => EnvVar[];
}

export interface Question {
  type: `text` | `password` | `select` | `multiselect` | `confirm`;
  name: string;
  message: string;
  choices?: Choice[];
  default?: string | boolean | number;
  validate?: (value: string) => true | string;
  when?: (answers: Record<string, any>) => boolean;
}

export interface MenuItem {
  label: string;
  value: string;
  hint?: string;
}

export interface Choice {
  title: string;
  value: string;
  description?: string;
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