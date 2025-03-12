import { BaseDockerConfig } from './base';

export type ProductionDockerConfig = BaseDockerConfig & {
  healthCheck?: boolean;
  cacheDirectories?: string[];
};

export const productionTemplate = `
{{> base}}

# Build stage
FROM base as builder

# Copy source
COPY . .

{{#if cacheDirectories}}
# Cache directories
{{#each cacheDirectories}}
COPY {{this}} ./{{this}}
{{/each}}
{{/if}}

# Build application
RUN npm run build

# Production stage
FROM node:{{nodeVersion}}-alpine

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
ENV NODE_ENV=production \\
    PORT=1337

{{#if healthCheck}}
# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
{{/if}}

# Expose port
EXPOSE \${PORT}

# Start command
CMD ["npm", "run", "start"]
`; 