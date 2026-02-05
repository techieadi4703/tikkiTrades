"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { getBotResponse } from "@/lib/chatbot/watchlistChatbot";


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

  const WatchlistChatbot = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
      {
        role: "bot",
        content:
          "Hi! Ask me about any stock in your watchlist (price, change, volume).",
      },
    ]);

    const [input, setInput] = useState("");

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
      <div className="flex h-full flex-col rounded-xl border border-gray-700 bg-gray-900/40 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Watchlist Assistant</h2>
          <p className="text-sm text-gray-400">
            Get quick answers about your saved stocks.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-gray-950/60 p-3 text-sm">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto w-fit rounded-lg bg-yellow-500/20 px-3 py-2 text-right text-yellow-100"
                  : "w-fit rounded-lg bg-gray-800 px-3 py-2 text-gray-100"
              }
            >
              {message.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AAPL, TSLA, volume..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-yellow-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-400"
          >
            Send
          </button>
        </form>
      </div>
    );
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => {
    const isActive = sortKey === k;

    return (
      <button
        onClick={() => handleSort(k)}
        className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer"
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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="rounded-xl border border-gray-700 overflow-hidden lg:flex-1">
          <div
            className="grid bg-gray-900 px-4 py-3 text-sm text-gray-300"
            style={{
              gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
            }}
          >
            <div>★</div>
            <SortHeader label="Company" k="company" />
            <div>Symbol</div>
            <SortHeader label="Price" k="price" />
            <SortHeader label="Change" k="change" />
            <SortHeader label="Change %" k="changePercent" />
            <SortHeader label="Volume" k="volume" />
            <div className="text-center">Action</div>
          </div>

          {data.map((item) => {
            const isUp = item.change >= 0;

            return (
              <div
                key={item._id}
                className="grid items-center px-4 py-4 border-t border-gray-600"
                style={{
                  gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
                }}
              >
                <div>⭐</div>

                <Link
                  href={`/stocks/${item.symbol}`}
                  className="font-bold hover:text-yellow-400"
                >
                  {item.company}
                </Link>

                <div>{item.symbol}</div>
                <div>${item.price.toFixed(2)}</div>

                <div className={isUp ? "text-green-400" : "text-red-400"}>
                  {item.change.toFixed(2)}
                </div>

                <div className={isUp ? "text-green-400" : "text-red-400"}>
                  {item.changePercent.toFixed(2)}%
                </div>

                <div>{item.volume}</div>

                <div className="flex justify-end">
                  <WatchlistButton
                    symbol={item.symbol}
                    company={item.company}
                    isInWatchlist
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full lg:w-96">
          <WatchlistChatbot />
        </div>
      </div>
    </div>
  );
}
