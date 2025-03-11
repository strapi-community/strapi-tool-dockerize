import crypto from 'crypto';

export interface PasswordOptions {
  length?: number;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  includeUppercase?: boolean;
}

export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    includeNumbers = true,
    includeSymbols = true,
    includeUppercase = true
  } = options;

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let chars = lowercase;
  if (includeNumbers) chars += numbers;
  if (includeSymbols) chars += symbols;
  if (includeUppercase) chars += uppercase;

  let password = '';
  const randomBytes = crypto.randomBytes(length);

  // Ensure at least one character from each required set
  if (includeNumbers) {
    password += numbers[randomBytes[0] % numbers.length];
  }
  if (includeSymbols) {
    password += symbols[randomBytes[1] % symbols.length];
  }
  if (includeUppercase) {
    password += uppercase[randomBytes[2] % uppercase.length];
  }
  password += lowercase[randomBytes[3] % lowercase.length];

  // Fill the rest randomly
  while (password.length < length) {
    const randomByte = randomBytes[password.length];
    password += chars[randomByte % chars.length];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSymbols) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, numbers, and symbols'
    };
  }

  return { isValid: true };
} 