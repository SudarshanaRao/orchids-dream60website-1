import  { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Users, Headphones, Shield, Globe, Zap, Building2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface ContactProps {
  onBack: () => void;
}

export function Contact({ onBack }: ContactProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
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
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: ''
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again or contact support@dream60.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
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
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-purple-800">Contact Dream60</h1>
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
                <p className="text-[10px] text-purple-600">Live Auction Platform</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Mobile Title */}
        <motion.h1 
          className="sm:hidden text-2xl font-bold text-purple-800 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Contact Dream60
        </motion.h1>

        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Hero Section */}
          <div className="text-center px-2">
            <div className="inline-flex items-center space-x-2 mb-3 sm:mb-4">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-800">Get in Touch</h2>
            </div>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-purple-600 max-w-3xl mx-auto mb-4 sm:mb-6">
              We're here 24/7 to support your Dream60 experience. Whether you need help with auctions, 
              payments, or have suggestions, our dedicated team is ready to assist you.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-300 text-xs sm:text-sm">24/7 Support</Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs sm:text-sm">Fast Response</Badge>
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs sm:text-sm">Expert Team</Badge>
            </div>
          </div>

            {/* Quick Contact Methods */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 relative z-10">
                <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <CardHeader className="text-center pb-2 relative z-10 font-medium">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-purple-800">Live Chat</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10 font-medium">
                  <p className="text-purple-700 mb-2">Instant Support</p>
                  <Badge className="bg-green-100 text-green-700 border-green-300">Online Now</Badge>
                  <p className="text-xs text-purple-600 mt-2">Average response: &lt;30 seconds</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <CardHeader className="text-center pb-2 relative z-10 font-medium">
                  <Mail className="w-12 h-12 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-purple-800">Email Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10 font-medium">
                  <p className="text-purple-700 mb-2">support@dream60.com</p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">24h Response</Badge>
                  <p className="text-xs text-purple-600 mt-2">Detailed assistance</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <CardHeader className="text-center pb-2 relative z-10 font-medium">
                  <Headphones className="w-12 h-12 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-purple-800">Priority Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10 font-medium">
                  <p className="text-purple-700 mb-2">VIP Members</p>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Premium</Badge>
                  <p className="text-xs text-purple-600 mt-2">Dedicated agent</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <CardHeader className="text-center pb-2 relative z-10 font-medium">
                  <Users className="w-12 h-12 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-purple-800">Community</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10 font-medium">
                  <p className="text-purple-700 mb-2">Discord & Forums</p>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-300">5k+ Members</Badge>
                  <p className="text-xs text-purple-600 mt-2">Player discussions</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Contact Information */}
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-xl relative overflow-hidden">
                  <CardHeader className="relative z-10 font-medium">
                    <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                      <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Send us a Message</span>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-purple-600">We'll get back to you within hours, not days!</p>
                  </CardHeader>
                  <CardContent className="relative z-10 font-medium">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-purple-700 font-bold mb-2">Full Name *</label>
                          <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="bg-white border-purple-300 text-purple-800 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 font-medium shadow-sm"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-purple-700 font-bold mb-2">Email Address *</label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="your.email@example.com"
                            className="bg-white border-purple-300 text-purple-800 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 font-medium shadow-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-purple-700 font-bold mb-2">Category *</label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger className="bg-white border-purple-300 text-purple-800 focus:border-purple-500 focus:ring-purple-500 font-medium shadow-sm font-medium">
                            <SelectValue placeholder="Choose your inquiry type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-purple-200 shadow-lg font-medium">
                            <SelectItem value="account">Account & Login Issues</SelectItem>
                            <SelectItem value="auction">Auction Questions</SelectItem>
                            <SelectItem value="payment">Payment & Billing</SelectItem>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="prizes">Prize & Delivery</SelectItem>
                            <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                            <SelectItem value="partnership">Business Partnership</SelectItem>
                            <SelectItem value="press">Press & Media</SelectItem>
                            <SelectItem value="legal">Legal & Compliance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-purple-700 font-bold mb-2">Subject *</label>
                        <Input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="Brief description of your inquiry"
                          className="bg-white border-purple-300 text-purple-800 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 font-medium shadow-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-purple-700 font-bold mb-2">Message *</label>
                        <Textarea
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          placeholder="Please provide as much detail as possible so we can help you quickly..."
                          rows={6}
                          className="bg-white border-purple-300 text-purple-800 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 font-medium shadow-sm resize-none"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 py-3 font-bold shadow-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information Sidebar */}
              <div className="space-y-6 relative z-10">
                {/* Company Information */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg relative overflow-hidden group">
                  <CardHeader className="relative z-10 font-medium">
                    <CardTitle className="text-purple-800 flex items-center space-x-2">
                      <Building2 className="w-6 h-6 text-purple-600" />
                      <span>Dream60 India</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10 font-medium">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-purple-800">Global Headquarters</p>
                        <p className="text-purple-700 text-sm">
                          Finpages Tech Private Limited,<br />
                          #709, Gowra Fountainhead,<br />
                          Hitech City, Madhapur,<br />
                          Pin: 500081.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-purple-800">Contact</p>
                        <p className="text-purple-700 text-sm">
                          Email: support@dream60.com<br />
                          For urgent auction issues: Live Chat Only
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Globe className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-purple-800">Global Presence</p>
                        <p className="text-purple-700 text-sm">
                          Serving India<br />
                          Licensed & regulated auction platform
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Times */}
                <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg relative overflow-hidden group">
                  <CardHeader className="relative z-10 font-medium">
                    <CardTitle className="text-purple-800 flex items-center space-x-2">
                      <Zap className="w-6 h-6 text-purple-600" />
                      <span>Response Times</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10 font-medium">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">Live Chat</span>
                      <Badge className="bg-green-100 text-green-700 border-green-300">Instant</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">Auction Issues</span>
                      <Badge className="bg-red-100 text-red-700 border-red-300">&lt;5 min</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">Payment Problems</span>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">&lt;2 hours</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">Technical Support</span>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">&lt;6 hours</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">General Inquiries</span>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">&lt;24 hours</Badge>
                    </div>
                  </div>
                  
                  <div className="border-t border-purple-200 pt-3">
                    <p className="text-xs text-purple-600">
                      * Response times are based on business hours (Mon-Sun, 24/7 for critical issues)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>


        </div>
      </main>
    </div>
  );
}