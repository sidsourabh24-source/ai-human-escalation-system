import { extractLeadData } from "./claudeService.js";

export async function buildLeadSnapshot(userMessage, signals) {
  const potentialLead = Boolean(signals?.buyingIntent);
  let summary = userMessage || "";

  if (potentialLead) {
    const extractedData = await extractLeadData(userMessage);
    summary = JSON.stringify(extractedData);
  }

  return {
    potentialLead,
    summary,
    source: "chat-widget"
  };
}
