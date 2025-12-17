import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { API_ENDPOINTS } from '../lib/api-config';
import { SupportCenterHeader } from './SupportCenterHeader';

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp?: number;
  isTyping?: boolean;
}

interface SupportChatPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function SupportChatPage({ onBack, onNavigate }: SupportChatPageProps) {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm Dream60 Assist. Ask me about entry fees, bidding rounds, prize claims, or payouts.",
      timestamp: Date.now(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchBotReply = async (query: string): Promise<string> => {
    try {
      const res = await fetch(API_ENDPOINTS.supportChat.ask, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: query,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        return data?.message || "I'm having trouble answering right now. Please try again.";
      }

      return String(data?.data?.reply || "I don't have that information on the Dream60 website yet.");
    } catch (error) {
      console.error('Error fetching AI reply:', error);
      return "I'm having trouble answering right now. Please try again.";
    }
  };

  const typewriterEffect = (text: string, callback: () => void) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        callback();
      }
    }, 30);
    return interval;
  };

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
      if (e) e.preventDefault();
      const text = (overrideText ?? chatInput).trim();
      if (!text || isTyping) return;

      const userMessage: Message = {
        role: 'user',
        text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setChatInput('');

      setIsTyping(true);

      // Give a small delay so the typing indicator feels natural
      setTimeout(async () => {
        const reply = await fetchBotReply(text);
        setDisplayedText('');

        typewriterEffect(reply, () => {
          const botMessage: Message = {
            role: 'bot',
            text: reply,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          setDisplayedText('');
        });
      }, 500);
    };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, displayedText, isTyping]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('support');
      window.history.pushState({}, '', '/support');
    } else {
      onBack();
    }
  };

  const quickPrompts = [
    'How do prize claims work?',
    'What is my auction schedule?',
    'Entry fee rules',
    'How to get Amazon voucher?',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <SupportCenterHeader
        title="Start Chat"
        icon={<Bot className="w-6 h-6" />}
        onBack={handleBack}
        backLabel="Back to Support"
      />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 border-purple-200/70 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Dream60 Assist</h2>
                  <p className="text-sm text-white/80">Ask me anything about Dream60</p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div
                ref={chatContainerRef}
                className="h-[500px] overflow-y-auto p-4 space-y-4 bg-purple-50/30"
              >
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-purple-900 border border-purple-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs mb-1.5 opacity-80">
                          {msg.role === 'user' ? (
                            <User className="w-3.5 h-3.5" />
                          ) : (
                            <Bot className="w-3.5 h-3.5" />
                          )}
                          <span className="font-medium">
                            {msg.role === 'user' ? 'You' : 'Dream60 Assist'}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 bg-white text-purple-900 border border-purple-100 shadow-sm">
                      <div className="flex items-center gap-2 text-xs mb-1.5 opacity-80">
                        <Bot className="w-3.5 h-3.5" />
                        <span className="font-medium">Dream60 Assist</span>
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                      <div className="text-sm leading-relaxed">
                        {displayedText}
                        <span className="inline-block w-1 h-4 bg-purple-600 ml-0.5 animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-purple-100">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(undefined, prompt)}
                      disabled={isTyping}
                      className="px-3 py-1.5 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isTyping}
                    className="flex-1 bg-purple-50/50 border-purple-200 text-purple-900 placeholder:text-purple-400"
                  />
                  <Button
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
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
