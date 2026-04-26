export function buildLeadSnapshot(userMessage, signals) {
  return {
    potentialLead: Boolean(signals?.buyingIntent),
    summary: userMessage || "",
    source: "chat-widget"
  };
}
