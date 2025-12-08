import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, MessageCircle, Book, Clock, Zap, DollarSign, Trophy, AlertCircle, Send, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AnimatedBackground } from './AnimatedBackground';
import { toast } from 'sonner';

interface SupportProps {
  onBack: () => void;
}

export function Support({ onBack }: SupportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Support ticket submitted successfully! We\'ll get back to you within 24 hours.', {
      duration: 4000,
    });
    
    setTicketSubject('');
    setTicketMessage('');
    setIsSubmitting(false);
  };

  const faqData = [
    {
      category: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      questions: [
        {
          question: 'How does Dream60 work?',
          answer: 'Dream60 runs hourly auctions with 6 boxes. The first 2 boxes require entry fees to participate. Boxes 3-6 open every 15 minutes during the auction. You can bid once per 15-minute round, and the highest bidder wins the prize.'
        },
        {
          question: 'What do I need to start playing?',
          answer: 'You need to create an account and pay the entry fee for the auction you want to join. The entry fee varies by auction but typically ranges from ₹1000 to ₹3500.'
        },
        {
          question: 'When do auctions run?',
          answer: 'Auctions run daily from 9 AM to 7 PM, with one auction starting every hour. That\'s 10 exciting auctions per day!'
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
          answer: 'You can place one bid per 15-minute round. Each auction has 4 bidding rounds (boxes 3-6), so you can bid up to 4 times per auction after paying the entry fee.'
        },
        {
          question: 'What happens if I bid but lose?',
          answer: 'All bids are final and non-refundable. This is part of the auction game format. Only the final highest bidder wins the prize.'
        },
        {
          question: 'How do I know if I\'ve won?',
          answer: 'Winners are announced immediately when the auction ends. You\'ll receive a notification and see your win recorded in your account dashboard.'
        },
        {
          question: 'Can I participate in multiple auctions simultaneously?',
          answer: 'Yes! You can join multiple auctions as long as you\'re able to pay the required entry fees and bids.'
        }
      ]
    },
    {
      category: 'Payments & Prizes',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      questions: [
        {
          question: 'How do I receive my prize?',
          answer: 'Physical prizes are shipped within 7 business days to your registered address. Digital prizes or cash equivalents are delivered electronically within 24 hours.'
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees! The entry fee and bid amounts are clearly displayed. We cover shipping costs for physical prizes to addresses within India.'
        },
        {
          question: 'Can I get a refund?',
          answer: 'Entry fees and bids are generally non-refundable. Refunds are only provided in cases of technical malfunction or platform errors, which are investigated on a case-by-case basis.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      questions: [
        {
          question: 'What if the site crashes during an auction?',
          answer: 'If technical issues occur during an auction, we may pause or restart the auction. Participants will be notified immediately, and any affected bids will be reviewed and resolved fairly.'
        },
        {
          question: 'My bid didn\'t go through. What should I do?',
          answer: 'First, check your internet connection. If the issue persists, contact support immediately with the auction ID and timestamp. We can investigate and resolve bid-related issues.'
        },
        {
          question: 'I can\'t access my account. How do I reset my password?',
          answer: 'Use the "Forgot Password" link on the login page. If you\'re still having trouble, contact support with your username and registered email address.'
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
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button 
            onClick={onBack}
            variant="outline" 
            className="border-purple-300/50 rounded-xl text-purple-700 bg-white/80 backdrop-blur-md shadow-lg shadow-purple-500/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              Support Center
            </h1>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Quick Help Cards */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 text-center shadow-xl shadow-purple-500/10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-purple-500/30">
                <Book className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Quick Start Guide</h3>
              <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">New to Dream60? Learn the basics in under 5 minutes.</p>
              <Button variant="outline" className="rounded-xl border-purple-400/50 text-purple-600 bg-white/60 backdrop-blur-sm text-sm shadow-md">
                View Guide
              </Button>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-green-200/50 p-4 sm:p-6 text-center shadow-xl shadow-green-500/10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-green-500/30">
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Live Chat</h3>
              <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">Get instant help from our support team.</p>
              <Button variant="outline" className="rounded-xl border-green-400/50 text-green-600 bg-white/60 backdrop-blur-sm text-sm shadow-md">
                Start Chat
              </Button>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 text-center shadow-xl shadow-purple-500/10 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-purple-500/30">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 mb-2">Winning Tips</h3>
              <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">Strategies to improve your auction success rate.</p>
              <Button variant="outline" className="rounded-xl border-purple-400/50 text-purple-600 bg-white/60 backdrop-blur-sm text-sm shadow-md">
                Learn More
              </Button>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
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
                      <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 shadow-xl shadow-purple-500/10">
                        <div className="p-3 sm:p-4">
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
              
              <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 shadow-xl shadow-purple-500/10">
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
                    <label className="block text-sm sm:text-base text-purple-700 mb-2 font-medium">Subject</label>
                    <Input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all"
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
                      className="bg-white/80 backdrop-blur-xl border-purple-300/50 text-purple-800 placeholder:text-purple-400 shadow-lg shadow-purple-500/5 focus:border-purple-400 transition-all resize-none"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-500/30 transition-all py-5 sm:py-6"
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
              </Card>

              {/* Contact Info */}
              <Card className="bg-white/80 backdrop-blur-xl border-purple-200/50 p-4 sm:p-6 mt-4 sm:mt-6 shadow-xl shadow-purple-500/10">
                <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-3 sm:mb-4">Other Ways to Reach Us</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-purple-600">
                  <p><strong className="text-purple-800">Email:</strong> support@dream60.com</p>
                  <p><strong className="text-purple-800">Response Time:</strong> Within 24 hours</p>
                  <p><strong className="text-purple-800">Live Chat:</strong> Available 24/7</p>
                  <p><strong className="text-purple-800">Emergency Issues:</strong> Use live chat for immediate assistance</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
