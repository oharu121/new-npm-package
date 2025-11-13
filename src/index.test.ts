import { describe, it, expect } from 'vitest';

/**
 * Helper function to validate package name according to npm rules
 */
function validatePackageName(name: string): string | undefined {
  if (!name) return 'Package name is required';
  if (name.length > 214) {
    return `Package name must be 214 characters or less`;
  }

  // Check for scoped package
  const scopedPackagePattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  if (!scopedPackagePattern.test(name)) {
    return 'Package name must be lowercase and can only contain letters, numbers, hyphens, underscores, and @/ for scoped packages';
  }

  // Reserved names
  const reserved = ['node_modules', 'favicon.ico'];
  if (reserved.includes(name)) {
    return `"${name}" is a reserved package name`;
  }

  return undefined;
}

describe('validatePackageName', () => {
  describe('valid names', () => {
    it('should accept simple lowercase names', () => {
      expect(validatePackageName('my-package')).toBeUndefined();
      expect(validatePackageName('package')).toBeUndefined();
      expect(validatePackageName('my-awesome-package')).toBeUndefined();
    });

    it('should accept names with numbers', () => {
      expect(validatePackageName('package123')).toBeUndefined();
      expect(validatePackageName('my-package-v2')).toBeUndefined();
    });

    it('should accept names with underscores', () => {
      expect(validatePackageName('my_package')).toBeUndefined();
      expect(validatePackageName('my_awesome_package')).toBeUndefined();
    });

    it('should accept scoped packages', () => {
      expect(validatePackageName('@scope/package')).toBeUndefined();
      expect(validatePackageName('@my-org/my-package')).toBeUndefined();
      expect(validatePackageName('@user/package-name')).toBeUndefined();
    });

    it('should accept names with dots', () => {
      expect(validatePackageName('my.package')).toBeUndefined();
      expect(validatePackageName('@scope/my.package')).toBeUndefined();
    });
  });

  describe('invalid names', () => {
    it('should reject empty names', () => {
      expect(validatePackageName('')).toBe('Package name is required');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(215);
      expect(validatePackageName(longName)).toBe('Package name must be 214 characters or less');
    });

    it('should reject names with uppercase letters', () => {
      expect(validatePackageName('MyPackage')).toContain('must be lowercase');
      expect(validatePackageName('my-Package')).toContain('must be lowercase');
    });

    it('should reject names with spaces', () => {
      expect(validatePackageName('my package')).toContain('must be lowercase');
    });

    it('should reject names with special characters', () => {
      expect(validatePackageName('my-package!')).toContain('must be lowercase');
      expect(validatePackageName('my@package')).toContain('must be lowercase');
      expect(validatePackageName('my#package')).toContain('must be lowercase');
    });

    it('should reject reserved names', () => {
      expect(validatePackageName('node_modules')).toBe('"node_modules" is a reserved package name');
      expect(validatePackageName('favicon.ico')).toBe('"favicon.ico" is a reserved package name');
    });

    it('should reject names starting with dot', () => {
      expect(validatePackageName('.mypackage')).toContain('must be lowercase');
    });

    it('should reject invalid scoped package formats', () => {
      expect(validatePackageName('@/package')).toContain('must be lowercase');
      expect(validatePackageName('@scope/')).toContain('must be lowercase');
      expect(validatePackageName('scope/package')).toContain('must be lowercase');
    });
  });

  describe('edge cases', () => {
    it('should handle names at exactly 214 characters', () => {
      const exactLength = 'a'.repeat(214);
      expect(validatePackageName(exactLength)).toBeUndefined();
    });

    it('should handle scoped packages with multiple dots and hyphens', () => {
      expect(validatePackageName('@my-org/my.awesome.package-name')).toBeUndefined();
    });
  });
});
