import { 
  DatabasePlugin as BaseDBPlugin, 
  DatabasePluginConfig as BaseDBConfig, 
  DatabaseTemplateVariables as BaseTemplateVars,
  DatabaseAnswers
} from '@/types/database';

import {
  Question,
  ValidationRules,
  PluginUtils,
  PluginTemplateUtils
} from '@/types/plugin';

// Extend base plugin types with additional functionality
export interface DatabasePlugin extends BaseDBPlugin {
  getQuestions: () => Promise<Question[]>;
  processAnswers: (answers: Record<string, any>) => DatabaseAnswers;
}

export interface DatabasePluginConfig extends BaseDBConfig {
  validations?: Record<string, ValidationRules>;
  additionalQuestions?: Question[];
}

// Template types
export interface TemplateVariables extends BaseTemplateVars {
  database: BaseTemplateVars['database'] & {
    charset?: string;
    collation?: string;
  };
}

// Re-export plugin types
export type {
  Question,
  ValidationRules,
  PluginUtils,
  PluginTemplateUtils,
  DatabaseAnswers
}; 