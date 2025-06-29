import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { clients, workers, tasks, rules } = await request.json();
    
    // Create export package
    const exportData = {
      clients: clients || [],
      workers: workers || [],
      tasks: tasks || [],
      rules: rules || {},
      exportTimestamp: new Date().toISOString()
    };
    
    return NextResponse.json(exportData);
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}