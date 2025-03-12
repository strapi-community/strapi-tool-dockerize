import { Environment } from '../environments';

export type BaseDockerConfig = {
  nodeVersion: string;
  environment: Environment;
  buildArgs?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
};

export const baseTemplate = `
# Base stage for all builds
FROM node:{{nodeVersion}}-alpine as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \\
    build-base \\
    gcc \\
    autoconf \\
    automake \\
    zlib-dev \\
    libpng-dev \\
    vips-dev \\
    git \\
    python3

# Environment setup
ENV NODE_ENV={{environment}} \\
    PATH=/app/node_modules/.bin:$PATH

# Copy package files
COPY package*.json ./

# Install dependencies
RUN {{#if production}}npm ci --only=production{{else}}npm install{{/if}}

{{#if buildArgs}}
# Build arguments
{{#each buildArgs}}
ARG {{@key}}={{this}}
{{/each}}
{{/if}}

{{#if volumes}}
# Volumes
{{#each volumes}}
VOLUME {{this}}
{{/each}}
{{/if}}

{{#if ports}}
# Expose ports
{{#each ports}}
EXPOSE {{this}}
{{/each}}
{{/if}}
`; 