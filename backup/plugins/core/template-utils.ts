import { DatabasePluginConfig, DatabaseAnswers, TemplateVariables } from '@types';

export const createBaseTemplateVariables = (
  config: DatabasePluginConfig,
  answers: DatabaseAnswers
): TemplateVariables => ({
  database: {
    type: config.name.toLowerCase(),
    name: answers.database,
    user: answers.username,
    password: answers.password,
    port: answers.port.toString(),
    host: 'localhost'
  },
  environment: {
    [`${config.envPrefix}_DATABASE`]: answers.database,
    [`${config.envPrefix}_USER`]: answers.username,
    [`${config.envPrefix}_PASSWORD`]: answers.password,
    [`${config.envPrefix}_ROOT_PASSWORD`]: answers.rootPassword || answers.password,
  },
  volumes: {
    data: config.volumePath
  },
  image: {
    name: config.image.name,
    tag: answers.version || config.defaultVersion
  }
});

export const mergeTemplateVariables = (
  base: TemplateVariables,
  custom: Partial<TemplateVariables>
): TemplateVariables => ({
  ...base,
  ...custom,
  environment: {
    ...base.environment,
    ...custom.environment
  }
}); 