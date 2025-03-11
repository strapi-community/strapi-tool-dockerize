export type Environment = 'development' | 'production';

export const environmentConfigs = {
  development: {
    command: 'npm run develop',
    volumes: ['./:/app'],
    watch: true,
    nodeEnv: 'development'
  },
  production: {
    command: 'npm start',
    volumes: ['./:/app', './public/uploads:/app/public/uploads'],
    watch: false,
    nodeEnv: 'production'
  }
}; 