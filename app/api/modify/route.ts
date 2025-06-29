import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Natural language data modification
async function performNaturalLanguageModification(instruction: string, data: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Given the following data and modification instruction, return the modified data.
    
    Instruction: "${instruction}"
    
    Current Data:
    ${JSON.stringify(data, null, 2)}
    
    Apply the modification instruction carefully. Consider:
    - Which entities need to be modified
    - What fields need to change
    - What the new values should be
    - Ensure data integrity is maintained
    
    Return a JSON object with:
    {
      "modifiedData": {...complete modified dataset},
      "changes": [
        {
          "entityType": "clients|workers|tasks",
          "entityId": "id",
          "field": "field_name", 
          "oldValue": old_value,
          "newValue": new_value,
          "action": "update|add|delete"
        }
      ],
      "interpretation": "how you interpreted the instruction",
      "success": true/false,
      "message": "explanation of what was done or why it failed"
    }
    
    Only return the JSON object, no other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    let response = result.response.text();
    // Remove code fences if present
    response = response.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    try {
      // Try standard JSON parse first
      try {
        return JSON.parse(response);
      } catch (e) {
        // Attempt to fix common JSON issues (e.g., unterminated strings)
        // Remove trailing commas and fix unclosed braces/brackets
        let fixed = response
          .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
          .replace(/\\([\s\S]?)/g, '\\\\$1'); // Escape stray backslashes
        // Attempt to close unclosed braces/brackets
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/]/g) || []).length;
        fixed += '}'.repeat(Math.max(0, openBraces - closeBraces));
        fixed += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
        try {
          return JSON.parse(fixed);
        } catch (jsonError) {
          // Try using jsonrepair to fix malformed JSON
          try {
            const { jsonrepair } = await import('jsonrepair');
            const repaired = jsonrepair(fixed);
            return JSON.parse(repaired);
          } catch (repairError) {
            console.error('JSON repair failed:', repairError);
            throw jsonError;
          }
        }
      }
    } catch (parseError) {
      try {
        // Fallback: try JSON5 for more flexible parsing
        const JSON5 = await import('json5');
        return JSON5.parse(response);
      } catch (json5Error) {
        console.error('JSON parse error:', parseError);
        return {
          modifiedData: data,
          changes: [],
          interpretation: "Error parsing model response",
          success: false,
          message: "Failed to parse model response as valid JSON"
        };
      }
    }
  } catch (error) {
    console.error('Natural language modification error:', error);
    return {
      modifiedData: data,
      changes: [],
      interpretation: "Error processing modification",
      success: false,
      message: "Failed to process modification instruction"
    };
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, data } = body;

    if (!instruction) {
      return NextResponse.json({ error: 'Modification instruction is required' }, { status: 400 });
    }

    const result = await performNaturalLanguageModification(instruction, data);

    return NextResponse.json({
      success: result.success,
      result
    });

  } catch (error) {
    console.error('Modification error:', error);
    return NextResponse.json({ error: 'Modification failed' }, { status: 500 });
  }
}