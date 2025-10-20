import { OrgTreeViewer } from './components/OrgTreeViewer'
import orgData from './post-processing/org_structure.json'
import { processOrgData } from './post-processing/process-org-data'
import './App.css'

function App() {
  const cleanedOrgData = processOrgData(orgData)

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <OrgTreeViewer orgData={cleanedOrgData || {}} title="Apple Organization Structure" />
    </div>
  )
}

export default App
