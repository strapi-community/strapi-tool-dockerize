import { DatabasePlugin } from '../databases/core/base-plugin';
import { DatabaseAnswers, Question } from '../databases/core/types';
import { PostgreSQLPlugin } from '../databases/postgresql';
import { MySQLPlugin } from '../databases/mysql';
import { MariaDBPlugin } from '../databases/mariadb';
import { SQLitePlugin } from '../databases/sqlite';

export class PluginManager {
  private plugins: Map<string, DatabasePlugin>;

  constructor() {
    this.plugins = new Map();
    this.loadBuiltinPlugins();
  }

  private loadBuiltinPlugins(): void {
    // Load built-in plugins
    const builtinPlugins = [
      PostgreSQLPlugin,
      MySQLPlugin,
      MariaDBPlugin,
      SQLitePlugin
    ];

    for (const plugin of builtinPlugins) {
      this.plugins.set(plugin.config.name.toLowerCase(), plugin);
    }
  }

  /**
   * Get a list of available database types
   */
  getDatabaseTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get a plugin by database type
   */
  getPlugin(type: string): DatabasePlugin | undefined {
    return this.plugins.get(type.toLowerCase());
  }

  /**
   * Get questions for a specific database type
   */
  async getQuestions(type: string): Promise<Question[]> {
    const plugin = this.getPlugin(type);
    if (!plugin) {
      throw new Error(`Unknown database type: ${type}`);
    }
    return plugin.getQuestions();
  }

  /**
   * Process answers for a specific database type
   */
  processAnswers(type: string, answers: Record<string, any>): DatabaseAnswers {
    const plugin = this.getPlugin(type);
    if (!plugin) {
      throw new Error(`Unknown database type: ${type}`);
    }
    return plugin.processAnswers(answers);
  }

  /**
   * Get template variables for a specific database type
   */
  getTemplateVariables(type: string, answers: DatabaseAnswers): Record<string, any> {
    const plugin = this.getPlugin(type);
    if (!plugin) {
      throw new Error(`Unknown database type: ${type}`);
    }
    return plugin.getTemplateVariables(answers);
  }
} 