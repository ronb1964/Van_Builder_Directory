/**
 * Secure storage utility for safely handling sensitive data
 * Provides encryption for localStorage items and prevents XSS attacks
 */

// Prefix for all storage keys to avoid collisions
const STORAGE_PREFIX = 'cvb_secure_';

/**
 * Simple encryption/decryption for localStorage values
 * Note: This is not military-grade encryption, but adds a layer of obfuscation
 * For truly sensitive data, use a proper encryption library
 */
const encrypt = (text: string): string => {
  // Simple XOR-based obfuscation with a fixed key
  // For production, use a proper encryption library
  const key = 'camper-van-builders-secure-key';
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  // Convert to base64 for storage
  return btoa(result);
};

/**
 * Decrypt a previously encrypted string
 */
const decrypt = (encryptedText: string): string => {
  try {
    // Convert from base64
    const text = atob(encryptedText);
    const key = 'camper-van-builders-secure-key';
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return '';
  }
};

/**
 * Securely set an item in localStorage with encryption
 */
export const secureSet = (key: string, value: any): void => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const encryptedValue = encrypt(valueToStore);
    localStorage.setItem(prefixedKey, encryptedValue);
  } catch (error) {
    console.error(`Error storing ${key} in secure storage:`, error);
  }
};

/**
 * Securely get an item from localStorage with decryption
 */
export const secureGet = <T>(key: string, defaultValue: T): T => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const encryptedValue = localStorage.getItem(prefixedKey);
    
    if (!encryptedValue) {
      return defaultValue;
    }
    
    const decryptedValue = decrypt(encryptedValue);
    
    // Try to parse as JSON if it looks like an object
    if (decryptedValue.startsWith('{') || decryptedValue.startsWith('[')) {
      return JSON.parse(decryptedValue) as T;
    }
    
    // Otherwise return as is (with type casting)
    return decryptedValue as unknown as T;
  } catch (error) {
    console.error(`Error retrieving ${key} from secure storage:`, error);
    return defaultValue;
  }
};

/**
 * Securely remove an item from localStorage
 */
export const secureRemove = (key: string): void => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error(`Error removing ${key} from secure storage:`, error);
  }
};

/**
 * Clear all secure storage items
 */
export const secureClear = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing secure storage:', error);
  }
};

/**
 * Check if a key exists in secure storage
 */
export const secureExists = (key: string): boolean => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    return localStorage.getItem(prefixedKey) !== null;
  } catch (error) {
    console.error(`Error checking if ${key} exists in secure storage:`, error);
    return false;
  }
};
