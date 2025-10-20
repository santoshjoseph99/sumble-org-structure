import {useState, useMemo, useEffect} from 'react';
import {ChevronRight, ChevronDown, Building2, Search, X, ArrowUpDown} from 'lucide-react';
import {useDebounce} from '../hooks/useDebounce';

type OrgNode = {[key: string]: OrgNode};

export type SortOption = 'none' | 'size' | 'name';

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

// Calculate total size (node count including all descendants)
function calculateNodeSize(node: TreeNode): number {
  let size = 1; // Count the node itself
  for (const child of node.children) {
    size += calculateNodeSize(child);
  }
  return size;
}

// Sort tree nodes based on sort option
function sortTreeNodes(nodes: TreeNode[], sortBy: SortOption): TreeNode[] {
  if (sortBy === 'none') {
    return nodes;
  }

  const sorted = [...nodes];

  if (sortBy === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
    // Recursively sort children
    return sorted.map((node) => ({
      ...node,
      children: sortTreeNodes(node.children, sortBy),
    }));
  }

  if (sortBy === 'size') {
    sorted.sort((a, b) => {
      const sizeA = calculateNodeSize(a);
      const sizeB = calculateNodeSize(b);
      return sizeB - sizeA; // Descending order (largest first)
    });
    // Recursively sort children
    return sorted.map((node) => ({
      ...node,
      children: sortTreeNodes(node.children, sortBy),
    }));
  }

  return sorted;
}

interface OrgTreeViewerProps {
  orgData: OrgNode;
  title?: string;
}

export function OrgTreeViewer({orgData, title = 'Organization Structure'}: OrgTreeViewerProps) {
  const treeNodes = useMemo(() => convertOrgToTreeNodes(orgData), [orgData]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter and sort nodes
  const filteredAndSortedNodes = useMemo(() => {
    const filtered = filterTreeNodes(treeNodes, debouncedSearch);
    return sortTreeNodes(filtered, sortBy);
  }, [treeNodes, debouncedSearch, sortBy]);

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
    const nodeSize = sortBy === 'size' ? calculateNodeSize(node) : null;

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

          <div className="ml-auto flex items-center gap-2">
            {sortBy === 'size' && nodeSize !== null && (
              <span className="text-xs text-blue-600 font-medium" title="Total organization size">
                {nodeSize}
              </span>
            )}
            {hasChildren && (
              <span className="text-xs text-slate-400">{node.children.length}</span>
            )}
          </div>
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

        {/* Search and Sort Controls */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
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

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer hover:border-slate-400 transition-colors"
                aria-label="Sort by"
              >
                <option value="none">Sort: None</option>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {debouncedSearch && (
            <p className="text-xs text-slate-500 mt-2">
              {filteredAndSortedNodes.length === 0
                ? 'No results found'
                : `Showing ${filteredAndSortedNodes.length} matching organization${filteredAndSortedNodes.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <div className="p-2 max-h-[600px] overflow-y-auto">
          {filteredAndSortedNodes.length === 0 && debouncedSearch ? (
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
            filteredAndSortedNodes.map((node: TreeNode) => renderTreeNode(node))
          )}
        </div>
      </div>
    </div>
  );
}
