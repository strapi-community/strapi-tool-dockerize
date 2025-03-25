import { ProjectInfo } from '../core/types.js';
import React, { FC } from 'react';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { Box, Text } from 'ink';
import { MenuItem } from '../types/cli.js';
import { PluginConfig } from '../config/plugin.js';
import { DatabasePlugin, Question } from '../plugins/core/types.js';
import { loadDatabasePlugins } from '../plugins/core/load-plugins.js';

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
  pluginConfig: PluginConfig;
}

export const DatabasePrompt: FC<DatabasePromptProps> = ({ projectInfo, onSubmit, pluginConfig }) => {
	const [step, setStep] = React.useState<`type` | `config` | `confirm`>(`type`);
	const [selectedType, setSelectedType] = React.useState<string | null>(null);
	const [config, setConfig] = React.useState<Partial<DatabaseConfig>>({});
	const [databasePlugins, setDatabasePlugins] = React.useState<Map<string, DatabasePlugin>>(new Map());
	const [questions, setQuestions] = React.useState<Question[]>([]);
	const [feedback, setFeedback] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		const loadPlugins = async () => {
			const plugins = await loadDatabasePlugins(process.cwd());
			setDatabasePlugins(plugins);
			setLoading(false);
		};
		loadPlugins();
	}, []);

	const databaseOptions: MenuItem[] = React.useMemo(() => {
		return Array.from(databasePlugins.entries()).map(([key, plugin]) => ({
			label: plugin.name || key,
			value: key,
			hint: plugin.description || `Database plugin`
		}));
	}, [databasePlugins]);

	const handleTypeSelect = async ({ value }: MenuItem) => {
		setSelectedType(value);
		const plugin = databasePlugins.get(value);
		setFeedback([]);
		
		if (value === projectInfo.databaseType && projectInfo.envFile?.databaseConfig) {
			setStep(`confirm`);
		} else if (plugin) {
			const pluginQuestions = await plugin.getQuestions();
			setQuestions(pluginQuestions);
			
			// Handle plugin-specific initialization feedback
			if (plugin.onInit) {
				const initFeedback = await plugin.onInit();
				if (initFeedback) {
					setFeedback(prev => [...prev, ...initFeedback]);
				}
			}
			
			setStep(`config`);
		}
	};

	const handleConfigSubmit = async (value: string, field: keyof DatabaseConfig) => {
		setConfig(prev => ({ ...prev, [field]: value }));
		
		// Handle plugin-specific field validation feedback
		const plugin = selectedType ? databasePlugins.get(selectedType) : null;
		if (plugin?.onFieldChange) {
			const fieldFeedback = await plugin.onFieldChange(field, value, config);
			if (fieldFeedback) {
				setFeedback(prev => [...prev, ...fieldFeedback]);
			}
		}
	};

	const handleConfirm = ({ value }: MenuItem) => {
		if (value === `yes` && projectInfo.envFile?.databaseConfig) {
			onSubmit({
				...projectInfo.envFile.databaseConfig,
				type: selectedType!
			});
		} else {
			setStep(`config`);
		}
	};

	if (loading) {
		return (
			<Box>
				<Text>Loading database plugins...</Text>
			</Box>
		);
	}

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

	// Config step UI based on database plugin
	const renderConfigInputs = () => {
		if (!questions.length) return null;

		return (
			<Box flexDirection="column">
				{questions.map((question: Question, index: number) => (
					<Box key={index}>
						<Text>{question.label}: </Text>
						<TextInput
							value={config[question.field as keyof DatabaseConfig] || ``}
							onChange={value => handleConfigSubmit(value, question.field as keyof DatabaseConfig)}
							placeholder={question.default || ``}
							mask={question.sensitive ? `*` : undefined}
						/>
					</Box>
				))}
				{feedback.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						{feedback.map((message, index) => (
							<Text key={index} color="yellow">{message}</Text>
						))}
					</Box>
				)}
			</Box>
		);
	};

	return (
		<Box flexDirection="column">
			<Text>Configure {selectedType} database:</Text>
			{renderConfigInputs()}
		</Box>
	);
}; 