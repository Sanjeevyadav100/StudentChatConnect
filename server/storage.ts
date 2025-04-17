import { users, type User, type InsertUser, ChatUser, ChatRoom } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat storage methods
  getChatUsers(): Map<string, ChatUser>;
  getWaitingUsers(): string[];
  getChatRooms(): Map<string, ChatRoom>;
  addWaitingUser(userId: string): void;
  removeWaitingUser(userId: string): void;
  getUserRoom(userId: string): string | undefined;
  createRoom(room: ChatRoom): void;
  deleteRoom(roomId: string): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatUsers: Map<string, ChatUser>;
  private waitingUsers: string[];
  private chatRooms: Map<string, ChatRoom>;
  private userRooms: Map<string, string>; // userId -> roomId
  currentId: number;

  constructor() {
    this.users = new Map();
    this.chatUsers = new Map();
    this.waitingUsers = [];
    this.chatRooms = new Map();
    this.userRooms = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Chat storage methods
  getChatUsers(): Map<string, ChatUser> {
    return this.chatUsers;
  }

  getWaitingUsers(): string[] {
    return [...this.waitingUsers];
  }

  getChatRooms(): Map<string, ChatRoom> {
    return this.chatRooms;
  }

  addWaitingUser(userId: string): void {
    if (!this.waitingUsers.includes(userId)) {
      this.waitingUsers.push(userId);
    }
  }

  removeWaitingUser(userId: string): void {
    this.waitingUsers = this.waitingUsers.filter(id => id !== userId);
  }

  getUserRoom(userId: string): string | undefined {
    return this.userRooms.get(userId);
  }

  createRoom(room: ChatRoom): void {
    this.chatRooms.set(room.id, room);
    
    // Update user-room associations
    room.users.forEach(userId => {
      this.userRooms.set(userId, room.id);
    });
  }

  deleteRoom(roomId: string): void {
    const room = this.chatRooms.get(roomId);
    if (room) {
      // Remove user-room associations
      room.users.forEach(userId => {
        this.userRooms.delete(userId);
      });
      
      // Delete the room
      this.chatRooms.delete(roomId);
    }
  }
}

export const storage = new MemStorage();
