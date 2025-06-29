import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, rules, priorities, format = 'csv' } = body;
    const { clients = [], workers = [], tasks = [] } = data;

    if (format === 'csv') {
      // Export as CSV files
      const clientsCsv = Papa.unparse(clients);
      const workersCsv = Papa.unparse(workers);
      const tasksCsv = Papa.unparse(tasks);
      
      // Create rules config
      const rulesConfig = {
        rules: rules || [],
        priorities: priorities || {},
        exportedAt: new Date().toISOString(),
        metadata: {
          clientCount: clients.length,
          workerCount: workers.length,
          taskCount: tasks.length
        }
      };

      return NextResponse.json({
        success: true,
        files: {
          'clients.csv': clientsCsv,
          'workers.csv': workersCsv,
          'tasks.csv': tasksCsv,
          'rules.json': JSON.stringify(rulesConfig, null, 2)
        }
      });
      
    } else if (format === 'xlsx') {
      // Export as Excel file
      const workbook = XLSX.utils.book_new();
      
      // Add worksheets
      const clientsWs = XLSX.utils.json_to_sheet(clients);
      const workersWs = XLSX.utils.json_to_sheet(workers);
      const tasksWs = XLSX.utils.json_to_sheet(tasks);
      
      XLSX.utils.book_append_sheet(workbook, clientsWs, 'Clients');
      XLSX.utils.book_append_sheet(workbook, workersWs, 'Workers');
      XLSX.utils.book_append_sheet(workbook, tasksWs, 'Tasks');
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Create rules config
      const rulesConfig = {
        rules: rules || [],
        priorities: priorities || {},
        exportedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        files: {
          'data.xlsx': buffer.toString('base64'),
          'rules.json': JSON.stringify(rulesConfig, null, 2)
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid format. Use "csv" or "xlsx"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}