import { describe, it, expect } from 'vitest';

// Example validation function for testing
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validateStationName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  return name.trim().length > 0 && name.length <= 255;
};

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateStationName', () => {
    it('should validate correct station name', () => {
      expect(validateStationName('Berlin Hauptbahnhof')).toBe(true);
      expect(validateStationName('S-Bahn')).toBe(true);
    });

    it('should reject empty station name', () => {
      expect(validateStationName('')).toBe(false);
      expect(validateStationName('   ')).toBe(false);
    });

    it('should reject station name exceeding max length', () => {
      expect(validateStationName('a'.repeat(256))).toBe(false);
    });
  });
});
