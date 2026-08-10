import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByDays } from '@/lib/firestore';
import { sendMessageToCoach } from '@/lib/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};


declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function CoachPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola, soy Anna, la coach que te acompaña en tu día a día. He estado analizando tu diario de entrenamiento. ¿En qué puedo ayudarte hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        toast.error(`Error en el micrófono: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = text.replace(/[*_#]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  
  useEffect(() => {
    if (!user) return;
    async function loadEntries() {
      try {
        const data = await fetchEntriesByDays(user!.uid, 90);
        setEntries(data);
      } catch (err) {
        toast.error('Error al cargar historial para el Coach.');
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
      
      const chatHistory = newMessages.slice(-10);
      const res = await sendMessageToCoach(chatHistory, entries, profile);
      
      setMessages([...newMessages, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setError('Hubo un error al comunicarse con el coach. Intenta de nuevo.');
      setMessages(newMessages); 
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
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-background pb-[120px] md:pb-[80px]">
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <h1 className="text-lg font-bold text-gradient">Personal Coach</h1>
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
                className={`max-w-[85%] rounded-3xl px-5 py-3.5 shadow-sm backdrop-blur-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card/60 border border-border/40 text-foreground rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="relative">
                    <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:m-0 prose-ul:my-2 prose-li:my-0.5 max-w-none break-words">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSpeech(msg.content)}
                        className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
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

      <div className="fixed bottom-[64px] md:bottom-0 left-1/2 -translate-x-1/2 md:ml-12 w-full max-w-3xl border-t border-border/40 bg-background/80 backdrop-blur-md p-4 z-20">
        <div className="flex gap-2">
          {window.SpeechRecognition || window.webkitSpeechRecognition ? (
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              size="icon"
              className={`rounded-full shrink-0 h-[42px] w-[42px] ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
              title={isListening ? "Detener grabación" : "Dictar por voz"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          ) : null}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta a tu coach..."
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
