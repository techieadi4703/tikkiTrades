"use client";

import { useState, type FormEvent, useRef, useEffect } from "react";
import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { ArrowUp, ArrowDown, ArrowUpDown, Sparkles, Send, User, Bot, HelpCircle } from "lucide-react";
import { getWatchlistAIResponse, type ChatMessage } from "@/lib/actions/chatbot.actions";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";


type SortKey = "company" | "price" | "change" | "changePercent";

type WatchlistItem = {
  _id: string;
  company: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="mr-auto flex gap-1 px-4 py-3 bg-white/[0.05] border border-white/5 rounded-2xl items-center"
  >
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
    />
  </motion.div>
);

const SuggestedQuestion = ({ question, onClick }: { question: string, onClick: (q: string) => void }) => (
  <button
    onClick={() => onClick(question)}
    className="group flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-gray-400 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 active:scale-95"
  >
    <HelpCircle size={12} className="text-gray-600 group-hover:text-emerald-500" />
    {question}
  </button>
);

const WatchlistChatbot = ({ data }: { data: WatchlistItem[] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content:
        "Hi! I'm your **Watchlist Assistant**. I can help you analyze prices, compare performance, or summarize your portfolio. What would you like to know?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsTyping(true);

    const result = await getWatchlistAIResponse(trimmed, data, messages);

    setIsTyping(false);

    if (result.success && result.content) {
      setMessages((prev) => [...prev, { role: "bot", content: result.content! }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble connecting to my brain. Please try again in a moment." },
      ]);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "Who is the top gainer today?",
    "Which stock has the highest price?",
    "Summarize my portfolio performance",
    "Identify any volatility patterns"
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
           </div>
           <div>
             <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Watchlist AI</h2>
             <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-tight flex items-center gap-1.5">
               <Sparkles size={10} />
               Premium Assistant
             </p>
           </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scroll-smooth"
      >
        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className={`flex items-center gap-2 mb-1.5 opacity-40 px-1`}>
              {message.role === "user" ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">You</span>
                  <User size={10} className="text-white" />
                </>
              ) : (
                <>
                  <Bot size={10} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Assistant</span>
                </>
              )}
            </div>
            
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 text-white px-4 py-3 text-sm font-medium shadow-xl shadow-emerald-900/20 border border-emerald-400/20"
                  : "max-w-[85%] rounded-2xl rounded-tl-none bg-white/[0.06] border border-white/10 text-gray-100 px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-md"
              }
            >
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-emerald-400 prose-strong:font-black">
                <ReactMarkdown 
                  components={{
                    table: ({node, ...props}) => <div className="overflow-x-auto my-2 rounded-lg border border-white/10"><table className="w-full text-xs" {...props} /></div>,
                    th: ({node, ...props}) => <th className="bg-white/5 px-2 py-1 text-left font-bold" {...props} />,
                    td: ({node, ...props}) => <td className="px-2 py-1 border-t border-white/5" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      <div className="flex-none p-5 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((q) => (
            <SuggestedQuestion key={q} question={q} onClick={handleSend} />
          ))}
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="relative group flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about performance, volume, insights..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-5 pr-12 py-4 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/20 shadow-inner group-hover:border-white/20"
              disabled={isTyping}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/[0.04] border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold text-gray-500">⌘↵</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="rounded-2xl bg-emerald-500 p-4 text-black hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale transition-all shadow-[0_0_25px_rgba(16,185,129,0.2)] active:scale-90 flex items-center justify-center shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default function WatchlistClient({
  initialData,
}: {
  initialData: WatchlistItem[];
}) {
  const [data, setData] = useState<WatchlistItem[]>(initialData);
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    const nextOrder =
      key === sortKey ? (order === "asc" ? "desc" : "asc") : "asc";

    const sorted = [...data].sort((a, b) => {
      const A = a[key];
      const B = b[key];

      if (typeof A === "string" && typeof B === "string") {
        return nextOrder === "asc"
          ? A.localeCompare(B)
          : B.localeCompare(A);
      }

      return nextOrder === "asc"
        ? Number(A) - Number(B)
        : Number(B) - Number(A);
    });

    setSortKey(key);
    setOrder(nextOrder);
    setData(sorted);
  };

  const handleRemove = (symbol: string) => {
    setData((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => {
    const isActive = sortKey === k;

    return (
      <button
        onClick={() => handleSort(k)}
        className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer"
      >
        {label}
        {isActive ? (
          order === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowUpDown size={14} className="opacity-40" />
        )}
      </button>
    );
  };

  return (
    <div className="p-4 md:p-8 md:pt-0 max-w-[1600px] mx-auto h-[calc(100vh-70px)] overflow-hidden flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-none mb-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your primary market assets.</p>
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row items-stretch min-h-0 pb-6">
        {/* Main Table Container */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div
            className="grid bg-white/[0.03] px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5"
            style={{
              gridTemplateColumns: "50px 2fr 1fr 1fr 1fr 1fr 1.5fr",
            }}
          >
            <div className="flex justify-center">★</div>
            <SortHeader label="Company" k="company" />
            <div className="flex items-center">Symbol</div>
            <SortHeader label="Price" k="price" />
            <SortHeader label="Change" k="change" />
            <SortHeader label="Change %" k="changePercent" />
            <div className="text-center">Action</div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 divide-y divide-white/5">
            <AnimatePresence mode="popLayout" initial={false}>
              {data.map((item, idx) => {
                const isUp = item.change >= 0;

                return (
                  <motion.div
                    key={item.symbol}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="grid items-center px-6 py-5 group hover:bg-white/[0.03] transition-all cursor-default"
                    style={{
                      gridTemplateColumns: "50px 2fr 1fr 1fr 1fr 1fr 1.5fr",
                    }}
                  >
                    <div className="flex justify-center">
                      <div className="text-emerald-500/40 group-hover:text-emerald-500 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">⭐</div>
                    </div>

                    <Link
                      href={`/stocks/${item.symbol}`}
                      className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate pr-4"
                    >
                      {item.company}
                    </Link>

                    <div className="text-gray-400 font-mono text-sm">{item.symbol}</div>
                    <div className="text-white font-mono font-medium">${item.price.toFixed(2)}</div>

                    <div className={`font-mono text-sm ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? '+' : ''}{item.change.toFixed(2)}
                    </div>

                    <div className={`font-mono text-sm px-2 py-0.5 rounded-md w-fit ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>

                    <div className="flex justify-center">
                      <div className="scale-90 group-hover:scale-95 transition-transform flex justify-center w-full max-w-[140px]">
                        <WatchlistButton
                          symbol={item.symbol}
                          company={item.company}
                          isInWatchlist
                          onRemove={handleRemove}
                          compact
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {data.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-500">Your watchlist is empty.</p>
                <Link href="/" className="text-emerald-500 hover:underline mt-2 inline-block">Explore markets</Link>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-[400px] h-full"
        >
          <WatchlistChatbot data={data} />
        </motion.div>
      </div>
    </div>
  );
}
