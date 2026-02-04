"use client";
import { useState } from "react";

export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-3 border-t border-gray-800 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Ask about your watchlist..."
        className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
      />
      <button
        onClick={submit}
        className="bg-yellow-500 text-black px-4 rounded font-medium"
      >
        Send
      </button>
    </div>
  );
}
