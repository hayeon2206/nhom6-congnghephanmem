import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(rawPassword, SALT_ROUNDS);
}

export function verifyPassword(rawPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawPassword, hash);
}
