import * as fs from 'fs';
import * as path from 'path';

export interface ConfigManagerOptions {
  debug?: boolean;
  projectPath?: string;
  backupPath?: string;
}

export class ConfigManager {
  private debug: boolean;
  private projectPath: string;
  private backupPath: string;

  constructor(options: ConfigManagerOptions = {}) {
    this.debug = options.debug || false;
    this.projectPath = options.projectPath || process.cwd();
    this.backupPath = options.backupPath || path.join(this.projectPath, '.strapi-dockerize/backups');
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  public backupFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const fileName = path.basename(filePath);
    const backupDir = path.join(this.backupPath, this.getTimestamp());
    this.ensureDirectoryExists(backupDir);

    const backupPath = path.join(backupDir, `${fileName}.backup`);
    fs.copyFileSync(filePath, backupPath);
  }

  public writeFile(content: string, fileName: string): void {
    const filePath = this.debug 
      ? path.join(this.projectPath, fileName)
      : path.join(process.cwd(), fileName);

    // Backup existing file if it exists
    if (fs.existsSync(filePath)) {
      this.backupFile(filePath);
    }

    // Ensure directory exists
    this.ensureDirectoryExists(path.dirname(filePath));

    // Write new file
    fs.writeFileSync(filePath, content);

    if (this.debug) {
      console.log(`Debug: File written to ${filePath}`);
    }
  }

  public writeDockerfile(content: string): void {
    this.writeFile(content, 'Dockerfile');
  }

  public writeDockerCompose(content: string, isProd: boolean = false): void {
    const fileName = isProd ? 'docker-compose.prod.yml' : 'docker-compose.yml';
    this.writeFile(content, fileName);
  }

  public writeEnvFile(content: string, isProd: boolean = false): void {
    const fileName = isProd ? '.env.production' : '.env';
    this.writeFile(content, fileName);
  }
} 