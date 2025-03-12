import { ProjectInfo } from '../core/types.js';
import React, { FC } from 'react';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { Box, Text } from 'ink';
import { MenuItem } from '../types/cli.js';

interface DatabaseConfig {
  type: string;
  database?: string;
  username?: string;
  password?: string;
  port?: string;
  host?: string;
  filename?: string;
}

interface DatabasePromptProps {
  projectInfo: ProjectInfo;
  onSubmit: (config: DatabaseConfig) => void;
}

const databaseOptions: MenuItem[] = [
  {
    label: `PostgreSQL (Recommended for production)`,
    value: `postgresql`,
    hint: `Best for production environments`
  },
  {
    label: `MySQL`,
    value: `mysql`,
    hint: `Popular open-source database`
  },
  {
    label: `MariaDB`,
    value: `mariadb`,
    hint: `Community-developed fork of MySQL`
  },
  {
    label: `SQLite (Development only)`,
    value: `sqlite`,
    hint: `Simple file-based database, good for development`
  }
];

export const DatabasePrompt: FC<DatabasePromptProps> = ({ projectInfo, onSubmit }) => {
  const [step, setStep] = React.useState<'type' | 'config' | 'confirm'>(`type`);
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<Partial<DatabaseConfig>>({});

  const handleTypeSelect = ({ value }: MenuItem) => {
    setSelectedType(value);
    if (value === projectInfo.databaseType && projectInfo.envFile?.databaseConfig) {
      setStep(`confirm`);
    } else {
      setStep(`config`);
    }
  };

  const handleConfigSubmit = (value: string, field: keyof DatabaseConfig) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = ({ value }: MenuItem) => {
    if (value === `yes` && projectInfo.envFile?.databaseConfig) {
      onSubmit({
        type: selectedType!,
        ...projectInfo.envFile.databaseConfig
      });
    } else {
      setStep(`config`);
    }
  };

  if (step === `type`) {
    return (
      <Box flexDirection="column">
        <Text>Select database setup:</Text>
        <SelectInput
          items={databaseOptions}
          onSelect={handleTypeSelect}
          initialIndex={databaseOptions.findIndex(
            opt => opt.value === projectInfo.databaseType
          )}
        />
      </Box>
    );
  }

  if (step === `confirm` && projectInfo.envFile?.databaseConfig) {
    return (
      <Box flexDirection="column">
        <Text>Use detected {selectedType} configuration?</Text>
        <SelectInput
          items={[
            { label: `Yes`, value: `yes`, hint: `Use existing configuration` },
            { label: `No`, value: `no`, hint: `Configure manually` }
          ]}
          onSelect={handleConfirm}
        />
      </Box>
    );
  }

  // Config step UI based on database type
  const renderConfigInputs = () => {
    switch (selectedType) {
      case `postgresql`:
      case `mysql`:
      case `mariadb`:
        const port = selectedType === `postgresql` ? `5432` : `3306`;
        return (
          <Box flexDirection="column">
            <Box>
              <Text>Database name: </Text>
              <TextInput
                value={config.database || ``}
                onChange={value => handleConfigSubmit(value, `database`)}
                placeholder="strapi"
              />
            </Box>
            <Box>
              <Text>Username: </Text>
              <TextInput
                value={config.username || ``}
                onChange={value => handleConfigSubmit(value, `username`)}
                placeholder="strapi"
              />
            </Box>
            <Box>
              <Text>Password: </Text>
              <TextInput
                value={config.password || ``}
                onChange={value => handleConfigSubmit(value, `password`)}
                placeholder=""
                mask="*"
              />
            </Box>
            <Box>
              <Text>Port: </Text>
              <TextInput
                value={config.port || ``}
                onChange={value => handleConfigSubmit(value, `port`)}
                placeholder={port}
              />
            </Box>
            <Box>
              <Text>Host: </Text>
              <TextInput
                value={config.host || ``}
                onChange={value => handleConfigSubmit(value, `host`)}
                placeholder="localhost"
              />
            </Box>
          </Box>
        );
      case `sqlite`:
        return (
          <Box>
            <Text>Database filename: </Text>
            <TextInput
              value={config.filename || ``}
              onChange={value => handleConfigSubmit(value, `filename`)}
              placeholder=".tmp/data.db"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Configure {selectedType} database:</Text>
      {renderConfigInputs()}
    </Box>
  );
}; 