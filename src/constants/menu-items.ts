import type { MenuItem } from '@/types/cli';
import type { EnvironmentType, DockerType, DatabaseType, StorageType } from '@/types/setup';

export const environmentItems: MenuItem[] = [
  {
    label: 'Development',
    value: 'development',
    hint: 'Hot-reload enabled, optimized for local development'
  },
  {
    label: 'Production',
    value: 'production',
    hint: 'Optimized for performance and security'
  },
  {
    label: 'Both (Development + Production)',
    value: 'both',
    hint: 'Separate configs for dev and prod environments'
  }
];

export const getDockerItems = (environment: EnvironmentType | null): MenuItem[] => [
  {
    label: 'Simple Dockerfile',
    value: 'dockerfile',
    hint: environment === 'both'
      ? 'Single Dockerfile with dev/prod stages'
      : 'Lightweight, single container setup'
  },
  {
    label: 'Docker Compose Setup',
    value: 'compose',
    hint: environment === 'both'
      ? 'Separate compose files for dev/prod with databases'
      : 'Multi-container setup with database'
  }
];

export const getDatabaseItems = (currentDatabaseType: string | undefined, environment: EnvironmentType | null): MenuItem[] => [
  ...(currentDatabaseType ? [{
    label: `Keep ${currentDatabaseType} (Current)`,
    value: `current_${currentDatabaseType}`,
    hint: 'Keep current database setup'
  }] : []),
  {
    label: 'PostgreSQL',
    value: 'postgresql',
    hint: 'Recommended for production'
  },
  {
    label: 'MySQL',
    value: 'mysql',
    hint: 'Popular open-source database'
  },
  {
    label: 'MariaDB',
    value: 'mariadb',
    hint: 'MySQL fork with enhanced features'
  },
  {
    label: 'SQLite',
    value: 'sqlite',
    hint: environment === 'production' 
      ? '⚠️ Requires careful configuration for production'
      : 'Simple file-based database'
  }
];

export const storageItems: MenuItem[] = [
  {
    label: 'Named Volume',
    value: 'volume',
    hint: 'Recommended - Persistent and managed by Docker'
  },
  {
    label: 'Bind Mount',
    value: 'bind',
    hint: 'Direct access to host filesystem'
  },
  {
    label: 'tmpfs (Memory)',
    value: 'tmpfs',
    hint: '⚠️ Data lost on container restart'
  }
];

export const getNodeVersionItems = (nodeVersions: {
  projectVersion?: string;
  availableVersions: {
    ltsVersions: Array<{
      majorVersion: number;
      version: string;
      name: string;
    }>;
    current?: string;
  };
}): MenuItem[] => [
  ...(nodeVersions.projectVersion ? [{
    label: `Project Version (v${nodeVersions.projectVersion})`,
    value: nodeVersions.projectVersion,
    hint: 'Currently used in project'
  }] : []),
  ...nodeVersions.availableVersions.ltsVersions.map(lts => ({
    label: `Node ${lts.majorVersion} LTS (v${lts.version})`,
    value: lts.version,
    hint: `${lts.name} - Latest minor version`
  })),
  {
    label: `Latest (v${nodeVersions.availableVersions?.current || '21.x'})`,
    value: nodeVersions.availableVersions?.current || '21.7.1',
    hint: 'Latest available version - Not LTS'
  },
  {
    label: 'Custom Version',
    value: 'custom',
    hint: 'Specify a custom Node.js version'
  }
]; 