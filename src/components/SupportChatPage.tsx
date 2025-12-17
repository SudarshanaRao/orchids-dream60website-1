import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { API_ENDPOINTS } from '../lib/api-config';
import { SupportCenterHeader } from './SupportCenterHeader';

interface Message {
  text: string;
  timestamp: number;
}

interface SupportChatPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function SupportChatPage({ onBack, onNavigate }: SupportChatPageProps) {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const persistUserMessage = async (text: string) => {
    try {
      const userId = localStorage.getItem('user_id');

      await fetch(API_ENDPOINTS.supportChat.sendMessage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId: userId || undefined,
          role: 'user',
          message: text,
        }),
      });
    } catch (error) {
      // Message is still shown locally even if persistence fails
      console.error('Error saving support chat message:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userMessage: Message = {
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');

    await persistUserMessage(text);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('support');
      window.history.pushState({}, '', '/support');
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <SupportCenterHeader
        title="Support Chat"
        icon={<MessageCircle className="w-6 h-6" />}
        onBack={handleBack}
        backLabel="Back to Support"
      />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-2 border-purple-200/70 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Support</h2>
                  <p className="text-sm text-white/80">Send your message to our team</p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div ref={chatContainerRef} className="h-[500px] overflow-y-auto p-4 space-y-4 bg-purple-50/30">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm bg-purple-600 text-white">
                      <div className="flex items-center gap-2 text-xs mb-1.5 opacity-80">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">You</span>
                      </div>
                      <div className="text-sm leading-relaxed">{msg.text}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-purple-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-purple-50/50 border-purple-200 text-purple-900 placeholder:text-purple-400"
                  />
                  <Button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
