import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ProjectInfo } from '../utils/detection';
import { detectNodeVersion, NodeVersions } from '../utils/detection/node-version';

interface ProjectSetupProps {
  projectInfo: ProjectInfo;
}

type EnvironmentType = 'development' | 'production' | 'both';
type DockerType = 'dockerfile' | 'compose';
type DatabaseType = 'postgresql' | 'mysql' | 'mariadb' | 'sqlite';
type StorageType = 'volume' | 'bind' | 'tmpfs';

type SetupStep = 
  | 'review'           // Initial project review
  | 'environment'      // Dev/Prod/Both choice
  | 'docker-setup'     // Docker configuration
  | 'database'         // Database selection if needed
  | 'storage-setup'    // Storage configuration for SQLite
  | 'database-config'  // Database configuration if needed
  | 'node-version'     // Node.js version selection
  | 'node-version-custom'  // Add new step for custom version input
  | 'generate';        // Final generation step

interface MenuItem {
  label: string;
  value: string;
  hint?: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
}

interface SetupConfig {
  environment: EnvironmentType | null;
  dockerType: DockerType | null;
  database: DatabaseType | null;
  storageType?: StorageType;
  nodeVersion?: string;
  databaseConfig?: DatabaseConfig;
}

export const ProjectSetup: React.FC<ProjectSetupProps> = ({ projectInfo }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('review');
  const [config, setConfig] = useState<SetupConfig>({
    environment: null,
    dockerType: null,
    database: projectInfo.databaseType as DatabaseType || null,
    storageType: undefined,
    nodeVersion: undefined,
    databaseConfig: projectInfo.envFile.databaseConfig ? {
      host: projectInfo.envFile.databaseConfig.connection.host || 'localhost',
      port: projectInfo.envFile.databaseConfig.connection.port || 5432,
      name: projectInfo.envFile.databaseConfig.connection.database || 'strapi',
      username: projectInfo.envFile.databaseConfig.connection.username || 'strapi',
      password: projectInfo.envFile.databaseConfig.connection.password || ''
    } : undefined
  });

  const [nodeVersions, setNodeVersions] = useState<NodeVersions>({
    availableVersions: {
      ltsVersions: [{
        majorVersion: 20,
        version: '20.11.1',
        name: 'Hydrogen',
        date: '2024-02-14'
      }],
      current: '21.7.1',
      recommended: '20.11.1'
    }
  });

  const [customVersion, setCustomVersion] = useState('');

  const [dbConfigStep, setDbConfigStep] = useState<'host' | 'port' | 'name' | 'username' | 'password'>('host');
  const [dbConfigValue, setDbConfigValue] = useState('');

  useEffect(() => {
    const loadNodeVersions = async () => {
      const versions = await detectNodeVersion(projectInfo.projectPath);
      setNodeVersions(versions);
    };
    loadNodeVersions();
  }, [projectInfo.projectPath]);

  const handleEnvironmentSelect = ({ value }: { value: string }) => {
    const envType = value as EnvironmentType;
    setConfig(prev => ({ ...prev, environment: envType }));
    setCurrentStep('docker-setup');
  };

  const handleDockerSetup = ({ value }: { value: string }) => {
    const dockerType = value as DockerType;
    setConfig(prev => ({ ...prev, dockerType }));
    
    // If we already have a valid database config, we can skip to node version
    if (projectInfo.databaseType && projectInfo.envFile.databaseConfig) {
      setCurrentStep('node-version');
    } else {
      setCurrentStep('database');
    }
  };

  const handleDatabaseSelect = ({ value }: { value: string }) => {
    const dbType = value as DatabaseType;
    setConfig(prev => ({ ...prev, database: dbType }));
    
    if (dbType === 'sqlite') {
      setCurrentStep('storage-setup');
    } else {
      setCurrentStep('database-config');
    }
  };

  const handleStorageSetup = ({ value }: { value: string }) => {
    const storageType = value as StorageType;
    setConfig(prev => ({ ...prev, storageType }));
    setCurrentStep('node-version');
  };

  const handleNodeVersionSelect = ({ value }: { value: string }) => {
    if (value === 'custom') {
      setCurrentStep('node-version-custom');
    } else {
      setConfig(prev => ({ ...prev, nodeVersion: value }));
      setCurrentStep('generate');
    }
  };

  const handleCustomVersionChange = (value: string) => {
    setCustomVersion(value);
  };

  const handleCustomVersionSubmit = (value: string) => {
    // Basic semver validation
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(value)) {
      // You might want to add error handling here
      return;
    }
    setConfig(prev => ({ ...prev, nodeVersion: value }));
    setCurrentStep('generate');
  };

  const handleDatabaseConfigInput = (value: string) => {
    setDbConfigValue(value);
  };

  const handleDatabaseConfigSubmit = () => {
    setConfig(prev => ({
      ...prev,
      databaseConfig: {
        ...prev.databaseConfig || {
          host: 'localhost',
          port: 5432,
          name: 'strapi',
          username: 'strapi',
          password: ''
        },
        [dbConfigStep]: dbConfigStep === 'port' ? parseInt(dbConfigValue, 10) : dbConfigValue
      }
    }));

    switch (dbConfigStep) {
      case 'host':
        setDbConfigStep('port');
        setDbConfigValue(config.databaseConfig?.port?.toString() || '5432');
        break;
      case 'port':
        setDbConfigStep('name');
        setDbConfigValue(config.databaseConfig?.name || 'strapi');
        break;
      case 'name':
        setDbConfigStep('username');
        setDbConfigValue(config.databaseConfig?.username || 'strapi');
        break;
      case 'username':
        setDbConfigStep('password');
        setDbConfigValue('');
        break;
      case 'password':
        setCurrentStep('node-version');
        break;
    }
  };

  const environmentItems: MenuItem[] = [
    {
      label: 'Development',
      value: 'development',
      hint: 'Optimized for local development with hot-reload'
    },
    {
      label: 'Production',
      value: 'production',
      hint: 'Optimized for deployment'
    },
    {
      label: 'Both',
      value: 'both',
      hint: 'Development + Production setup'
    }
  ];

  const dockerItems: MenuItem[] = [
    {
      label: 'Simple Dockerfile only',
      value: 'dockerfile',
      hint: 'Lightweight, single container deployment'
    },
    {
      label: 'Dockerfile with Docker Compose',
      value: 'compose',
      hint: 'Multi-container setup with database'
    }
  ];

  const databaseItems: MenuItem[] = [
    ...(projectInfo.databaseType ? [{
      label: `Use existing configuration (${projectInfo.databaseType})`,
      value: projectInfo.databaseType,
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
      hint: config.environment === 'production' 
        ? '⚠️ Requires careful configuration for production'
        : 'Simple file-based database'
    }
  ];

  const storageItems: MenuItem[] = [
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

  const nodeVersionItems: MenuItem[] = [
    ...(nodeVersions.projectVersion ? [{
      label: `Project Version (v${nodeVersions.projectVersion})`,
      value: nodeVersions.projectVersion,
      hint: 'Currently used in project'
    }] : []),
    ...nodeVersions.availableVersions.ltsVersions.map((lts) => ({
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

  const renderStep = () => {
    switch (currentStep) {
      case 'review':
        return (
          <Box flexDirection="column">
            <Text>✓ Strapi {projectInfo.strapiVersion} detected</Text>
            <Text>✓ Project type: {projectInfo.type}</Text>
            {projectInfo.databaseType && (
              <Text>✓ Database: {projectInfo.databaseType} detected</Text>
            )}
            <Text>✓ Docker files: {projectInfo.hasDockerfile || projectInfo.hasDockerCompose ? 'Found' : 'None'}</Text>
            <Text>Press Enter to start setup...</Text>
            <SelectInput
              items={[{ label: 'Start Setup', value: 'start' }]}
              onSelect={() => setCurrentStep('environment')}
            />
          </Box>
        );

      case 'environment':
        return (
          <Box flexDirection="column">
            <Text>Select environment setup:</Text>
            <SelectInput items={environmentItems} onSelect={handleEnvironmentSelect} />
          </Box>
        );

      case 'docker-setup':
        return (
          <Box flexDirection="column">
            <Text>How would you like to containerize your application?</Text>
            <SelectInput items={dockerItems} onSelect={handleDockerSetup} />
          </Box>
        );

      case 'database':
        return (
          <Box flexDirection="column">
            <Text>Select database setup:</Text>
            <SelectInput items={databaseItems} onSelect={handleDatabaseSelect} />
          </Box>
        );

      case 'storage-setup':
        return (
          <Box flexDirection="column">
            <Text>SQLite storage configuration:</Text>
            {config.environment === 'production' && (
              <Text color="yellow">
                ⚠️  Warning: Using SQLite in production requires careful configuration
              </Text>
            )}
            <SelectInput items={storageItems} onSelect={handleStorageSetup} />
          </Box>
        );

      case 'database-config':
        const dbConfigPrompts = {
          host: 'Database host:',
          port: 'Database port:',
          name: 'Database name:',
          username: 'Database username:',
          password: 'Database password:'
        };

        return (
          <Box flexDirection="column">
            <Text>Configure {config.database} database:</Text>
            <Text>{dbConfigPrompts[dbConfigStep]}</Text>
            <TextInput 
              value={dbConfigValue}
              onChange={handleDatabaseConfigInput}
              onSubmit={handleDatabaseConfigSubmit}
              mask={dbConfigStep === 'password' ? '*' : undefined}
            />
          </Box>
        );

      case 'node-version':
        return (
          <Box flexDirection="column">
            <Text>Select Node.js version:</Text>
            <SelectInput items={nodeVersionItems} onSelect={handleNodeVersionSelect} />
          </Box>
        );

      case 'node-version-custom':
        return (
          <Box flexDirection="column">
            <Text>Enter Node.js version (format: x.y.z):</Text>
            <TextInput
              value={customVersion}
              onChange={handleCustomVersionChange}
              onSubmit={handleCustomVersionSubmit}
              placeholder="20.11.1"
            />
            <Text dimColor>Press Enter to confirm, or Escape to go back</Text>
          </Box>
        );

      case 'generate':
        return (
          <Box flexDirection="column">
            <Text>Configuration Summary:</Text>
            <Text>• Environment: {config.environment}</Text>
            <Text>• Docker Setup: {config.dockerType === 'dockerfile' ? 'Dockerfile only' : 'Docker Compose'}</Text>
            <Text>• Database: {config.database}</Text>
            {config.database === 'sqlite' && (
              <Text>• Storage: {config.storageType}</Text>
            )}
            <Text>• Node.js: {config.nodeVersion}</Text>
            <Text>Generating Docker configuration...</Text>
          </Box>
        );

      default:
        return <Text>Setting up your Docker environment...</Text>;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {renderStep()}
    </Box>
  );
};

export default ProjectSetup; 