import { Liquid } from 'liquidjs';
import fs from 'fs';
import path from 'path';

const engine = new Liquid({
  extname: '.liquid',
  cache: true
});

export async function renderTemplate(
  template: string,
  variables: Record<string, any>
): Promise<string> {
  try {
    return await engine.parseAndRender(template, variables);
  } catch (error) {
    console.error('Error rendering template:', error);
    throw error;
  }
}

export async function writeRenderedTemplate(
  content: string,
  targetPath: string
): Promise<void> {
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

export async function renderAndWriteTemplate(
  template: string,
  variables: Record<string, any>,
  targetPath: string
): Promise<void> {
  const rendered = await renderTemplate(template, variables);
  await writeRenderedTemplate(rendered, targetPath);
}

export async function loadTemplates(
  pluginPath: string,
  pluginName: string
): Promise<Record<string, string>> {
  const templates: Record<string, string> = {};
  const templatesPath = path.join(pluginPath, 'databases', pluginName, 'templates');

  if (!fs.existsSync(templatesPath)) {
    return templates;
  }

  const files = fs.readdirSync(templatesPath);
  for (const file of files) {
    if (file.endsWith('.liquid')) {
      const templateName = path.basename(file, '.liquid');
      const templateContent = fs.readFileSync(path.join(templatesPath, file), 'utf-8');
      templates[templateName] = templateContent;
    }
  }

  return templates;
} 