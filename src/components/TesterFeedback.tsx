import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Lightbulb, 
  AlertCircle, 
  Send, 
  ArrowLeft,
  CheckCircle2,
  Bug,
  Image as ImageIcon,
  X,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { SupportCenterHeader } from './SupportCenterHeader';
import { API_BASE_URL } from '@/lib/api-config';

interface TesterFeedbackProps {
  user?: {
    id: string;
    username: string;
    email?: string;
  } | null;
  onBack: () => void;
}

  export const TesterFeedback: React.FC<TesterFeedbackProps> = ({ user, onBack }) => {
    const [feedbackType, setFeedbackType] = useState<'idea' | 'suggestion' | 'error' | 'issue'>('suggestion');
    const [message, setMessage] = useState('');
    const [name, setName] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
      if (user) {
        setName(user.username || '');
        setEmail(user.email || '');
      }
    }, [user]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload an image file (JPG, PNG, WEBP)');
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 5MB.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setScreenshot(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.onerror = () => {
          toast.error('Failed to read file. Please try another image.');
          removeScreenshot();
        };
        reader.readAsDataURL(file);
      }
    };

    const removeScreenshot = () => {
      setScreenshot(null);
      setScreenshotPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!message.trim()) {
        toast.error('Please enter your feedback message');
        return;
      }

      // Final check for file size before submission
      if (screenshot && screenshot.size > 5 * 1024 * 1024) {
        toast.error('Attached image is too large. Please use an image under 5MB.');
        return;
      }

      setIsSubmitting(true);

      try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('type', feedbackType);
        formData.append('message', message);
        if (user?.id) formData.append('userId', user.id);
        if (screenshot) {
          formData.append('screenshot', screenshot);
        }

        const response = await fetch(`${API_BASE_URL}/feedback`, {
          method: 'POST',
          body: formData,
        });

        if (response.status === 413) {
          toast.error('Image is too large for our server. Please use a smaller image or compress it.');
          setIsSubmitting(false);
          return;
        }

        const data = await response.json();

        if (data.success) {
          setIsSuccess(true);
          toast.success('Feedback submitted successfully!');
          setMessage('');
          removeScreenshot();
        } else {
          toast.error(data.message || 'Failed to submit feedback');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Could not connect to server. Your image might be too large or your connection is slow.');
      } finally {
        setIsSubmitting(false);
      }
    };

  const feedbackTypes = [
    { id: 'suggestion', label: 'Suggestion', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'idea', label: 'New Idea', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'error', label: 'Error', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SupportCenterHeader 
          title="Tester Feedback"
          icon={<Bug className="w-6 h-6" />}
          onBack={onBack}
          backLabel="Back to Home"
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-purple-500/5 p-8 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h2>
            <p className="text-slate-600 mb-8">
              Your feedback has been received. We appreciate your help in making Dream60 better!
            </p>
            <button
              onClick={onBack}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SupportCenterHeader 
        title="Tester Feedback"
        icon={<Bug className="w-6 h-6" />}
        onBack={onBack}
        backLabel="Back to Home"
      />

      <div className="max-w-2xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-purple-500/5 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <p className="text-slate-500 font-medium">Help us improve Dream60 v2.0</p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-black">
                    T{i}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Feedback Type Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id as any)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      feedbackType === type.id
                        ? 'border-purple-600 bg-purple-50 shadow-lg shadow-purple-500/10 scale-[1.02]'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${type.bg}`}>
                      <type.icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <span className={`text-xs font-bold ${feedbackType === type.id ? 'text-purple-700' : 'text-slate-500'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>

                {/* User Info (Auto-filled if logged in) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Your Name {!user && <span className="text-rose-500">*</span>}
                    </label>
                      <input
                        type="text"
                        required={!user}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        readOnly={!!user}
                        placeholder="Enter your name"
                        className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all ${
                          user 
                            ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' 
                            : 'bg-slate-50 border-slate-100 focus:border-purple-500 focus:bg-white text-slate-700'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Email Address {!user && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="email"
                        required={!user}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        readOnly={!!user}
                        placeholder="Enter your email"
                        className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all ${
                          user 
                            ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' 
                            : 'bg-slate-50 border-slate-100 focus:border-purple-500 focus:bg-white text-slate-700'
                        }`}
                      />
                  </div>
                </div>


                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Message
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Describe your ${feedbackType} in detail...`}
                    rows={5}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none"
                  />
                </div>

                {/* Screenshot/Media Upload */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Attach Reference (Optional)
                  </label>
                  
                  <div className="flex flex-wrap gap-4">
                    {!screenshotPreview ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-all group"
                      >
                        <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Add Screenshot</span>
                      </button>
                    ) : (
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg">
                          <img 
                            src={screenshotPreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-2xl">
                          <span className="text-white text-[10px] font-black uppercase">Click X to remove</span>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium px-1">
                    Maximum file size: 5MB. Supports JPG, PNG, WEBP.
                  </p>
                </div>

                <button
                disabled={isSubmitting}
                type="submit"
                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
        
        <p className="text-center text-slate-400 font-medium mt-8 text-sm px-8">
          Your feedback will be sent directly to our development team at <span className="text-purple-500 font-bold">dream60.official@gmail.com</span>
        </p>
      </div>
    </div>
  );
};
