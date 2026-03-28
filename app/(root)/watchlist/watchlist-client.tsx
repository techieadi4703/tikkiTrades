"use client";

import { useState, type FormEvent, useRef, useEffect } from "react";
import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { getBotResponse } from "@/lib/chatbot/watchlistChatbot";
import { motion, AnimatePresence } from "framer-motion";


type SortKey = "company" | "price" | "change" | "changePercent" | "volume";

type WatchlistItem = {
  _id: string;
  company: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

const WatchlistChatbot = ({ data }: { data: WatchlistItem[] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content:
        "Hi! Ask me about any stock in your watchlist (price, change, volume).",
    },
  ]);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const reply = getBotResponse(trimmed, data);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "bot", content: reply },
    ]);

    setInput("");
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
           </div>
           <div>
             <h2 className="text-sm font-bold text-white uppercase tracking-wider">Watchlist Assistant</h2>
             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">AI Powered Insights</p>
           </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scroll-smooth"
      >
        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-emerald-500 text-black px-4 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/10"
                : "mr-auto max-w-[80%] rounded-2xl bg-white/[0.05] border border-white/5 text-gray-200 px-4 py-2.5 text-sm leading-relaxed"
            }
          >
            {message.content}
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-2 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AAPL, price..."
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center"
          >
            Send
          </button>
        </div>
      </form>
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
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your primary market assets.</p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8 lg:flex-row items-start">
        {/* Main Table Container */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full lg:flex-1 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div
            className="grid bg-white/[0.03] px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5"
            style={{
              gridTemplateColumns: "50px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
            }}
          >
            <div className="flex justify-center">★</div>
            <SortHeader label="Company" k="company" />
            <div className="flex items-center">Symbol</div>
            <SortHeader label="Price" k="price" />
            <SortHeader label="Change" k="change" />
            <SortHeader label="Change %" k="changePercent" />
            <SortHeader label="Volume" k="volume" />
            <div className="text-right pr-4">Action</div>
          </div>

          <div className="divide-y divide-white/5">
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
                      gridTemplateColumns: "50px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
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

                    <div className="text-gray-500 text-sm font-mono">{item.volume.toLocaleString()}</div>

                    <div className="flex justify-end pr-2">
                      <div className="scale-90 origin-right group-hover:scale-95 transition-transform">
                        <WatchlistButton
                          symbol={item.symbol}
                          company={item.company}
                          isInWatchlist
                          onRemove={handleRemove}
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

        {/* Chatbot Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-[400px] lg:sticky lg:top-[100px]"
        >
          <WatchlistChatbot data={data} />
        </motion.div>
      </div>
    </div>
  );
}
