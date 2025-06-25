import { PluginManager } from './plugin-manager';
import { TemplateRenderer } from './template-renderer';
import path from 'path';

export interface DockerConfig {
  environment: 'development' | 'production' | 'both';
  database: {
    type: string;
    config: Record<string, any>;
  };
  node: {
    version: string;
  };
}

export class DockerGenerator {
  private pluginManager: PluginManager;
  private templateRenderer: TemplateRenderer;

  constructor(pluginsPath: string) {
    this.pluginManager = new PluginManager(pluginsPath);
    this.templateRenderer = new TemplateRenderer();
  }

  // Initialize the generator
  async initialize(): Promise<void> {
    await this.pluginManager.loadPlugins();
  }

  // Get available database types
  getAvailableDatabases(): string[] {
    return this.pluginManager.getAllDatabasePlugins().map(plugin => plugin.name);
  }

  // Generate Docker configuration files
  async generate(config: DockerConfig, targetDir: string): Promise<void> {
    // Load database plugin and templates
    const { templates, variables } = await this.pluginManager.generateDockerConfig(
      config.database.type,
      config.database.config
    );

    // Add environment-specific variables
    const templateVars = {
      ...variables,
      environment: config.environment,
      node: {
        version: config.node.version
      }
    };

    // Generate docker-compose.yml
    if (config.environment !== 'production' || config.database.type === 'sqlite') {
      const composePath = path.join(targetDir, 
        config.environment === 'both' ? 'docker-compose.dev.yml' : 'docker-compose.yml'
      );
      await this.templateRenderer.renderToFile(
        templates['compose'],
        templateVars,
        composePath
      );
    }

    // Generate production docker-compose if needed
    if (config.environment === 'production' || config.environment === 'both') {
      const prodComposePath = path.join(targetDir, 'docker-compose.prod.yml');
      await this.templateRenderer.renderToFile(
        templates['compose'],
        { ...templateVars, environment: 'production' },
        prodComposePath
      );
    }

    // Generate Dockerfile
    const dockerfilePath = path.join(targetDir, 
      config.environment === 'both' ? 'Dockerfile.prod' : 'Dockerfile'
    );
    
    if (templates['dockerfile']) {
      await this.templateRenderer.renderToFile(
        templates['dockerfile'],
        templateVars,
        dockerfilePath
      );
    }

    // Generate development Dockerfile if needed
    if (config.environment === 'both') {
      await this.templateRenderer.renderToFile(
        templates['dockerfile'],
        { ...templateVars, environment: 'development' },
        path.join(targetDir, 'Dockerfile.dev')
      );
    }
  }

  // Validate configuration
  async validateConfig(config: DockerConfig): Promise<boolean> {
    const plugin = this.pluginManager.getDatabasePlugin(config.database.type);
    if (!plugin) {
      throw new Error(`Unsupported database type: ${config.database.type}`);
    }

    const validation = plugin.validateAnswers(config.database.config);
    return validation.isValid;
  }
} 