-- Support Chat Messages Table
-- This table stores chat messages between users and the Dream60 Assist chatbot
-- Run this script to create the support_chat_messages table in your Turso database

CREATE TABLE IF NOT EXISTS support_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK(role IN ('user', 'bot')),
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_support_chat_session ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_user ON support_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_timestamp ON support_chat_messages(timestamp);
