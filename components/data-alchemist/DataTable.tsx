import React, { useState } from 'react';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { EntityType, ValidationResult, EditingCell } from '@/types/type';

interface DataTableProps {
  entityType: EntityType;
  data: any[];
  validation?: ValidationResult | null;
  editingCell: EditingCell;
  setEditingCell: (cell: EditingCell) => void;
  onCellEdit: (entityType: EntityType, rowIndex: number, field: string, value: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  entityType,
  data: tableData,
  validation,
  editingCell,
  setEditingCell,
  onCellEdit
}) => {
  if (!tableData.length) return <div className="text-gray-500 text-center py-8">No data loaded</div>;

  const headers = Object.keys(tableData[0]);
  const hasErrors = validation?.errors?.some(error => error.entityType === entityType);

  const handleCellBlur = (rowIndex: number, field: string, value: string) => {
    onCellEdit(entityType, rowIndex, field, value);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y  divide-gray-200">
        <thead className="bg-black">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-sans text-gray-100 uppercase tracking-wider">
                {header}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-sans text-gray-100 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-black divide-y  divide-gray-200">
          {tableData.map((row, rowIndex) => {
            const rowErrors = validation?.errors?.filter(error => 
              error.entityType === entityType && 
              (error.entityId === row[`${entityType.slice(0, -1).charAt(0).toUpperCase() + entityType.slice(1, -1)}ID`] || 
               error.entityId === `row_${rowIndex}`)
            ) || [];
            
            return (
              <tr key={rowIndex} className={rowErrors.length > 0 ? 'bg-red-50' : ''}>
                {headers.map(header => {
                  const cellError = rowErrors.find(error => error.field === header);
                  const isEditing = editingCell?.row === rowIndex && 
                                  editingCell?.field === header && 
                                  editingCell?.entityType === entityType;
                  
                  return (
                    <td key={header} className={`px-6 py-4 whitespace-nowrap font-sans text-sm ${cellError ? 'text-red-900' : 'text-gray-200'}`}>
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={row[header]}
                          onBlur={(e) => handleCellBlur(rowIndex, header, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellBlur(rowIndex, header, (e.target as HTMLInputElement).value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className={`cursor-pointer  hover:bg-gray-800 hover:text-gray-100 px-2 py-1 rounded ${cellError ? 'border border-red-300' : ''}`}
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

export default DataTable;