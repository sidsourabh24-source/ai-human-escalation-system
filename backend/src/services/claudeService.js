export async function generateAssistantReply(userMessage) {
  if (!userMessage || !userMessage.trim()) {
    return "Could you share a bit more detail so I can help you better?";
  }

  return `AI: Thanks for sharing. I understood: ${userMessage}`;
}

export async function classifyEscalation(userMessage) {
  const text = (userMessage || "").toLowerCase();

  const anger = /(angry|frustrated|worst|useless|terrible|hate)/.test(text);
  const confusion = /(confused|don't understand|not clear|what do you mean)/.test(text);
  const buyingIntent = /(buy|pricing|plan|subscription|demo|enterprise)/.test(text);
  const manualRequest = /(human|agent|representative|talk to someone)/.test(text);

  const shouldEscalate = anger || confusion || buyingIntent || manualRequest;

  return {
    shouldEscalate,
    signals: {
      anger,
      confusion,
      buyingIntent,
      manualRequest
    }
  };
}
