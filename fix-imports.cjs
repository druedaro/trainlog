const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(apiDir, file), 'utf-8');
  
  // Remove dynamic import
  content = content.replace(/const\s*{\s*extractAndParseJSON\s*}\s*=\s*await\s+import\('\.\/lib\/jsonParser\.js'\);\n?/g, '');
  
  // Add static import at top if it contains extractAndParseJSON
  if (content.includes('extractAndParseJSON') && !content.includes("import { extractAndParseJSON }")) {
    content = "import { extractAndParseJSON } from './lib/jsonParser.js';\n" + content;
  }
  
  fs.writeFileSync(path.join(apiDir, file), content);
}
console.log("Imports fixed to static.");
