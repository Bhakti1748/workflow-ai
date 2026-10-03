import React, { useState, useRef, useEffect } from 'react';
import { AssistantMessage } from '../types/assistant';
import { Task } from '../types/task';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

interface AssistantPageProps {
  tasks: Task[];
  onViewTaskDetails: (task: Task) => void;
}

const PRESET_QUERIES = [
  'What should I do first?',
  'What tasks are overdue?',
  'I have only 2 hours today. What should I complete?',
  'Break this task into smaller tasks.',
  'Create a message for my team about tomorrow’s deadline.',
];

// Helper to render markdown bolding, code spans and lists neatly
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }

        // Parse bold **text** and inline `code`
        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={pIdx} className="bg-slate-200/70 text-brand-800 px-1 py-0.5 rounded font-mono text-[11px]">
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-brand-500 font-bold mt-0.5">•</span>
              <span className="flex-1">{renderedLine}</span>
            </div>
          );
        }

        return <p key={idx}>{renderedLine}</p>;
      })}
    </div>
  );
};

export const AssistantPage: React.FC<AssistantPageProps> = ({ tasks, onViewTaskDetails }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        `Hello! I'm your **WorkFlow AI Agent**. I have real-time visibility into your **${tasks.length} workspace tasks**.\n\nAsk me for prioritized next steps, quick sprint plans, team updates, or bottleneck analysis.`,
      suggested_actions: [
        'What should I do first?',
        'I have only 2 hours today. What should I complete?',
        'Create a message for my team about tomorrow’s deadline.',
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: AssistantMessage = {
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.askAssistant(query, [...messages, userMsg]);
      const botMsg: AssistantMessage = {
        role: 'assistant',
        content: response.reply,
        highlighted_task_ids: response.highlighted_task_ids,
        suggested_actions: response.suggested_actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      addToast('error', 'Assistant query failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    addToast('info', 'Copied message', 'Assistant response copied to clipboard.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation reset. I am ready to analyze your **${tasks.length} tasks**! What would you like help with?`,
        suggested_actions: PRESET_QUERIES.slice(0, 3),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>WorkFlow AI Productivity Coach</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h2>
            <p className="text-xs text-slate-500">Grounded in your live SQLite task database</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-brand-50 border border-brand-200 text-brand-700 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50/90 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs'
                }`}
              >
                {/* Formatted Content */}
                <FormattedMessage content={msg.content} />

                {/* Highlighted Tasks chips */}
                {msg.highlighted_task_ids && msg.highlighted_task_ids.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Referenced Tasks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.highlighted_task_ids.map((taskId) => {
                        const targetTask = tasks.find((t) => t.id === taskId);
                        if (!targetTask) return null;
                        return (
                          <button
                            key={taskId}
                            onClick={() => onViewTaskDetails(targetTask)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-50 transition-colors shadow-2xs"
                          >
                            <span>{targetTask.title}</span>
                            <ArrowUpRight className="w-3 h-3 text-brand-500" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Actions */}
                {!isUser && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-wrap gap-1.5">
                    {msg.suggested_actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200/60 transition-colors shadow-2xs"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}

                {/* Copy button for bot response */}
                {!isUser && (
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-brand-600" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Analyzing task database with Gemini...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Bar */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-brand-600" />
          Quick:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset)}
            className="text-xs text-slate-600 hover:text-brand-700 bg-white hover:bg-brand-50/60 border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 shadow-2xs font-medium"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything about your tasks, priorities, or schedule..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white disabled:opacity-40 transition-all shadow-xs active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
