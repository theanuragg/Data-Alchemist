import { NextRequest, NextResponse } from 'next/server';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Readable } from 'stream';
import { promisify } from 'util';

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- Multer Setup ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// --- Helper to run multer middleware ---
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// --- Parsing Logic ---
function parseFile(buffer: Buffer, filename: string): any[] {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    const csvText = buffer.toString('utf-8');
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return parsed.data as any[];
  } else if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
  throw new Error('Unsupported file format');
}

// --- AI Mapping Logic ---
async function mapHeaders(headers: string[], entityType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const expectedHeaders = {
    clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
    workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
    tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
  };

  const prompt = `
Map the following CSV headers to the expected ${entityType} entity headers.

Input headers: ${headers.join(', ')}
Expected headers: ${expectedHeaders[entityType as keyof typeof expectedHeaders].join(', ')}

Return a JSON object mapping input headers to expected headers.
Example: {"input_header": "expected_header", "another_input": null}

Only return the JSON object, no other text.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Extract JSON object from the response string
    const match = response.match(/{[\s\S]*}/);
    if (!match) throw new Error('No JSON object found in AI response');
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('Header mapping error:', err);
    return {};
  }
}

// --- POST Method Handler (App Router Style) ---
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!['clients', 'workers', 'tasks'].includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = parseFile(buffer, file.name);

    if (!data.length) return NextResponse.json({ error: 'No data found in file' }, { status: 400 });

    const headers = Object.keys(data[0]);
    const headerMapping = await mapHeaders(headers, entityType);

    const mappedData = data.map(row => {
      const mappedRow: any = {};
      Object.keys(row).forEach(key => {
        const mappedKey = headerMapping[key] || key;
        mappedRow[mappedKey] = row[key];
      });
      return mappedRow;
    });

    return NextResponse.json({
      success: true,
      data: mappedData,
      entityType,
      headerMapping,
      recordCount: mappedData.length,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File processing failed' }, { status: 500 });
  }
}


