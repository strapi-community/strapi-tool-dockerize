import { describe, it, expect } from 'vitest';
import { DatabasePluginConfig, DatabaseAnswers } from '../types';
import { createDatabasePlugin } from '../base-plugin';

describe('Base Database Plugin', () => {
  const mockConfig = {
    name: 'TestDB',
    defaultPort: 1234,
    containerName: 'test-container',
    volumePath: '/data/test'
  };

  it('should create a plugin with basic configuration', () => {
    const plugin = createDatabasePlugin(mockConfig);
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('TestDB');
    expect(plugin.getDefaultPort()).toBe(1234);
  });

  it('should validate required config properties', () => {
    const plugin = createDatabasePlugin(mockConfig);
    const answers = {
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
      port: '1234'
    };
    expect(plugin.validateConfig(answers)).toBe(true);
  });

  it('should handle template variables', () => {
    const plugin = createDatabasePlugin(mockConfig);
    const config = {
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
      port: '1234'
    };
    const variables = plugin.getTemplateVariables(config);
    expect(variables).toHaveProperty('database', 'test_db');
  });

  it('should validate connection string format', () => {
    const plugin = createDatabasePlugin(mockConfig);
    expect(plugin.validateConnectionString('invalid')).toBe(false);
  });
}); 