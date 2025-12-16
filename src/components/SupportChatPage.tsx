import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { API_ENDPOINTS } from '@/lib/api-config';
import { toast } from 'sonner';

interface SupportChatPageProps {
  onBack: () => void;
  user?: {
    id?: string;
    username?: string;
    email?: string;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}

export function SupportChatPage({ onBack, user }: SupportChatPageProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const botStreamRef = useRef<NodeJS.Timeout | null>(null);

  const knowledgeBase = [
    'You pay only your final round bid to claim. We issue an Amazon voucher equal to full product worth.',
    'Entry fee is required before Round 1. After entry you can bid once per 15-minute round (4 rounds).',
    'Auctions run hourly with fixed numbers; check Today’s Schedule for time slots and prizes.',
    'Highest final bid wins. Your last-round bid is what you pay to claim.',
  ];

  const buildReply = (question: string) => {
    const normalized = question.toLowerCase();
    if (normalized.includes('prize') || normalized.includes('claim') || normalized.includes('voucher')) {
      return 'You pay only your final round bid to claim the prize. We then send you an Amazon voucher equal to the full product worth for that auction.';
    }
    if (normalized.includes('entry')) {
      return 'Pay the entry fee before Round 1 to participate. After entry, you get one bid per 15-minute round (4 rounds total).';
    }
    if (normalized.includes('bid') || normalized.includes('round')) {
      return 'Bidding is one bid per round. Four rounds open every 15 minutes. The highest final bid wins and that last bid is the amount you pay.';
    }
    if (normalized.includes('schedule') || normalized.includes('time')) {
      return 'Auctions run hourly (10 per day). Today’s Schedule shows fixed auction numbers and time slots so you can plan ahead.';
    }
    return knowledgeBase[Math.floor(Math.random() * knowledgeBase.length)];
  };

  const streamBotReply = (reply: string) => {
    if (botStreamRef.current) {
      clearInterval(botStreamRef.current);
      botStreamRef.current = null;
    }
    setIsBotTyping(true);
    setMessages((prev) => [...prev, { role: 'bot', text: '', streaming: true }]);
    let idx = 0;
    botStreamRef.current = setInterval(() => {
      idx += 1;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            text: reply.slice(0, idx),
            streaming: idx < reply.length,
          };
        }
        return updated;
      });
      if (idx >= reply.length) {
        setIsBotTyping(false);
        if (botStreamRef.current) {
          clearInterval(botStreamRef.current);
          botStreamRef.current = null;
        }
      }
    }, 18);
  };

  const persistMessage = async (role: 'user' | 'bot', text: string) => {
    if (!threadId) return;
    try {
      await fetch(`${API_ENDPOINTS.supportChat.message}/${threadId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          text,
          userId: user?.id,
          name: user?.username,
          email: user?.email,
        }),
      });
    } catch (error) {
      console.error('Error saving chat message', error);
    }
  };

  const startChat = async (initialMessage?: string) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.supportChat.start, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: user?.username,
          email: user?.email,
          initialMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to start chat');
      }
      setThreadId(data.data.threadId);
      localStorage.setItem('support_chat_thread_id', data.data.threadId);
      setMessages(data.data.messages || []);
    } catch (error: any) {
      console.error('Error starting chat', error);
      toast.error(error?.message || 'Unable to start chat');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingChat = async (existingThread: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.supportChat.message}/${existingThread}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Unable to load chat');
      setThreadId(existingThread);
      setMessages(data.data.messages || []);
    } catch (error) {
      console.error('Error loading chat', error);
      localStorage.removeItem('support_chat_thread_id');
      await startChat();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedThread = localStorage.getItem('support_chat_thread_id');
    if (storedThread) {
      loadExistingChat(storedThread);
    } else {
      startChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => () => {
    if (botStreamRef.current) {
      clearInterval(botStreamRef.current);
    }
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');

    if (threadId) {
      persistMessage('user', text);
    } else {
      startChat(text);
    }

    const reply = buildReply(text);
    streamBotReply(reply);
    persistMessage('bot', reply);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-purple-700 hover:text-purple-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Support
          </Button>
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <Bot className="w-4 h-4" />
            <span>Dream60 Assist Live Chat</span>
          </div>
        </div>

        <Card className="border-2 border-purple-200/70 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/80">Live Support</p>
                <h2 className="text-lg font-semibold">Dream60 Assist</h2>
              </div>
            </div>
            <div className="text-xs text-white/80">Thread: {threadId ? threadId.slice(0, 8) : 'starting...'}</div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div ref={chatRef} className="h-[420px] sm:h-[520px] bg-white/80 border border-purple-100 rounded-xl p-3 overflow-y-auto space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-900 border border-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{msg.role === 'user' ? 'You' : 'Dream60 Assist'}</span>
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              ))}
              {(loading || isBotTyping) && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs bg-purple-50 text-purple-800 border border-purple-100 shadow">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{loading ? 'Connecting…' : 'Dream60 Assist is typing…'}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => handleSend(e)} className="flex flex-col sm:flex-row gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-white/90 border-purple-200 text-purple-900"
              />
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
