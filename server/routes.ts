import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { ChatManager } from "./chat";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server on a specific path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize chat manager
  const chatManager = new ChatManager();
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    
    // Generate a unique ID for the user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Initialize user in chat manager
    chatManager.addUser(userId, ws);
    
    // Handle messages
    ws.on('message', (messageData: string) => {
      try {
        const message = JSON.parse(messageData);
        chatManager.handleMessage(userId, message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket disconnected: ${userId}`);
      chatManager.removeUser(userId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${userId}:`, error);
      chatManager.removeUser(userId);
    });
  });
  
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeUsers: chatManager.getUserCount() });
  });
  
  return httpServer;
}
