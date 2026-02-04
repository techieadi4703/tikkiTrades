export async function callLLM(prompt: string) {
  console.log("🔥 GEMINI PROMPT SENT:", prompt);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 350,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("❌ Gemini HTTP error:", errText);
    throw new Error("Gemini request failed");
  }

  const data = await response.json();

  // Gemini response shape
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("❌ Gemini empty response:", data);
    return "I couldn’t generate a response right now.";
  }

  return text.trim();
}
