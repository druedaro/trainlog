import re

phrase_code = """
const getEmpatheticPhrase = (mood: string | null) => {
  if (mood === 'very_negative' || mood === 'negative') {
    return "Has venido a pesar de todo, eso ya es mucho.";
  }
  if (mood === 'very_positive' || mood === 'positive') {
    return "Hoy te has regalado algo bueno.";
  }
  if (mood === 'neutral') {
    return "Paso a paso, sigues avanzando.";
  }
  return null;
};
"""

def fix_file(filepath, config_anchor, target, replacement):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "getEmpatheticPhrase" not in content:
        content = content.replace(config_anchor, phrase_code + '\n' + config_anchor)
    
    content = content.replace(target, replacement)
    
    with open(filepath, 'w') as f:
        f.write(content)

# AnalysisView.tsx
fix_file(
    'src/features/journal/AnalysisView.tsx',
    'const ENERGY_CONFIG',
    '''          <p className="text-sm italic leading-relaxed text-foreground/80">
            {analysis.reflectionPrompt}
          </p>''',
    '''          <p className="text-sm italic leading-relaxed text-foreground/80 mb-3">
            {analysis.reflectionPrompt}
          </p>
          {getEmpatheticPhrase(analysis.perceivedMood) && (
            <p className="text-xs font-medium text-foreground/60 border-t border-primary/10 pt-2">
              ✨ {getEmpatheticPhrase(analysis.perceivedMood)}
            </p>
          )}'''
)

# EntryDetail.tsx
fix_file(
    'src/features/journal/EntryDetail.tsx',
    'const ENERGY_CONFIG',
    '''              <p className="text-sm italic leading-relaxed text-foreground/80">
                {analysis.reflectionPrompt}
              </p>''',
    '''              <p className="text-sm italic leading-relaxed text-foreground/80 mb-3">
                {analysis.reflectionPrompt}
              </p>
              {getEmpatheticPhrase(analysis.perceivedMood) && (
                <p className="text-xs font-medium text-foreground/60 border-t border-primary/10 pt-2">
                  ✨ {getEmpatheticPhrase(analysis.perceivedMood)}
                </p>
              )}'''
)
