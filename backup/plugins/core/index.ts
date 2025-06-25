// Re-export all types from our core types
export * from './types';

// Export base plugin creator
export { createDatabasePlugin } from '../databases/core/base-plugin';

// Export template utilities
export { 
  createBaseTemplateVariables,
  mergeTemplateVariables 
} from './template-utils';

// Export validation utilities
export {
  validatePort,
  validateRequired
} from './validation';

// Export general utilities
export {
  createConnectionStringValidator
} from './utils'; 