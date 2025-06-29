import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Priority } from '@/types/type';

interface PriorityEditorProps {
  priorities: Priority[];
  loading: boolean;
  onReload: () => void;
  onUpdateWeights: (weights: Record<string, number>) => void;
}

const PriorityEditor: React.FC<PriorityEditorProps> = ({
  priorities,
  loading,
  onReload,
  onUpdateWeights
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const weights: Record<string, number> = {};
    priorities.forEach(p => {
      weights[p.id] = Number(formData.get(p.id));
    });
    onUpdateWeights(weights);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-sans text-gray-100">Priorities</h2>
        <button
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center px-4 py-2  text-sm font-sans rounded-md text-white bg-gradient-to-b from-blue-200 to-blue-500   disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>
      <div className="bg-black rounded-lg shadow p-6">
        <h3 className="text-md font-sans text-gray-100 mb-4">Adjust Priority Weights</h3>
        {priorities.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No priorities defined.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-sans text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-sans text-gray-500 uppercase tracking-wider">Weight</th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-gray-200">
                {priorities.map((priority) => (
                  <tr key={priority.id}>
                    <td className="px-6 py-4 text-sm font-sans text-gray-100">{priority.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-100">
                      <input
                        type="number"
                        name={priority.id}
                        defaultValue={priority.weight}
                        min={0}
                        step={1}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none "
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 text-sm font-sans rounded-md text-white bg-gradient-to-b from-green-200 to-green-500 "
            >
              <Save className="w-4 h-4 mr-2" />
              Save Weights
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PriorityEditor;