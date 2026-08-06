import { useState, useEffect, useRef } from 'react';
import { Send, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByDays } from '@/lib/firestore';
import { sendMessageToCoach } from '@/lib/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function CoachPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola, soy tu Coach personal. He estado analizando tu diario de entrenamiento. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus molestias, tu progresión o pedirme un resumen de tus entrenamientos recientes.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user entries on mount
  useEffect(() => {
    if (!user) return;
    async function loadEntries() {
      try {
        const data = await fetchEntriesByDays(user!.uid, 90);
        setEntries(data);
      } catch (err) {
        console.error('Error loading entries for coach', err);
      }
    }
    loadEntries();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send chat history (up to last 10 messages to avoid token bloat)
      const chatHistory = newMessages.slice(-10);
      const res = await sendMessageToCoach(chatHistory, entries, profile);
      
      setMessages([...newMessages, { role: 'assistant', content: res.response }]);
    } catch (err) {
      console.error('Coach chat error:', err);
      setError('Hubo un error al comunicarse con el coach. Intenta de nuevo.');
      setMessages(newMessages); // Keep the user's message
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background pb-[120px]">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5 flex items-center gap-3 h-16">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Entrenador</h1>
          <p className="text-[10px] font-medium text-muted-foreground leading-tight">Modo estricto basado en datos</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 pb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card/50 border border-border/40 text-foreground rounded-bl-sm prose prose-sm dark:prose-invert prose-p:leading-snug prose-p:m-0 prose-ul:m-0 prose-li:m-0'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card/50 border border-border/40 px-4 py-4">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-border/40 bg-background/80 backdrop-blur-md p-3 z-20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta a tu entrenador..."
            disabled={isLoading || entries.length === 0}
            className="flex-1 rounded-full border border-border/40 bg-card/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || entries.length === 0}
            size="icon"
            className="rounded-full shrink-0 h-[42px] w-[42px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {entries.length === 0 && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Cargando historial de entrenamiento...
          </p>
        )}
      </div>
    </div>
  );
}
