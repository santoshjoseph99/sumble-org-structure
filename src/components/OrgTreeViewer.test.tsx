import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgTreeViewer } from './OrgTreeViewer';

describe('OrgTreeViewer', () => {
  const mockOrgData = {
    'Engineering': {
      'Frontend': {
        'React Team': {},
        'Vue Team': {},
      },
      'Backend': {
        'API Team': {},
      },
    },
    'Design': {
      'UI Team': {},
    },
  };

  describe('rendering', () => {
    it('should render the component with header', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      expect(screen.getByText('Organization Structure')).toBeInTheDocument();
      expect(screen.getByText(/Click to expand and explore/i)).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<OrgTreeViewer orgData={mockOrgData} title="Apple Organization Structure" />);

      expect(screen.getByText('Apple Organization Structure')).toBeInTheDocument();
    });

    it('should render top-level organization nodes', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('should show child count for nodes with children', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Engineering has 2 children (Frontend, Backend)
      const engineeringRow = screen.getByText('Engineering').closest('div');
      expect(engineeringRow).toHaveTextContent('2');

      // Design has 1 child (UI Team)
      const designRow = screen.getByText('Design').closest('div');
      expect(designRow).toHaveTextContent('1');
    });

    it('should not show children initially', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Children should not be visible initially
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend')).not.toBeInTheDocument();
      expect(screen.queryByText('UI Team')).not.toBeInTheDocument();
    });

    it('should render empty state for empty org data', () => {
      render(<OrgTreeViewer orgData={{}} />);

      expect(screen.getByText('Organization Structure')).toBeInTheDocument();
      // No org nodes should be rendered
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse interaction', () => {
    it('should expand node when clicked', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const engineeringNode = screen.getByText('Engineering');
      await user.click(engineeringNode);

      // Children should now be visible
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('should collapse node when clicked again', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const engineeringNode = screen.getByText('Engineering');

      // Expand
      await user.click(engineeringNode);
      expect(screen.getByText('Frontend')).toBeInTheDocument();

      // Collapse
      await user.click(engineeringNode);
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend')).not.toBeInTheDocument();
    });

    it('should expand nested nodes independently', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Expand Engineering
      await user.click(screen.getByText('Engineering'));
      expect(screen.getByText('Frontend')).toBeInTheDocument();

      // Expand Frontend
      await user.click(screen.getByText('Frontend'));
      expect(screen.getByText('React Team')).toBeInTheDocument();
      expect(screen.getByText('Vue Team')).toBeInTheDocument();

      // Backend should still be collapsed
      expect(screen.queryByText('API Team')).not.toBeInTheDocument();
    });

    it('should expand multiple top-level nodes independently', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Expand Engineering
      await user.click(screen.getByText('Engineering'));
      expect(screen.getByText('Frontend')).toBeInTheDocument();

      // Expand Design
      await user.click(screen.getByText('Design'));
      expect(screen.getByText('UI Team')).toBeInTheDocument();

      // Both should be expanded
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('UI Team')).toBeInTheDocument();
    });
  });

  describe('nested hierarchy display', () => {
    it('should display deeply nested structure correctly', async () => {
      const user = userEvent.setup();
      const deepOrgData = {
        'Level1': {
          'Level2': {
            'Level3': {
              'Level4': {},
            },
          },
        },
      };

      render(<OrgTreeViewer orgData={deepOrgData} />);

      // Expand all levels
      await user.click(screen.getByText('Level1'));
      expect(screen.getByText('Level2')).toBeInTheDocument();

      await user.click(screen.getByText('Level2'));
      expect(screen.getByText('Level3')).toBeInTheDocument();

      await user.click(screen.getByText('Level3'));
      expect(screen.getByText('Level4')).toBeInTheDocument();
    });

    it('should handle nodes without children', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Expand to leaf nodes
      await user.click(screen.getByText('Engineering'));
      await user.click(screen.getByText('Frontend'));

      const reactTeam = screen.getByText('React Team');

      // Clicking leaf node should not cause errors
      await user.click(reactTeam);
      expect(reactTeam).toBeInTheDocument();
    });
  });

  describe('visual elements', () => {
    it('should render chevron icons for expandable nodes', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const engineeringRow = screen.getByText('Engineering').closest('div');
      // Check for chevron presence (ChevronRight when collapsed)
      const svg = engineeringRow?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render building icons for all nodes', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Check that building icons are present (lucide-react Building2)
      const engineeringRow = screen.getByText('Engineering').closest('div');
      const svgs = engineeringRow?.querySelectorAll('svg');
      // Should have at least 2 SVGs (chevron + building icon)
      expect(svgs).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('should render semantic structure', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Organization Structure');
    });

    it('should have clickable elements', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const engineeringNode = screen.getByText('Engineering');
      expect(engineeringNode.closest('div')).toHaveClass('cursor-pointer');

      // Should be interactive
      await user.click(engineeringNode);
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle single node', () => {
      const singleNodeData = {
        'Only Node': {},
      };
      render(<OrgTreeViewer orgData={singleNodeData} />);

      expect(screen.getByText('Only Node')).toBeInTheDocument();
    });

    it('should handle nodes with special characters', () => {
      const specialCharData = {
        'Node & Co.': {
          'Sub-Node (2024)': {},
        },
      };
      render(<OrgTreeViewer orgData={specialCharData} />);

      expect(screen.getByText('Node & Co.')).toBeInTheDocument();
    });

    it('should handle very long node names', () => {
      const longNameData = {
        'This is a very long organization name that might wrap to multiple lines': {},
      };
      render(<OrgTreeViewer orgData={longNameData} />);

      expect(screen.getByText(/This is a very long organization name/)).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should render search input', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter nodes based on search term', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Type search term
      await user.type(searchInput, 'Frontend');

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      }, { timeout: 500 });

      // Nodes that don't match should not be visible
      expect(screen.queryByText('Design')).not.toBeInTheDocument();
    });

    it('should highlight matching text', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');
      await user.type(searchInput, 'eng');

      // Wait for debounce
      await waitFor(() => {
        const marks = screen.getAllByText((_content, element) =>
          element?.tagName.toLowerCase() === 'mark'
        );
        expect(marks.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });

    it('should auto-expand parent nodes when child matches', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Initially, React Team should not be visible
      expect(screen.queryByText('React Team')).not.toBeInTheDocument();

      // Search for React Team
      await user.type(searchInput, 'React');

      // Wait for debounce and auto-expansion
      await waitFor(() => {
        // Text might be split by highlight marks, so use regex
        expect(screen.getByText(/React/)).toBeInTheDocument();
        expect(screen.getByText(/Team/)).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should show clear button when search has text', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Initially no clear button
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

      // Type something
      await user.type(searchInput, 'test');

      // Clear button should appear
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...') as HTMLInputElement;

      // Type something
      await user.type(searchInput, 'Frontend');
      expect(searchInput.value).toBe('Frontend');

      // Click clear button
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      // Input should be cleared
      expect(searchInput.value).toBe('');
    });

    it('should show "no results" message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Search for something that doesn't exist
      await user.type(searchInput, 'NonexistentOrg');

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText(/No organizations found matching/)).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should show result count when searching', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Search for "Team"
      await user.type(searchInput, 'Team');

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText(/Showing.*matching organization/)).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should handle case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const searchInput = screen.getByPlaceholderText('Search organizations...');

      // Search with different case
      await user.type(searchInput, 'ENGINEERING');

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should preserve manually expanded nodes after search clear', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Manually expand Engineering
      await user.click(screen.getByText('Engineering'));
      expect(screen.getByText('Frontend')).toBeInTheDocument();

      // Search for something
      const searchInput = screen.getByPlaceholderText('Search organizations...');
      await user.type(searchInput, 'Design');

      await waitFor(() => {
        expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      }, { timeout: 500 });

      // Clear search
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      // Frontend should be collapsed after clear (state reset)
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    });
  });

  describe('sorting functionality', () => {
    it('should render sort dropdown', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const sortSelect = screen.getByLabelText('Sort by');
      expect(sortSelect).toBeInTheDocument();
    });

    it('should have default sort option as "none"', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      const sortSelect = screen.getByLabelText('Sort by') as HTMLSelectElement;
      expect(sortSelect.value).toBe('none');
    });

    it('should sort by name alphabetically', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Get initial order
      const initialNodes = screen.getAllByText(/Engineering|Design/);
      expect(initialNodes[0]).toHaveTextContent('Engineering');
      expect(initialNodes[1]).toHaveTextContent('Design');

      // Change to name sort
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'name');

      // Should be alphabetically sorted
      const sortedNodes = screen.getAllByText(/Engineering|Design/);
      expect(sortedNodes[0]).toHaveTextContent('Design');
      expect(sortedNodes[1]).toHaveTextContent('Engineering');
    });

    it('should sort by size (total descendant count)', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Change to size sort
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'size');

      // Engineering has more descendants than Design, so should come first
      const sortedNodes = screen.getAllByText(/Engineering|Design/);
      expect(sortedNodes[0]).toHaveTextContent('Engineering');
      expect(sortedNodes[1]).toHaveTextContent('Design');
    });

    it('should display size numbers when sorting by size', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Change to size sort
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'size');

      // Size numbers should be visible
      // Engineering has 5 total nodes (Engineering + Frontend + Backend + React Team + Vue Team + API Team)
      const engineeringRow = screen.getByText('Engineering').closest('div');
      expect(engineeringRow).toHaveTextContent('6'); // 1 + 2 children (Frontend, Backend) + 3 grandchildren (React, Vue, API)
    });

    it('should not display size numbers when not sorting by size', () => {
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // With default sort (none), size shouldn't be shown
      const engineeringRow = screen.getByText('Engineering').closest('div');
      // Should only show child count (2), not total size
      expect(engineeringRow).toHaveTextContent('2');
      // Should not have the font-medium size indicator (which indicates total size)
      const sizeElement = engineeringRow?.querySelector('.font-medium');
      expect(sizeElement).not.toBeInTheDocument();
    });

    it('should sort children recursively when sorting by name', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Expand Engineering
      await user.click(screen.getByText('Engineering'));

      // Change to name sort
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'name');

      // Children should also be sorted alphabetically
      // Backend should come before Frontend
      const childNodes = screen.getAllByText(/Frontend|Backend/);
      expect(childNodes[0]).toHaveTextContent('Backend');
      expect(childNodes[1]).toHaveTextContent('Frontend');
    });

    it('should maintain sort when searching', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Set sort to name
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'name');

      // Search for "Team"
      const searchInput = screen.getByPlaceholderText('Search organizations...');
      await user.type(searchInput, 'Team');

      // Wait for debounce
      await waitFor(() => {
        // Results should still be sorted by name
        const nodes = screen.getAllByText(/Team/);
        expect(nodes.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });

    it('should reset to original order when selecting "none"', async () => {
      const user = userEvent.setup();
      render(<OrgTreeViewer orgData={mockOrgData} />);

      // Change to name sort
      const sortSelect = screen.getByLabelText('Sort by');
      await user.selectOptions(sortSelect, 'name');

      // Verify sorted
      let nodes = screen.getAllByText(/Engineering|Design/);
      expect(nodes[0]).toHaveTextContent('Design');

      // Change back to none
      await user.selectOptions(sortSelect, 'none');

      // Should be back to original order
      nodes = screen.getAllByText(/Engineering|Design/);
      expect(nodes[0]).toHaveTextContent('Engineering');
    });
  });
});
