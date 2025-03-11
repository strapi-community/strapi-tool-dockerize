import { generateDockerCompose } from '../templates';
import { getAvailablePlugins, processPluginAnswers } from '../core/plugin-manager';

export async function dockerize(answers: any) {
  const options = {
    nodeVersion: answers.nodeVersion,
    environment: answers.environment,
    customModifications: [
      // Example: Add Redis service
      {
        service: 'redis',
        config: {
          image: 'redis:alpine',
          ports: ['6379:6379'],
          volumes: ['redis_data:/data']
        }
      },
      // Example: Modify Strapi service
      {
        service: 'strapi',
        config: {
          environment: {
            REDIS_HOST: 'redis'
          },
          depends_on: ['redis']
        }
      }
    ]
  };

  if (answers.database) {
    const plugin = getAvailablePlugins().find(p => p.name === answers.database);
    if (plugin) {
      options.database = {
        plugin,
        config: await processPluginAnswers(plugin.name, answers)
      };
    }
  }

  const composeFile = await generateDockerCompose(options);
  
  // Write to appropriate docker-compose file
  const filename = options.environment === 'production' 
    ? 'docker-compose.prod.yml' 
    : 'docker-compose.yml';
  
  await writeFile(filename, composeFile);
} 