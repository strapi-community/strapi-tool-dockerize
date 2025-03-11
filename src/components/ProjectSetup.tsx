import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ProjectInfo } from '../utils/detection';

interface ProjectSetupProps {
  projectInfo: ProjectInfo;
}

type EnvironmentType = 'development' | 'production' | 'both';
type DockerType = 'dockerfile' | 'compose' | 'both';
type DatabaseType = 'postgresql' | 'mysql' | 'mariadb' | 'sqlite';

type SetupStep = 
  | 'review'           // Initial project review
  | 'environment'      // Dev/Prod/Both choice
  | 'production-type'  // Only shown if production was chosen
  | 'database'         // Database selection if needed
  | 'database-config'  // Database configuration if needed
  | 'node-version'     // Node.js version selection
  | 'generate';        // Final generation step

interface MenuItem {
  label: string;
  value: string;
  hint?: string;
}

export const ProjectSetup: React.FC<ProjectSetupProps> = ({ projectInfo }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('review');
  const [environment, setEnvironment] = useState<EnvironmentType | null>(null);
  const [dockerType, setDockerType] = useState<DockerType | null>(null);
  const [database, setDatabase] = useState<DatabaseType | null>(null);

  const handleEnvironmentSelect = ({ value }: { value: string }) => {
    const envType = value as EnvironmentType;
    setEnvironment(envType);
    
    // Automatically set docker type for development
    if (envType === 'development') {
      setDockerType('compose');
      setCurrentStep('database');
    } else if (envType === 'both') {
      setDockerType('both');
      setCurrentStep('database');
    } else {
      setCurrentStep('production-type');
    }
  };

  const handleProductionTypeSelect = ({ value }: { value: string }) => {
    setDockerType(value as DockerType);
    setCurrentStep('database');
  };

  const handleDatabaseSelect = ({ value }: { value: string }) => {
    setDatabase(value as DatabaseType);
    if (value === 'sqlite' && environment === 'production') {
      // Show warning about SQLite in production
      setCurrentStep('node-version');
    } else {
      setCurrentStep('database-config');
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

  const productionTypeItems: MenuItem[] = [
    {
      label: 'Single Dockerfile',
      value: 'dockerfile',
      hint: 'Simple deployment, good for platforms like Heroku'
    },
    {
      label: 'Docker Compose',
      value: 'compose',
      hint: 'Multi-container setup, good for custom servers'
    }
  ];

  const databaseItems: MenuItem[] = [
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
      hint: projectInfo.environment === 'development' ? 'Good for development' : 'Not recommended for production'
    }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 'review':
        return (
          <Box flexDirection="column">
            <Text>Project detected: {projectInfo.name}</Text>
            <Text>Type: {projectInfo.type}</Text>
            <Text>Version: {projectInfo.strapiVersion}</Text>
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

      case 'production-type':
        return (
          <Box flexDirection="column">
            <Text>Choose deployment setup:</Text>
            <SelectInput items={productionTypeItems} onSelect={handleProductionTypeSelect} />
          </Box>
        );

      case 'database':
        return (
          <Box flexDirection="column">
            <Text>Select database setup:</Text>
            <SelectInput items={databaseItems} onSelect={handleDatabaseSelect} />
          </Box>
        );

      // Additional steps will be implemented here

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