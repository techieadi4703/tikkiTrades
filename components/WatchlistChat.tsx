"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function WatchlistChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi 👋 I'm your trading assistant. Ask me anything about your watchlist.",
    },
  ]);
  const [input, setInput] = useState("");

const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage = input;

  // 1️⃣ Add user message to UI
  setMessages((prev) => [
    ...prev,
    { role: "user", content: userMessage },
  ]);

  // 2️⃣ Clear input
  setInput("");

  // 3️⃣ Show temporary thinking message
  setMessages((prev) => [
    ...prev,
    { role: "assistant", content: "Thinking..." },
  ]);

  // 4️⃣ Call backend chat API
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: userMessage }),
  });

  const data = await res.json();

  // 5️⃣ Replace "Thinking..." with AI reply
  setMessages((prev) => [
    ...prev.slice(0, -1),
    { role: "assistant", content: data.reply },
  ]);
};



  return (
    <div className="h-[90%] rounded-xl border border-gray-700 bg-gray-900 flex flex-col mt-10">
      {/* Header */}
      <div className="px-4 py-1 border-b border-gray-700">
        <h2 className="font-semibold text-lg">AI Assistant</h2>
        <p className="text-xs text-gray-400">
          Ask questions about your watchlist
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-yellow-500 text-black"
                : "mr-auto bg-gray-800 text-gray-200"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your watchlist..."
          className="flex-1 bg-black/40 border border-gray-600 rounded px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-yellow-500 text-black px-3 rounded flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
