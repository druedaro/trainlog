export function extractAndParseJSON(rawContent: string): any {
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let firstIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) firstIdx = Math.min(firstBrace, firstBracket);
  else if (firstBrace !== -1) firstIdx = firstBrace;
  else if (firstBracket !== -1) firstIdx = firstBracket;
  
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let lastIdx = -1;
  if (lastBrace !== -1 && lastBracket !== -1) lastIdx = Math.max(lastBrace, lastBracket);
  else if (lastBrace !== -1) lastIdx = lastBrace;
  else if (lastBracket !== -1) lastIdx = lastBracket;

  if (firstIdx !== -1 && lastIdx !== -1 && lastIdx >= firstIdx) {
    cleaned = cleaned.substring(firstIdx, lastIdx + 1);
  }
  
  return JSON.parse(cleaned);
}
