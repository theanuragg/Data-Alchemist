import React from 'react';
import { Search } from 'lucide-react';
import DataTable from './DataTable';
import { SearchResults, EntityType, ValidationResult, EditingCell } from '@/types/type';

interface SearchPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  onSearch: () => void;
  searchResults: SearchResults | null;
  validation?: ValidationResult | null;
  editingCell: EditingCell;
  setEditingCell: (cell: EditingCell) => void;
  onCellEdit: (entityType: EntityType, rowIndex: number, field: string, value: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  setSearchQuery,
  loading,
  onSearch,
  searchResults,
  validation,
  editingCell,
  setEditingCell,
  onCellEdit
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-sans text-gray-100 mb-6">AI-Powered Natural Language Search</h2>
        <div className="bg-black rounded-lg shadow p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 'Show all high priority clients with tasks requiring JavaScript skills'"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <button
              onClick={onSearch}
              disabled={loading || !searchQuery.trim()}
              className="inline-flex items-center px-6 py-2  text-sm font-sans rounded-md text-whitebg-gradient-to-b from-blue-200 to-blue-500  disabled:opacity-50"
            >
              <Search className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Search
            </button>
          </div>
        </div>
      </div>

      {searchResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-sans text-gray-100 mb-4">
            Search Results ({searchResults.matchCount} matches)
          </h3>
          <div className="text-sm text-gray-600 mb-4">
            <strong>Interpretation:</strong> {searchResults.interpretation}
          </div>
          
          {searchResults.clients.length > 0 && (
            <div className="mb-6">
              <h4 className="font-sans text-gray-800 mb-2">Clients ({searchResults.clients.length})</h4>
              <DataTable
                entityType="clients"
                data={searchResults.clients}
                validation={validation}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                onCellEdit={onCellEdit}
              />
            </div>
          )}
          
          {searchResults.workers.length > 0 && (
            <div className="mb-6">
              <h4 className="font-sans text-gray-800 mb-2">Workers ({searchResults.workers.length})</h4>
              <DataTable
                entityType="workers"
                data={searchResults.workers}
                validation={validation}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                onCellEdit={onCellEdit}
              />
            </div>
          )}
          
          {searchResults.tasks.length > 0 && (
            <div>
              <h4 className="font-sans text-gray-800 mb-2">Tasks ({searchResults.tasks.length})</h4>
              <DataTable
                entityType="tasks"
                data={searchResults.tasks}
                validation={validation}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                onCellEdit={onCellEdit}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;