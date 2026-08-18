const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(apiDir, file), 'utf-8');
  content = content.replace(/model:\s*'gemini-2\.5-flash'/g, "model: 'gemini-3.6-flash'");
  fs.writeFileSync(path.join(apiDir, file), content);
}
console.log("Model updated to gemini-3.6-flash.");
