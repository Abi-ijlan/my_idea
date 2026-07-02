/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Initialize Firebase Admin for secure server-side Firestore operations
const adminApp = getApps().length === 0 ? initializeApp() : getApp();

// Robustly load custom Firestore database ID from firebase-applet-config.json
let dbAdmin;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const databaseId = config.firestoreDatabaseId || '(default)';
  dbAdmin = getFirestore(adminApp, databaseId);
  console.log(`[Firebase Admin] Initialized Firestore with Database ID: "${databaseId}"`);
} catch (e) {
  console.error('[Firebase Admin] Failed to read firebase-applet-config.json, using default database', e);
  dbAdmin = getFirestore(adminApp);
}

const app = express();
app.use(express.json());

const PORT = 3000;

// Helper to send Telegram messages
async function sendTelegramMessage(token: string, chatId: number | string, text: string, parseMode: 'HTML' | 'Markdown' | null = 'HTML') {
  try {
    const payload: any = {
      chat_id: chatId,
      text: text,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to send Telegram message:', errText);
      // If HTML parsing failed due to unescaped entities (e.g. from Gemini or user input), retry as plain text!
      if (parseMode === 'HTML' && (errText.includes('can\'t parse entities') || errText.includes('bad request'))) {
        console.log('HTML parsing failed, retrying as plain text...');
        await sendTelegramMessage(token, chatId, text, null);
      }
    }
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}


// Initialize Gemini SDK with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint for Gemini AI Operations
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
    } else {
      return res.json({ result: text.trim() });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while communicating with Gemini.' });
  }
});

// GET /api/telegram/status - Returns whether the Telegram bot is configured and its info
app.get('/api/telegram/status', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.json({ configured: false });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!response.ok) {
      return res.json({ configured: true, active: false, error: 'Invalid Bot Token' });
    }
    const data = await response.json();
    const botUser = data.result;

    // Check webhook status
    const webhookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookData = await webhookRes.json();
    const webhookInfo = webhookData.result;

    // Write debug file for the developer to inspect
    try {
      const fs = await import('fs');
      fs.writeFileSync('./webhook_status_debug.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        webhookInfo
      }, null, 2));
    } catch (e) {
      console.error('Failed to write webhook status debug file:', e);
    }

    return res.json({
      configured: true,
      active: true,
      botUsername: botUser.username,
      botName: botUser.first_name,
      webhookUrl: webhookInfo?.url || '',
      hasWebhook: !!webhookInfo?.url,
      webhookInfo, // Include the full webhook info for debugging
    });
  } catch (e: any) {
    return res.json({ configured: true, active: false, error: e.message || 'Failed to fetch bot info' });
  }
});

// POST /api/telegram/register - Registers webhook with Telegram
app.post('/api/telegram/register', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is not configured in your Secrets panel.' });
  }

  const { appUrl } = req.body;
  
  // Robustly detect the real public application URL
  const detectedProto = req.headers['x-forwarded-proto'] || 'https';
  const detectedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const serverDetectedUrl = `${detectedProto}://${detectedHost}`;
  
  // Prefer process.env.APP_URL (injected by AI Studio) as it's guaranteed to be the correct public URL.
  // Fall back to server-detected URL, and then to client-provided appUrl.
  let finalAppUrl = process.env.APP_URL || serverDetectedUrl || appUrl || '';
  
  // If the URL is an internal/authenticated dev subdomain (ais-dev-*), map it to the public pre-shared URL (ais-pre-*)
  // so that Telegram's POST requests do not get caught in the 302 authentication redirect loop.
  if (finalAppUrl.includes('ais-dev-')) {
    finalAppUrl = finalAppUrl.replace('ais-dev-', 'ais-pre-');
  }

  // Strip any trailing slash
  finalAppUrl = finalAppUrl.replace(/\/$/, '');

  const webhookUrl = `${finalAppUrl}/api/telegram/webhook`;
  console.log(`[Telegram Register] Attempting registration for webhookUrl: "${webhookUrl}"`);

  try {
    const registerRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    if (!registerRes.ok) {
      const errText = await registerRes.text();
      throw new Error(`Telegram API returned: ${errText}`);
    }

    const registerData = await registerRes.json();
    if (!registerData.ok) {
      throw new Error(registerData.description || 'Registration failed');
    }

    // Get bot username
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    console.log(`[Telegram Register] Webhook successfully registered: "${webhookUrl}". Bot username: "@${meData.result?.username}"`);

    return res.json({
      success: true,
      webhookUrl,
      botUsername: meData.result?.username || '',
    });
  } catch (error: any) {
    console.error('[Telegram Register] Error registering telegram webhook:', error);
    return res.status(500).json({ error: error.message || 'Failed to register webhook' });
  }
});

