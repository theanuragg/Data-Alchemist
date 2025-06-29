import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Download, 
  Settings, 
  Wand2, 
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
import Header from './Header';
import NavTabs from './Navtab';
import StatusMessage from './StatusMessage';
import FileUploadZone from './Fileupload';
import DataTable from './DataTable';
import ValidationPanel from './validation';
import SearchPanel from './Search';
import RuleEditor from './Rules';
import PriorityEditor from './Priority';
import { 
  EntityType, 
  DataState, 
  ValidationResult, 
  Rule, 
  Priority, 
  SearchResults, 
  EditingCell,
  TabType
} from '@/types/type';

const DataAlchemist: React.FC = () => {
  // State management
  const [data, setData] = useState<DataState>({
    clients: [],
    workers: [],
    tasks: []
  });
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [modifyInstruction, setModifyInstruction] = useState('');

  const tabs: TabType[] = [
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'validate', label: 'Validate', icon: CheckCircle },
    { id: 'search', label: 'AI Search', icon: Search },
    { id: 'modify', label: 'AI Modify', icon: Bot },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'priorities', label: 'Priorities', icon: Target }
  ];

  // API call handlers
  const handleFileUpload = useCallback(async (file: File, entityType: EntityType) => {
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
  }, []);

  const validateData = useCallback(async () => {
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
  }, [data]);

  const handleSearch = useCallback(async () => {
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
  }, [searchQuery, data]);

  const handleModifyData = useCallback(async () => {
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
  }, [modifyInstruction, data, validateData]);

  const createRuleFromNaturalLanguage = useCallback(async () => {
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
  }, [newRuleDescription, data]);

  const getRuleRecommendations = useCallback(async () => {
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
  }, [data]);

  const loadPriorities = useCallback(async () => {
    try {
      const response = await fetch('/api/priorities');
      const result = await response.json();
      setPriorities(result.priorities || []);
    } catch (err) {
      console.error('Failed to load priorities');
    }
  }, []);

  const updatePriorityWeights = useCallback(async (weights: Record<string, number>) => {
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
  }, []);

  const handleExport = useCallback(async (format = 'csv') => {
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
  }, [data, rules, priorities]);

  const handleCellEdit = useCallback((entityType: EntityType, rowIndex: number, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [entityType]: prev[entityType].map((item, idx) => 
        idx === rowIndex ? { ...item, [field]: value } : item
      )
    }));
    setEditingCell(null);
    validateData();
  }, [validateData]);

  // Initialize
  useEffect(() => {
    loadPriorities();
  }, [loadPriorities]);

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

  const hasData = data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0;

  return (
    <div className="min-h-screen bg-black text-white    ">
      <Header 
        validation={validation} 
        hasData={hasData} 
        onExport={handleExport} 
      />
      
      <NavTabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {success && (
          <StatusMessage 
            type="success" 
            message={success} 
            onDismiss={() => setSuccess('')} 
          />
        )}
        {error && (
          <StatusMessage 
            type="error" 
            message={error} 
            onDismiss={() => setError('')} 
          />
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-sans text-gray-100 mb-6">Upload Your Data Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FileUploadZone
                  entityType="clients"
                  icon={Users}
                  title="Clients"
                  description="Upload client data (CSV/XLSX)"
                  onUpload={handleFileUpload}
                  dataCount={data.clients.length}
                />
                <FileUploadZone
                  entityType="workers"
                  icon={Briefcase}
                  title="Workers"
                  description="Upload worker data (CSV/XLSX)"
                  onUpload={handleFileUpload}
                  dataCount={data.workers.length}
                />
                <FileUploadZone
                  entityType="tasks"
                  icon={FileText}
                  title="Tasks"
                  description="Upload task data (CSV/XLSX)"
                  onUpload={handleFileUpload}
                  dataCount={data.tasks.length}
                />
              </div>
            </div>

            {/* Data Preview */}
            {hasData && (
              <div className="space-y-6">
                <h3 className="text-lg font-sans text-gray-100">Data Preview</h3>
                
                {data.clients.length > 0 && (
                  <div>
                    <h4 className="text-md font-sans text-gray-200 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Clients ({data.clients.length} records)
                    </h4>
                    <div className="bg-black rounded-lg shadow overflow-hidden">
                      <DataTable 
                        entityType="clients" 
                        data={data.clients} 
                        validation={validation}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onCellEdit={handleCellEdit}
                      />
                    </div>
                  </div>
                )}

                {data.workers.length > 0 && (
                  <div>
                    <h4 className="text-md font-sans text-gray-800 mb-3 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Workers ({data.workers.length} records)
                    </h4>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <DataTable 
                        entityType="workers" 
                        data={data.workers} 
                        validation={validation}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onCellEdit={handleCellEdit}
                      />
                    </div>
                  </div>
                )}

                {data.tasks.length > 0 && (
                  <div>
                    <h4 className="text-md font-sans text-gray-800 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Tasks ({data.tasks.length} records)
                    </h4>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <DataTable 
                        entityType="tasks" 
                        data={data.tasks} 
                        validation={validation}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onCellEdit={handleCellEdit}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'validate' && (
          <ValidationPanel 
            validation={validation} 
            loading={loading} 
            onRevalidate={validateData} 
          />
        )}

        {activeTab === 'search' && (
          <SearchPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loading}
            onSearch={handleSearch}
            searchResults={searchResults}
            validation={validation}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            onCellEdit={handleCellEdit}
          />
        )}

        {activeTab === 'modify' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-sans text-gray-100 mb-6">AI Data Modification</h2>
              <div className="bg-black rounded-lg shadow p-6">
                <div className="mb-4">
                  <textarea
                    value={modifyInstruction}
                    onChange={(e) => setModifyInstruction(e.target.value)}
                    placeholder="e.g., 'Increase all client priority levels by 1' or 'Add JavaScript skill to all workers in the Development group'"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none "
                  />
                </div>
                <button
                  onClick={handleModifyData}
                  disabled={loading || !modifyInstruction.trim()}
                  className="inline-flex items-center px-6 py-2  text-sm font-sans rounded-md text-white bg-gradient-to-b from-blue-200 to-blue-500 disabled:opacity-50"
                >
                  <Bot className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Apply Modification
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <RuleEditor
            rules={rules}
            newRuleDescription={newRuleDescription}
            setNewRuleDescription={setNewRuleDescription}
            loading={loading}
            onCreateRule={createRuleFromNaturalLanguage}
            onGetRecommendations={getRuleRecommendations}
            onRemoveRule={(index) => setRules(rules.filter((_, i) => i !== index))}
          />
        )}

        {activeTab === 'priorities' && (
          <PriorityEditor
            priorities={priorities}
            loading={loading}
            onReload={loadPriorities}
            onUpdateWeights={updatePriorityWeights}
          />
        )}
      </main>
    </div>
  );
};

export default DataAlchemist;