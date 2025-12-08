import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AnimatedBackground } from './AnimatedBackground';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

interface SignupFormProps {
  onSignup: (userData: { username: string; mobile: string; email: string; password: string }) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
  onNavigate?: (page: string) => void;
  isLoading?: boolean;
}

export function SignupForm({ onSignup, onSwitchToLogin, onBack, onNavigate, isLoading: externalLoading }: SignupFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username cannot exceed 20 characters';
    }

    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be a valid 10-digit number';
    }


    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch(API_ENDPOINTS.auth.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          mobile: formData.mobile,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);

        toast.success('Account created!', {
          description: `Welcome to Dream60, ${data.user.username}!`,
          duration: 4000,
        });
        
        // SUCCESS — send data back upward
        onSignup(data.user);
        
        return;
      }
      if (!response.ok) {
        setErrors({ api: data.message || "Signup failed" });
        toast.error("Login Failed", {
          description: data.message || `Unexpected error (${response.status}). Try again.`,
          duration: 4000,
        });
        return;
      }

    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ api: "Network error. Please try again." });
    }
  };



  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 py-6 relative overflow-hidden">
      <AnimatedBackground />

      <motion.div
        className="w-full max-w-md space-y-5 sm:space-y-6 relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.6, -0.05, 0.01, 0.99]
        }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="absolute top-3 left-3 sm:top-4 sm:left-4 text-purple-600 hover:text-purple-800 hover:bg-purple-50/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Back</span>
          </Button>

          <div className="flex items-center justify-center space-x-3 pt-8 sm:pt-0">
            <motion.div
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{
                scale: 1.05,
                rotate: -5,
                transition: { duration: 0.2 }
              }}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Dream60
            </motion.h1>
          </div>
          <motion.p
            className="text-sm sm:text-base text-purple-600/80 px-4 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Join the elite auction community today
          </motion.p>
        </motion.div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
        >
          <Card className="bg-white/70 backdrop-blur-xl border border-purple-200/50 shadow-2xl shadow-purple-500/10 overflow-hidden">
            {/* Card shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
            />
            <CardHeader className="relative">
              <CardTitle className="text-purple-800 text-center text-xl sm:text-2xl">Create Account</CardTitle>
              <motion.div
                className="h-1 w-16 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mx-auto mt-2"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-purple-700">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 20) {
                          handleInputChange('username', value);
                        }
                      }}
                      placeholder="Choose a username"
                      className="pl-10 bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none transition-all duration-200 rounded-xl"
                    /></div>
                  {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}

                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-purple-700">Mobile</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                    <Input
                      id="mobile"
                      type="tel"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");  // allow only digits
                        if (value.length <= 10) {
                          handleInputChange('mobile', value);
                        }
                      }}

                      placeholder="Enter your mobile number"
                      className="pl-10 bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none transition-all duration-200 rounded-xl"
                    />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
                </div>


                <div className="space-y-2">
                  <Label htmlFor="email" className="text-purple-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl" />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-purple-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password"
                      className="pl-10 bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-purple-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10 bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start space-x-2">
                  <input type="checkbox" id="terms" className="mt-1 rounded border-purple-400 text-purple-600 focus:ring-purple-500" required />
                  <label htmlFor="terms" className="text-sm text-purple-600">
                    I agree to the{' '}
                    <Button
                      variant="link"
                      onClick={() => onNavigate?.('terms')}
                      className="text-purple-700 hover:text-purple-800 p-0 h-auto"
                      type="button"
                    >
                      Terms of Service
                    </Button>
                    {' '}and{' '}
                    <Button
                      variant="link"
                      onClick={() => onNavigate?.('privacy')}
                      className="text-purple-700 hover:text-purple-800 p-0 h-auto"
                      type="button"
                    >
                      Privacy Policy
                    </Button>
                  </label>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    disabled={externalLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {externalLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </motion.div>

              </form>

              <div className="mt-6 text-center">
                <p className="text-purple-600">
                  Already have an account?{' '}
                  <Button
                    onClick={onSwitchToLogin}
                    variant="link"
                    className="text-purple-700 hover:text-purple-800 p-0 h-auto"
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}