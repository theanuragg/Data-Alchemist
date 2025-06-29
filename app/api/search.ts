import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Natural language search using AI
async function performNaturalLanguageSearch(query: string, data: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Given the following data and natural language query, return the entities that match the criteria.
    
    Query: "${query}"
    
    Data:
    ${JSON.stringify(data, null, 2)}
    
    Analyze the query and return matching entities. Consider:
    - Numerical comparisons (greater than, less than, equal to)
    - Text matching (contains, starts with, etc.)
    - List operations (includes, excludes)
    - Complex combinations of criteria
    
    Return a JSON object with:
    {
      "clients": [...matching client entities],
      "workers": [...matching worker entities], 
      "tasks": [...matching task entities],
      "interpretation": "how you interpreted the query",
      "matchCount": total_number_of_matches
    }
    
    Only return the JSON object, no other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error('Natural language search error:', error);
    return {
      clients: [],
      workers: [],
      tasks: [],
      interpretation: "Error processing query",
      matchCount: 0
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, data } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResults = await performNaturalLanguageSearch(query, data);

    res.status(200).json({
      success: true,
      query,
      results: searchResults
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}
