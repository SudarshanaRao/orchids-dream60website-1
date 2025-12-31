# Action Required: Live Chat Fix

To enable the Support Live Chat (Dream60 Assist), you need to perform one manual step in your Turso database. The backend code and frontend interface are already fully implemented, but the database table for storing messages is likely missing.

### 📋 Step-by-Step Instructions

1.  **Open your Turso Dashboard** or use the Turso CLI.
2.  **Run the following SQL script** against your database (`db-1676479a-4335-439a-a3c9-d030cb3b1674-orchids`):

```sql
-- Create the support_chat_messages table
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK(role IN ('user', 'bot')),
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_chat_session ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_user ON support_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_timestamp ON support_chat_messages(timestamp);
```

### 💡 Why is this needed?
The chatbot stores your conversations so they persist even if you refresh the page. Without this table, the backend API will return a "Database error" when trying to save or retrieve messages.

### 🚀 What's already done:
- ✅ **Backend Routes**: Registered at `/support-chat` in `server.js`.
- ✅ **AI Integration**: Configured to use Groq (Llama 3.1) via your API key in `.env`.
- ✅ **Frontend Interface**: Dedicated chat page at `/support-chat` with typewriter effects and quick prompts.

Once you run the SQL above, the chat will start working immediately!
