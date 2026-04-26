export async function syncLeadToHubspotMock(lead) {
  // Mock adapter for MVP so external CRM does not block development.
  return {
    status: "mocked",
    syncedAt: new Date().toISOString(),
    lead
  };
}
