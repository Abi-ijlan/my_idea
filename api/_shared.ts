import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const loadEnvFile = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined && (process.env[key] === undefined || process.env[key] === '')) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn(`Unable to load environment file ${filePath}:`, error);
  }
};

loadEnvFile(path.resolve('.env.local'));
loadEnvFile(path.resolve('.env'));

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
