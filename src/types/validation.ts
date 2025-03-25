export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ValidationRules {
  required?: boolean;
  pattern?: RegExp;
  message?: string;
}

export interface ValidationUtils {
  validateRequired: (value: unknown) => ValidationResult;
  validatePattern: (value: string, pattern: RegExp) => ValidationResult;
}

export interface BaseValidation {
  validateRequired: (value: unknown, fieldName: string) => ValidationResult;
  validatePort: (port: string) => ValidationResult;
}

export interface DatabaseValidation extends BaseValidation {
  validateCharset?: (charset: string) => ValidationResult;
  validateCollation?: (collation: string) => ValidationResult;
  validateSSL?: (sslMode: string) => ValidationResult;
  validateConfig?: (config: Record<string, unknown>) => ValidationResult;
}