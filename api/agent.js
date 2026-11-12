module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let message = req.body && req.body.message;
    if (!message && typeof req.body === 'string') {
      try {
        message = JSON.parse(req.body).message;
      } catch (e) {}
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a helpful AI voice assistant for Blink Beyond, a digital marketing agency based in Palghar, Maharashtra, India. 
You help visitors navigate the website and learn about services including web development, social media management, branding, and performance marketing.
Keep responses concise and conversational, as they will be spoken aloud.

You can also issue navigation or scroll commands by including a "surfCommand" in your JSON response.

Available pages: / (home), /about.html (about us), /services.html (services), /contact.html (contact)
Available scroll targets (CSS selectors): #hero, #services, #about, #contact, footer

Always respond in this exact JSON format:
{
  "response": "Your spoken response here",
  "surfCommand": { "action": "navigate", "target": "/page.html" }
}
OR if no navigation/scroll needed:
{
  "response": "Your spoken response here"
}

For scroll actions use: { "action": "scroll", "target": "#section-id" }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Agent API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

