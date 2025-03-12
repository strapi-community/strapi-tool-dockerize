import { DatabasePlugin as BaseDBPlugin } from './database';
import { Question } from './cli';
import { DatabaseAnswers } from "./database";
import { ValidationResult } from "./validation";

// Plugin utility types
export interface PluginUtils {
  createConnectionStringValidator: (databaseType: string) => (connectionString: string) => boolean;
  validatePort: (port: string) => ValidationResult;
  validateRequired: (value: any, fieldName: string) => ValidationResult;
}

// Template utility types
export interface PluginTemplateUtils {
  createBaseTemplateVariables: (config: Record<string, any>) => Record<string, any>;
  mergeTemplateVariables: (base: Record<string, any>, override: Record<string, any>) => Record<string, any>;
}

// Validation types for plugins
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

// Plugin types
export interface Plugin extends BaseDBPlugin {
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, any>) => DatabaseAnswers;
}

// Re-export types that are commonly used with plugins
export type {
  Question,
  DatabaseAnswers,
  ValidationResult
}; 