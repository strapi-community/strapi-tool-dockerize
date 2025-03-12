export interface DatabaseConfig {
  type: string;
  database?: string;
  username?: string;
  password?: string;
  port?: string;
  host?: string;
  filename?: string;
}

export interface EnvFile {
  databaseConfig?: DatabaseConfig;
  // Add other env file configurations as needed
}

export interface ProjectInfo {
  databaseType?: string;
  envFile?: EnvFile;
  // Add other project info fields as needed
} 