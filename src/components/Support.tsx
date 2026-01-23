import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, MessageCircle, Book, Clock, Zap, IndianRupee, Trophy, AlertCircle, Search, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface SupportProps {
  user?: {
    id: string;
    username: string;
    email?: string;
  } | null;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function Support({ user, onBack, onNavigate }: SupportProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketName, setTicketName] = useState(user?.username || '');
  const [ticketEmail, setTicketEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setTicketName(user.username || '');
      setTicketEmail(user.email || '');
    }
  }, [user]);


  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketName || !ticketEmail || !ticketSubject || !ticketMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.contact.sendMessage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ticketName,
          email: ticketEmail,
          subject: ticketSubject,
          category: 'support',
          message: ticketMessage
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
        setTicketName('');
        setTicketEmail('');
        setTicketSubject('');
        setTicketMessage('');
      } else {
        throw new Error(data.message || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket. Please try again or contact support@dream60.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqData = [
    {
      category: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      questions: [
        {
            question: 'How does Dream60 work?',
            answer: 'Dream60 runs premium hourly Auctions daily. To participate, you must pay an entry fee during the join window. There are 4 bidding rounds every 15 minutes. The highest bidder in the final round wins the prize!'
          },
          {
            question: 'How much is the entry fee?',
            answer: 'Entry fees are company decided and fixed for each auction. You can see the exact fee on the auction box when the join window opens.'
          },
        {
          question: 'Are there subscriptions?',
          answer: 'No, Dream60 is entirely pay-as-you-go. You only pay for the auctions you choose to join.'
        }
      ]
    },
    {
      category: 'Bidding & Auctions',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      questions: [
        {
          question: 'How often can I bid?',
          answer: 'You can place one bid per 15-minute round. Each auction has 4 bidding rounds, allowing 4 bids in total per auction after joining.'
        },
        {
          question: 'What happens if I lose?',
          answer: 'Entry fees and bids are non-refundable as they represent participation in the live event. Only the final Rank 1 winner claims the prize.'
        },
        {
          question: 'Can I bid higher than my previous bid?',
          answer: 'Yes, every new bid in a subsequent round must be higher than your bid in the previous round to remain qualified.'
        }
      ]
    },
    {
      category: 'Payments & Prizes',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      questions: [
        {
          question: 'What currency is used?',
          answer: 'Dream60 is an Indian platform and all transactions (fees, bids, claims) are strictly in Indian Rupees (₹ INR).'
        },
        {
          question: 'How do I receive my prize?',
          answer: 'Winners receive the full market value of the prize as an Amazon Voucher, delivered to their registered email within 24-48 hours of verification.'
        },
        {
          question: 'Is my payment secure?',
          answer: 'Yes, all payments are processed through India\'s trusted payment gateway, supporting UPI, Cards, and Net Banking.'
        }
      ]
    },
    {
      category: 'Account & Security',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      questions: [
        {
          question: 'Is identity verification required?',
          answer: 'Yes, to maintain fair play and comply with Indian regulations, prize winners must complete a verification process involving ID proof.'
        },
        {
          question: 'Can I have multiple accounts?',
          answer: 'No, only one account per person is allowed. Multiple accounts result in immediate suspension and forfeiture of any winnings.'
        }
      ]
    }
  ];



  const filteredFaq = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => searchQuery === '' || 
           q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen relative">
      {/* Header with Logo */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
              <div className="hidden sm:flex items-center space-x-2">
                <HelpCircle className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Support Center</h1>
              </div>
            </div>
            
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Play</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Mobile Title */}
        <motion.div 
          className="flex sm:hidden items-center space-x-2 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <HelpCircle className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
            Support Center
          </h1>
        </motion.div>

          <div className="max-w-6xl mx-auto">
            {/* Quick Help Cards */}
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
                <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 text-center shadow-xl shadow-purple-500/10 relative overflow-hidden group">
                  <div className="relative z-10 font-medium">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-purple-500/30">
                      <Book className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Quick Participation Guide</h3>
                    <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">New to Dream60? Learn how to participate in under 5 minutes.</p>
                    <Button
                      variant="outline"
                      className="rounded-xl border-purple-400/50 text-purple-600 bg-white/60 backdrop-blur-sm text-sm shadow-md"
                      onClick={() => {
                        onNavigate?.('view-guide');
                        window.history.pushState({}, '', '/view-guide');
                      }}
                    >
                      View Guide
                    </Button>
                  </div>
                </Card>
  
                <Card className="bg-white/80 backdrop-blur-xl border-green-200/50 p-4 sm:p-6 text-center shadow-xl shadow-green-500/10 relative overflow-hidden group">
                  <div className="relative z-10 font-medium">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-green-500/30">
                      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Live Support</h3>
                    <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">Get instant help from our local support team.</p>
                    <Button
                      variant="outline"
                      className="rounded-xl border-green-400/50 text-green-600 bg-white/60 backdrop-blur-sm text-sm shadow-md"
                      onClick={() => {
                        onNavigate?.('support-chat');
                        window.history.pushState({}, '', '/support-chat');
                      }}
                    >
                      Start Chat
                    </Button>
                  </div>
                </Card>
  
                <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 text-center shadow-xl shadow-purple-500/10 sm:col-span-2 lg:col-span-1 relative overflow-hidden group">
                  <div className="relative z-10 font-medium">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-purple-500/30">
                      <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Winning Tips</h3>
                    <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">Strategies to improve your auction success rate in India.</p>
                    <Button
                      variant="outline"
                      className="rounded-xl border-purple-400/50 text-purple-600 bg-white/60 backdrop-blur-sm text-sm shadow-md"
                      onClick={() => {
                        onNavigate?.('winning-tips');
                        window.history.pushState({}, '', '/winning-tips');
                      }}
                    >
                      Learn More
                    </Button>
                  </div>
                </Card>

          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 relative z-10">
            {/* FAQ Section */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-purple-800 mb-4 sm:mb-6">
              Frequently Asked Questions
            </h2>
            
            {/* Search */}
            <div className="mb-4 sm:mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 pl-10 shadow-lg shadow-purple-500/10 focus:border-purple-400 transition-all"
              />
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-3 sm:space-y-4">
              {filteredFaq.length > 0 ? (
                filteredFaq.map((category, categoryIndex) => (
                  <motion.div
                    key={categoryIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 shadow-xl shadow-purple-500/10 relative overflow-hidden group">
                      <div className="p-3 sm:p-4 relative z-10">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                            {category.icon}
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-purple-800">{category.category}</h3>
                        </div>
                        
                        <Accordion type="single" collapsible className="w-full">
                          {category.questions.map((faq, faqIndex) => (
                            <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`} className="border-purple-200/50">
                              <AccordionTrigger className="text-left text-sm sm:text-base text-purple-700 py-3 transition-colors">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-xs sm:text-sm text-purple-600 leading-relaxed">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12 bg-white/80 backdrop-blur-xl border border-purple-200/50 rounded-2xl shadow-xl">
                  <HelpCircle className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-purple-600">No results found for "{searchQuery}"</p>
                  <p className="text-xs sm:text-sm text-purple-500 mt-2">Try different keywords or browse all categories</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Support Ticket Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-purple-800 mb-4 sm:mb-6">
              Contact Support
            </h2>
            
            <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 shadow-xl shadow-purple-500/10 relative overflow-hidden group">
              <div className="relative z-10 font-medium">
                <div className="flex items-start space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-2">Need More Help?</h3>
                    <p className="text-xs sm:text-sm text-purple-600">
                      Can't find what you're looking for? Submit a support ticket and our team will get back to you within 24 hours.
                    </p>
                  </div>
                </div>

                  <form onSubmit={handleSubmitTicket} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm sm:text-base text-purple-700 mb-2 font-medium">Name {!user && <span className="text-rose-500">*</span>}</label>
                      <Input
                        type="text"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        readOnly={!!user}
                        placeholder="Your full name"
                        className={`bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all font-medium ${user ? 'cursor-not-allowed opacity-70' : ''}`}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm sm:text-base text-purple-700 mb-2 font-medium">Email {!user && <span className="text-rose-500">*</span>}</label>
                      <Input
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        readOnly={!!user}
                        placeholder="your.email@example.com"
                        className={`bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all font-medium ${user ? 'cursor-not-allowed opacity-70' : ''}`}
                        required
                      />
                    </div>

                  
                  <div>
                    <label className="block text-sm sm:text-base text-purple-700 mb-2 font-medium">Subject</label>
                    <Input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all font-medium"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm sm:text-base text-purple-700 mb-2 font-medium">Message</label>
                    <Textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Please describe your issue in detail..."
                      rows={6}
                      className="bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all resize-none font-medium"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-500/30 transition-all py-5 sm:py-6 font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Support Ticket
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 mt-4 sm:mt-6 shadow-xl shadow-purple-500/10 relative overflow-hidden">
              <div className="relative z-10 font-medium">
                <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-3 sm:mb-4">Other Ways to Reach Us</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-purple-600">
                  <p><strong className="text-purple-800">Email:</strong> support@dream60.com</p>
                  <p><strong className="text-purple-800">Response Time:</strong> Within 24 hours</p>
                  <p><strong className="text-purple-800">Live Chat:</strong> Available 24/7</p>
                  <p><strong className="text-purple-800">Emergency Issues:</strong> Use live chat for immediate assistance</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
  );
}
