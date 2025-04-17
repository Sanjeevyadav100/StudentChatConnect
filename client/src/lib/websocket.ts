import { WsMessage } from "@shared/schema";

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageListeners: ((message: WsMessage) => void)[] = [];
  private connectionStatusListeners: ((status: boolean) => void)[] = [];
  private reconnectInterval: number = 2000; // 2 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionallyClosed: boolean = false;

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    
    this.intentionallyClosed = false;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.notifyConnectionStatus(true);
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        this.notifyMessageListeners(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.notifyConnectionStatus(false);
      this.socket = null;
      
      // Only attempt to reconnect if not intentionally closed
      if (!this.intentionallyClosed) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  disconnect() {
    this.intentionallyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  sendMessage(message: WsMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
      this.connect(); // Try to reconnect
    }
  }
  
  addMessageListener(listener: (message: WsMessage) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }
  
  addConnectionStatusListener(listener: (status: boolean) => void) {
    this.connectionStatusListeners.push(listener);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
    };
  }
  
  private notifyMessageListeners(message: WsMessage) {
    this.messageListeners.forEach(listener => listener(message));
  }
  
  private notifyConnectionStatus(status: boolean) {
    this.connectionStatusListeners.forEach(listener => listener(status));
  }
  
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
