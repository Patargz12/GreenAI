import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';

interface ChatRequest {
  message: string;
  apiKey: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text: string;
      }>;
    };
  }>;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  const { message, apiKey } = req.body;

  if (!message || !apiKey) {
    return res.status(400).json({ error: 'Message and API key are required' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to get response from Gemini API' });
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ error: 'Invalid response format from Gemini API' });
    }

    const botResponse = data.candidates[0].content.parts?.[0]?.text;

    if (!botResponse) {
      return res.status(500).json({ error: 'No response text from Gemini API' });
    }

    res.json({ response: botResponse });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});