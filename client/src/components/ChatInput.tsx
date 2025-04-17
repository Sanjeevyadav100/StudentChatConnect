import { useState, KeyboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const ChatInput = ({ 
  onSendMessage, 
  onTyping,
  disabled = false 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;
    
    onSendMessage(trimmedMessage);
    setMessage("");
    
    // Let the server know user stopped typing
    onTyping(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Handle typing indicator with debounce
    if (newMessage && !disabled) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeout) {
        window.clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const timeout = window.setTimeout(() => {
        onTyping(false);
      }, 2000);
      
      setTypingTimeout(timeout);
    } else if (!newMessage) {
      onTyping(false);
      if (typingTimeout) {
        window.clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Waiting for connection..." : "Type a message..."}
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
          disabled={disabled}
        />
        <Button
          type="submit"
          className="bg-primary hover:bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center justify-center transition-colors"
          disabled={!message.trim() || disabled}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
