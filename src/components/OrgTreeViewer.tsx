import {useTree} from '@headless-tree/react';
import {useState} from 'react';
import {ChevronRight, ChevronDown, Building2} from 'lucide-react';

type OrgNode = {[key: string]: OrgNode};

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}

// Convert nested org structure to flat tree format
function convertOrgToTreeNodes(orgData: OrgNode, parentId: string = 'root'): TreeNode[] {
  return Object.entries(orgData).map(([name, children], index) => {
    const id = `${parentId}-${index}`;
    return {
      id,
      name,
      children: convertOrgToTreeNodes(children, id),
    };
  });
}

interface OrgTreeViewerProps {
  orgData: OrgNode;
}

export function OrgTreeViewer({orgData}: OrgTreeViewerProps) {
  const treeNodes = convertOrgToTreeNodes(orgData);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const paddingLeft = depth * 20;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 hover:bg-slate-50 cursor-pointer
            rounded-md transition-colors duration-150
            ${isExpanded ? 'bg-slate-50' : ''}
          `}
          style={{paddingLeft: `${paddingLeft + 12}px`}}
          onClick={() => hasChildren && toggleExpand(node.id)}
        >
          {hasChildren ? (
            <button className="flex items-center justify-center w-5 h-5 hover:bg-slate-200 rounded transition-colors">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          ) : (
            <span className="w-5 h-5" />
          )}

          <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />

          <span className="text-sm text-slate-700 select-none">{node.name}</span>

          {hasChildren && (
            <span className="ml-auto text-xs text-slate-400">{node.children.length}</span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Apple Organization Structure</h2>
          <p className="text-sm text-slate-600 mt-1">
            Click to expand and explore the organizational hierarchy
          </p>
        </div>

        <div className="p-2 max-h-[600px] overflow-y-auto">
          {treeNodes.map((node) => renderTreeNode(node))}
        </div>
      </div>
    </div>
  );
}
