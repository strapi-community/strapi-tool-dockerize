export interface StrapiProject {
  isStrapi: boolean;
  name: string;
  packageManager: "npm" | "yarn" | "pnpm";
  type: "javascript" | "typescript";
  path: string;
  version?: string;
}

export interface DatabaseConfig {
  type: "postgresql" | "mysql" | "mariadb" | "sqlite";
  name: string;
  user: string;
  password: string;
  port: number;
  host: string;
}

export interface DockerConfig {
  database: DatabaseConfig;
  environment: "development" | "production" | "both";
  useCompose: boolean;
}

// Enhanced plugin system with validation and metadata
export interface PluginMetadata {
  name: string;
  type: string;
  version?: string;
  description?: string;
  author?: string;
  tags?: string[];
  category: "database" | "service" | "tool" | "custom";
  requirements?: {
    node?: string;
    strapi?: string;
    dependencies?: string[];
  };
}

export interface PluginValidation {
  validate: (config: Record<string, any>) => Promise<ValidationResult>;
  schema?: any; // Zod schema or similar
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PluginTest {
  name: string;
  test: () => Promise<TestResult>;
}

export interface TestResult {
  passed: boolean;
  message?: string;
  details?: any;
}

export interface DatabasePlugin {
  name: string;
  type: string;
  metadata?: PluginMetadata;
  questions: () => Promise<Record<string, any>>;
  generateFiles: (
    config: Record<string, any>,
    context?: PluginContext
  ) => Promise<void>;
  validate?: PluginValidation["validate"];
  tests?: PluginTest[];
}

export interface PluginContext {
  project: StrapiProject;
  outputDir: string;
  templateDir: string;
  isDryRun?: boolean;
}

// Plugin discovery and loading
export interface PluginDiscoveryOptions {
  directories?: string[];
  npmPackages?: boolean;
  localOnly?: boolean;
}

export interface DiscoveredPlugin {
  plugin: DatabasePlugin;
  source: "local" | "npm" | "builtin";
  path: string;
}
