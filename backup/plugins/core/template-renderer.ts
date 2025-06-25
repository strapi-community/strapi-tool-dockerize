import { Liquid } from 'liquidjs';
import fs from 'fs';
import path from 'path';

export class TemplateRenderer {
  private engine: Liquid;

  constructor() {
    this.engine = new Liquid({
      extname: '.liquid',
      cache: true
    });
  }

  // Render a template with variables
  async render(template: string, variables: Record<string, any>): Promise<string> {
    try {
      return await this.engine.parseAndRender(template, variables);
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  // Write rendered template to file
  async writeToFile(content: string, targetPath: string): Promise<void> {
    try {
      const directory = path.dirname(targetPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      fs.writeFileSync(targetPath, content);
    } catch (error) {
      console.error('Error writing template to file:', error);
      throw error;
    }
  }

  // Render and write template to file
  async renderToFile(template: string, variables: Record<string, any>, targetPath: string): Promise<void> {
    const rendered = await this.render(template, variables);
    await this.writeToFile(rendered, targetPath);
  }

  // Merge multiple templates into one
  async mergeTemplates(templates: Record<string, string>, variables: Record<string, any>): Promise<string> {
    const rendered: string[] = [];
    
    for (const [name, template] of Object.entries(templates)) {
      const content = await this.render(template, variables);
      rendered.push(content);
    }

    return rendered.join('\n\n');
  }
} 