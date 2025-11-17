import { randomBytes } from 'crypto';

/**
 * Generates a unique identifier (UID)
 * @param length - The length of the UID (default: 16)
 * @returns A random UID string
 */
export function generateUID(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a shorter alphanumeric UID
 * @param length - The length of the UID (default: 8)
 * @returns A random alphanumeric UID string
 */
export function generateShortUID(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generates a UUID v4
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
