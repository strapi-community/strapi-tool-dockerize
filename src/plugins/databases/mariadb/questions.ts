import { text, select, password } from "@clack/prompts";

export async function questions() {
  const dbName = await text({
    message: "Database name (press Enter for default):",
    placeholder: "strapi",
    defaultValue: "strapi",
    validate: (value) => {
      const val = value || "strapi";
      if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
        return "Database name can only contain letters, numbers, underscores and hyphens";
      }
    },
  });

  const dbUser = await text({
    message: "Database user (press Enter for default):",
    placeholder: "strapi",
    defaultValue: "strapi",
    validate: (value) => {
      const val = value || "strapi";
      if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
        return "Username can only contain letters, numbers, underscores and hyphens";
      }
    },
  });

  const passwordType = await select({
    message: "How would you like to set the database password?",
    options: [
      {
        value: "generate",
        label: "Generate secure password",
        hint: "Recommended",
      },
      { value: "custom", label: "Enter custom password" },
    ],
  });

  let dbPassword: string;
  if (passwordType === "custom") {
    dbPassword = (await password({
      message: "Database password:",
      validate: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8)
          return "Password must be at least 8 characters long";
      },
    })) as string;
  } else {
    dbPassword = generateSecurePassword();
    console.log(`🔐 Generated password: ${dbPassword}`);
  }

  const dbPort = await text({
    message: "Database port (press Enter for default):",
    placeholder: "3306",
    defaultValue: "3306",
    validate: (value) => {
      const val = value || "3306";
      const port = parseInt(val);
      if (isNaN(port)) return "Port must be a number";
      if (port < 1024 || port > 65535)
        return "Port must be between 1024 and 65535";
    },
  });

  return {
    name: dbName || "strapi",
    user: dbUser || "strapi",
    password: dbPassword,
    port: parseInt((dbPort as string) || "3306"),
    host: "localhost",
  };
}

function generateSecurePassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
