import { useEffect, useRef } from "react";
import { Message } from "@shared/schema";

interface MessageContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageContainer = ({ messages, isTyping }: MessageContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="p-4 h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800">
      {messages.length === 0 ? (
        <div className="flex justify-center mb-4">
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm max-w-xs">
            Waiting to connect...
          </div>
        </div>
      ) : (
        messages.map((message) => {
          if (message.isSystem) {
            return (
              <div key={message.id} className="flex justify-center mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm max-w-xs">
                  {message.content}
                </div>
              </div>
            );
          }

          const isCurrentUser = message.senderId === "currentUser";
          return (
            <div
              key={message.id}
              className={`flex mb-3 ${isCurrentUser ? "justify-end" : ""}`}
            >
              <div
                className={`${
                  isCurrentUser
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                } rounded-lg px-4 py-2 max-w-xs break-words`}
              >
                {message.content}
              </div>
            </div>
          );
        })
      )}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex mb-3">
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg px-4 py-2 flex space-x-1">
            <span
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageContainer;
