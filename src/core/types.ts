export interface DatabaseConfig {
  type: string;
  connection?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
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
  strapiVersion: string;
  type: string;
  databaseType?: string;
  envFile?: EnvFile;
  projectPath: string;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
} 