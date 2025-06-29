import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { rules, priorities } = await request.json();
    
    const rulesConfig = {
      rules,
      priorities,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(rulesConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Rules generation failed' }, { status: 500 });
  }
}
