import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

// Uses native fetch — no SDK, no model path issue
async function testModel(model) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [{ parts: [{ text: "Say exactly: OK" }] }]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) throw new Error(`${data.error.code} ${data.error.status}: ${data.error.message.slice(0, 80)}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function main() {
  const candidates = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
  ];

  for (const model of candidates) {
    process.stdout.write(`${model}: `);
    try {
      const reply = await testModel(model);
      console.log(`✅ SUCCESS -> "${reply}"`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

main();
