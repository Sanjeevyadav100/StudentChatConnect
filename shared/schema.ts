import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat schema definitions
export type ChatUser = {
  id: string;
  nickname: string;
  department: string;
  isTyping: boolean;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
};

export type ChatRoom = {
  id: string;
  users: string[];
};

export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'waiting'
  | 'connected';

export type WsMessageType = 
  | 'join'
  | 'leave'
  | 'message'
  | 'typing'
  | 'stopTyping'
  | 'findNewPartner'
  | 'partnerInfo'
  | 'partnerDisconnected'
  | 'systemMessage'
  | 'webrtc-signal';

export type WsMessage = {
  type: WsMessageType;
  data: any;
};

export const departmentOptions = [
  { value: "computer-science", label: "Computer Science" },
  { value: "engineering", label: "Engineering" },
  { value: "business", label: "Business" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "science", label: "Science" },
  { value: "other", label: "Other" }
];

export const userProfileSchema = z.object({
  nickname: z.string().max(30).optional(),
  department: z.string().min(1, { message: "Please select your department" })
});

export type UserProfile = z.infer<typeof userProfileSchema>;
