export default function AgentDashboard() {
  const demoQueue = [
    {
      conversationId: "conv-demo-01",
      reason: "Buying intent",
      lastMessage: "I want pricing for team plans"
    },
    {
      conversationId: "conv-demo-02",
      reason: "Manual request",
      lastMessage: "Please connect me to a human"
    }
  ];

  return (
    <section className="card">
      <h2>Agent Dashboard</h2>
      <p className="muted">Week 4 module placeholder with live queue UI skeleton</p>

      {demoQueue.map((item) => (
        <article className="queueItem" key={item.conversationId}>
          <h3>{item.conversationId}</h3>
          <p><strong>Reason:</strong> {item.reason}</p>
          <p><strong>Last message:</strong> {item.lastMessage}</p>
          <button>Claim Conversation</button>
        </article>
      ))}
    </section>
  );
}
