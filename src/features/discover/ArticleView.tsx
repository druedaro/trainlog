import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import type { DiscoverArticle } from '@/types/discover';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  recovery: { label: 'Recovery', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  training: { label: 'Training', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  nutrition: { label: 'Nutrition', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  mindset: { label: 'Mindset', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

interface ArticleViewProps {
  article: DiscoverArticle;
  onBack: () => void;
}

export function ArticleView({ article, onBack }: ArticleViewProps) {
  const catConfig = CATEGORY_CONFIG[article.category] ?? {
    label: article.category,
    color: 'text-muted-foreground',
    bg: 'bg-muted/10',
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      {/* Header with gradient */}
      <div className="relative overflow-hidden border-b border-border/40 px-5 pb-6 pt-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <Button
          variant="ghost"
          onClick={onBack}
          className="relative mb-4 gap-2 rounded-xl px-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            {article.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${catConfig.color}`}>
              {catConfig.label}
            </span>
            <h1 className="mt-1 text-lg font-bold leading-tight text-foreground">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-6 animate-slide-up">
        {/* Why this article */}
        <div className={`rounded-xl ${catConfig.bg} p-4`}>
          <p className="text-xs font-medium text-muted-foreground">
            💡 {article.reason}
          </p>
        </div>

        {/* Content */}
        <div className="prose-trainlog rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <ReactMarkdown
            components={{
              h2: ({ node, ...props }) => (
                <h2 className="mb-3 mt-5 text-sm font-bold uppercase tracking-wider text-foreground first:mt-0" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="mb-2 mt-4 text-sm font-semibold text-foreground" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-3 text-sm leading-relaxed text-foreground/90 last:mb-0" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="mb-3 list-disc pl-5 space-y-1.5 last:mb-0" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-sm leading-relaxed text-foreground/90" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-primary" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="text-muted-foreground" {...props} />
              ),
              hr: () => (
                <hr className="my-5 border-border/30" />
              ),
              img: ({ node, ...props }) => (
                <img className="mt-3 w-full max-w-sm rounded-xl border border-primary/20 shadow-sm" loading="lazy" {...props} />
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
