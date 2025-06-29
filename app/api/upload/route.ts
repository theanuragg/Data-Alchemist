// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;

    if (!file || !entityType) {
      return NextResponse.json({ error: 'File and entity type required' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let data: any[] = [];

    if (file.name.endsWith('.csv')) {
      const text = new TextDecoder().decode(buffer);
      data = parseCSV(text);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    // AI-powered header mapping
    const mappedData = await mapHeaders(data, entityType);
    const validationResults = validateData(mappedData, entityType);

    return NextResponse.json({
      data: mappedData,
      validationResults,
      success: true
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

async function mapHeaders(data: any[], entityType: string): Promise<any[]> {
  const expectedHeaders = getExpectedHeaders(entityType);
  if (data.length === 0) return data;

  const actualHeaders = Object.keys(data[0]);
  const mapping = await generateHeaderMapping(actualHeaders, expectedHeaders, entityType);
  
  return data.map(row => {
    const mappedRow: any = {};
    Object.entries(mapping).forEach(([actual, expected]) => {
      mappedRow[expected] = row[actual];
    });
    return mappedRow;
  });
}

function getExpectedHeaders(entityType: string): string[] {
  switch (entityType) {
    case 'clients':
      return ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];
    case 'workers':
      return ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
    case 'tasks':
      return ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];
    default:
      return [];
  }
}

async function generateHeaderMapping(actual: string[], expected: string[], entityType: string): Promise<Record<string, string>> {
  // Simple fuzzy matching for header mapping
  const mapping: Record<string, string> = {};
  
  expected.forEach(expectedHeader => {
    const bestMatch = actual.find(actualHeader => 
      actualHeader.toLowerCase().includes(expectedHeader.toLowerCase()) ||
      expectedHeader.toLowerCase().includes(actualHeader.toLowerCase()) ||
      similarity(actualHeader.toLowerCase(), expectedHeader.toLowerCase()) > 0.6
    );
    
    if (bestMatch) {
      mapping[bestMatch] = expectedHeader;
    } else {
      // Find the closest match
      let maxSimilarity = 0;
      let closestMatch = actual[0];
      
      actual.forEach(actualHeader => {
        const sim = similarity(actualHeader.toLowerCase(), expectedHeader.toLowerCase());
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          closestMatch = actualHeader;
        }
      });
      
      mapping[closestMatch] = expectedHeader;
    }
  });
  
  return mapping;
}

function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function validateData(data: any[], entityType: string): any {
  const errors: any[] = [];
  const warnings: any[] = [];

  data.forEach((row, index) => {
    const rowErrors = validateRow(row, entityType, index);
    errors.push(...rowErrors);
  });

  // Cross-validation
  const crossValidationErrors = performCrossValidation(data, entityType);
  errors.push(...crossValidationErrors);

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    summary: {
      totalRows: data.length,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  };
}

function validateRow(row: any, entityType: string, index: number): any[] {
  const errors: any[] = [];

  switch (entityType) {
    case 'clients':
      if (!row.ClientID) errors.push({ row: index, field: 'ClientID', message: 'ClientID is required' });
      if (!row.ClientName) errors.push({ row: index, field: 'ClientName', message: 'ClientName is required' });
      if (!row.PriorityLevel || row.PriorityLevel < 1 || row.PriorityLevel > 5) {
        errors.push({ row: index, field: 'PriorityLevel', message: 'PriorityLevel must be between 1-5' });
      }
      if (row.AttributesJSON) {
        try {
          JSON.parse(row.AttributesJSON);
        } catch {
          errors.push({ row: index, field: 'AttributesJSON', message: 'Invalid JSON format' });
        }
      }
      break;

    case 'workers':
      if (!row.WorkerID) errors.push({ row: index, field: 'WorkerID', message: 'WorkerID is required' });
      if (!row.WorkerName) errors.push({ row: index, field: 'WorkerName', message: 'WorkerName is required' });
      if (!row.Skills) errors.push({ row: index, field: 'Skills', message: 'Skills are required' });
      if (!row.AvailableSlots) errors.push({ row: index, field: 'AvailableSlots', message: 'AvailableSlots are required' });
      if (!row.MaxLoadPerPhase || row.MaxLoadPerPhase < 1) {
        errors.push({ row: index, field: 'MaxLoadPerPhase', message: 'MaxLoadPerPhase must be >= 1' });
      }
      break;

    case 'tasks':
      if (!row.TaskID) errors.push({ row: index, field: 'TaskID', message: 'TaskID is required' });
      if (!row.TaskName) errors.push({ row: index, field: 'TaskName', message: 'TaskName is required' });
      if (!row.Duration || row.Duration < 1) {
        errors.push({ row: index, field: 'Duration', message: 'Duration must be >= 1' });
      }
      if (!row.RequiredSkills) errors.push({ row: index, field: 'RequiredSkills', message: 'RequiredSkills are required' });
      break;
  }

  return errors;
}

function performCrossValidation(data: any[], entityType: string): any[] {
  const errors: any[] = [];
  
  // Check for duplicate IDs
  const ids = data.map(row => {
    switch (entityType) {
      case 'clients': return row.ClientID;
      case 'workers': return row.WorkerID;
      case 'tasks': return row.TaskID;
      default: return null;
    }
  }).filter(Boolean);

  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  duplicateIds.forEach(id => {
    errors.push({
      type: 'duplicate',
      field: `${entityType === 'clients' ? 'ClientID' : entityType === 'workers' ? 'WorkerID' : 'TaskID'}`,
      message: `Duplicate ID found: ${id}`
    });
  });

  return errors;
}

// app/api/validate/route.ts
