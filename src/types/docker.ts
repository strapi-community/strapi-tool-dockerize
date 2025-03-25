export interface DockerSetupStep {
  id: string;
  title: string;
  status: `pending` | `running` | `completed` | `failed` | `skipped`;
  required: boolean;
  indent?: number;
}

export interface DockerSetupTask extends DockerSetupStep {
  subtasks?: DockerSetupStep[];
}

export interface DockerConfig {
  type: `dockerfile` | `compose`;
  environment: `development` | `production` | `both`;
  database?: string;
  storageType?: `volume` | `bind` | `tmpfs`;
  nodeVersion?: string;
  databaseConfig?: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
} 