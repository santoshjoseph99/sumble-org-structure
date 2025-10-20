import { describe, it, expect } from 'vitest';
import { processOrgData } from './process-org-data';

describe('processOrgData', () => {
  describe('prefix grouping', () => {
    it('should group keys with common prefixes', () => {
      const input = {
        'AIML Infrastructure Teams': {},
        'AIML Data Platform': {},
        'AIML Engineering Efficiency': {},
        'AIML Search Infrastructure': {},
        'Design System': {},
      };

      const result = processOrgData(input);

      // Should have AIML as a top-level group
      expect(result).toHaveProperty('AIML');

      // AIML should contain the suffixes as children
      const aiml = result?.['AIML'];
      expect(Object.keys(aiml || {})).toContain('Infrastructure Teams');
      expect(Object.keys(aiml || {})).toContain('Data Platform');
      expect(Object.keys(aiml || {})).toContain('Engineering Efficiency');
      expect(Object.keys(aiml || {})).toContain('Search Infrastructure');

      // Design System should remain at top level (not part of AIML group)
      expect(result).toHaveProperty('Design System');
    });

    it('should only group when there are at least 3 items with common prefix', () => {
      const input = {
        'Frontend Development': {},
        'Frontend Design': {},
        'Backend Services': {},
      };

      const result = processOrgData(input);

      // Should not create Frontend group (only 2 items)
      expect(result).not.toHaveProperty('Frontend');
      expect(result).toHaveProperty('Frontend Development');
      expect(result).toHaveProperty('Frontend Design');
    });

    it('should handle AI/ML prefix variations', () => {
      const input = {
        'AI/ML End User Products PM': {},
        'AI/ML Global Product Experience': {},
        'AI/ML Instrumentation Platform': {},
        'AI/ML Machine Learning Platform': {},
      };

      const result = processOrgData(input);

      // Should group under AI/ML
      expect(result).toHaveProperty('AI/ML');

      const aiml = result?.['AI/ML'];
      expect(Object.keys(aiml || {}).length).toBeGreaterThanOrEqual(4);
    });

    it('should not group items with no common prefix', () => {
      const input = {
        'Engineering': {},
        'Design': {},
        'Product': {},
      };

      const result = processOrgData(input);

      // Should remain ungrouped
      expect(Object.keys(result || {})).toHaveLength(3);
      expect(result).toHaveProperty('Engineering');
      expect(result).toHaveProperty('Design');
      expect(result).toHaveProperty('Product');
    });
  });

  describe('deduplication', () => {
    it('should merge similar keys with different punctuation', () => {
      const input = {
        '3D Visual Merchandising': {
          'Child A': {},
        },
        '3D/Visual Merchandising': {
          'Child B': {},
        },
      };

      const result = processOrgData(input);

      // Should have only one key (the similar ones merged)
      expect(Object.keys(result || {})).toHaveLength(1);

      // Should preserve all children
      const firstKey = Object.keys(result || {})[0];
      expect(Object.keys(result?.[firstKey] || {})).toContain('Child A');
      expect(Object.keys(result?.[firstKey] || {})).toContain('Child B');
    });

    it('should merge the 3D Visual Merchandising variants', () => {
      const input = {
        '3D Visual Merchandising': {},
        '3D Visual Merchandising Design': {},
        '3d/visual Merchandising Design': {},
      };

      const result = processOrgData(input);

      // Should have only one merged key
      expect(Object.keys(result || {})).toHaveLength(1);

      // Should choose the longest, most descriptive name
      const mergedKey = Object.keys(result || {})[0];
      expect(mergedKey.length).toBeGreaterThanOrEqual(29);
    });

    it('should merge children recursively', () => {
      const input = {
        'Engineering Team': {
          'Frontend': {
            'React Team': {},
          },
          'Front-End': {
            'Vue Team': {},
          },
        },
      };

      const result = processOrgData(input);

      // Should have Engineering at top level
      expect(result).toHaveProperty('Engineering');

      // Should have merged Frontend and Front-End
      const engineering = result?.['Engineering'];
      const frontendKeys = Object.keys(engineering || {});

      // Should have only one frontend key (merged)
      expect(frontendKeys).toHaveLength(1);

      // Should have both React and Vue teams
      const frontend = engineering?.[frontendKeys[0]];
      expect(Object.keys(frontend || {})).toContain('React');
      expect(Object.keys(frontend || {})).toContain('Vue');
    });

    it('should not merge completely different names', () => {
      const input = {
        'Engineering': {},
        'Design': {},
        'Product': {},
      };

      const result = processOrgData(input);

      // Should keep all three separate
      expect(Object.keys(result || {})).toHaveLength(3);
      expect(result).toHaveProperty('Engineering');
      expect(result).toHaveProperty('Design');
      expect(result).toHaveProperty('Product');
    });

    it('should handle exact duplicate keys from cleanTeamName', () => {
      const input = {
        'Engineering Team': {},
        'Engineering Group': {},
        'Engineering Org': {},
      };

      const result = processOrgData(input);

      // All should be cleaned to "Engineering" and merged
      expect(Object.keys(result || {})).toHaveLength(1);
      expect(result).toHaveProperty('Engineering');
    });
  });

  describe('cleaning', () => {
    it('should remove junk keys', () => {
      const input = {
        'Valid Team': {},
        ')': {},
        's': {},
        ',,': {},
      };

      const result = processOrgData(input);

      // Should only have the valid key
      expect(Object.keys(result || {})).toHaveLength(1);
      expect(result).toHaveProperty('Valid');
    });

    it('should clean and normalize names', () => {
      const input = {
        'Engineering Team,': {},
        'Design Group (DG)': {},
      };

      const result = processOrgData(input);

      expect(result).toHaveProperty('Engineering');
      expect(result).toHaveProperty('Design');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = processOrgData({});
      expect(result).toEqual({});
    });

    it('should handle deeply nested structure', () => {
      const input = {
        'Level 1 Team': {
          'Level 2 Group': {
            'Level 3 Org': {},
          },
        },
      };

      const result = processOrgData(input);

      expect(result).toHaveProperty('Level 1');
      expect(result?.['Level 1']).toHaveProperty('Level 2');
      expect(result?.['Level 1']?.['Level 2']).toHaveProperty('Level 3');
    });

    it('should preserve empty children objects', () => {
      const input = {
        'Engineering': {},
      };

      const result = processOrgData(input);

      expect(result).toHaveProperty('Engineering');
      expect(result?.['Engineering']).toEqual({});
    });
  });
});
