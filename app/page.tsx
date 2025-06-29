'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Search, Download, AlertCircle, CheckCircle, Settings, Sliders, FileText, Users, Briefcase, Target } from 'lucide-react';

interface DataRow {
  [key: string]: any;
}

interface ValidationError {
  row?: number;
  field: string;
  message: string;
  type?: string;
}

interface ValidationResults {
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
  summary: {
    totalRows: number;
    errorCount: number;
    warningCount: number;
  };
}

interface Rule {
  id: string;
  type: string;
  name: string;
  config: any;
}

const DataAlchemist: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'workers' | 'tasks' | 'rules' | 'export'>('clients');
  const [clientsData, setClientsData] = useState<DataRow[]>([]);
  const [workersData, setWorkersData] = useState<DataRow[]>([]);
  const [tasksData, setTasksData] = useState<DataRow[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResults>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DataRow[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState({
    priorityLevel: 0.3,
    taskFulfillment: 0.25,
    fairness: 0.2,
    workloadBalance: 0.25
  });
  const [loading, setLoading] = useState(false);
  const [ruleInput, setRuleInput] = useState('');
  
  const fileInputRefs = {
    clients: useRef<HTMLInputElement>(null),
    workers: useRef<HTMLInputElement>(null),
    tasks: useRef<HTMLInputElement>(null)
  };

  const handleFileUpload = useCallback(async (file: File, entityType: 'clients' | 'workers' | 'tasks') => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        switch (entityType) {
          case 'clients':
            setClientsData(result.data);
            break;
          case 'workers':
            setWorkersData(result.data);
            break;
          case 'tasks':
            setTasksData(result.data);
            break;
        }
        
        setValidationResults(prev => ({
          ...prev,
          [entityType]: result.validationResults
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCellEdit = useCallback(async (entityType: string, rowIndex: number, field: string, value: any) => {
    let data: DataRow[];
    let setData: React.Dispatch<React.SetStateAction<DataRow[]>>;
    
    switch (entityType) {
      case 'clients':
        data = clientsData;
        setData = setClientsData;
        break;
      case 'workers':
        data = workersData;
        setData = setWorkersData;
        break;
      case 'tasks':
        data = tasksData;
        setData = setTasksData;
        break;
      default:
        return;
    }
    
    const updatedData = [...data];
    updatedData[rowIndex][field] = value;
    setData(updatedData);
    
    // Re-validate
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData, entityType })
      });
      
      const validationResult = await response.json();
      setValidationResults(prev => ({
        ...prev,
        [entityType]: validationResult
      }));
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [clientsData, workersData, tasksData]);

  const handleNaturalLanguageSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const allData = [...clientsData, ...workersData, ...tasksData];
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, data: allData, entityType: activeTab })
      });
      
      const result = await response.json();
      setSearchResults(result.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, clientsData, workersData, tasksData, activeTab]);

  const handleAddRule = useCallback(async () => {
    if (!ruleInput.trim()) return;
    
    // Simple rule parsing - in real implementation, this would use Gemini AI
    const newRule: Rule = {
      id: Date.now().toString(),
      type: 'natural_language',
      name: ruleInput.slice(0, 50) + '...',
      config: { description: ruleInput }
    };
    
    setRules(prev => [...prev, newRule]);
    setRuleInput('');
  }, [ruleInput]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clients: clientsData,
          workers: workersData,
          tasks: tasksData,
          rules: { rules, priorities }
        })
      });
      
      const exportData = await response.json();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resource-allocation-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  }, [clientsData, workersData, tasksData, rules, priorities]);

  const renderDataGrid = (data: DataRow[], entityType: string) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No data</h3>
          <p className="mt-1 text-sm text-gray-500">Upload a CSV or XLSX file to get started</p>
        </div>
      );
    }

    const headers = Object.keys(data[0]);
    const validation = validationResults[entityType];

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {headers.map(header => {
                  const hasError = validation?.errors?.some(error => 
                    error.row === rowIndex && error.field === header
                  );
                  
                  return (
                    <td key={header} className={`px-6 py-4 whitespace-nowrap text-sm ${hasError ? 'bg-red-50 border-red-200' : ''}`}>
                      <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleCellEdit(entityType, rowIndex, header, e.target.value)}
                        className={`w-full border-none bg-transparent focus:ring-2 focus:ring-blue-500 ${hasError ? 'text-red-900' : 'text-gray-900'}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderValidationSummary = (entityType: string) => {
    const validation = validationResults[entityType];
    if (!validation) return null;

    return (
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`font-semibold ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              {validation.isValid ? 'All validations passed' : `${validation.summary.errorCount} errors found`}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {validation.summary.totalRows} rows processed
          </div>
        </div>
        
        {validation.errors.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
            <ul className="space-y-1">
              {validation.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  {error.row !== undefined ? `Row ${error.row + 1}: ` : ''}{error.message}
                </li>
              ))}
              {validation.errors.length > 5 && (
                <li className="text-sm text-red-600">...and {validation.errors.length - 5} more errors</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPrioritySliders = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Priority Weights</h3>
      {Object.entries(priorities).map(([key, value]) => (
        <div key={key} className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <span className="text-sm text-gray-500">{(value * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={value}
            onChange={(e) => setPriorities(prev => ({
              ...prev,
              [key]: parseFloat(e.target.value)
            }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 Data Alchemist</h1>
              <p className="text-gray-600 mt-1">AI-Powered Resource Allocation Configurator</p>
            </div>
            
            {/* Natural Language Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search with natural language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageSearch()}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleNaturalLanguageSearch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'clients', label: 'Clients', icon: Users },
              { key: 'workers', label: 'Workers', icon: Briefcase },
              { key: 'tasks', label: 'Tasks', icon: Target },
              { key: 'rules', label: 'Rules', icon: Settings },
              { key: 'export', label: 'Export', icon: Download }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchResults.length > 0 && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Search Results ({searchResults.length} found)</h3>
            <div className="space-y-2">
              {searchResults.slice(0, 3).map((result, index) => (
                <div key={index} className="text-sm text-blue-800">
                  {Object.entries(result).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Upload and Management */}
        {(activeTab === 'clients' || activeTab === 'workers' || activeTab === 'tasks') && (
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">{activeTab} Data</h2>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRefs[activeTab]}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, activeTab);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefs[activeTab].current?.click()}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>

              {renderValidationSummary(activeTab)}
              {renderDataGrid(
                activeTab === 'clients' ? clientsData : 
                activeTab === 'workers' ? workersData : tasksData,
                activeTab
              )}
            </div>
          </div>
        )}

        {/* Rules Management */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Rules</h2>
              
              {/* Natural Language Rule Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Rule in Natural Language
                </label>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    placeholder="e.g., Tasks T12 and T14 should always run together"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Rule
                  </button>
                </div>
              </div>

              {/* Predefined Rule Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { type: 'coRun', name: 'Co-run Tasks', desc: 'Tasks that must run together' },
                  { type: 'loadLimit', name: 'Load Limit', desc: 'Maximum workload per worker group' },
                  { type: 'phaseWindow', name: 'Phase Window', desc: 'Restrict tasks to specific phases' },
                  { type: 'precedence', name: 'Precedence', desc: 'Task execution order' },
                  { type: 'skillMatch', name: 'Skill Matching', desc: 'Match tasks to worker skills' },
                  { type: 'fairness', name: 'Fair Distribution', desc: 'Ensure balanced workload' }
                ].map((template) => (
                  <div key={template.type} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.desc}</p>
                  </div>
                ))}
              </div>

              {/* Current Rules */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Current Rules ({rules.length})</h3>
                {rules.length === 0 ? (
                  <p className="text-gray-500 text-sm">No rules defined yet. Add rules using natural language or templates above.</p>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{rule.name}</span>
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{rule.type}</span>
                        </div>
                        <button
                          onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority Weights */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Sliders className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Priority Configuration</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {renderPrioritySliders()}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preset Profiles</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Maximize Fulfillment', config: { priorityLevel: 0.4, taskFulfillment: 0.4, fairness: 0.1, workloadBalance: 0.1 } },
                      { name: 'Fair Distribution', config: { priorityLevel: 0.2, taskFulfillment: 0.2, fairness: 0.4, workloadBalance: 0.2 } },
                      { name: 'Minimize Workload', config: { priorityLevel: 0.2, taskFulfillment: 0.2, fairness: 0.2, workloadBalance: 0.4 } },
                      { name: 'Balanced Approach', config: { priorityLevel: 0.25, taskFulfillment: 0.25, fairness: 0.25, workloadBalance: 0.25 } }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setPriorities(preset.config)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Priority: {(preset.config.priorityLevel * 100).toFixed(0)}%, 
                          Fulfillment: {(preset.config.taskFulfillment * 100).toFixed(0)}%, 
                          Fairness: {(preset.config.fairness * 100).toFixed(0)}%, 
                          Balance: {(preset.config.workloadBalance * 100).toFixed(0)}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Configuration</h2>
              
              {/* Data Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{clientsData.length}</div>
                  <div className="text-sm text-blue-700">Clients</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Briefcase className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{workersData.length}</div>
                  <div className="text-sm text-green-700">Workers</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">{tasksData.length}</div>
                  <div className="text-sm text-purple-700">Tasks</div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Validation Status</h3>
                <div className="space-y-2">
                  {['clients', 'workers', 'tasks'].map(entityType => {
                    const validation = validationResults[entityType];
                    const hasData = 
                      (entityType === 'clients' && clientsData.length > 0) ||
                      (entityType === 'workers' && workersData.length > 0) ||
                      (entityType === 'tasks' && tasksData.length > 0);
                    
                    return (
                      <div key={entityType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="capitalize font-medium">{entityType}</span>
                        <div className="flex items-center">
                          {!hasData ? (
                            <span className="text-gray-500">No data</span>
                          ) : validation?.isValid ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-700">Valid</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-red-700">{validation?.summary.errorCount || 0} errors</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rules Summary */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Rules & Priorities</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="font-medium">Business Rules: </span>
                    <span className="text-gray-600">{rules.length} rules defined</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Priority Level Weight: {(priorities.priorityLevel * 100).toFixed(0)}%</div>
                    <div>Task Fulfillment Weight: {(priorities.taskFulfillment * 100).toFixed(0)}%</div>
                    <div>Fairness Weight: {(priorities.fairness * 100).toFixed(0)}%</div>
                    <div>Workload Balance Weight: {(priorities.workloadBalance * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Export Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleExport}
                    disabled={loading || (clientsData.length === 0 && workersData.length === 0 && tasksData.length === 0)}
                    className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {loading ? 'Exporting...' : 'Export Complete Package'}
                  </button>
                  
                  <button
                    onClick={async () => {
                      const rulesBlob = new Blob([JSON.stringify({ rules, priorities }, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(rulesBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'rules-config.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    disabled={rules.length === 0}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Export Rules Only
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  The complete package includes cleaned data files (CSV format) and a rules.json file ready for downstream allocation tools.
                </p>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights & Recommendations</h3>
              
              <div className="space-y-4">
                {clientsData.length > 0 && workersData.length > 0 && tasksData.length > 0 ? (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Data Quality</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Your data coverage looks good with {clientsData.length} clients, {workersData.length} workers, and {tasksData.length} tasks.
                        {Object.values(validationResults).every(v => v?.isValid) 
                          ? ' All validation checks passed!' 
                          : ' Some validation issues need attention.'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900">Optimization Suggestions</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Consider adding co-run rules for tasks that frequently appear together in client requests.
                        {rules.length === 0 && ' You might want to define some business rules to improve allocation efficiency.'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Ready for Export</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Your configuration is ready for export. The downstream allocation system will use your priority weights and business rules to optimize resource assignments.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Getting Started</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload your client, worker, and task data files to begin configuration. The AI will help validate your data and suggest optimizations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DataAlchemist;