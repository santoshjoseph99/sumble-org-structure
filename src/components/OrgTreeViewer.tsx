import {useState, useMemo, useEffect} from 'react';
import {ChevronRight, ChevronDown, Building2, Search, X} from 'lucide-react';
import {useDebounce} from '../hooks/useDebounce';

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

// Filter tree nodes based on search term
function filterTreeNodes(nodes: TreeNode[], searchTerm: string): TreeNode[] {
  if (searchTerm === '') return nodes;

  return nodes
    .map((node) => {
      const filteredChildren = filterTreeNodes(node.children, searchTerm);
      const nodeMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Include node if it matches or has matching children
      if (nodeMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter((node): node is TreeNode => node !== null);
}

// Get all node IDs that should be expanded (nodes with matching descendants)
function getExpandedNodeIds(nodes: TreeNode[], searchTerm: string): Set<string> {
  const expandedIds = new Set<string>();

  if (searchTerm === '') return expandedIds;

  function traverse(node: TreeNode): boolean {
    let hasMatchingDescendant = false;

    for (const child of node.children) {
      const childHasMatch = traverse(child);
      if (childHasMatch) {
        hasMatchingDescendant = true;
      }
    }

    const nodeMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (hasMatchingDescendant || nodeMatches) {
      if (node.children.length > 0) {
        expandedIds.add(node.id);
      }
      return true;
    }

    return false;
  }

  nodes.forEach((node) => traverse(node));
  return expandedIds;
}

// Highlight matching text
function highlightMatch(text: string, searchTerm: string) {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-slate-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface OrgTreeViewerProps {
  orgData: OrgNode;
  title?: string;
}

export function OrgTreeViewer({orgData, title = 'Organization Structure'}: OrgTreeViewerProps) {
  const treeNodes = useMemo(() => convertOrgToTreeNodes(orgData), [orgData]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter nodes based on search
  const filteredNodes = useMemo(
    () => filterTreeNodes(treeNodes, debouncedSearch),
    [treeNodes, debouncedSearch]
  );

  // Auto-expand nodes when searching
  useEffect(() => {
    if (debouncedSearch) {
      const idsToExpand = getExpandedNodeIds(treeNodes, debouncedSearch);
      setExpandedIds(idsToExpand);
    }
  }, [debouncedSearch, treeNodes]);

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

  const clearSearch = () => {
    setSearchTerm('');
    setExpandedIds(new Set());
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

          <span className="text-sm text-slate-700 select-none">
            {highlightMatch(node.name, debouncedSearch)}
          </span>

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
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Click to expand and explore the organizational hierarchy
          </p>
        </div>

        {/* Search Box */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search organizations..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {debouncedSearch && (
            <p className="text-xs text-slate-500 mt-2">
              {filteredNodes.length === 0
                ? 'No results found'
                : `Showing ${filteredNodes.length} matching organization${filteredNodes.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <div className="p-2 max-h-[600px] overflow-y-auto">
          {filteredNodes.length === 0 && debouncedSearch ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No organizations found matching "{debouncedSearch}"</p>
              <button
                onClick={clearSearch}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredNodes.map((node) => renderTreeNode(node))
          )}
        </div>
      </div>
    </div>
  );
}
