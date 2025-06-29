import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface Rule {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters: any;
  active: boolean;
  createdAt: string;
}

// Convert natural language to rule
async function convertNaturalLanguageToRule(description: string, data: any): Promise<Rule | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Convert the following natural language rule description into a structured rule object.
    
    Rule description: "${description}"
    
    Available data context:
    ${JSON.stringify(data, null, 2)}
    
    Convert this to a structured rule with one of these types:
    - coRun: Tasks that must run together
    - slotRestriction: Minimum common slots for groups
    - loadLimit: Maximum slots per phase for worker groups
    - phaseWindow: Allowed phases for specific tasks
    - patternMatch: Regex-based rules
    - precedenceOverride: Priority overrides
    
    Return a JSON object:
    {
      "type": "rule_type",
      "name": "short_rule_name",
      "description": "clear_description",
      "parameters": {
        // rule-specific parameters based on type
      },
      "isValid": true/false,
      "validationMessage": "explanation if invalid"
    }
    
    Only return the JSON object, no other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const ruleData = JSON.parse(response);
    
    if (!ruleData.isValid) {
      return null;
    }
    
    return {
      id: `rule_${Date.now()}`,
      type: ruleData.type,
      name: ruleData.name,
      description: ruleData.description,
      parameters: ruleData.parameters,
      active: true,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Rule conversion error:', error);
    return null;
  }
}

// Generate rule recommendations
async function generateRuleRecommendations(data: any): Promise<Rule[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Analyze the following data and suggest business rules that would be beneficial:
    
    ${JSON.stringify(data, null, 2)}
    
    Look for patterns like:
    - Tasks that are frequently requested together (co-run rules)
    - Workers with similar skills or groups (load balancing)
    - Tasks with similar requirements (phase restrictions)
    - Overloaded workers or phases (load limits)
    
    Return a JSON array of rule suggestions:
    [
      {
        "type": "rule_type",
        "name": "rule_name",
        "description": "what this rule would do",
        "parameters": {...},
        "confidence": 0.8,
        "reasoning": "why this rule is suggested"
      }
    ]
    
    Only return the JSON array, no other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Remove Markdown code fences if present
    const jsonString = response.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(jsonString);
    
    return suggestions.map((suggestion: any, index: number) => ({
      id: `suggestion_${Date.now()}_${index}`,
      type: suggestion.type,
      name: suggestion.name,
      description: suggestion.description,
      parameters: {
        ...suggestion.parameters,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning
      },
      active: false,
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Rule recommendation error:', error);
    return [];
  }
}

let rules: Rule[] = []; // In-memory storage for demo

// GET handler
export async function GET() {
  try {
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Rules API error:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;
    
    switch (action) {
      case 'createFromNaturalLanguage':
        const { description, data } = payload;
        const newRule = await convertNaturalLanguageToRule(description, data);
        
        if (newRule) {
          rules.push(newRule);
          return NextResponse.json({ success: true, rule: newRule }, { status: 201 });
        } else {
          return NextResponse.json({ error: 'Could not create rule from description' }, { status: 400 });
        }
        
      case 'createStructured':
        const rule: Rule = {
          id: `rule_${Date.now()}`,
          ...payload.rule,
          active: true,
          createdAt: new Date().toISOString()
        };
        rules.push(rule);
        return NextResponse.json({ success: true, rule }, { status: 201 });
        
      case 'getRecommendations':
        const recommendations = await generateRuleRecommendations(payload.data);
        return NextResponse.json({ recommendations });
        
      case 'generateConfig':
        const activeRules = rules.filter(r => r.active);
        const config = {
          rules: activeRules,
          metadata: {
            generatedAt: new Date().toISOString(),
            ruleCount: activeRules.length,
            version: '1.0'
          }
        };
        return NextResponse.json({ config });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Rules API error:', error);
    return NextResponse.json({ error: 'Rules operation failed' }, { status: 500 });
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;
    const ruleIndex = rules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    rules[ruleIndex] = { ...rules[ruleIndex], ...updates };
    return NextResponse.json({ success: true, rule: rules[ruleIndex] });
  } catch (error) {
    console.error('Rules API error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }
    
    const indexToDelete = rules.findIndex(r => r.id === id);
    
    if (indexToDelete === -1) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    rules.splice(indexToDelete, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rules API error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}