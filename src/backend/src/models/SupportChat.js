import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

const tursoClient = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(tursoClient);

const supportChatMessages = sqliteTable("support_chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  role: text("role").notNull(),
  message: text("message").notNull(),
  timestamp: integer("timestamp").notNull(),
  createdAt: integer("created_at").notNull(),
});

class SupportChat {
  static async createMessage({ sessionId, userId, role, message }) {
    const now = Date.now();
    const result = await db
      .insert(supportChatMessages)
      .values({
        sessionId,
        userId: userId || null,
        role,
        message,
        timestamp: now,
        createdAt: now,
      })
      .returning();
    
    return result[0];
  }

  static async getMessagesBySession(sessionId) {
    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(sql`${supportChatMessages.sessionId} = ${sessionId}`)
      .orderBy(supportChatMessages.timestamp);
    
    return messages;
  }

  static async getMessagesByUser(userId) {
    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(sql`${supportChatMessages.userId} = ${userId}`)
      .orderBy(supportChatMessages.timestamp);
    
    return messages;
  }

  static async deleteSessionMessages(sessionId) {
    await db
      .delete(supportChatMessages)
      .where(sql`${supportChatMessages.sessionId} = ${sessionId}`);
  }
}

export default SupportChat;