// POST /api/telegram/webhook - Main webhook receiver for Telegram messages
app.post('/api/telegram/webhook', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  // Log request for debugging
  try {
    const fs = await import('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
    };
    fs.appendFileSync('./webhook_log.json', JSON.stringify(logData, null, 2) + '\n---\n');
  } catch (err) {
    console.error('Failed to write webhook log:', err);
  }

  if (!token) {
    return res.status(200).send('OK (Token not configured)');
  }

  try {
    const { message } = req.body;
    if (!message || !message.chat || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Check if it's a deep-linked start command: /start <uid>
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const linkedUid = parts[1];
        
        // Save association in Firestore (admin bypasses standard client rules)
        await dbAdmin.collection('telegram_users').doc(chatId.toString()).set({
          userId: linkedUid,
          firstName: message.from?.first_name || 'User',
          username: message.from?.username || '',
          linkedAt: Date.now(),
        });

        await sendTelegramMessage(token, chatId, `🎉 <b>Connection Successful!</b>\n\nYour Telegram account is now linked to your IdeaVault.\n\nYou can interact with your second brain using these commands:\n\n• 📝 <b>/add &lt;Title&gt; - &lt;Description&gt;</b> - Create a new idea\n• 📋 <b>/list</b> - View all of your ideas\n• 🔍 <b>/search &lt;query&gt;</b> - Find specific ideas\n• 💡 Or just <b>ask me any question</b>, and I will query your ideas to answer you!`);
        return res.sendStatus(200);
      } else {
        // Just general /start without link
        // Check if already linked
        const linkDoc = await dbAdmin.collection('telegram_users').doc(chatId.toString()).get();
        if (linkDoc.exists) {
          await sendTelegramMessage(token, chatId, `Welcome back! 💡 Your account is linked.\n\nUse <b>/list</b> to see ideas, <b>/add</b> to save a new one, or ask me a question!`);
        } else {
          await sendTelegramMessage(token, chatId, `💡 <b>Welcome to IdeaVault Assistant!</b>\n\nTo search or save your ideas, please link your Telegram account first by clicking the <b>Link Telegram</b> button in the IdeaVault web application.`);
        }
        return res.sendStatus(200);
      }
    }

    // Check link status
    const linkDoc = await dbAdmin.collection('telegram_users').doc(chatId.toString()).get();
    if (!linkDoc.exists) {
      await sendTelegramMessage(token, chatId, `🔒 <b>Account Not Linked</b>\n\nPlease link your Telegram account first from the IdeaVault web app to chat with your second brain.`);
      return res.sendStatus(200);
    }

    const { userId } = linkDoc.data()!;

    // Process Command /add
    if (text.startsWith('/add')) {
      const content = text.replace('/add', '').trim();
      if (!content) {
        await sendTelegramMessage(token, chatId, `⚠️ <b>Invalid format!</b>\n\nUse: <code>/add Title - Description</code>`);
        return res.sendStatus(200);
      }

      let title = content;
      let description = 'Added via Telegram';
      
      const dashIndex = content.indexOf('-');
      if (dashIndex !== -1) {
        title = content.substring(0, dashIndex).trim();
        description = content.substring(dashIndex + 1).trim();
      }

      // Add to Firestore using Admin SDK
      const newId = `tg-${Date.now()}`;
      await dbAdmin.collection('ideas').doc(newId).set({
        title,
        description,
        category: 'Other',
        color: 'cyan',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        userId: userId,
      });

      await sendTelegramMessage(token, chatId, `📝 <b>Idea Saved Successfully!</b>\n\n<b>Title:</b> ${title}\n<b>Description:</b> ${description}\n\nIt is now safely tucked inside your IdeaVault!`);
      return res.sendStatus(200);
    }

    // Process Command /list
    if (text === '/list') {
      const ideasSnapshot = await dbAdmin.collection('ideas')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      if (ideasSnapshot.empty) {
        await sendTelegramMessage(token, chatId, `💡 You haven't added any ideas to your Vault yet! Send an idea from the web app or use <code>/add Title - Description</code> here.`);
        return res.sendStatus(200);
      }

      let replyText = `📋 <b>Your Recent Ideas:</b>\n\n`;
      let count = 1;
      ideasSnapshot.forEach((doc) => {
        const data = doc.data();
        replyText += `${count}. <b>${data.title}</b> (${data.category || 'Other'})\n<i>${data.description ? data.description.substring(0, 80) + (data.description.length > 80 ? '...' : '') : 'No description'}</i>\n\n`;
        count++;
      });

      await sendTelegramMessage(token, chatId, replyText);
      return res.sendStatus(200);
    }

    // Process Command /search
    if (text.startsWith('/search')) {
      const queryStr = text.replace('/search', '').trim().toLowerCase();
      if (!queryStr) {
        await sendTelegramMessage(token, chatId, `⚠️ <b>Please specify search term!</b>\n\nUse: <code>/search AI</code>`);
        return res.sendStatus(200);
      }

      const ideasSnapshot = await dbAdmin.collection('ideas')
        .where('userId', '==', userId)
        .get();

      const matching: any[] = [];
      ideasSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.title && data.title.toLowerCase().includes(queryStr)) ||
          (data.description && data.description.toLowerCase().includes(queryStr)) ||
          (data.category && data.category.toLowerCase().includes(queryStr))
        ) {
          matching.push(data);
        }
      });

      if (matching.length === 0) {
        await sendTelegramMessage(token, chatId, `🔍 No ideas found matching "<b>${queryStr}</b>".`);
        return res.sendStatus(200);
      }

      let replyText = `🔍 <b>Search Results for "${queryStr}":</b>\n\n`;
      matching.slice(0, 8).forEach((data, index) => {
        replyText += `${index + 1}. <b>${data.title}</b>\n<i>${data.description}</i>\n\n`;
      });

      if (matching.length > 8) {
        replyText += `<i>And ${matching.length - 8} more ideas...</i>`;
      }

      await sendTelegramMessage(token, chatId, replyText);
      return res.sendStatus(200);
    }

    if (text === '/help') {
      await sendTelegramMessage(token, chatId, `💡 <b>IdeaVault Telegram Assistant</b>\n\nHere are the commands you can use:\n\n• 📝 <code>/add Title - Description</code> - Create a new idea\n• 📋 <code>/list</code> - View your 10 most recent ideas\n• 🔍 <code>/search &lt;query&gt;</code> - Search your ideas\n• 💡 Or just <b>type any question</b> (e.g. "Suggest improvements for my coffee idea") and I will consult your ideas!`);
      return res.sendStatus(200);
    }

    // Smart general chat question using Gemini over their IdeaVault
    const ideasSnapshot = await dbAdmin.collection('ideas')
      .where('userId', '==', userId)
      .get();

    const allUserIdeas = ideasSnapshot.docs.map(doc => {
      const data = doc.data();
      return { title: data.title, description: data.description, category: data.category };
    });

    const prompt = `You are a brilliant, supportive Second Brain coach helping a creative innovator review their saved ideas.
The user is asking: "${text}"

Here is their full list of saved ideas from their IdeaVault database:
${JSON.stringify(allUserIdeas)}

Answer their question by referencing, summarizing, connecting, or brainstorming around their ideas. 
Be helpful, concise, engaging, and personal. Keep the response under 150 words. Format with clean, readable text using bold headers if needed. Avoid using internal markdown tags or raw JSON.`;

    try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const reply = aiResponse.text || "I was unable to process that. Please try again.";
      await sendTelegramMessage(token, chatId, reply);
    } catch (err: any) {
      console.error('Gemini error for Telegram:', err);
      await sendTelegramMessage(token, chatId, `🤖 Sorry, I had some trouble reading your ideas or consulting Gemini. Details: ${err.message || 'Unknown error'}`);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Telegram Webhook error:', error);
    return res.sendStatus(200); // Always 200 for telegram
  }
});

// Vite middleware setup for assets and SPA
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
