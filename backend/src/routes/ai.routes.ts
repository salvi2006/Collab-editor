import { Router } from 'express';
import axios from 'axios';

const router = Router();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

router.post('/chat', async (req, res) => {
  const { prompt, codeContext } = req.body;

  if (!ANTHROPIC_API_KEY) {
    // Return mock response if no API key is set for development
    return res.json({ 
      response: "System: AI Assistant is running in Mock Mode because ANTHROPIC_API_KEY isn't set. I see your code is:\n\n```\n" + (codeContext ? codeContext.substring(0, 100) + "..." : "(empty)") + "\n```\n\nHow can I help you with it?"
    });
  }

  try {
    const aiResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Here is my current code context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nQuestion: ${prompt}`
        }
      ]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    res.json({ response: aiResponse.data.content[0].text });
  } catch (error: any) {
    console.error('Anthropic API Error', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to contact AI Assistant' });
  }
});

export default router;
