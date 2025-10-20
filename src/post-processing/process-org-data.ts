import {cleanTeamName, areNamesSimilar, chooseCanonicalName} from './post-process';

type OrgNode = {[key: string]: OrgNode};

// Find the longest common prefix among a group of strings
function findLongestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return '';

  // Sort strings to compare first and last (they'll be most different)
  const sorted = [...strings].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  let i = 0;
  while (i < first.length && first[i] === last[i]) {
    i++;
  }

  const prefix = first.substring(0, i).trim();

  // Only return prefix if it's meaningful (at least 2 chars)
  if (prefix.length >= 2) {
    // Check if the next character after prefix (if exists) is a space
    if (i < first.length && first[i] === ' ') {
      return prefix;
    }

    // Check if it ends at a word boundary (space, slash, dash)
    const lastChar = prefix[prefix.length - 1];
    if (lastChar === ' ' || lastChar === '/' || lastChar === '-') {
      return prefix.trim();
    }

    // If prefix is all caps or a known acronym pattern, accept it
    if (/^[A-Z0-9/]+$/.test(prefix)) {
      return prefix;
    }

    // If not at boundary, try to find the last word boundary
    const lastSpace = prefix.lastIndexOf(' ');
    const lastSlash = prefix.lastIndexOf('/');
    const lastDash = prefix.lastIndexOf('-');
    const lastBoundary = Math.max(lastSpace, lastSlash, lastDash);
    if (lastBoundary > 0) {
      return prefix.substring(0, lastBoundary + 1).trim();
    }
  }

  return '';
}

// Group nodes by common prefix
function groupByPrefix(node: OrgNode, minGroupSize: number = 3): OrgNode {
  const keys = Object.keys(node);
  if (keys.length < minGroupSize) return node;

  // Find groups of keys with common prefixes
  const prefixGroups: Map<string, string[]> = new Map();
  const ungrouped: string[] = [];

  for (const key of keys) {
    let foundGroup = false;

    // Check existing prefix groups
    for (const [prefix, group] of prefixGroups.entries()) {
      if (key.startsWith(prefix)) {
        group.push(key);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      // Try to find other keys with the same prefix
      const potentialGroup = keys.filter(k => {
        if (k === key) return true;
        const prefix = findLongestCommonPrefix([key, k]);
        return prefix.length >= 3 && k.startsWith(prefix);
      });

      if (potentialGroup.length >= minGroupSize) {
        const prefix = findLongestCommonPrefix(potentialGroup);
        if (prefix && !prefixGroups.has(prefix)) {
          prefixGroups.set(prefix, potentialGroup);
          foundGroup = true;
        }
      }

      if (!foundGroup) {
        ungrouped.push(key);
      }
    }
  }

  // Build the new structure
  const result: OrgNode = {};

  // Add grouped items
  for (const [prefix, group] of prefixGroups.entries()) {
    if (group.length >= minGroupSize) {
      const groupedChildren: OrgNode = {};

      for (const key of group) {
        // Remove the prefix from the key name
        let childName = key.substring(prefix.length).trim();

        // If the child name is empty or too short, use the full key
        if (childName.length < 2) {
          childName = key;
        }

        // Recursively group children
        groupedChildren[childName] = groupByPrefix(node[key], minGroupSize);
      }

      result[prefix.trim()] = groupByPrefix(groupedChildren, minGroupSize);
    } else {
      // If group is too small, add items ungrouped
      group.forEach(key => ungrouped.push(key));
    }
  }

  // Add ungrouped items
  for (const key of ungrouped) {
    result[key] = groupByPrefix(node[key], minGroupSize);
  }

  return result;
}

// Merge children from similar keys into a single canonical key
function deduplicateSimilarKeys(node: OrgNode): OrgNode {
  const keys = Object.keys(node);
  if (keys.length === 0) return node;

  const deduplicated: OrgNode = {};
  const processed = new Set<string>();

  for (const key of keys) {
    if (processed.has(key)) continue;

    // Find all similar keys
    const similarKeys = [key];
    for (const otherKey of keys) {
      if (key !== otherKey && !processed.has(otherKey) && areNamesSimilar(key, otherKey)) {
        similarKeys.push(otherKey);
        processed.add(otherKey);
      }
    }

    processed.add(key);

    // Choose the canonical name (prefer longer, more descriptive names)
    const canonicalName = chooseCanonicalName(similarKeys);

    // Merge all children from similar keys
    const mergedChildren: OrgNode = {};
    for (const similarKey of similarKeys) {
      const children = node[similarKey];
      // Merge children objects
      Object.assign(mergedChildren, children);
    }

    // Recursively deduplicate children
    deduplicated[canonicalName] = deduplicateSimilarKeys(mergedChildren);
  }

  return deduplicated;
}

export function processOrgData(node: OrgNode): OrgNode | null {
  const cleanedNode: OrgNode = {};

  for (const key in node) {
    const cleanedKey = cleanTeamName(key);

    // Skip junk keys
    if (cleanedKey === null) {
      continue;
    }

    const children = node[key];
    const cleanedChildren = processOrgData(children);

    // Only add the node if it has a valid name
    if (cleanedChildren) {
      // If this key already exists, merge the children
      if (cleanedNode[cleanedKey]) {
        Object.assign(cleanedNode[cleanedKey], cleanedChildren);
      } else {
        cleanedNode[cleanedKey] = cleanedChildren;
      }
    }
  }

  // Deduplicate similar keys after cleaning
  const deduplicated = deduplicateSimilarKeys(cleanedNode);

  // Group by common prefix to create hierarchy
  const grouped = groupByPrefix(deduplicated, 3);

  // Return null if the node becomes empty after cleaning
  return Object.keys(grouped).length > 0 ? grouped : {};
}
