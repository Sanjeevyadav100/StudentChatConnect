import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@shared/schema";
import { useWebRTC } from "@/hooks/useWebRTC";

interface VideoChatProps {
  connectionStatus: ConnectionStatus;
  partnerId: string | null;
  onVideoToggle: (enabled: boolean) => void;
  onAudioToggle: (enabled: boolean) => void;
}

const VideoChat = ({ 
  connectionStatus, 
  partnerId,
  onVideoToggle, 
  onAudioToggle 
}: VideoChatProps) => {
  const isConnected = connectionStatus === "connected";
  
  const { 
    localStream,
    remoteStream,
    connectionError,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio
  } = useWebRTC(isConnected, partnerId);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Set local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Set remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Notify parent component of video/audio toggle
  useEffect(() => {
    onVideoToggle(isVideoEnabled);
  }, [isVideoEnabled, onVideoToggle]);
  
  useEffect(() => {
    onAudioToggle(isAudioEnabled);
  }, [isAudioEnabled, onAudioToggle]);
  
  // Only show video interface when connected
  const isVideoVisible = isConnected;
  const isLoading = isConnected && (!localStream || !remoteStream);
  
  const handleToggleVideo = () => {
    toggleVideo();
  };
  
  const handleToggleAudio = () => {
    toggleAudio();
  };

  return (
    <div className="relative">
      {/* Main video container */}
      <div className={`flex flex-col space-y-3 transition-opacity duration-300 ${isVideoVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Video streams */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {/* Remote video (main) */}
          {remoteStream ? (
            <video 
              ref={remoteVideoRef}
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-center">Waiting for partner's video...</p>
            </div>
          )}
          
          {/* Local video (Picture-in-Picture) */}
          {localStream && (
            <div className="absolute right-2 top-2 w-1/4 aspect-video rounded-md overflow-hidden border-2 border-white shadow-lg">
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Connection error */}
          {connectionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-red-600 text-white p-3 rounded-lg max-w-xs text-center">
                <p className="font-medium">{connectionError}</p>
              </div>
            </div>
          )}
          
          {/* Video loading state */}
          {isLoading && !connectionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="flex flex-col items-center text-white">
                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting video...</span>
              </div>
            </div>
          )}
          
          {/* Video controls */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full p-2 ${!isAudioEnabled ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800'}`}
              onClick={handleToggleAudio}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full p-2 ${!isVideoEnabled ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800'}`}
              onClick={handleToggleVideo}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;