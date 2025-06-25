import { describe, it, expect } from 'vitest';

export function createPluginTestSuite(pluginName: string, plugin: any) {
  describe(`Database Plugin: ${pluginName}`, () => {
    // Structure Tests
    it('should have required plugin structure', () => {
      expect(plugin).toBeDefined();
      expect(plugin.name).toBeDefined();
      expect(typeof plugin.getTemplateVariables).toBe('function');
      expect(typeof plugin.validateConfig).toBe('function');
    });

    // Configuration Tests
    it('should have valid default configuration', () => {
      expect(plugin.defaultPort).toBeGreaterThan(0);
      expect(plugin.containerName).toBeDefined();
      expect(plugin.volumePath).toBeDefined();
    });

    it('should generate valid template variables', () => {
      const config = {
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
        port: plugin.defaultPort
      };

      const variables = plugin.getTemplateVariables(config);
      expect(variables).toHaveProperty('database', 'test_db');
      expect(variables).toHaveProperty('username', 'test_user');
      expect(variables).toHaveProperty('password', 'test_pass');
      expect(variables).toHaveProperty('port', plugin.defaultPort);
    });

    it('should properly validate configurations', () => {
      const validConfig = {
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
        port: '5432'
      };

      const invalidConfig = {
        database: 'test_db',
        // missing username and password
        port: '5432'
      };

      expect(plugin.validateConfig(validConfig)).toBe(true);
      expect(plugin.validateConfig(invalidConfig)).toBe(false);
    });
  });
} 