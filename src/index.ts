import { getProjectInfo } from './utils/project-detection';
import { loadPlugins } from './core/plugin-manager';
import { promptQuestions } from './prompts';
import { generateConfiguration } from './templates';

export async function main() {
  // 1. Auto-Detection Phase
  const projectInfo = await getProjectInfo();
  // - Project type (TS/JS)
  // - Existing database config
  // - Node.js version
  // - Environment files

  // 2. Load Available Plugins
  const plugins = await loadPlugins();

  // 3. Interactive Questions
  const answers = await promptQuestions({
    projectInfo,
    availablePlugins: plugins
  });

  // 4. Generate Configuration
  await generateConfiguration({
    projectInfo,
    answers,
    selectedPlugin: plugins[answers.database]
  });
} 