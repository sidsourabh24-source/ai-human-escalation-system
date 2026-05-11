import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

const anthropic = new Anthropic({
  apiKey: env.claudeApiKey || "dummy-key" // fallback so it doesn't crash on init if missing
});

export async function generateAssistantReply(userMessage) {
  if (!userMessage || !userMessage.trim()) {
    return "Could you share a bit more detail so I can help you better?";
  }

  // Fallback to mock if API key isn't provided
  if (!env.claudeApiKey) {
    return `AI: Thanks for sharing. I understood: ${userMessage}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: env.claudeModel,
      max_tokens: 500,
      messages: [{ role: "user", content: userMessage }],
      system: "You are a helpful customer support assistant. Keep your responses friendly, professional, and concise."
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Claude API error:", error);
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

  if (!env.claudeApiKey) {
    return fallbackClassification();
  }

  try {
    const response = await anthropic.messages.create({
      model: env.claudeModel,
      max_tokens: 150,
      messages: [{ role: "user", content: userMessage }],
      system: `Analyze the user message and determine if it contains any of the following signals:
1. anger: User is angry, frustrated, or upset.
2. confusion: User is confused or doesn't understand something.
3. buyingIntent: User is asking about pricing, plans, or wants to buy/subscribe.
4. manualRequest: User explicitly asks to talk to a human, agent, or representative.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "anger": boolean,
  "confusion": boolean,
  "buyingIntent": boolean,
  "manualRequest": boolean
}`
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const signals = JSON.parse(jsonMatch[0]);
    const shouldEscalate = signals.anger || signals.confusion || signals.buyingIntent || signals.manualRequest;

    return {
      shouldEscalate,
      signals
    };
  } catch (error) {
    console.error("Claude API Escalation Error:", error);
    return fallbackClassification();
  }
}

export async function extractLeadData(userMessage) {
  if (!userMessage || !userMessage.trim() || !env.claudeApiKey) {
    return { name: null, email: null, company: null, budget: null, raw: userMessage };
  }

  try {
    const response = await anthropic.messages.create({
      model: env.claudeModel,
      max_tokens: 200,
      messages: [{ role: "user", content: userMessage }],
      system: `Extract lead details from the user's message.
Return a JSON object with these keys (use null if not found):
{
  "name": string | null,
  "email": string | null,
  "company": string | null,
  "budget": string | null
}
Respond ONLY with the JSON object.`
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...parsed, raw: userMessage };
    }
  } catch (error) {
    console.error("Claude API Lead Extraction Error:", error);
  }
  
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

  if (!env.claudeApiKey) {
    const userMessages = messages.filter(m => m.sender === 'user');
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
    
    const response = await anthropic.messages.create({
      model: env.claudeModel,
      max_tokens: 300,
      messages: [{ role: "user", content: `Please summarize the following conversation.\n\n${transcriptText}` }],
      system: `Analyze the conversation transcript and provide a real-time summary for a support agent.
Extract the following information:
1. issue: The main problem or reason the user is chatting.
2. points: An array of strings representing the key discussion points or details shared so far.
3. actionsTaken: A brief description of what has been done so far (by the user or assistant).
4. status: Current state of the conversation (e.g., "Pending agent review", "Waiting for user reply", "Troubleshooting").
5. priority: Rate the urgency as "Low", "Medium", "High", or "Critical".
6. suggestedAction: A brief recommendation on what the agent should do next.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "issue": string,
  "points": string[],
  "actionsTaken": string,
  "status": string,
  "priority": string,
  "suggestedAction": string
}`
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Claude API Summary Error:", error);
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
