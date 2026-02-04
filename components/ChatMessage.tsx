import { ChatMessage as ChatMessageType } from "@/types/chat";

export default function ChatMessage({
  message,
}: {
  message: ChatMessageType;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
        isUser
          ? "ml-auto bg-yellow-500 text-black"
          : "bg-gray-800 text-gray-100"
      }`}
    >
      {message.content}
    </div>
  );
}
