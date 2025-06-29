import React from 'react';
import { FileUploadZoneProps } from '@/types/type';
import { CheckCircle, Upload } from 'lucide-react';

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  entityType,
  icon: Icon,
  title,
  description,
  onUpload,
  dataCount
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], entityType);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        id={`upload-${entityType}`}
      />
      <label htmlFor={`upload-${entityType}`} className="cursor-pointer">
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-sans text-gray-200 mb-2">{title}</h3>
          <p className="text-sm font-sans text-gray-300 mb-4">{description}</p>
          <div className="inline-flex items-center px-4 py-2  text-sm font-sans rounded-md text-white bg-gradient-to-b from-blue-200 to-blue-500 ">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </div>
        </div>
      </label>
      {dataCount > 0 && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {dataCount} records loaded
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;