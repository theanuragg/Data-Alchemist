import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, data, entityType } = await request.json();
    
    // Simple natural language search implementation
    const results = await performNaturalLanguageSearch(query, data, entityType);
    
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

async function performNaturalLanguageSearch(query: string, data: any[], entityType: string): Promise<any[]> {
  // Simple keyword-based search for now
  const keywords = query.toLowerCase().split(' ');
  
  return data.filter(row => {
    const searchText = Object.values(row).join(' ').toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });
}