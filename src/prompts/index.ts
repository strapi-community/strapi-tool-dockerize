import { ProjectInfo } from '../types';
import { DatabasePlugin } from '../core/types';

type PromptOptions = {
  projectInfo: ProjectInfo;
  availablePlugins: DatabasePlugin[];
};

export async function promptQuestions({ projectInfo, availablePlugins }: PromptOptions) {
  // 1. Environment Selection
  const environment = await promptEnvironment();

  // 2. Database Selection (if needed)
  const database = await promptDatabase(availablePlugins);

  // 3. If database selected, get database-specific configuration
  let databaseConfig = null;
  if (database) {
    databaseConfig = await promptDatabaseConfig(database);
  }

  // 4. Node.js Version (if not detected)
  const nodeVersion = projectInfo.nodeVersion || await promptNodeVersion();

  return {
    environment,
    database,
    databaseConfig,
    nodeVersion
  };
} 