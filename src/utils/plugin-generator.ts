import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { text, select, multiselect, confirm } from "@clack/prompts";
import type { PluginMetadata } from "../types";

export interface PluginGeneratorOptions {
  name: string;
  type: string;
  category: "database" | "service" | "tool" | "custom";
  description?: string;
  author?: string;
  outputDir: string;
  includeTests?: boolean;
  includeValidation?: boolean;
  includeTemplates?: boolean;
}

export class PluginGenerator {
  async generatePlugin(options?: Partial<PluginGeneratorOptions>) {
    console.log("🚀 Creating a new Strapi Dockerize plugin...\n");

    // Collect plugin information
    const name =
      options?.name ||
      ((await text({
        message: "Plugin name:",
        placeholder: "my-awesome-plugin",
        validate: (value) => {
          if (!value) return "Plugin name is required";
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return "Plugin name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens";
          }
        },
      })) as string);

    const type =
      options?.type ||
      ((await text({
        message: "Plugin type (unique identifier):",
        placeholder: name.replace(/-/g, ""),
        defaultValue: name.replace(/-/g, ""),
        validate: (value) => {
          if (!value) return "Plugin type is required";
          if (!/^[a-z][a-z0-9]*$/.test(value)) {
            return "Plugin type must be lowercase and contain only letters and numbers";
          }
        },
      })) as string);

    const category =
      options?.category ||
      ((await select({
        message: "Plugin category:",
        options: [
          {
            value: "database",
            label: "Database",
            hint: "Database connection plugins",
          },
          {
            value: "service",
            label: "Service",
            hint: "Additional services (Redis, Elasticsearch, etc.)",
          },
          {
            value: "tool",
            label: "Tool",
            hint: "Development tools and utilities",
          },
          { value: "custom", label: "Custom", hint: "Custom functionality" },
        ],
      })) as "database" | "service" | "tool" | "custom");

    const description =
      options?.description ||
      ((await text({
        message: "Plugin description:",
        placeholder: "A brief description of what this plugin does",
      })) as string);

    const author =
      options?.author ||
      ((await text({
        message: "Author name:",
        placeholder: "Your Name",
      })) as string);

    const features = (await multiselect({
      message: "Include additional features:",
      options: [
        {
          value: "validation",
          label: "Input validation",
          hint: "Zod schema validation",
        },
        { value: "tests", label: "Unit tests", hint: "Vitest test suite" },
        {
          value: "templates",
          label: "Template files",
          hint: "Liquid template examples",
        },
        {
          value: "docs",
          label: "Documentation",
          hint: "README and usage docs",
        },
      ],
    })) as string[];

    const outputDir = options?.outputDir || process.cwd();
    const pluginDir = join(outputDir, "plugins", name);

    // Create plugin directory structure
    this.createDirectoryStructure(pluginDir, features);

    // Generate plugin files
    const pluginOptions: PluginGeneratorOptions = {
      name,
      type,
      category,
      description,
      author,
      outputDir: pluginDir,
      includeTests: features.includes("tests"),
      includeValidation: features.includes("validation"),
      includeTemplates: features.includes("templates"),
    };

    await this.generatePluginFiles(pluginOptions, features);

    console.log(`\n✅ Plugin "${name}" created successfully!`);
    console.log(`📁 Location: ${pluginDir}`);
    console.log("\n📚 Next steps:");
    console.log("1. Edit the plugin file to implement your logic");
    console.log("2. Add your templates in the templates/ directory");
    if (features.includes("tests")) {
      console.log("3. Run tests with: npm test");
    }
    console.log(
      "4. Test your plugin by running strapi-dockerize in a Strapi project"
    );

