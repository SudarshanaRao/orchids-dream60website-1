import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { API_ENDPOINTS } from '../lib/api-config';

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
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const knowledgeBase = [
    {
      question: 'How do prize claims work?',
      answer: 'If you win, you pay only your final round bid amount to claim. You then receive an Amazon voucher equal to the full product worth. Example: pay ₹1,000, get ₹20,000 voucher.',
    },
    {
      question: 'What is the entry fee?',
      answer: 'You must pay the entry fee before Round 1. After that, you can place one bid per round as boxes open every 15 minutes.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can chat here, submit a ticket, or email support@dream60.com. For urgent issues, use live chat.',
    },
    {
      question: 'When are auctions scheduled?',
      answer: 'Auctions run hourly (10 daily). Check Today\'s Schedule to see fixed auction numbers and time slots.',
    },
    {
      question: 'How does the bidding work?',
      answer: 'There are 4 bidding rounds after entry. One bid per round. Each next round opens every 15 minutes. Highest final bid wins.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept UPI, cards, and net banking through Razorpay. UPI is the fastest and most convenient method.',
    },
  ];

  const getBotReply = (query: string): string => {
    const normalized = query.toLowerCase();
    
    if (normalized.includes('prize') || normalized.includes('claim') || normalized.includes('voucher')) {
      return 'You pay only your final round bid to claim. We then issue an Amazon voucher equal to the full product worth for that auction.';
    }
    if (normalized.includes('entry')) {
      return 'Pay the entry fee before Round 1. After entry, you can bid once per 15-minute round (4 rounds). Entry fees are non-refundable.';
    }
    if (normalized.includes('bid') || normalized.includes('round')) {
      return 'There are 4 bidding rounds after entry. One bid per round. Each next round opens every 15 minutes. Highest final bid wins.';
    }
    if (normalized.includes('schedule') || normalized.includes('auction number')) {
      return 'Today\'s Schedule shows fixed auction numbers for the day (they do not reset). You can preview time slots and prizes there.';
    }
    if (normalized.includes('payment') || normalized.includes('upi') || normalized.includes('pay')) {
      return 'We accept UPI, cards, and net banking through Razorpay. All payments are secure and instant. Entry fees and bids are non-refundable.';
    }
    if (normalized.includes('win') || normalized.includes('winner')) {
      return 'Winners are announced immediately when the auction ends. The highest bidder in the final round wins and can claim the prize by paying their final bid amount.';
    }
    
    const match = knowledgeBase.find(
      (item) =>
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
    );
    
    return match?.answer || "I couldn't find that yet. Ask about entry fees, bids, prize claims, vouchers, or scheduling.";
  };

  const saveMessageToDatabase = async (role: 'user' | 'bot', message: string) => {
    try {
      await fetch(API_ENDPOINTS.supportChat.sendMessage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          role,
          message,
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
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
    
    await saveMessageToDatabase('user', text);

    setIsTyping(true);
    
    setTimeout(() => {
      const reply = getBotReply(text);
      setCurrentBotMessage(reply);
      setDisplayedText('');

      const intervalId = typewriterEffect(reply, async () => {
        const botMessage: Message = {
          role: 'bot',
          text: reply,
          timestamp: Date.now(),
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        setDisplayedText('');
        setCurrentBotMessage('');
        
        await saveMessageToDatabase('bot', reply);
      });

      return () => clearInterval(intervalId);
    }, 800);
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
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-700 hover:text-purple-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Support
          </Button>
        </div>

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
