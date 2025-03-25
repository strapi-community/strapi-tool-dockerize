import type { 
  DatabaseTemplateVariables,
  DatabaseAnswers,
  DatabasePluginConfig as BasePluginConfig
} from '@/types/database';

import type {
  Question,
  ValidationRules,
  PluginUtils,
  PluginTemplateUtils
} from '@/types/plugin';

import type { DockerSetupTask } from '@/types/docker';

// Extended plugin config type
export interface DatabasePluginConfig extends BasePluginConfig {
  validations?: Record<string, ValidationRules>;
  additionalQuestions?: Question[];
}

// Extended template variables type
export interface TemplateVariables extends DatabaseTemplateVariables {
  database: DatabaseTemplateVariables['database'] & {
    charset?: string;
    collation?: string;
  };
}

// Re-export imported types
export type {
  DatabaseTemplateVariables,
  DatabaseAnswers,
  Question,
  ValidationRules,
  PluginUtils,
  PluginTemplateUtils,
  DockerSetupTask
}; 