import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Upload, Send, CheckCircle2, AlertCircle, Clock, User, Mail, Phone, Link as LinkIcon, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { SupportCenterHeader } from './SupportCenterHeader';

import { API_ENDPOINTS } from '@/lib/api-config';

interface CareersFormProps {
  onBack: () => void;
}

export function CareersForm({ onBack }: CareersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
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
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role || !file) {
      toast.error('Please fill in all required fields and upload your resume');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('role', formData.role);
      data.append('experience', formData.experience);
      data.append('portfolio', formData.portfolio);
      data.append('message', formData.message);
      data.append('resume', file);

      const response = await fetch(API_ENDPOINTS.careers.apply, {
        method: 'POST',
        body: data,
        // Don't set Content-Type header, fetch will set it correctly for FormData with boundary
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        toast.success(result.message || 'Application submitted successfully!');
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application. Please try again.');
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
      <SupportCenterHeader 
        title="Careers" 
        icon={<Briefcase className="w-6 h-6" />} 
        onBack={onBack} 
        backLabel="Back to Home"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-purple-900 mb-4">Work at Dream60</h2>
            <p className="text-purple-600/70 font-medium">Help us build India's most exciting live auction platform.</p>
          </div>

          <Card className="p-6 md:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>
                  <Input 
                    required
                    placeholder="John Doe"
                    className="rounded-lg border-gray-300 focus:ring-purple-500 py-5"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Email Address *
                  </label>
                  <Input 
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="rounded-lg border-gray-300 focus:ring-purple-500 py-5"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <Input 
                    placeholder="+91 00000 00000"
                    className="rounded-lg border-gray-300 focus:ring-purple-500 py-5"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Select Role *
                  </label>
                  <select 
                    required
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Years of Experience
                  </label>
                  <select 
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Portfolio / LinkedIn URL
                  </label>
                  <Input 
                    placeholder="https://linkedin.com/in/..."
                    className="rounded-lg border-gray-300 focus:ring-purple-500 py-5"
                    value={formData.portfolio}
                    onChange={e => setFormData({...formData, portfolio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Resume / CV (PDF) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition-all group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 transition-colors">
                    <FileText className="w-5 h-5 text-gray-500 group-hover:text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {fileName || 'Click to upload your resume'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Max 5MB (PDF, DOC, DOCX)</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Why do you want to join Dream60?
                </label>
                <Textarea 
                  placeholder="Tell us about yourself..."
                  className="rounded-lg border-gray-300 focus:ring-purple-500 min-h-[100px] resize-none"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-6 font-semibold shadow-sm transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>

              <div className="flex items-center justify-center gap-2 text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <p className="text-[11px] font-medium">Your data is secure and used only for recruitment</p>
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
