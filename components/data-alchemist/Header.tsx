import React from "react";
import { Wand2, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { ValidationResult } from "@/types/type";

interface HeaderProps {
  validation: ValidationResult | null;
  hasData: boolean;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ validation, hasData, onExport }) => {
  return (
    <header className="bg-black shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Data Alchemist</h1>
            <Wand2 className="h-6 w-6 text-purple-600 mr-3" />
          </div>
          <div className="flex items-center space-x-4">
            {validation && (
              <div className="flex items-center">
                {validation.isValid ? (
                  <span className="flex items-center rounded-lg font-sans text-sm bg-gradient-to-b from-green-500 to-green-900 text-white px-3 py-3">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    Valid
                  </span>
                ) : (
                  <span className="flex items-center rounded-lg font-sans text-sm bg-gradient-to-b from-red-500 to-red-900 text-white px-3 py-3">
                    <AlertTriangle className="w-5 h-5 mr-1" />
                    {validation.summary.totalErrors} errors
                  </span>
                )}
              </div>
            )}
            <button
              onClick={onExport}
              disabled={!hasData}
              className="px-4 py-2 flex rounded-lg  bg-gradient-to-b from-white to-gray-400  text-gray-800 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2 mt-1" />
              Export
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
