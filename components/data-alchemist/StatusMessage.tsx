import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, onDismiss }) => {
  const icon = type === 'success' ? (
    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
  ) : (
    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
  );

  const styles = type === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-700'
    : 'bg-red-50 border border-red-200 text-red-700';

  return (
    <div className={`${styles} rounded-md p-4 mb-4`}>
      <div className="flex">
        {icon}
        <div className="text-sm">{message}</div>
        <button onClick={onDismiss} className="ml-auto">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default StatusMessage;