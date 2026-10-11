import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Loader2,
  MoreHorizontal,
  Clock,
  Info,
} from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const suggestions = [
  "Combien avons-nous d'employés ?",
  "Liste les départements actifs.",
  "Montre les contrats qui expirent bientôt.",
  "À quoi sert la page Analytics ?",
  "Que peut faire un RH ?",
  "Comment ajouter un département ?",
];

const WELCOME_MSG = "Bonjour ! 👋\n\nJe suis votre Assistant IA. Mon rôle est de vous aider à comprendre et utiliser la plateforme RH.\n\nJe peux vous expliquer les fonctionnalités, guider dans l'utilisation des modules, et répondre à vos questions sur le système.";

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, title: 'Bienvenue', lastMessage: 'Bonjour ! Comment puis-je vous aider ?', timestamp: new Date(), messageCount: 1 },
  ]);
  const [activeConversation, setActiveConversation] = useState<number | null>(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: WELCOME_MSG,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const history = messages.slice(1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await api.ai.chat(input.trim(), history);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation && c.title === 'Bienvenue'
            ? { ...c, title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '') }
            : c,
        ),
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      let friendlyMessage = `Désolé, une erreur est survenue : ${errorMsg}. Veuillez réessayer.`;

      if (errorMsg.includes('clé API') || errorMsg.includes('API key') || errorMsg.includes('configuration')) {
        friendlyMessage = "La clé API n'est pas configurée. Contactez l'administrateur.";
      } else if (errorMsg.includes('quota') || errorMsg.includes('dépassé')) {
        friendlyMessage = "Le quota API est dépassé. Veuillez réessayer plus tard.";
      } else if (errorMsg.includes('connexion') || errorMsg.includes('réseau')) {
        friendlyMessage = "Impossible de joindre le service IA. Vérifiez votre connexion.";
      }

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: friendlyMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now(),
      title: 'Nouvelle conversation',
      lastMessage: '',
      timestamp: new Date(),
      messageCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv.id);
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: WELCOME_MSG,
        timestamp: new Date(),
      },
    ]);
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: WELCOME_MSG,
        timestamp: new Date(),
      },
    ]);
  };

  const handleDeleteConversation = (id: number) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation === id) {
      setActiveConversation(conversations[0]?.id ?? null);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const showWelcome = messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-2xl border border-surface-200 overflow-hidden -m-6">
      {/* Sidebar */}
      <div
        className={cn(
          'flex flex-col bg-surface-50 border-r border-surface-200 transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
        )}
      >
        <div className="p-3 border-b border-surface-200">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-700 bg-white border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-surface-200 bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
            Récentes
          </p>
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={cn(
                'group flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5',
                activeConversation === conv.id
                  ? 'bg-white shadow-sm border border-surface-200'
                  : 'hover:bg-white/60',
              )}
            >
              <MessageSquare className="w-4 h-4 text-surface-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-700 truncate">{conv.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-surface-300" />
                  <span className="text-[10px] text-surface-400">{formatTime(conv.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-surface-900">AI Assistant</h2>
                <p className="text-[11px] text-surface-400">Mode Information & Guidance</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {showWelcome ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900 mb-2">
                  Bonjour ! 👋
                </h1>
                <p className="text-lg text-surface-600 mb-1">
                  Je suis votre Assistant IA.
                </p>
                <p className="text-sm text-surface-500 max-w-md mb-3">
                  Mon rôle est de vous aider à comprendre et utiliser la plateforme RH.
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 mb-10">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Je peux répondre à vos questions mais je ne peux pas effectuer d'actions directes sur les données.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(suggestion)}
                      className="group flex items-center gap-2.5 px-4 py-3 rounded-xl border border-surface-200 bg-white text-left text-sm text-surface-600 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 transition-all"
                    >
                      <span className="text-surface-400 group-hover:text-primary-500 transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 animate-fade-in',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={cn(
                          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                          message.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-surface-100 text-surface-800 rounded-bl-md',
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-surface-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-surface-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-surface-200 bg-white px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-surface-50 rounded-2xl border border-surface-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez une question sur la plateforme RH..."
                rows={1}
                className="flex-1 bg-transparent px-4 py-3.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none resize-none max-h-32"
                style={{ minHeight: '48px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={cn(
                  'm-2 p-2.5 rounded-xl transition-all',
                  input.trim() && !isTyping
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20'
                    : 'bg-surface-200 text-surface-400 cursor-not-allowed',
                )}
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-surface-400 text-center mt-2">
              Maj+Entrée pour un nouveau ligne · Entrée pour envoyer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
