const fs = require('fs');
const path = require('path');

const coachFile = path.join(__dirname, 'api', 'chatWithCoach.ts');
let content = fs.readFileSync(coachFile, 'utf-8');

// Fix journal context and message mapping
content = content.replace(/const aiResponse = await ai\.models\.generateContent\(\{[\s\S]*?config: \{/g, `
    // Ensure contents starts with 'user' and alternates properly (Gemini requirement)
    // Also inject journalContext into the system prompt since we removed it before
    const finalSystemPrompt = dynamicSystemPrompt + "\\n\\nContexto del diario del usuario:\\n" + journalContext;

    const formattedMessages = [];
    for (const m of messages) {
      if (!m.content) continue;
      const role = m.role === 'user' ? 'user' : 'model';
      
      // Prevent consecutive same-role messages or starting with 'model'
      if (formattedMessages.length === 0 && role === 'model') continue;
      
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
        formattedMessages[formattedMessages.length - 1].parts[0].text += "\\n\\n" + m.content;
      } else {
        formattedMessages.push({ role, parts: [{ text: m.content }] });
      }
    }

    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', parts: [{ text: "Hola" }] });
    }

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedMessages,
      config: {
`);

content = content.replace(/systemInstruction: dynamicSystemPrompt,/, "systemInstruction: finalSystemPrompt,");

fs.writeFileSync(coachFile, content);
console.log("Fixed chatWithCoach.ts");