    return pluginDir;
  }

  private createDirectoryStructure(pluginDir: string, features: string[]) {
    // Create main plugin directory
    mkdirSync(pluginDir, { recursive: true });

    // Create subdirectories based on features
    if (features.includes("templates")) {
      mkdirSync(join(pluginDir, "templates"), { recursive: true });
    }

    if (features.includes("tests")) {
      mkdirSync(join(pluginDir, "__tests__"), { recursive: true });
    }

    if (features.includes("docs")) {
      mkdirSync(join(pluginDir, "docs"), { recursive: true });
    }
  }

  private async generatePluginFiles(
    options: PluginGeneratorOptions,
    features: string[]
  ) {
    // Generate main plugin file
    this.generateMainPluginFile(options);

    // Generate additional files based on features
    if (options.includeValidation) {
      this.generateValidationFile(options);
    }

    if (options.includeTests) {
      this.generateTestFile(options);
    }

    if (options.includeTemplates) {
      this.generateTemplateFiles(options);
    }

    if (features.includes("docs")) {
      this.generateDocumentation(options);
    }

    // Generate package.json for npm plugins
    this.generatePackageJson(options);
  }

  private generateMainPluginFile(options: PluginGeneratorOptions) {
    const template = this.getPluginTemplate(options);
    writeFileSync(join(options.outputDir, "index.ts"), template);
  }

  private generateValidationFile(options: PluginGeneratorOptions) {
    const template = `import { z } from "zod";
import type { ValidationResult } from "@strapi-community/dockerize";

export const ${options.type}Schema = z.object({
  // Add your validation schema here
  name: z.string().min(1, "Name is required"),
  // Example: port: z.number().min(1024).max(65535),
});

export async function validate${
      options.type.charAt(0).toUpperCase() + options.type.slice(1)
    }Config(
  config: Record<string, any>
): Promise<ValidationResult> {
  try {
    ${options.type}Schema.parse(config);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => \`\${err.path.join('.')}: \${err.message}\`),
      };
    }
    return {
      valid: false,
      errors: ["Unknown validation error"],
    };
  }
}
`;
    writeFileSync(join(options.outputDir, "validation.ts"), template);
  }

  private generateTestFile(options: PluginGeneratorOptions) {
    const template = `import { describe, it, expect } from "vitest";
import { ${options.type}Plugin } from "../index";

describe("${options.name} Plugin", () => {
  it("should have correct metadata", () => {
    expect(${options.type}Plugin.name).toBe("${options.name}");
    expect(${options.type}Plugin.type).toBe("${options.type}");
    expect(${options.type}Plugin.metadata?.category).toBe("${
      options.category
    }");
  });

  it("should have questions function", () => {
    expect(typeof ${options.type}Plugin.questions).toBe("function");
  });

  it("should have generateFiles function", () => {
    expect(typeof ${options.type}Plugin.generateFiles).toBe("function");
  });

  ${
    options.includeValidation
      ? `
  it("should validate configuration", async () => {
    const config = {
      name: "test",
      // Add test configuration
    };
    
    if (${options.type}Plugin.validate) {
      const result = await ${options.type}Plugin.validate(config);
      expect(result.valid).toBe(true);
    }
  });
  `
      : ""
  }

  // Add more specific tests for your plugin logic
});
`;
    writeFileSync(
      join(options.outputDir, "__tests__", "index.test.ts"),
      template
    );
  }

  private generateTemplateFiles(options: PluginGeneratorOptions) {
    if (options.category === "database") {
      const composeTemplate = `version: '3.8'

services:
  {{ serviceName }}:
    image: {{ image.name }}:{{ image.tag }}
    environment:
      # Add your environment variables here
    ports:
      - "{{ port }}:{{ defaultPort }}"
    volumes:
      - {{ volumeName }}:/data
    healthcheck:
      test: ["CMD", "echo", "hello"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  {{ volumeName }}:
`;
      writeFileSync(
        join(options.outputDir, "templates", "compose.liquid"),
        composeTemplate
      );
    }

    // Add service-specific template examples
    const exampleTemplate = `# Example template for {{ pluginName }}
# Customize this template for your specific use case

# Template variables available:
# - config: The configuration from questions
# - project: Strapi project information
# - context: Plugin context (outputDir, etc.)

Hello from {{ pluginName }}!
Configuration: {{ config | json }}
`;
    writeFileSync(
      join(options.outputDir, "templates", "example.liquid"),
      exampleTemplate
    );
  }

  private generateDocumentation(options: PluginGeneratorOptions) {
    const readme = `# ${options.name}

${options.description}

## Installation

\`\`\`bash
# For local plugins
mkdir -p plugins
cp -r path/to/${options.name} plugins/

# For npm plugins (when published)
npm install strapi-dockerize-plugin-${options.name}
\`\`\`

## Usage

This plugin will be automatically discovered by strapi-dockerize when you run it in a Strapi project.

## Configuration

The plugin will ask you for the following configuration:

- **Field 1**: Description of what this field does
- **Field 2**: Description of what this field does

## Templates

This plugin includes the following templates:

- \`compose.liquid\`: Docker Compose service definition
- \`example.liquid\`: Example template file

## Development

\`\`\`bash
# Run tests
npm test

# Build plugin
npm run build
\`\`\`

## Author

${options.author}
`;
    writeFileSync(join(options.outputDir, "README.md"), readme);
  }

  private generatePackageJson(options: PluginGeneratorOptions) {
    const packageJson = {
      name: `strapi-dockerize-plugin-${options.name}`,
      version: "1.0.0",
      description: options.description,
      main: "index.js",
      types: "index.d.ts",
      keywords: [
        "strapi",
        "docker",
        "strapi-dockerize",
        "plugin",
        options.category,
      ],
      author: options.author,
      license: "MIT",
      peerDependencies: {
        "@strapi-community/dockerize": "^2.0.0",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/node": "^20.0.0",
        ...(options.includeTests && {
          vitest: "^1.0.0",
          "@vitest/ui": "^1.0.0",
        }),
        ...(options.includeValidation && {
          zod: "^3.22.0",
        }),
      },
      scripts: {
        build: "tsc",
        ...(options.includeTests && {
          test: "vitest",
          "test:watch": "vitest watch",
        }),
      },
    };

    writeFileSync(
      join(options.outputDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private getPluginTemplate(options: PluginGeneratorOptions): string {
    const imports = [
      'import { text, select } from "@clack/prompts";',
      'import type { DatabasePlugin } from "@strapi-community/dockerize";',
      ...(options.includeValidation
        ? [
            "import { validate" +
              options.type.charAt(0).toUpperCase() +
              options.type.slice(1) +
              'Config } from "./validation";',
          ]
        : []),
    ];

    return `${imports.join("\n")}

export const ${options.type}Plugin: DatabasePlugin = {
  name: "${options.name}",
  type: "${options.type}",
  
  metadata: {
    name: "${options.name}",
    type: "${options.type}",
    version: "1.0.0",
    description: "${options.description}",
    author: "${options.author}",
    category: "${options.category}",
    requirements: {
      node: ">=18.0.0",
    },
  },

  async questions() {
    // Implement your configuration questions here
    const name = await text({
      message: "Enter configuration name:",
      placeholder: "default",
      defaultValue: "default",
      validate: (value) => {
        if (!value) return "Name is required";
      },
    });

    // Add more questions as needed
    // const port = await text({
    //   message: "Port number:",
    //   placeholder: "3000",
    //   validate: (value) => {
    //     const port = parseInt(value);
    //     if (isNaN(port) || port < 1024 || port > 65535) {
    //       return "Port must be a number between 1024 and 65535";
    //     }
    //   },
    // });

    return {
      name: name as string,
      // port: parseInt(port as string),
    };
  },

  async generateFiles(config, context) {
    try {
      // Implement your file generation logic here
      console.log(\`🔧 Generating \${this.name} configuration...\`);
      console.log("Configuration:", config);
      
      if (context) {
        console.log("Project:", context.project.name);
        console.log("Output directory:", context.outputDir);
      }

      // Example: Generate docker-compose service
      // const liquid = new Liquid();
      // const template = readFileSync(join(__dirname, "templates/compose.liquid"), "utf8");
      // const rendered = await liquid.parseAndRender(template, {
      //   serviceName: config.name,
      //   config,
      //   project: context?.project,
      // });
      
      // Write files using context.outputDir or handle file writing
      console.log(\`✅ \${this.name} configuration generated successfully!\`);
    } catch (error) {
      console.error(\`❌ Error generating \${this.name} configuration:\`, error);
      throw error;
    }
  },

  ${
    options.includeValidation
      ? `
  async validate(config) {
    return validate${
      options.type.charAt(0).toUpperCase() + options.type.slice(1)
    }Config(config);
  },
  `
      : ""
  }

  ${
    options.includeTests
      ? `
  tests: [
    {
      name: "Plugin loads correctly",
      async test() {
        return {
          passed: true,
          message: "Plugin loaded successfully",
        };
      },
    },
    // Add more tests as needed
  ],
  `
      : ""
  }
};

// Export as default for easier importing
export default ${options.type}Plugin;
`;
  }
}

// CLI command for generating plugins
export async function generatePluginCommand() {
  const generator = new PluginGenerator();
  await generator.generatePlugin();
}
