export interface DevelopmentConfig {
  watchPaths?: string[];
  debugPort?: number;
}

export const developmentTemplate = `
version: '3.8'

services:
  strapi:
    build: 
      context: .
      target: development
    environment:
      - NODE_ENV=development
    ports:
      - "1337:1337"
      {{#if debugPort}}
      - "{{debugPort}}:{{debugPort}}"
      {{/if}}
    volumes:
      - .:/app
      - /app/node_modules
    develop:
      watch:
        - action: sync
          path: ./
          target: /app
          ignore:
            - node_modules/
            - .git/
            - .env
            - "*.lock"
        {{#if watchPaths}}
        {{#each watchPaths}}
        - action: sync
          path: {{this}}
          target: /app/{{this}}
        {{/each}}
        {{/if}}
    {{#if debugPort}}
    command: ["npm", "run", "develop", "--inspect=0.0.0.0:{{debugPort}}"]
    {{else}}
    command: ["npm", "run", "develop"]
    {{/if}}
`;

export function generateDevelopmentCompose(config: DevelopmentConfig = {}): string {
  return developmentTemplate
    .replace('{{watchPaths}}', config.watchPaths?.join('\n      ') || '')
    .replace(/{{debugPort}}/g, config.debugPort?.toString() || '9229');
} 