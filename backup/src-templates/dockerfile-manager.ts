import { Environment } from './environments';

type DockerfileConfig = {
  nodeVersion: string;
  environment: Environment;
  buildArgs?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  healthCheck?: boolean;
};

export function createBaseDockerfile(config: DockerfileConfig): string {
  const { nodeVersion, environment } = config;
  
  return `
# Base stage for all builds
FROM node:${nodeVersion}-alpine as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git \
    python3

# Environment setup
ENV NODE_ENV=${environment} \
    PATH=/app/node_modules/.bin:$PATH

# Copy package files
COPY package*.json ./

# Install dependencies with specific flags for production
RUN ${environment === 'production' 
  ? 'npm ci --only=production' 
  : 'npm install'}`
}

export function createProductionDockerfile(config: DockerfileConfig): string {
  const baseStage = createBaseDockerfile(config);
  const healthCheck = config.healthCheck ? `
# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"` : '';

  return `${baseStage}

# Build stage
FROM base as builder

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:${config.nodeVersion}-alpine

# Set working directory
WORKDIR /app

# Install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .
COPY --from=builder /app/favicon.ico .

# Environment variables
ENV NODE_ENV=production \
    PORT=1337

${healthCheck}

# Expose port
EXPOSE \${PORT}

# Start command
CMD ["npm", "run", "start"]`
}

export function createDevelopmentDockerfile(config: DockerfileConfig): string {
  const baseStage = createBaseDockerfile(config);
  
  return `${baseStage}

# Copy source
COPY . .

# Expose port
EXPOSE 1337

# Start development server
CMD ["npm", "run", "develop"]`
}

export function generateDockerfile(config: DockerfileConfig): string {
  if (config.environment === 'production') {
    return createProductionDockerfile(config);
  }
  return createDevelopmentDockerfile(config);
} 