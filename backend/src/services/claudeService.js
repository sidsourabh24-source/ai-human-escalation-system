import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey || "dummy-key" });
const MODEL = env.geminiModel || "gemini-2.0-flash";

// Helper: parse JSON safely from Gemini text output
function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function generateAssistantReply(userMessage) {
  if (!userMessage || !userMessage.trim()) {
    return "Could you share a bit more detail so I can help you better?";
  }

  if (!env.geminiApiKey) {
    return `AI: Thanks for sharing. I understood: ${userMessage}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: "You are a helpful customer support assistant. Keep your responses friendly, professional, and concise."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return "I'm having trouble thinking right now. Please hold on or try again later.";
  }
}

export async function classifyEscalation(userMessage) {
  const text = (userMessage || "").toLowerCase();

  const fallbackClassification = () => {
    const anger = /(angry|frustrated|worst|useless|terrible|hate)/.test(text);
    const confusion = /(confused|don't understand|not clear|what do you mean)/.test(text);
    const buyingIntent = /(buy|pricing|plan|subscription|demo|enterprise)/.test(text);
    const manualRequest = /(human|agent|representative|talk to someone)/.test(text);
    return {
      shouldEscalate: anger || confusion || buyingIntent || manualRequest,
      signals: { anger, confusion, buyingIntent, manualRequest }
    };
  };

  if (!env.geminiApiKey) return fallbackClassification();

  try {
    const prompt = `Analyze the user message and determine if it contains any of the following signals:
1. anger: User is angry, frustrated, or upset.
2. confusion: User is confused or doesn't understand something.
3. buyingIntent: User is asking about pricing, plans, or wants to buy/subscribe.
4. manualRequest: User explicitly asks to talk to a human, agent, or representative.

User message: "${userMessage}"

Respond ONLY with a valid JSON object:
{
  "anger": boolean,
  "confusion": boolean,
  "buyingIntent": boolean,
  "manualRequest": boolean
}`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const signals = parseJson(response.text);

    if (!signals) throw new Error("Could not parse JSON from Gemini response");

    const shouldEscalate = signals.anger || signals.confusion || signals.buyingIntent || signals.manualRequest;
    return { shouldEscalate, signals };
  } catch (error) {
    console.error("Gemini Escalation Error:", error.message);
    return fallbackClassification();
  }
}

export async function extractLeadData(userMessage) {
  if (!userMessage || !userMessage.trim() || !env.geminiApiKey) {
    return { name: null, email: null, company: null, budget: null, raw: userMessage };
  }

  try {
    const prompt = `Extract lead details from the user's message below.
Return a JSON object with these keys (use null if not found):
{
  "name": string | null,
  "email": string | null,
  "company": string | null,
  "budget": string | null
}
Respond ONLY with the JSON object.

User message: "${userMessage}"`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJson(response.text);
    if (parsed) return { ...parsed, raw: userMessage };
  } catch (error) {
    console.error("Gemini Lead Extraction Error:", error.message);
  }

  return { name: null, email: null, company: null, budget: null, raw: userMessage };
}

export async function generateConversationSummary(messages) {
  if (!messages || messages.length === 0) {
    return {
      issue: "No details available",
      points: [],
      actionsTaken: "None",
      status: "Waiting for information",
      priority: "Low",
      suggestedAction: "Wait for customer input"
    };
  }

  if (!env.geminiApiKey) {
    const userMessages = messages.filter(m => m.sender === "user");
    const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].body : "Customer needs help";
    return {
      issue: `User said: "${lastUserMsg}" (Mock Summary)`,
      points: ["User initiated chat", "Escalated to human agent"],
      actionsTaken: "System transferred chat",
      status: "Agent Active",
      priority: "Medium",
      suggestedAction: "Review conversation history and assist"
    };
  }

  try {
    const transcriptText = messages.map(m => `${m.sender}: ${m.body}`).join("\n");

    const prompt = `You are a real-time assistant helping a live support agent. Analyze the conversation transcript below and extract a concise summary.

Conversation:
${transcriptText}

Respond ONLY with a valid JSON object:
{
  "issue": "The main problem or reason the user is chatting",
  "points": ["key point 1", "key point 2"],
  "actionsTaken": "What has been done so far",
  "status": "Current state (e.g. Pending agent review, Troubleshooting, Waiting for user reply)",
  "priority": "Low | Medium | High | Critical",
  "suggestedAction": "What the agent should do next"
}`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJson(response.text);
    if (parsed) return parsed;
  } catch (error) {
    console.error("Gemini Summary Error:", error.message);
  }

  return {
    issue: "Could not generate summary",
    points: [],
    actionsTaken: "Unknown",
    status: "Error",
    priority: "Medium",
    suggestedAction: "Read the chat transcript manually"
  };
}
