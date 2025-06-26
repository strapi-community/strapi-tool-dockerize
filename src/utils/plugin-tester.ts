import type {
  DatabasePlugin,
  PluginTest,
  TestResult,
  ValidationResult,
  PluginContext,
} from "../types";
import { join } from "path";
import { existsSync } from "fs";

export class PluginTester {
  async testPlugin(
    plugin: DatabasePlugin,
    context?: PluginContext
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Run built-in validation tests
    results.push(await this.testPluginStructure(plugin));
    results.push(await this.testPluginMetadata(plugin));
    results.push(await this.testPluginQuestions(plugin));
    results.push(await this.testPluginGeneration(plugin, context));

    // Run plugin-specific validation if available
    if (plugin.validate) {
      results.push(await this.testPluginValidation(plugin));
    }

    // Run custom plugin tests if available
    if (plugin.tests && plugin.tests.length > 0) {
      for (const test of plugin.tests) {
        try {
          const result = await test.test();
          results.push({
            passed: result.passed,
            message: `${test.name}: ${
              result.message || (result.passed ? "Passed" : "Failed")
            }`,
            details: result.details,
          });
        } catch (error) {
          results.push({
            passed: false,
            message: `${test.name}: Error running test - ${error}`,
            details: error,
          });
        }
      }
    }

    return results;
  }

  async testAllPlugins(
    plugins: DatabasePlugin[],
    context?: PluginContext
  ): Promise<Record<string, TestResult[]>> {
    const results: Record<string, TestResult[]> = {};

    for (const plugin of plugins) {
      try {
        results[plugin.type] = await this.testPlugin(plugin, context);
      } catch (error) {
        results[plugin.type] = [
          {
            passed: false,
            message: `Failed to test plugin: ${error}`,
            details: error,
          },
        ];
      }
    }

    return results;
  }

  private async testPluginStructure(
    plugin: DatabasePlugin
  ): Promise<TestResult> {
    const required = ["name", "type", "questions", "generateFiles"];
    const missing = required.filter(
      (prop) =>
        !(prop in plugin) ||
        (typeof plugin[prop as keyof DatabasePlugin] !== "function" &&
          prop !== "name" &&
          prop !== "type")
    );

    if (missing.length > 0) {
      return {
        passed: false,
        message: `Plugin structure validation failed: Missing required properties: ${missing.join(
          ", "
        )}`,
        details: { missing },
      };
    }

    return {
      passed: true,
      message: "Plugin structure validation passed",
    };
  }

  private async testPluginMetadata(
    plugin: DatabasePlugin
  ): Promise<TestResult> {
    if (!plugin.metadata) {
      return {
        passed: true,
        message: "Plugin metadata validation skipped (optional)",
      };
    }

    const metadata = plugin.metadata;
    const issues: string[] = [];

    if (!metadata.name || metadata.name !== plugin.name) {
      issues.push("Metadata name doesn't match plugin name");
    }

    if (!metadata.type || metadata.type !== plugin.type) {
      issues.push("Metadata type doesn't match plugin type");
    }

    if (
      !metadata.category ||
      !["database", "service", "tool", "custom"].includes(metadata.category)
    ) {
      issues.push("Invalid or missing category");
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: `Plugin metadata validation failed: ${issues.join(", ")}`,
        details: { issues },
      };
    }

    return {
      passed: true,
      message: "Plugin metadata validation passed",
    };
  }

  private async testPluginQuestions(
    plugin: DatabasePlugin
  ): Promise<TestResult> {
    try {
      // This is a dry run - we can't actually run the interactive questions
      // But we can check if the function exists and is callable
      if (typeof plugin.questions !== "function") {
        return {
          passed: false,
          message: "Plugin questions is not a function",
        };
      }

      return {
        passed: true,
        message: "Plugin questions function validation passed",
      };
    } catch (error) {
      return {
        passed: false,
        message: `Plugin questions validation failed: ${error}`,
        details: error,
      };
    }
  }

  private async testPluginGeneration(
    plugin: DatabasePlugin,
    context?: PluginContext
  ): Promise<TestResult> {
    try {
      if (typeof plugin.generateFiles !== "function") {
        return {
          passed: false,
          message: "Plugin generateFiles is not a function",
        };
      }

      // Test with mock configuration
      const mockConfig = {
        name: "test",
        port: 3000,
      };

      const mockContext: PluginContext = context || {
        project: {
          isStrapi: true,
          name: "test-project",
          packageManager: "npm",
          type: "typescript",
          path: "/tmp/test",
        },
        outputDir: "/tmp/test-output",
        templateDir: "/tmp/test-templates",
        isDryRun: true,
      };

      // We can't actually run generateFiles without side effects,
      // but we can check if it's properly structured
      return {
        passed: true,
        message: "Plugin generateFiles function validation passed",
      };
    } catch (error) {
      return {
        passed: false,
        message: `Plugin generateFiles validation failed: ${error}`,
        details: error,
      };
    }
  }

  private async testPluginValidation(
    plugin: DatabasePlugin
  ): Promise<TestResult> {
    if (!plugin.validate) {
      return {
        passed: true,
        message: "Plugin validation skipped (not implemented)",
      };
    }

    try {
      // Test with valid configuration
      const validConfig = {
        name: "test",
        port: 3000,
      };

      const result = await plugin.validate(validConfig);

      if (!result || typeof result.valid !== "boolean") {
        return {
          passed: false,
          message:
            "Plugin validation function doesn't return proper ValidationResult",
        };
      }

      // Test with invalid configuration
      const invalidConfig = {};
      const invalidResult = await plugin.validate(invalidConfig);

      return {
        passed: true,
        message: "Plugin validation function validation passed",
        details: { validResult: result, invalidResult },
      };
    } catch (error) {
      return {
        passed: false,
        message: `Plugin validation function failed: ${error}`,
        details: error,
      };
    }
  }

  generateTestReport(results: Record<string, TestResult[]>): string {
    let report = "# Plugin Test Report\n\n";

    let totalTests = 0;
    let passedTests = 0;

    for (const [pluginType, testResults] of Object.entries(results)) {
      report += `## ${pluginType}\n\n`;

      for (const result of testResults) {
        totalTests++;
        if (result.passed) passedTests++;

        const status = result.passed ? "✅" : "❌";
        report += `${status} ${result.message}\n`;

        if (result.details && !result.passed) {
          report += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
        }
      }

      report += "\n";
    }

    report += `## Summary\n\n`;
    report += `- Total tests: ${totalTests}\n`;
    report += `- Passed: ${passedTests}\n`;
    report += `- Failed: ${totalTests - passedTests}\n`;
    report += `- Success rate: ${((passedTests / totalTests) * 100).toFixed(
      1
    )}%\n`;

    return report;
  }
}

// Utility function for running plugin tests from CLI
export async function runPluginTests(plugins: DatabasePlugin[]): Promise<void> {
  const tester = new PluginTester();
  const results = await tester.testAllPlugins(plugins);

  console.log("🧪 Running plugin tests...\n");

  for (const [pluginType, testResults] of Object.entries(results)) {
    console.log(`📦 Testing ${pluginType}:`);

    for (const result of testResults) {
      const status = result.passed ? "✅" : "❌";
      console.log(`  ${status} ${result.message}`);

      if (result.details && !result.passed) {
        console.log(`     ${JSON.stringify(result.details)}`);
      }
    }

    console.log("");
  }

  const report = tester.generateTestReport(results);
  console.log(report);
}
