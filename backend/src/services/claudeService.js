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
