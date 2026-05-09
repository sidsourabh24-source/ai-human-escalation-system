export async function syncLeadToHubspotMock(lead) {
  // Mock adapter for MVP so external CRM does not block development.
  // Simulate network flakiness (30% chance of failure)
  if (Math.random() < 0.3) {
    throw new Error("HubSpot API mock failure: Service Unavailable");
  }

  return {
    status: "mocked",
    syncedAt: new Date().toISOString(),
    lead
  };
}
