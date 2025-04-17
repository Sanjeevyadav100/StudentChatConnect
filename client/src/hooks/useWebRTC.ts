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
      console.log('Requesting media access...');
      
      // First check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video calls');
      }
      
      // Try to get the user media with fallback options
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      }).catch(async () => {
        console.log('Failed with video and audio, trying audio only...');
        return navigator.mediaDevices.getUserMedia({ 
          video: false, 
          audio: true 
        });
      });
      
      console.log('Media access granted:', stream.getTracks().map(t => t.kind).join(', '));
      
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
      console.log(`Setting up peer connection. Connected: ${isConnected}, Partner ID: ${partnerId}`);
      
      // Cleanup if disconnected or partner changed
      if (!isConnected || !partnerId) {
        // Clean up existing peer connection
        if (peerRef.current) {
          console.log('Cleaning up: destroying peer connection');
          peerRef.current.destroy();
          peerRef.current = null;
        }
        
        // Clean up remote stream
        setState(prev => ({ ...prev, remoteStream: null }));
        return;
      }
      
      // If we're connected and have a partner ID
      if (isConnected && partnerId) {
        console.log('Connection active, preparing for video chat');
        
        try {
          // Always ensure we have a fresh local stream
          if (!localStreamRef.current) {
            console.log('No local stream, initializing...');
            const stream = await initializeLocalStream();
            
            if (!stream) {
              console.error('Failed to get local stream');
              if (mounted) {
                setState(prev => ({ 
                  ...prev, 
                  connectionError: 'Could not access your camera or microphone' 
                }));
              }
              return;
            }
            
            if (!mounted) return;
          }
          
          // Both peers should not create an offer at the same time
          // Let's determine if we should be the initiator based on a deterministic algorithm
          // We'll compare the peer IDs and make the one with the "greater" ID be the initiator
          const shouldInitiate = (userId: string): boolean => {
            // If we don't have both IDs, default to not initiating
            if (!partnerId) return false;
            
            // Generate a "random" number from the user ID
            const hash = (id: string): number => 
              id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              
            const ourHash = hash(userId);
            const theirHash = hash(partnerId);
            
            console.log(`Initiator decision: our hash ${ourHash}, their hash ${theirHash}`);
            return ourHash > theirHash;
          };
          
          // Get our user ID from the signaling system
          const ourUserId = webSocketService.getUserId();
          const willInitiate = shouldInitiate(ourUserId);
          
          console.log(`Decided ${willInitiate ? 'to' : 'not to'} be the initiator`);
          createPeer(partnerId, willInitiate);
        } catch (err) {
          console.error('Error in setupPeerConnection:', err);
        }
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
      if (message.type === 'webrtc-signal') {
        if (message.data && message.data.signal) {
          try {
            console.log('Received WebRTC signal from server:', typeof message.data.signal);
            
            // If we don't have a peer yet and we're not the initiator,
            // we need to create one to accept the offer
            if (!peerRef.current && isConnected && partnerId && message.data.peerId === partnerId) {
              console.log('Creating non-initiator peer to accept incoming signal');
              
              if (!localStreamRef.current) {
                console.error('Cannot create peer - no local stream available');
                return;
              }
              
              // Create peer as non-initiator
              createPeer(partnerId, false);
            }
            
            // Now process the signal
            if (peerRef.current) {
              console.log('Processing signal in existing peer');
              peerRef.current.signal(message.data.signal);
            } else {
              console.error('No peer connection to handle signal');
            }
          } catch (error) {
            console.error('Error handling WebRTC signal:', error);
          }
        }
      }
    };
    
    const cleanup = webSocketService.addMessageListener(handleSignalingMessage);
    
    return cleanup;
  }, [isConnected, partnerId]);
  
  // Create WebRTC Peer
  const createPeer = (peerId: string, isInitiator: boolean) => {
    try {
      console.log(`Creating peer connection. Initiator: ${isInitiator}, Peer ID: ${peerId}`);
      
      // Make sure we have a local stream before creating a peer
      if (!localStreamRef.current) {
        console.error('Attempted to create peer without local stream');
        return;
      }

      // Clean up existing peer connection if any
      if (peerRef.current) {
        console.log('Destroying existing peer connection');
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      // Configure peer options
      const peerOptions = {
        initiator: isInitiator,
        trickle: true, // Using trickle ICE for better connectivity
        stream: localStreamRef.current,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      };
      
      console.log('Creating new Peer with options:', JSON.stringify(peerOptions, null, 2));
      const peer = new Peer(peerOptions);
      
      // Handle signals (WebRTC offer, answer, ice candidates)
      peer.on('signal', (signal: any) => {
        console.log('Received signal from peer library:', JSON.stringify(signal).slice(0, 100) + '...');
        
        // Send signal to the server to be relayed to the peer
        webSocketService.sendMessage({
          type: 'webrtc-signal' as WsMessageType,
          data: {
            peerId,
            signal,
          },
        });
      });
      
      // Log when peer connection is established
      peer.on('connect', () => {
        console.log('Peer connection established!');
      });
      
      // Handle remote stream
      peer.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream:', remoteStream.getTracks().map(t => t.kind).join(', '));
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
        console.log('Peer connection closed');
        setState(prev => ({ ...prev, remoteStream: null }));
      });
      
      peerRef.current = peer;
      
    } catch (error) {
      console.error('Error creating peer:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: 'Failed to create video connection.' 
      }));
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