# Live Chat Configuration (MongoDB)

The Support Live Chat (Dream60 Assist) is fully integrated with **MongoDB** via Mongoose. No additional setup is required for the database schema.

## Current Status

| Component | Status |
|-----------|--------|
| Backend Route | `/support-chat` in `server.js` |
| Database | MongoDB (Mongoose) - Auto-creates collection |
| AI Provider | Groq (Llama 3.1 8B Instant) |
| Frontend | `SupportChatPage.tsx` with typewriter effects |

## What I Need From You (to debug any issues):

### 1. Backend Server Logs
Please share any error logs from your backend when clicking the chat button or sending a message. Run your backend and check for errors like:
- `❌ [SUPPORT-CHAT] Error creating message:`
- `❌ [SUPPORT-CHAT] /ask error:`

### 2. Network Tab Response
Open browser DevTools > Network tab, then:
1. Click "Support" in the app
2. Send a message in the chat
3. Look for requests to `/support-chat/ask` or `/support-chat/session/`
4. Share the response status code and body

### 3. Environment Variables (Backend)
Confirm these are set in your backend `.env`:
```
GROQ_API_KEY=gsk_xxxxx (your Groq API key)
SUPPORT_CHAT_PROVIDER=groq
SUPPORT_CHAT_MODEL=llama-3.1-8b-instant
```

### 4. MongoDB Connection
Confirm MongoDB is connecting successfully. You should see:
```
✅ MongoDB connected successfully
```
in your backend logs on startup.

## How It Works

1. **Model**: `src/backend/src/models/SupportChat.js` - Mongoose schema for chat messages
2. **Routes**: `src/backend/src/routes/supportChat.js` - API endpoints for saving/retrieving messages
3. **AI Utility**: `src/backend/src/utils/supportChatAi.js` - Groq integration for AI responses
4. **Frontend**: `src/components/SupportChatPage.tsx` - React component with chat UI

The MongoDB collection `supportchatmessages` is created automatically when the first message is saved.
