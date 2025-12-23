import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Upload, Send, CheckCircle2, AlertCircle, Clock, User, Mail, Phone, Link as LinkIcon, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface CareersFormProps {
  onBack: () => void;
}

export function CareersForm({ onBack }: CareersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    experience: '',
    portfolio: '',
    message: ''
  });

  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'UI/UX Designer',
    'Product Manager',
    'Marketing Specialist',
    'Customer Support',
    'Operations Manager',
    'Other'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role || !fileName) {
      toast.error('Please fill in all required fields and upload your resume');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-purple-900">Application Received!</h2>
          <p className="text-purple-600 font-medium">
            Thank you for your interest in joining Dream60. Our recruitment team will review your application and get back to you soon.
          </p>
          <Button 
            onClick={onBack}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-6 font-bold"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Replicating Support Style */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
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
                <Briefcase className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Careers</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block text-right">
                <h2 className="text-lg font-bold text-purple-900 leading-none">Dream60</h2>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest mt-1">Join Our Team</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-purple-900 mb-4">Work at Dream60</h2>
            <p className="text-purple-600/70 font-medium">Help us build India's most exciting live auction platform.</p>
          </div>

          <Card className="p-6 md:p-8 bg-white border-purple-100 shadow-2xl shadow-purple-500/5 rounded-[32px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" /> Full Name *
                  </label>
                  <Input 
                    required
                    placeholder="Enter your full name"
                    className="rounded-xl border-purple-100 focus:border-purple-400 py-6"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" /> Email Address *
                  </label>
                  <Input 
                    required
                    type="email"
                    placeholder="email@example.com"
                    className="rounded-xl border-purple-100 focus:border-purple-400 py-6"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" /> Phone Number
                  </label>
                  <Input 
                    placeholder="+91 00000 00000"
                    className="rounded-xl border-purple-100 focus:border-purple-400 py-6"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-500" /> Select Role *
                  </label>
                  <select 
                    required
                    className="w-full h-12 rounded-xl border border-purple-100 bg-white px-3 text-sm focus:outline-none focus:border-purple-400"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="">Choose a role...</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" /> Years of Experience
                  </label>
                  <select 
                    className="w-full h-12 rounded-xl border border-purple-100 bg-white px-3 text-sm focus:outline-none focus:border-purple-400"
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                  >
                    <option value="">Select experience...</option>
                    <option value="fresher">Fresher</option>
                    <option value="1-2">1-2 Years</option>
                    <option value="3-5">3-5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-purple-500" /> Portfolio / LinkedIn URL
                  </label>
                  <Input 
                    placeholder="https://linkedin.com/in/..."
                    className="rounded-xl border-purple-100 focus:border-purple-400 py-6"
                    value={formData.portfolio}
                    onChange={e => setFormData({...formData, portfolio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-500" /> Resume / CV (PDF) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-100 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-purple-900">
                    {fileName || 'Click to upload your resume'}
                  </p>
                  <p className="text-xs text-purple-500 mt-2 font-medium">Max file size: 5MB (PDF, DOC, DOCX)</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <MessageCircleIcon className="w-4 h-4 text-purple-500" /> Why do you want to join Dream60?
                </label>
                <Textarea 
                  placeholder="Tell us a bit about yourself..."
                  className="rounded-2xl border-purple-100 focus:border-purple-400 min-h-[120px] resize-none"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl py-8 font-black text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Application...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5" />
                    <span>Submit Application</span>
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-purple-500">
                <AlertCircle className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Your data is secure and will only be used for recruitment</p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
