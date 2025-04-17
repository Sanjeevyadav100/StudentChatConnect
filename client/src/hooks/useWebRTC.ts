import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { webSocketService } from '@/lib/websocket';
import { WsMessage, WsMessageType } from '@shared/schema';

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionError: string | null;
}

export function useWebRTC(isConnected: boolean, partnerId: string | null) {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    connectionError: null,
  });
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Get user media
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: 'Could not access camera or microphone. Please check permissions.' 
      }));
      return null;
    }
  }, []);
  
  // Create or destroy peer connection based on connection status
  useEffect(() => {
    let mounted = true;
    
    const setupPeerConnection = async () => {
      // If we're connected and have a partner ID
      if (isConnected && partnerId) {
        // Get local media stream if we don't have one
        if (!localStreamRef.current) {
          const stream = await initializeLocalStream();
          if (!stream || !mounted) return;
        }
        
        createPeer(partnerId, true);
      } else {
        // Clean up existing peer connection
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        
        // Clean up remote stream
        setState(prev => ({ ...prev, remoteStream: null }));
      }
    };
    
    setupPeerConnection();
    
    // Clean up when component unmounts
    return () => {
      mounted = false;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [isConnected, partnerId, initializeLocalStream]);
  
  // Handle WebSocket messages for signaling
  useEffect(() => {
    const handleSignalingMessage = (message: WsMessage) => {
      if (!peerRef.current) return;
      
      if (message.type === 'webrtc-signal') {
        if (message.data && message.data.signal) {
          try {
            peerRef.current.signal(message.data.signal);
          } catch (error) {
            console.error('Error handling WebRTC signal:', error);
          }
        }
      }
    };
    
    const cleanup = webSocketService.addMessageListener(handleSignalingMessage);
    
    return cleanup;
  }, []);
  
  // Create Peer
  const createPeer = (peerId: string, isInitiator: boolean) => {
    try {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      const peer = new Peer({
        initiator: isInitiator,
        trickle: false,
        stream: localStreamRef.current || undefined,
      });
      
      // Handle signals (WebRTC offer, answer, ice candidates)
      peer.on('signal', (signal: any) => {
        // Send signal to the server to be relayed to the peer
        webSocketService.sendMessage({
          type: 'webrtc-signal' as WsMessageType,
          data: {
            peerId,
            signal,
          },
        });
      });
      
      // Handle remote stream
      peer.on('stream', (remoteStream: MediaStream) => {
        setState(prev => ({ ...prev, remoteStream }));
      });
      
      // Handle errors
      peer.on('error', (err: Error) => {
        console.error('Peer connection error:', err);
        setState(prev => ({ 
          ...prev, 
          connectionError: 'Video connection error. Please try reconnecting.' 
        }));
      });
      
      // Handle connection close
      peer.on('close', () => {
        setState(prev => ({ ...prev, remoteStream: null }));
      });
      
      peerRef.current = peer;
      
    } catch (error) {
      console.error('Error creating peer:', error);
    }
  };
  
  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const newState = !isVideoEnabled;
      
      videoTracks.forEach(track => {
        track.enabled = newState;
      });
      
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);
  
  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newState = !isAudioEnabled;
      
      audioTracks.forEach(track => {
        track.enabled = newState;
      });
      
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);
  
  // Clean up resources
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setState(prev => ({ ...prev, localStream: null, remoteStream: null }));
    }
  }, []);
  
  return {
    ...state,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    cleanup,
  };
}