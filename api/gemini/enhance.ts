import { getGeminiClient } from '../_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, description, category, action } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
  }

  try {
    let prompt = '';

    if (action === 'enhance') {
      prompt = `You are a startup and product design mentor. Refine the following idea to make it highly compelling, professional, and clear, while retaining the core intent and tone.
Idea Title: ${title}
Category: ${category}
Description: ${description}

Respond with a JSON object containing two fields:
"title": "A refined, punchy, professional title"
"description": "A refined, highly compelling and clear description"

Do not include any other text or markdown outside of the JSON block.`;
    } else if (action === 'next-steps') {
      prompt = `You are an agile product strategist. Suggest exactly three highly actionable, sequential next steps to prototype and validate the following idea:
Idea Title: ${title}
Category: ${category}
Description: ${description}

Provide a concise, 3-bullet list of concrete next steps. Make each bullet clear, precise, and practical. Keep the response under 100 words.`;
    } else if (action === 'tech-stack') {
      prompt = `You are a senior software architect. Suggest a modern, production-ready technology stack (frontend, backend, database, hosting, or external APIs) tailored specifically for building this idea. Be specific and explain *why* each choice fits:
Idea Title: ${title}
Category: ${category}
Description: ${description}

Provide a concise, scannable response with modern tech suggestions. Keep it under 100 words.`;
    } else {
      return res.status(400).json({ error: 'Invalid action. Supported actions: enhance, next-steps, tech-stack' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: action === 'enhance' ? { responseMimeType: 'application/json' } : undefined,
    });

    const text = response.text || '';
    if (action === 'enhance') {
      try {
        const parsed = JSON.parse(text.trim());
        return res.status(200).json(parsed);
      } catch (error) {
        console.error('Failed to parse JSON response from Gemini:', text, error);
        return res.status(200).json({ title: `${title} (Enhanced)`, description: text.trim() });
      }
    }

    return res.status(200).json({ result: text.trim() });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while communicating with Gemini.' });
  }
}
