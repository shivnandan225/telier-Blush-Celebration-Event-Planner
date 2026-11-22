import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/assistant', async (req, res) => {
  try {
    const {
      message = '',
      eventType = 'wedding',
      totalBudget = 25000,
      currencyCode = 'USD',
      estimatedGuests = 100,
      currentBudgetSummary = '',
      history = [],
    } = req.body ?? {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ai = getAiClient();

    const systemInstruction = `You are Atelier Blush, an expert celebratory event planner and financial advisor.
Your job is to help visitors choose an event type (wedding, birthday, corporate, shower, custom), quickly build a realistic, easy-to-follow budget in ANY requested currency (${currencyCode}), suggest smart cost-saving tips tailored specifically to their entered budget and guest count, and recommend a matching setup theme from these exact IDs:
- "garden_blush" (Romantic Garden Terrace — ideal for mid/balanced outdoor weddings & receptions)
- "grand_ballroom" (Grand Candlelight Ballroom — ideal for larger/luxury weddings & formal galas)
- "sunset_courtyard" (Coral Courtyard Lounge — ideal for milestone birthdays, evening parties & cocktail receptions)
- "minimalist_loft" (Sunlit Modern Loft — ideal for corporate galas, modern dinners & contemporary weddings)
- "botanical_brunch" (Botanical Conservatory Brunch — ideal for budget-smart daytime showers, anniversaries & intimate celebrations)

Rules:
1. Keep "reply" concise, warm, and actionable (2-4 sentences).
2. Always respect the user's currency (${currencyCode}) and scale numbers realistically to that currency (e.g., INR budgets are often in lakhs, JPY in hundreds of thousands/millions, USD/EUR/GBP/AUD/CAD/SGD in thousands).
3. When the user asks to plan a budget, selects an event type (e.g., wedding), or gives a budget number, set "shouldApplyBudget": true and return a complete 6-to-7 item "budgetBreakdown" whose "allocatedAmount" values sum cleanly to "recommendedTotalBudget".
4. For per-guest categories (Catering, Beverages/Bar, Guest Favors & Stationery), set "pricingMode": "per_guest" and calculate "unitCost" = round(allocatedAmount / max(1, recommendedGuests)). For fixed categories (Venue Rental, Photography & Video, Florals & Decor, Music & Entertainment, Attire & Styling), set "pricingMode": "fixed" and "unitCost" = allocatedAmount.
5. Provide 4 to 6 specific, practical "costSavingTips" directly tied to their budget size, guest count, and event type.`;

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((h: { role?: string; text?: string }) => `${h.role === 'user' ? 'Visitor' : 'Assistant'}: ${String(h.text || '').slice(0, 300)}`)
          .join('\n')
      : '';

    const prompt = `Current Workspace Context:
- Event Type: ${eventType}
- Currency: ${currencyCode}
- Target Total Budget: ${totalBudget} ${currencyCode}
- Estimated Guests: ${estimatedGuests}
- Current Budget Summary: ${currentBudgetSummary || 'Not yet populated'}

Recent Conversation:
${recentHistory || 'None'}

Latest Visitor Request:
${message.trim()}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Helpful, warm planner response explaining the recommended budget and theme.',
            },
            detectedEventType: {
              type: Type.STRING,
              enum: ['wedding', 'birthday', 'corporate', 'shower', 'custom'],
            },
            shouldApplyBudget: {
              type: Type.BOOLEAN,
              description: 'True when the budget breakdown should populate or update the active budget workspace.',
            },
            recommendedTotalBudget: {
              type: Type.NUMBER,
            },
            recommendedGuests: {
              type: Type.NUMBER,
            },
            recommendedThemeId: {
              type: Type.STRING,
              enum: ['garden_blush', 'grand_ballroom', 'sunset_courtyard', 'minimalist_loft', 'botanical_brunch'],
            },
            budgetBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  pricingMode: { type: Type.STRING, enum: ['fixed', 'per_guest'] },
                  unitCost: { type: Type.NUMBER },
                  allocatedAmount: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
                required: ['category', 'title', 'pricingMode', 'unitCost', 'allocatedAmount', 'notes'],
              },
            },
            costSavingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'reply',
            'detectedEventType',
            'shouldApplyBudget',
            'recommendedTotalBudget',
            'recommendedGuests',
            'recommendedThemeId',
            'budgetBreakdown',
            'costSavingTips',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error) {
    console.error('Assistant API error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to generate planning guidance.';
    res.status(500).json({ error: errMsg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Celebration Event Planner server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
