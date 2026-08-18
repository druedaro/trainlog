const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(apiDir, file), 'utf-8');
  
  // Replace model
  content = content.replace(/model:\s*'llama-3\.3-70b-versatile'/g, "model: 'openai/gpt-oss-20b'");
  
  // Remove response_format
  content = content.replace(/response_format:\s*{\s*type:\s*'json_object'\s*},?\n?/g, '');
  
  // Add max_tokens
  if (!content.includes('max_tokens:')) {
    content = content.replace(/(model:\s*'openai\/gpt-oss-20b',?)/g, "$1\n      max_tokens: 7000,");
  }
  
  // Update prompt word counts to be less restrictive
  content = content.replace(/400-600 words/gi, 'extensive');
  content = content.replace(/at least 500 words/gi, 'extensive');
  
  // Import jsonParser if not present
  if (content.includes('JSON.parse') && !content.includes('extractAndParseJSON')) {
    content = content.replace(/const\s+chatCompletion\s*=\s*await\s+groq\.chat\.completions/, "const { extractAndParseJSON } = await import('./lib/jsonParser.js');\n\n    const chatCompletion = await groq.chat.completions");
  }
  
  // Replace JSON.parse logic
  content = content.replace(/const\s+cleanedContent.*?\.trim\(\);\n\s*(const|let)\s+parsed\s*=\s*JSON\.parse\(cleanedContent\);/s, "const parsed = extractAndParseJSON(rawContent);");
  content = content.replace(/const\s+cleanedContent.*?\.trim\(\);\n\s*let\s+parsed.*?\n\s*try\s*{\s*parsed\s*=\s*JSON\.parse\(cleanedContent\);/s, "let parsed: any;\n\n    try {\n      parsed = extractAndParseJSON(rawContent);");

  fs.writeFileSync(path.join(apiDir, file), content);
}

const vercelJsonPath = path.join(__dirname, 'vercel.json');
let vercelJson = fs.readFileSync(vercelJsonPath, 'utf-8');
vercelJson = vercelJson.replace(/"maxDuration":\s*10/g, '"maxDuration": 60');
fs.writeFileSync(vercelJsonPath, vercelJson);

console.log("Done fixing APIs and Vercel timeouts.");
