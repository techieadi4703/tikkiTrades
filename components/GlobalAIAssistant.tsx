'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getGlobalAIResponse, type ChatMessage } from '@/lib/actions/chatbot.actions';

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  Dashboard: [
    "What's happening in the market today?",
    "Which sectors are performing best?",
    "Summarize today's market outlook",
    "Explain what a stock heatmap shows",
  ],
  'Stock Details': [
    "What does the P/E ratio mean?",
    "Explain the Sentinel Score",
    "How to read candlestick charts?",
    "What are support and resistance levels?",
  ],
  Watchlist: [
    "Compare my top watchlist stocks",
    "Which stock has the highest volume?",
    "Explain dollar-cost averaging",
    "What makes a good entry point?",
  ],
  Portfolio: [
    "How should I diversify my portfolio?",
    "What is asset allocation?",
    "Explain unrealized vs realized P&L",
    "How to calculate portfolio returns?",
  ],
  Journal: [
    "How to write a good trade thesis?",
    "Analyze my recent trading sentiment.",
    "What's my biggest weakness right now?",
    "Generate my psychology profile.",
  ],
  Backtest: [
    "What is an SMA crossover?",
    "How does RSI mean reversion work?",
    "What is a good max drawdown?",
  ],
  Other: [
    "What's happening in the market today?",
    "Explain RSI indicator",
    "How do I journal my trades?",
    "Compare AAPL vs MSFT",
  ],
};

export default function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: "Hey! I'm **TikkiBot** 🤖 — your AI trading companion. I can help with market analysis, explain indicators, or guide you around the platform. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const currentPage = pathname === '/' ? 'Dashboard' 
    : pathname.startsWith('/stocks') ? 'Stock Details'
    : pathname.startsWith('/watchlist') ? 'Watchlist'
    : pathname.startsWith('/portfolio') ? 'Portfolio'
    : pathname.startsWith('/journal') ? 'Journal'
    : pathname.startsWith('/backtest') ? 'Backtest'
    : 'Other';

  const suggestions = PAGE_SUGGESTIONS[currentPage] || PAGE_SUGGESTIONS.Other;

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsTyping(true);

    const result = await getGlobalAIResponse(trimmed, messages, currentPage);

    setIsTyping(false);

    if (result.success && result.content) {
      setMessages(prev => [...prev, { role: 'bot', content: result.content! }]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center justify-center transition-shadow"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    TikkiBot <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground">AI Trading Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={`msg-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 opacity-50">
                    {msg.role === 'user' ? (
                      <>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">You</span>
                        <User size={9} />
                      </>
                    ) : (
                      <>
                        <Bot size={9} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">TikkiBot</span>
                      </>
                    )}
                  </div>
                  <div
                    className={
                      msg.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 text-white px-3.5 py-2.5 text-sm shadow-md'
                        : 'max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary/60 border border-border text-foreground px-3.5 py-2.5 text-sm shadow-sm'
                    }
                  >
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-strong:text-emerald-500 prose-strong:font-bold text-inherit">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 px-4 py-2.5 bg-secondary/40 border border-border rounded-2xl w-fit"
                >
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Suggested Questions (only show if few messages) */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap text-[10px] font-medium px-2.5 py-1.5 rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 transition-colors shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about markets..."
                  className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-20 transition-all active:scale-90 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
