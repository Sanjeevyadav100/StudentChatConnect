import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";
import ChatHeader from "./ChatHeader";
import MessageContainer from "./MessageContainer";
import ChatInput from "./ChatInput";
import ConnectionOverlay from "./ConnectionOverlay";
import DisconnectionNotification from "./DisconnectionNotification";
import VideoChat from "./VideoChat";
import { useChatContext } from "@/contexts/ChatContext";

const ChatApp = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check user preference or system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const {
    connectionStatus,
    messages,
    userProfile,
    partnerInfo,
    partnerId,
    isTyping,
    isVideoEnabled,
    isAudioEnabled,
    handleStartChat,
    handleSendMessage,
    handleTyping,
    findNewPartner,
    handleVideoToggle,
    handleAudioToggle
  } = useChatContext();

  // Show onboarding modal if user profile is not set
  const isOnboardingVisible = !userProfile;
  
  // Handle disconnect notification visibility
  const [showDisconnectNotification, setShowDisconnectNotification] = useState(false);
  
  // Update document class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Show disconnect notification when partner disconnects
  useEffect(() => {
    if (connectionStatus === 'waiting' && messages.length > 0) {
      setShowDisconnectNotification(true);
      
      // Auto dismiss notification after 3 seconds
      const timer = setTimeout(() => {
        setShowDisconnectNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, messages.length]);
  
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  
  const dismissNotification = () => {
    setShowDisconnectNotification(false);
  };
  
  // Check if connection overlay should be visible
  const isConnectionOverlayVisible = 
    connectionStatus === 'connecting' || 
    connectionStatus === 'waiting';
  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 font-sans min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 relative">
        {isOnboardingVisible && <OnboardingModal onSubmit={handleStartChat} />}
        
        <ChatHeader 
          connectionStatus={connectionStatus} 
          partnerInfo={partnerInfo}
          onNextClick={findNewPartner} 
          onToggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
        />

        {/* Video Chat */}
        <VideoChat 
          connectionStatus={connectionStatus}
          partnerId={partnerId}
          onVideoToggle={handleVideoToggle}
          onAudioToggle={handleAudioToggle}
        />
        
        <MessageContainer 
          messages={messages} 
          isTyping={isTyping} 
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping} 
          disabled={connectionStatus !== 'connected'}
        />
        
        <ConnectionOverlay 
          isVisible={isConnectionOverlayVisible} 
          status={connectionStatus} 
        />
        
        <DisconnectionNotification 
          isVisible={showDisconnectNotification} 
          onDismiss={dismissNotification} 
        />
      </div>
    </div>
  );
};

export default ChatApp;
