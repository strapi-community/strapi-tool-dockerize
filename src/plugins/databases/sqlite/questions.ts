import { text, confirm } from "@clack/prompts";

export async function questions(defaults?: {
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseHost?: string;
  databasePort?: number;
}) {
  const dbFile = await text({
    message: "SQLite database file path (press Enter for default):",
    placeholder: defaults?.databaseName || ".tmp/data.db",
    defaultValue: defaults?.databaseName || ".tmp/data.db",
    validate: (value) => {
      // Use the provided value or fall back to default
      const val = value || defaults?.databaseName || ".tmp/data.db";

      // Only validate if there's actually a value
      if (val && !val.includes(".db")) {
        return "Database file should have .db extension";
      }

      // Accept empty values as they'll use the default
      return undefined;
    },
  });

  const createBackup = await confirm({
    message: "Create backup directory structure?",
    initialValue: true,
  });

  return {
    filename: dbFile || defaults?.databaseName || ".tmp/data.db",
    createBackup,
    // SQLite doesn't need host/port/user/password but include for consistency
    host: defaults?.databaseHost || "localhost",
    port: defaults?.databasePort || 0,
    name: dbFile || defaults?.databaseName || ".tmp/data.db", // Add name for consistency
  };
}
