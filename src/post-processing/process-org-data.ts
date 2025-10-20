import {cleanTeamName} from './post-process'; // Assuming the path

type OrgNode = {[key: string]: OrgNode};

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
      cleanedNode[cleanedKey] = cleanedChildren;
    }
  }

  // Return null if the node becomes empty after cleaning
  return Object.keys(cleanedNode).length > 0 ? cleanedNode : {};
}
