import { describe, it, expect } from 'vitest';
import { cleanTeamName } from './post-process';

describe('cleanTeamName', () => {
  describe('basic cleaning', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(cleanTeamName('  Engineering Team  ')).toBe('Engineering');
      expect(cleanTeamName('\tData Team\n')).toBe('Data');
    });

    it('should normalize unicode apostrophes', () => {
      expect(cleanTeamName('Apple\u2019s Team')).toBe('Apple');
    });

    it('should remove trailing punctuation', () => {
      expect(cleanTeamName('Engineering Team,')).toBe('Engineering');
      expect(cleanTeamName('Data Group.')).toBe('Data');
      expect(cleanTeamName('Design Team!)')).toBe('Design');
    });

    it('should remove trailing "\'s"', () => {
      expect(cleanTeamName('Apple\'s Engineering')).toBe('Apple\'s Engineering');
      expect(cleanTeamName('Company\'s')).toBe('Company');
    });
  });

  describe('junk filtering', () => {
    it('should return null for single character junk', () => {
      expect(cleanTeamName('s')).toBeNull();
      expect(cleanTeamName(')')).toBeNull();
      expect(cleanTeamName(',')).toBeNull();
    });

    it('should return null for two character non-alphanumeric junk', () => {
      expect(cleanTeamName('),')).toBeNull();
      expect(cleanTeamName('..')).toBeNull();
    });

    it('should allow valid two-letter acronyms', () => {
      expect(cleanTeamName('AI')).toBe('AI');
      expect(cleanTeamName('ML')).toBe('ML');
      expect(cleanTeamName('3D')).toBe('3D');
    });

    it('should return null for empty strings after cleaning', () => {
      expect(cleanTeamName('   ')).toBeNull();
      expect(cleanTeamName('...')).toBeNull();
    });
  });

  describe('suffix removal', () => {
    it('should remove "team" suffix', () => {
      expect(cleanTeamName('Engineering Team')).toBe('Engineering');
      expect(cleanTeamName('Data TEAM')).toBe('Data');
    });

    it('should remove "group" suffix', () => {
      expect(cleanTeamName('Silicon Technologies Group')).toBe('Silicon Technologies');
      expect(cleanTeamName('Hardware group')).toBe('Hardware');
    });

    it('should remove "org" and "organization" suffix', () => {
      expect(cleanTeamName('Marketing Org')).toBe('Marketing');
      expect(cleanTeamName('Sales Organization')).toBe('Sales');
    });

    it('should remove "department" suffix', () => {
      expect(cleanTeamName('IT Department')).toBe('IT');
    });

    it('should remove "division" suffix', () => {
      expect(cleanTeamName('Cloud Division')).toBe('Cloud');
    });
  });

  describe('acronym removal', () => {
    it('should remove trailing acronyms in parentheses', () => {
      expect(cleanTeamName('Technology Development Group (TDG)')).toBe('Technology Development');
      expect(cleanTeamName('Silicon Engineering Group (SEG)')).toBe('Silicon Engineering');
    });

    it('should handle acronyms with ampersands', () => {
      expect(cleanTeamName('Research & Development (R&D)')).toBe('Research & Development');
    });
  });

  describe('title case conversion', () => {
    it('should convert to title case', () => {
      expect(cleanTeamName('engineering team')).toBe('Engineering');
      expect(cleanTeamName('data science group')).toBe('Data Science');
    });

    it('should preserve all-caps acronyms', () => {
      expect(cleanTeamName('GPU Design Team')).toBe('GPU Design');
      expect(cleanTeamName('SOC Engineering Group')).toBe('SOC Engineering');
      expect(cleanTeamName('CAD team')).toBe('CAD');
    });

    it('should handle mixed case correctly', () => {
      expect(cleanTeamName('iPhone Software Team')).toBe('Iphone Software');
      expect(cleanTeamName('iOS Development')).toBe('Ios Development');
    });
  });

  describe('complex real-world examples', () => {
    it('should handle complex organization names', () => {
      expect(cleanTeamName('Technology Development Group (TDG),')).toBe('Technology Development');
      expect(cleanTeamName('Apple Silicon GPU Driver Scheduler Team')).toBe('Apple Silicon GPU Driver Scheduler');
      expect(cleanTeamName('Human Interface design team')).toBe('Human Interface Design');
    });

    it('should handle multiple transformations', () => {
      expect(cleanTeamName('  GPU Performance Analysis team,  ')).toBe('GPU Performance Analysis');
      expect(cleanTeamName('Silicon Engineering Group (SEG)\'s')).toBe('Silicon Engineering');
    });

    it('should handle edge cases from org_structure.json', () => {
      expect(cleanTeamName('Technology Development Group (TDG),')).toBe('Technology Development');
      expect(cleanTeamName('),')).toBeNull();
      expect(cleanTeamName('human')).toBe('Human');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(cleanTeamName('')).toBeNull();
    });

    it('should handle strings with only special characters', () => {
      expect(cleanTeamName('!!!')).toBeNull();
      expect(cleanTeamName('...')).toBeNull();
    });

    it('should preserve names without suffixes', () => {
      expect(cleanTeamName('Apple')).toBe('Apple');
      expect(cleanTeamName('Silicon')).toBe('Silicon');
    });

    it('should handle multiple spaces', () => {
      expect(cleanTeamName('Engineering   Team')).toBe('Engineering');
    });
  });
});
