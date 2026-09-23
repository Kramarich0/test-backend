import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  return await compare(password, hashString);
}
