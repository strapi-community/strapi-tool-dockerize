export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface BaseValidation {
  validateRequired: (value: any, fieldName: string) => ValidationResult;
  validatePort: (port: string) => ValidationResult;
}

export interface DatabaseValidation extends BaseValidation {
  validateCharset?: (charset: string) => ValidationResult;
  validateCollation?: (collation: string) => ValidationResult;
  validateSSL?: (sslMode: string) => ValidationResult;
  validateConfig?: (config: Record<string, any>) => ValidationResult;
}