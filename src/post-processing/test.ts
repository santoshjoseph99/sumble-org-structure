import orgData from './org_structure.json';

import {processOrgData} from './process-org-data';

const cleanedOrgData = processOrgData(orgData);

console.log(cleanedOrgData);
