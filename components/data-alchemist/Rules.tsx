import React from 'react';
import { Sliders, Plus, Trash2 } from 'lucide-react';
import { Rule } from '@/types/type';

interface RuleEditorProps {
  rules: Rule[];
  newRuleDescription: string;
  setNewRuleDescription: (description: string) => void;
  loading: boolean;
  onCreateRule: () => void;
  onGetRecommendations: () => void;
  onRemoveRule: (index: number) => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  rules,
  newRuleDescription,
  setNewRuleDescription,
  loading,
  onCreateRule,
  onGetRecommendations,
  onRemoveRule
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-sans text-gray-100">Business Rules</h2>
        <button
          onClick={onGetRecommendations}
          disabled={loading}
          className="inline-flex items-center px-4 py-2  text-sm font-sans rounded-md text-white bg-gradient-to-b from-blue-200 to-blue-500 disabled:opacity-50"
        >
          <Sliders className="w-4 h-4 mr-2" />
          Get Recommendations
        </button>
      </div>

      {/* Rule creation from natural language */}
      <div className="bg-black rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newRuleDescription}
            onChange={(e) => setNewRuleDescription(e.target.value)}
            placeholder="Describe a new business rule in natural language"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && onCreateRule()}
          />
          <button
            onClick={onCreateRule}
            disabled={loading || !newRuleDescription.trim()}
            className="inline-flex items-center px-6 py-2  text-sm font-sans rounded-md text-white bg-gradient-to-b from-blue-200 to-blue-500 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-black rounded-lg shadow p-6">
        <h3 className="text-md font-sans text-gray-100 mb-4">Current Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No rules defined yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-sans text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-sans text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-sans text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-pre-line text-sm text-gray-100">{rule.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{rule.source || 'User'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <button
                      onClick={() => onRemoveRule(idx)}
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
  );
};

export default RuleEditor;