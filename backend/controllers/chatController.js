// ============================================================
// chatController.js — AI assistant proxy (Google Gemini)
// ============================================================
// The browser NEVER calls Gemini directly and never sees the API
// key. The widget posts a message here; this controller forwards
// it to the Gemini free-tier API using the server-side
// GEMINI_API_KEY and returns the assistant's reply.
//
// Escalation: the model is instructed to append the marker
// [[ESCALATE]] when a human representative should take over
// (pricing negotiation, complaints, account/legal issues, or
// anything it cannot confidently answer). We strip the marker and
// surface an `escalate` flag so the UI can offer the Contact page.
// ============================================================

const axios = require('axios');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Persona / knowledge for the assistant.
const SYSTEM_PROMPT = `You are "Ava", the AI virtual assistant for AI-Solutions, a Sunderland-based
start-up that uses artificial intelligence to improve the digital employee experience. AI-Solutions
offers AI-powered virtual assistants, rapid affordable prototyping, and bespoke software solutions
that speed up design, engineering and innovation for industry clients.

Your job: answer visitor questions about the company, its services, past projects, events and how to
get in touch. Be concise (2-4 sentences), warm, and professional. Never invent specific prices,
contracts, or personal data.

Escalate to a human by ending your reply with the exact marker [[ESCALATE]] when: the visitor asks
for pricing/quotes, wants to book or schedule a demo, raises a complaint, asks something you cannot
answer confidently, or explicitly asks to speak to a person. When you escalate, briefly tell them a
representative will help and suggest the Contact Us form.`;

// Keyword fallback so escalation still works if the model forgets the marker.
const ESCALATION_HINTS = [
  'human', 'representative', 'agent', 'real person', 'speak to someone',
  'price', 'pricing', 'quote', 'cost', 'complaint', 'refund', 'book a demo',
  'schedule a demo', 'sales',
];

function looksLikeEscalation(text) {
  const t = (text || '').toLowerCase();
  return ESCALATION_HINTS.some(k => t.includes(k));
}

// POST /api/chat   body: { message, history?: [{role, text}] }
async function chat(req, res, next) {
  try {
    const message = (req.body.message || '').toString().trim();
    if (!message) {
      return res.status(400).json({ message: 'Please enter a message.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 characters).' });
    }

    // Graceful degradation when the key isn't configured.
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply:
          "I'm not fully online right now, but our team would love to help. " +
          'Please use the Contact Us page and someone will get back to you shortly.',
        escalate: true,
      });
    }

    // Build conversation history (last 8 turns) in Gemini's format.
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
    const contents = history
      .filter(h => h && h.text)
      .map(h => ({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(h.text).slice(0, 1000) }],
      }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const { data } = await axios.post(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400, topP: 0.9 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    let reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(' ').trim() || '';

    let escalate = false;
    if (reply.includes('[[ESCALATE]]')) {
      escalate = true;
      reply = reply.replace(/\[\[ESCALATE\]\]/g, '').trim();
    }
    // Fallback signal from the user's own words.
    if (!escalate && looksLikeEscalation(message)) escalate = true;

    if (!reply) {
      reply =
        "I'm sorry, I didn't quite catch that. Could you rephrase, or reach our team via the Contact Us page?";
      escalate = true;
    }

    return res.json({ reply, escalate });
  } catch (err) {
    // Don't leak provider errors to the client — degrade gracefully.
    console.error('[Chat] Gemini error:', err.response?.data?.error?.message || err.message);
    return res.json({
      reply:
        "I'm having trouble reaching my AI service right now. Our team can help directly — " +
        'please use the Contact Us page and we will be in touch.',
      escalate: true,
    });
  }
}

module.exports = { chat };
