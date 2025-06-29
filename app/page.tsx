'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Download, 
  Settings, 
  Wand2, 
  Eye,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  FileText,
  Users,
  Briefcase,
  Bot,
  Filter,
  RefreshCw,
  Target,
  Sliders
} from 'lucide-react';

const DataAlchemist = () => {
  // State management
  type EntityType = 'clients' | 'workers' | 'tasks';
  type DataState = {
    clients: any[];
    workers: any[];
    tasks: any[];
    [key: string]: any[]; // Add index signature for dynamic access
  };
  const [data, setData] = useState<DataState>({
    clients: [],
    workers: [],
    tasks: []
  });
  type ValidationError = {
    entityType: string;
    type: string;
    message: string;
    entityId?: string;
    field?: string;
    [key: string]: any;
  };
  type ValidationSummary = {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
    entitiesWithErrors: number;
    [key: string]: any;
  };
  type Validation = {
    isValid: boolean;
    summary: ValidationSummary;
    errors: ValidationError[];
    [key: string]: any;
  };
  const [validation, setValidation] = useState<Validation | null>(null);
  type Rule = { description: string; source?: string; [key: string]: any };
  const [rules, setRules] = useState<Rule[]>([]);
  type Priority = { id: string; name: string; weight: number };
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [searchQuery, setSearchQuery] = useState('');
  type SearchResults = {
    interpretation: string;
    matchCount: number;
    clients: any[];
    workers: any[];
    tasks: any[];
    [key: string]: any;
  };
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  type EditingCell = { row: number; field: string; entityType: string } | null;
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [modifyInstruction, setModifyInstruction] = useState('');

  // File upload handler
  const handleFileUpload = async (file: string | Blob, entityType: string) => {
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setData(prev => ({
          ...prev,
          [entityType]: result.data
        }));
        setSuccess(`${entityType} data uploaded successfully!`);
        await validateData();
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error during upload');
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const validateData = async () => {
    if (!data.clients.length && !data.workers.length && !data.tasks.length) return;

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setValidation(result);
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  // Natural language search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, data }),
      });

      const result = await response.json();
      setSearchResults(result.results);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Data modification
  const handleModifyData = async () => {
    if (!modifyInstruction.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: modifyInstruction, data }),
      });

      const result = await response.json();
      
      if (result.success && result.result.success) {
        setData(result.result.modifiedData);
        setSuccess(`Applied ${result.result.changes.length} modifications`);
        setModifyInstruction('');
        await validateData();
      } else {
        setError(result.result.message || 'Modification failed');
      }
    } catch (err) {
      setError('Modification failed');
    } finally {
      setLoading(false);
    }
  };

  // Rule creation
  const createRuleFromNaturalLanguage = async () => {
    if (!newRuleDescription.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createFromNaturalLanguage',
          description: newRuleDescription,
          data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setRules(prev => [...prev, result.rule]);
        setSuccess('Rule created successfully!');
        setNewRuleDescription('');
      } else {
        setError('Could not create rule from description');
      }
    } catch (err) {
      setError('Rule creation failed');
    } finally {
      setLoading(false);
    }
  };

  // Get rule recommendations
  const getRuleRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getRecommendations',
          data
        }),
      });

      const result = await response.json();
      
      if (result.recommendations) {
        setRules(prev => [...prev, ...result.recommendations]);
        setSuccess(`Added ${result.recommendations.length} rule recommendations`);
      }
    } catch (err) {
      setError('Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Load priorities
  const loadPriorities = async () => {
    try {
      const response = await fetch('/api/priorities');
      const result = await response.json();
      setPriorities(result.priorities || []);
    } catch (err) {
      console.error('Failed to load priorities');
    }
  };

  // Update priority weights
  const updatePriorityWeights = async (weights: {}) => {
    try {
      const response = await fetch('/api/priorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateWeights',
          weights
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPriorities(result.priorities);
        setSuccess('Priorities updated successfully!');
      }
    } catch (err) {
      setError('Failed to update priorities');
    }
  };

  // Export data
  const handleExport = async (format = 'csv') => {
    setLoading(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          rules,
          priorities: priorities.reduce((acc, p) => ({ ...acc, [p.id]: p.weight }), {}),
          format
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Create download links for each file
        Object.entries(result.files).forEach(([filename, content]) => {
          // Ensure content is a string or ArrayBuffer for Blob
          const safeContent = typeof content === 'string' || content instanceof ArrayBuffer ? content : JSON.stringify(content);
          const blob = new Blob([safeContent], { 
            type: filename.endsWith('.json') ? 'application/json' : 'text/csv' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        });
        
        setSuccess('Files exported successfully!');
      }
    } catch (err) {
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  // Cell editing
  const handleCellEdit = (entityType: string | number, rowIndex: any, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [entityType]: prev[entityType].map((item, idx) => 
        idx === rowIndex ? { ...item, [field]: value } : item
      )
    }));
    setEditingCell(null);
    validateData();
  };

  // Initialize
  useEffect(() => {
    loadPriorities();
  }, []);

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // File upload component
  type FileUploadZoneProps = {
    entityType: string;
    icon: React.ElementType;
    title: string;
    description: string;
  };
  const FileUploadZone: React.FC<FileUploadZoneProps> = ({ entityType, icon: Icon, title, description }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], entityType)}
        className="hidden"
        id={`upload-${entityType}`}
      />
      <label htmlFor={`upload-${entityType}`} className="cursor-pointer">
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-4">{description}</p>
          <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </div>
        </div>
      </label>
      {data[entityType].length > 0 && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {data[entityType].length} records loaded
          </span>
        </div>
      )}
    </div>
  );

  // Data table component
  type DataTableProps = { entityType: string; data: any[] };
  const DataTable: React.FC<DataTableProps> = ({ entityType, data: tableData }) => {
    if (!tableData.length) return <div className="text-gray-500 text-center py-8">No data loaded</div>;

    const headers = Object.keys(tableData[0]);
    const hasErrors = validation?.errors?.some(error => error.entityType === entityType);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, rowIndex) => {
              const rowErrors = validation?.errors?.filter(error => 
                error.entityType === entityType && 
                (error.entityId === row[`${entityType.slice(0, -1).charAt(0).toUpperCase() + entityType.slice(1, -1)}ID`] || error.entityId === `row_${rowIndex}`)
              ) || [];
              
              return (
                <tr key={rowIndex} className={rowErrors.length > 0 ? 'bg-red-50' : ''}>
                  {headers.map(header => {
                    const cellError = rowErrors.find(error => error.field === header);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.field === header && editingCell?.entityType === entityType;
                    
                    return (
                      <td key={header} className={`px-6 py-4 whitespace-nowrap text-sm ${cellError ? 'text-red-900' : 'text-gray-900'}`}>
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={row[header]}
                            onBlur={(e) => handleCellEdit(entityType, rowIndex, header, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(entityType, rowIndex, header, (e.target as HTMLInputElement).value);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${cellError ? 'border border-red-300' : ''}`}
                            onClick={() => setEditingCell({ row: rowIndex, field: header, entityType })}
                            title={cellError ? cellError.message : 'Click to edit'}
                          >
                            {row[header]}
                            {cellError && <AlertTriangle className="inline w-4 h-4 ml-1 text-red-500" />}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setEditingCell({ row: rowIndex, field: headers[0], entityType })}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Wand2 className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Data Alchemist</h1>
              <span className="ml-3 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-4">
              {validation && (
                <div className="flex items-center">
                  {validation.isValid ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-1" />
                      Valid
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <AlertTriangle className="w-5 h-5 mr-1" />
                      {validation.summary.totalErrors} errors
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => handleExport('csv')}
                disabled={!data.clients.length && !data.workers.length && !data.tasks.length}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'upload', label: 'Upload Data', icon: Upload },
              { id: 'validate', label: 'Validate', icon: CheckCircle },
              { id: 'search', label: 'AI Search', icon: Search },
              { id: 'modify', label: 'AI Modify', icon: Bot },
              { id: 'rules', label: 'Rules', icon: Settings },
              { id: 'priorities', label: 'Priorities', icon: Target }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Messages */}
      {(success || error) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div className="text-sm text-green-700">{success}</div>
                <button onClick={() => setSuccess('')} className="ml-auto">
                  <X className="h-4 w-4 text-green-400" />
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm text-red-700">{error}</div>
                <button onClick={() => setError('')} className="ml-auto">
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Upload Your Data Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FileUploadZone
                  entityType="clients"
                  icon={Users}
                  title="Clients"
                  description="Upload client data (CSV/XLSX)"
                />
                <FileUploadZone
                  entityType="workers"
                  icon={Briefcase}
                  title="Workers"
                  description="Upload worker data (CSV/XLSX)"
                />
                <FileUploadZone
                  entityType="tasks"
                  icon={FileText}
                  title="Tasks"
                  description="Upload task data (CSV/XLSX)"
                />
              </div>
            </div>

            {/* Data Preview */}
            {(data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0) && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
                
                {data.clients.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Clients ({data.clients.length} records)
                    </h4>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <DataTable entityType="clients" data={data.clients} />
                    </div>
                  </div>
                )}

                {data.workers.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Workers ({data.workers.length} records)
                    </h4>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <DataTable entityType="workers" data={data.workers} />
                    </div>
                  </div>
                )}

                {data.tasks.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Tasks ({data.tasks.length} records)
                    </h4>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <DataTable entityType="tasks" data={data.tasks} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'validate' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Data Validation</h2>
              <button
                onClick={validateData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Re-validate
              </button>
            </div>

            {validation && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{validation.summary.totalErrors}</div>
                    <div className="text-sm text-red-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{validation.summary.totalWarnings}</div>
                    <div className="text-sm text-yellow-600">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{validation.summary.criticalErrors}</div>
                    <div className="text-sm text-red-800">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{validation.summary.entitiesWithErrors}</div>
                    <div className="text-sm text-gray-600">Affected Entities</div>
                  </div>
                </div>

                {validation.errors.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-red-800 mb-3">Errors</h3>
                    <div className="space-y-2">
                      {validation.errors.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-800">
                                {error.entityType} - {error.type}
                              </div>
                              <div className="text-sm text-red-700">{error.message}</div>
                              {error.entityId && (
                                <div className="text-xs text-red-600 mt-1">
                                  Entity: {error.entityId} {error.field && `| Field: ${error.field}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">AI-Powered Natural Language Search</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., 'Show all high priority clients with tasks requiring JavaScript skills'"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Search className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {searchResults && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Search Results ({searchResults.matchCount} matches)
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  <strong>Interpretation:</strong> {searchResults.interpretation}
                </div>
                
                {searchResults.clients.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">Clients ({searchResults.clients.length})</h4>
                    <DataTable entityType="clients" data={searchResults.clients} />
                  </div>
                )}
                
                {searchResults.workers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">Workers ({searchResults.workers.length})</h4>
                    <DataTable entityType="workers" data={searchResults.workers} />
                  </div>
                )}
                
                {searchResults.tasks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Tasks ({searchResults.tasks.length})</h4>
                    <DataTable entityType="tasks" data={searchResults.tasks} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'modify' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">AI Data Modification</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <textarea
                    value={modifyInstruction}
                    onChange={(e) => setModifyInstruction(e.target.value)}
                    placeholder="e.g., 'Increase all client priority levels by 1' or 'Add JavaScript skill to all workers in the Development group'"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleModifyData}
                  disabled={loading || !modifyInstruction.trim()}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <Bot className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Apply Modification
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Business Rules</h2>
              <button
                onClick={getRuleRecommendations}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Sliders className="w-4 h-4 mr-2" />
                Get Recommendations
              </button>
            </div>

            {/* Rule creation from natural language */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder="Describe a new business rule in natural language"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && createRuleFromNaturalLanguage()}
                />
                <button
                  onClick={createRuleFromNaturalLanguage}
                  disabled={loading || !newRuleDescription.trim()}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </button>
              </div>
            </div>

            {/* Rules List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Current Rules ({rules.length})</h3>
              {rules.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No rules defined yet.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rules.map((rule, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-pre-line text-sm text-gray-900">{rule.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{rule.source || 'User'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {/* Remove rule button */}
                          <button
                            onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-900"
                            title="Remove rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Priorities Tab */}
        {activeTab === 'priorities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Priorities</h2>
              <button
                onClick={loadPriorities}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reload
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Adjust Priority Weights</h3>
              {priorities.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No priorities defined.</div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const weights: { [key: string]: number } = {};
                    priorities.forEach(p => {
                      weights[p.id] = Number(formData.get(p.id));
                    });
                    updatePriorityWeights(weights);
                  }}
                >
                  <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priorities.map((priority) => (
                        <tr key={priority.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{priority.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <input
                              type="number"
                              name={priority.id}
                              defaultValue={priority.weight}
                              min={0}
                              step={1}
                              className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Weights
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DataAlchemist;
