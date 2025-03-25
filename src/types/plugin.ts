import type { DatabasePlugin, DatabaseAnswers } from './database';
import type { Question } from './cli';
import type { ValidationResult, ValidationRules, ValidationUtils } from './validation';

// Plugin utility types
export interface PluginUtils extends ValidationUtils {
  validateConfig: (config: unknown) => ValidationResult;
}

// Template utility types
export interface PluginTemplateUtils {
  getTemplateVariables: (answers: unknown) => Record<string, unknown>;
}

// Plugin types
export interface Plugin extends DatabasePlugin {
  utils: PluginUtils;
  templateUtils: PluginTemplateUtils;
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, unknown>) => DatabaseAnswers;
}

// Re-export types that are commonly used with plugins
export type {
	Question,
	ValidationResult,
	ValidationRules
};
export type { DatabasePlugin, DatabaseAnswers }; 