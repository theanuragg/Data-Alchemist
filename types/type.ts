export type EntityType = 'clients' | 'workers' | 'tasks';

export type DataState = {
  clients: any[];
  workers: any[];
  tasks: any[];
  [key: string]: any[];
};

export type ValidationError = {
  entityType: string;
  type: string;
  message: string;
  entityId?: string;
  field?: string;
  [key: string]: any;
};

export type ValidationSummary = {
  totalErrors: number;
  totalWarnings: number;
  criticalErrors: number;
  entitiesWithErrors: number;
  [key: string]: any;
};

export type ValidationResult = {
  isValid: boolean;
  summary: ValidationSummary;
  errors: ValidationError[];
  [key: string]: any;
};

export type Rule = {
  description: string;
  source?: string;
  [key: string]: any;
};

export type Priority = {
  id: string;
  name: string;
  weight: number;
};

export type SearchResults = {
  interpretation: string;
  matchCount: number;
  clients: any[];
  workers: any[];
  tasks: any[];
  [key: string]: any;
};

export type EditingCell = {
  row: number;
  field: string;
  entityType: string;
} | null;

export type TabType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type FileUploadZoneProps = {
  entityType: EntityType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onUpload: (file: File, entityType: EntityType) => Promise<void>;
  dataCount: number;
};