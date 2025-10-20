import {cleanTeamName, areNamesSimilar, chooseCanonicalName} from './post-process';

type OrgNode = {[key: string]: OrgNode};

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

  // Return null if the node becomes empty after cleaning
  return Object.keys(deduplicated).length > 0 ? deduplicated : {};
}
