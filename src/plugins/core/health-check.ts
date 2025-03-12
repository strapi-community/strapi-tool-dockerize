export interface HealthCheckConfig {
  interval?: string;  // e.g., '30s'
  timeout?: string;   // e.g., '10s'
  retries?: number;   // e.g., 3
  startPeriod?: string; // e.g., '5s'
}

export interface HealthCheck {
  getHealthCheckCommand(): string;
  getHealthCheckConfig(): HealthCheckConfig;
}

export const defaultHealthCheckConfig: HealthCheckConfig = {
  interval: '30s',
  timeout: '10s',
  retries: 3,
  startPeriod: '5s'
};

export function generateHealthCheck(plugin: HealthCheck): string {
  const config = { ...defaultHealthCheckConfig, ...plugin.getHealthCheckConfig() };
  const command = plugin.getHealthCheckCommand();

  return `
HEALTHCHECK --interval=${config.interval} \\
           --timeout=${config.timeout} \\
           --start-period=${config.startPeriod} \\
           --retries=${config.retries} \\
  CMD ${command}
`;
} 