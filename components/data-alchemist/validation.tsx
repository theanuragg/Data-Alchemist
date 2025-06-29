import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ValidationResult } from '@/types/type';

interface ValidationPanelProps {
  validation: ValidationResult | null;
  loading: boolean;
  onRevalidate: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validation,
  loading,
  onRevalidate
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-sans text-gray-100">Data Validation</h2>
        <button
          onClick={onRevalidate}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-sans rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Re-validate
        </button>
      </div>

      {validation && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-100">{validation.summary.totalErrors}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-100">{validation.summary.totalWarnings}</div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-100">{validation.summary.criticalErrors}</div>
              <div className="text-sm text-red-800">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-100">{validation.summary.entitiesWithErrors}</div>
              <div className="text-sm text-gray-600">Affected Entities</div>
            </div>
          </div>

          {validation.errors.length > 0 && (
            <div>
              <h3 className="text-md font-sans text-red-800 mb-3">Errors</h3>
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <div className="text-sm font-sans text-red-800">
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
  );
};

export default ValidationPanel;