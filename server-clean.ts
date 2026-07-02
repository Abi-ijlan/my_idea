/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/gemini/enhance', async (req, res) => {
  const { title, description, category, action } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

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
      config: action === 'enhance' ? {
        responseMimeType: 'application/json',
      } : undefined,
    });

    const text = response.text || '';
    if (action === 'enhance') {
      try {
        const parsed = JSON.parse(text.trim());
        return res.json(parsed);
      } catch (e) {
        console.error('Failed to parse JSON response from Gemini:', text, e);
        return res.json({ title: title + ' (Enhanced)', description: text.trim() });
      }
    }

    return res.json({ result: text.trim() });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while communicating with Gemini.' });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
