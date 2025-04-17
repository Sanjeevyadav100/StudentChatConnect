import { WebSocket } from "ws";
import { storage } from "./storage";
import { WsMessage, ChatUser, ChatRoom, WsMessageType } from "@shared/schema";

export class ChatManager {
  private connections: Map<string, WebSocket>;
  
  constructor() {
    this.connections = new Map();
  }
  
  // Add a new user to the system
  addUser(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws);
  }
  
  // Remove a user and handle all cleanup
  removeUser(userId: string): void {
    // First, check if the user is in a room
    const roomId = storage.getUserRoom(userId);
    if (roomId) {
      const room = storage.getChatRooms().get(roomId);
      if (room) {
        // Notify the other user in the room
        const otherUserId = room.users.find(id => id !== userId);
        if (otherUserId) {
          this.sendMessage(otherUserId, {
            type: "partnerDisconnected",
            data: null
          });
          
          // Add other user back to waiting queue
          storage.addWaitingUser(otherUserId);
          this.findMatch(otherUserId);
        }
      }
      
      // Delete the room
      storage.deleteRoom(roomId);
    }
    
    // If the user is in the waiting list, remove them
    storage.removeWaitingUser(userId);
    
    // Remove the connection
    this.connections.delete(userId);
  }
  
  // Handle incoming message from a user
  handleMessage(userId: string, message: WsMessage): void {
    const { type, data } = message;
    
    switch (type) {
      case "join":
        this.handleJoin(userId, data);
        break;
        
      case "message":
        this.handleChatMessage(userId, data);
        break;
        
      case "typing":
        this.handleTyping(userId, true);
        break;
        
      case "stopTyping":
        this.handleTyping(userId, false);
        break;
        
      case "findNewPartner":
        this.handleFindNewPartner(userId);
        break;
        
      case "leave":
        this.handleLeave(userId);
        break;
        
      default:
        console.warn(`Unhandled message type: ${type}`);
    }
  }
  
  // Handle a user joining the chat
  private handleJoin(userId: string, data: any): void {
    // Create user profile
    const chatUser: ChatUser = {
      id: userId,
      nickname: data.nickname || "Anonymous",
      department: data.department || "Unknown",
      isTyping: false
    };
    
    // Store user information
    storage.getChatUsers().set(userId, chatUser);
    
    // Add to waiting list
    storage.addWaitingUser(userId);
    
    // Try to find a match
    this.findMatch(userId);
  }
  
  // Handle a chat message
  private handleChatMessage(userId: string, data: any): void {
    // Get user's current room
    const roomId = storage.getUserRoom(userId);
    if (!roomId) return;
    
    const room = storage.getChatRooms().get(roomId);
    if (!room) return;
    
    // Find the other user in the room
    const otherUserId = room.users.find(id => id !== userId);
    if (!otherUserId) return;
    
    // Forward the message to the other user
    this.sendMessage(otherUserId, {
      type: "message",
      data: {
        id: data.id,
        content: data.content,
        timestamp: data.timestamp || Date.now()
      }
    });
  }
  
  // Handle typing indicators
  private handleTyping(userId: string, isTyping: boolean): void {
    // Get user's current room
    const roomId = storage.getUserRoom(userId);
    if (!roomId) return;
    
    const room = storage.getChatRooms().get(roomId);
    if (!room) return;
    
    // Find the other user in the room
    const otherUserId = room.users.find(id => id !== userId);
    if (!otherUserId) return;
    
    // Update user's typing status
    const user = storage.getChatUsers().get(userId);
    if (user) {
      user.isTyping = isTyping;
    }
    
    // Send typing notification to other user
    this.sendMessage(otherUserId, {
      type: isTyping ? "typing" : "stopTyping",
      data: null
    });
  }
  
  // Handle request to find a new partner
  private handleFindNewPartner(userId: string): void {
    // Get user's current room
    const roomId = storage.getUserRoom(userId);
    if (roomId) {
      const room = storage.getChatRooms().get(roomId);
      if (room) {
        // Notify the other user in the room
        const otherUserId = room.users.find(id => id !== userId);
        if (otherUserId) {
          this.sendMessage(otherUserId, {
            type: "partnerDisconnected",
            data: null
          });
          
          // Add other user back to waiting queue
          storage.addWaitingUser(otherUserId);
          this.findMatch(otherUserId);
        }
      }
      
      // Delete the room
      storage.deleteRoom(roomId);
    }
    
    // Add user to waiting list
    storage.addWaitingUser(userId);
    
    // Try to find a new match
    this.findMatch(userId);
  }
  
  // Handle a user leaving the chat
  private handleLeave(userId: string): void {
    this.removeUser(userId);
  }
  
  // Try to find a match for a waiting user
  private findMatch(userId: string): void {
    const waitingUsers = storage.getWaitingUsers();
    
    // If there's only one waiting user (or none), no match possible
    if (waitingUsers.length <= 1) return;
    
    // Find another waiting user that is not the current user
    const otherUserId = waitingUsers.find(id => id !== userId);
    if (!otherUserId) return;
    
    // Remove both users from waiting list
    storage.removeWaitingUser(userId);
    storage.removeWaitingUser(otherUserId);
    
    // Create a new room
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const room: ChatRoom = {
      id: roomId,
      users: [userId, otherUserId]
    };
    
    storage.createRoom(room);
    
    // Get user profiles
    const user = storage.getChatUsers().get(userId);
    const otherUser = storage.getChatUsers().get(otherUserId);
    
    if (user && otherUser) {
      // Send partner info to both users
      this.sendMessage(userId, {
        type: "partnerInfo",
        data: {
          nickname: otherUser.nickname,
          department: otherUser.department
        }
      });
      
      this.sendMessage(otherUserId, {
        type: "partnerInfo",
        data: {
          nickname: user.nickname,
          department: user.department
        }
      });
    }
  }
  
  // Send a message to a specific user
  sendMessage(userId: string, message: WsMessage): void {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }
  
  // Broadcast a message to all connected users
  broadcastMessage(message: WsMessage): void {
    this.connections.forEach((connection) => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(message));
      }
    });
  }
  
  // Get the number of connected users
  getUserCount(): number {
    return this.connections.size;
  }
}
