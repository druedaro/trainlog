const { Groq } = require("groq-sdk");
require("dotenv").config({ path: ".env.local" });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function run() {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: `You are a sports science writer. Output exactly 1 article. CONCISENESS: Articles must be short and impactful. Each article's 'content' MUST be strictly between 250 and 270 characters in length. This is a critical constraint. Respond ONLY with a valid raw JSON object matching this exact structure: {"articles": [{"id":"string", "title":"string", "emoji":"string", "category":"general", "content":"string", "reason":"string", "imageKeyword":"string"}]}` },
      { role: 'user', content: 'Generate articles now.' },
    ],
    model: 'llama-3.1-70b-versatile',
    temperature: 0.5,
    response_format: { type: 'json_object' }
  });
  console.log(chatCompletion.choices[0]?.message?.content);
}
run().catch(console.error);
