import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { webSocketService } from "@/lib/websocket";
import { 
  ConnectionStatus, 
  Message, 
  UserProfile, 
  WsMessage,
  WsMessageType
} from "@shared/schema";
import { generateId, formatDepartment } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatContextProps {
  userProfile: UserProfile | null;
  connectionStatus: ConnectionStatus;
  messages: Message[];
  isTyping: boolean;
  partnerInfo: string;
  partnerId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  handleStartChat: (profile: UserProfile) => void;
  handleSendMessage: (content: string) => void;
  handleTyping: (isTyping: boolean) => void;
  findNewPartner: () => void;
  handleVideoToggle: (enabled: boolean) => void;
  handleAudioToggle: (enabled: boolean) => void;
}

const defaultContextValue: ChatContextProps = {
  userProfile: null,
  connectionStatus: "disconnected",
  messages: [],
  isTyping: false,
  partnerInfo: "Waiting for partner...",
  partnerId: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  handleStartChat: () => {},
  handleSendMessage: () => {},
  handleTyping: () => {},
  findNewPartner: () => {},
  handleVideoToggle: () => {},
  handleAudioToggle: () => {}
};

const ChatContext = createContext<ChatContextProps>(defaultContextValue);

export const useChatContext = () => useContext(ChatContext);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState("Waiting for partner...");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const { toast } = useToast();

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (userProfile) {
      webSocketService.connect();
      
      // Add message and connection status listeners
      const messageCleanup = webSocketService.addMessageListener(handleWebSocketMessage);
      const connectionCleanup = webSocketService.addConnectionStatusListener(
        (isConnected) => {
          if (isConnected) {
            setConnectionStatus("waiting");
            sendJoinMessage();
          } else {
            setConnectionStatus("disconnected");
          }
        }
      );
      
      return () => {
        messageCleanup();
        connectionCleanup();
      };
    }
  }, [userProfile]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WsMessage) => {
    switch (message.type) {
      case "message":
        if (message.data && typeof message.data.content === "string") {
          addMessage({
            id: message.data.id || generateId(),
            senderId: "partner",
            content: message.data.content,
            timestamp: message.data.timestamp || Date.now()
          });
        }
        break;
      
      case "typing":
        setIsTyping(true);
        break;
      
      case "stopTyping":
        setIsTyping(false);
        break;
      
      case "partnerInfo":
        if (message.data) {
          const nickname = message.data.nickname || "Anonymous";
          const department = formatDepartment(message.data.department);
          const peerId = message.data.peerId;
          
          setPartnerInfo(`Chatting with: ${nickname} (${department})`);
          setPartnerId(peerId);
          setConnectionStatus("connected");
          
          // Add system message
          addMessage({
            id: generateId(),
            senderId: "system",
            content: "You're now connected with a random student.",
            timestamp: Date.now(),
            isSystem: true
          });
        }
        break;
      
      case "partnerDisconnected":
        setConnectionStatus("waiting");
        setPartnerInfo("Waiting for partner...");
        addMessage({
          id: generateId(),
          senderId: "system",
          content: "Your chat partner has disconnected.",
          timestamp: Date.now(),
          isSystem: true
        });
        
        toast({
          title: "Partner disconnected",
          description: "Your chat partner has left the chat.",
        });
        break;
      
      case "systemMessage":
        if (message.data && typeof message.data.content === "string") {
          addMessage({
            id: generateId(),
            senderId: "system",
            content: message.data.content,
            timestamp: Date.now(),
            isSystem: true
          });
        }
        break;
      
      default:
        console.log("Unhandled message type:", message.type);
    }
  }, [toast]);

  // Add a new message to the chat
  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  // Send a join message to the server
  const sendJoinMessage = useCallback(() => {
    if (!userProfile) return;
    
    const message: WsMessage = {
      type: "join",
      data: {
        nickname: userProfile.nickname || "Anonymous",
        department: userProfile.department
      }
    };
    
    webSocketService.sendMessage(message);
  }, [userProfile]);

  // Handle starting a chat
  const handleStartChat = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setConnectionStatus("connecting");
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback((content: string) => {
    if (connectionStatus !== "connected") return;
    
    const messageId = generateId();
    
    // Add message to local state
    addMessage({
      id: messageId,
      senderId: "currentUser",
      content,
      timestamp: Date.now()
    });
    
    // Send message to the server
    const message: WsMessage = {
      type: "message",
      data: {
        id: messageId,
        content,
        timestamp: Date.now()
      }
    };
    
    webSocketService.sendMessage(message);
  }, [connectionStatus, addMessage]);

  // Handle typing indicator
  const handleTyping = useCallback((isTyping: boolean) => {
    if (connectionStatus !== "connected") return;
    
    const message: WsMessage = {
      type: isTyping ? "typing" : "stopTyping",
      data: null
    };
    
    webSocketService.sendMessage(message);
  }, [connectionStatus]);

  // Handle finding a new partner
  const findNewPartner = useCallback(() => {
    if (connectionStatus === "disconnected") return;
    
    setConnectionStatus("waiting");
    setPartnerInfo("Waiting for partner...");
    setPartnerId(null);
    setMessages([]);
    setIsTyping(false);
    
    const message: WsMessage = {
      type: "findNewPartner",
      data: null
    };
    
    webSocketService.sendMessage(message);
  }, [connectionStatus]);
  
  // Handle video toggle
  const handleVideoToggle = useCallback((enabled: boolean) => {
    setIsVideoEnabled(enabled);
  }, []);
  
  // Handle audio toggle
  const handleAudioToggle = useCallback((enabled: boolean) => {
    setIsAudioEnabled(enabled);
  }, []);

  const contextValue: ChatContextProps = {
    userProfile,
    connectionStatus,
    messages,
    isTyping,
    partnerInfo,
    partnerId,
    isVideoEnabled,
    isAudioEnabled,
    handleStartChat,
    handleSendMessage,
    handleTyping,
    findNewPartner,
    handleVideoToggle,
    handleAudioToggle
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
