import { DatabasePluginConfig, DatabaseAnswers } from '../types';

export function createMockAnswers(overrides: Partial<DatabaseAnswers> = {}): DatabaseAnswers {
  return {
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    port: '3306',
    ...overrides
  };
}

export function validatePluginStructure(plugin: any) {
  expect(plugin).toHaveProperty('name');
  expect(plugin).toHaveProperty('getDefaultPort');
  expect(plugin).toHaveProperty('validateConfig');
  expect(plugin).toHaveProperty('validateConnectionString');
  expect(plugin).toHaveProperty('getTemplateVariables');
} 