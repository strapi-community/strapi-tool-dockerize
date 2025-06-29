/**
 * Security utility functions
 * Consolidates password generation and other security-related functions
 */

/**
 * Generate a cryptographically secure random string
 */
export function generateRandomString(length: number = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a secure password with special characters
 */
export function generateSecurePassword(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate secure database defaults
 */
export function generateSecureDefaults() {
  return {
    databaseName: `strapi_${generateRandomString(8)}`,
    databaseUser: `strapi_${generateRandomString(8)}`,
    databasePassword: generateSecurePassword(),
  };
}

/**
 * Generate cryptographically secure secrets for Docker/Strapi (legacy format for file-writer)
 */
export function generateSecrets() {
  const generateSecret = (length: number = 64): string => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  return {
    jwt: generateSecret(64),
    adminJwt: generateSecret(64),
    appKeys: `${generateSecret(32)},${generateSecret(32)},${generateSecret(
      32
    )},${generateSecret(32)}`,
  };
}

/**
 * Generate comprehensive secrets for modern Strapi applications
 */
export function generateModernSecrets() {
  return {
    appKeys: Array.from({ length: 4 }, () => generateRandomString(32)),
    apiTokenSalt: generateRandomString(32),
    adminJwtSecret: generateRandomString(32),
    transferTokenSalt: generateRandomString(32),
    jwtSecret: generateRandomString(32),
  };
}
