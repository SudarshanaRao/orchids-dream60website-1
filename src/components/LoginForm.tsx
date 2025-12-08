import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, Phone, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AnimatedBackground } from "./AnimatedBackground";
import { toast } from 'sonner';
import { API_ENDPOINTS } from "@/lib/api-config";

interface LoginFormProps {
    onLogin: (user: any) => void; // ✅ Changed to accept user object directly
    onSwitchToSignup: () => void;
    onBack: () => void;
    onNavigate?: (page: string) => void;
}
export function LoginForm({
    onLogin,
    onSwitchToSignup,
    onBack,
    onNavigate,
}: LoginFormProps) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

    const validateForm = () => {
        const newErrors: { identifier?: string; password?: string } = {};

        if (!identifier) {
            newErrors.identifier = "Email or number is required";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onForgotPassword = () => {
        if (onNavigate) onNavigate("forgot");
        else console.warn("onNavigate not provided — cannot navigate to forgot page");
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
        const response = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json().catch(() => ({}));

        //Success case (your backend returns token + user)
        if (response.ok && data.user) {
        const user = data.user;

        // Store required details
        try {
            localStorage.setItem("user_id", user.user_id?.toString() ?? user.id?.toString() ?? "");
            localStorage.setItem("username", user.username ?? "");
            localStorage.setItem("email", user.email ?? "");
        } catch (err) {
            console.error("LocalStorage write failed:", err);
        }

        toast.success("Welcome back!", {
            description: "You have successfully signed in.",
            duration: 4000,
        });

        // Parent callback
        onLogin(user);
        
        return;
        }

    // 🚫 Detailed error handling
    if (response.status === 404) {
      toast.error("User Not Found", {
        description: "No account exists with that email or mobile.",
        duration: 4000,
      });
    } else if (response.status === 401) {
      toast.warning("Incorrect Password", {
        description: "That password doesn't match our records.",
        duration: 4000,
      });
    } else {
      toast.error("Login Failed", {
        description: data.message || `Unexpected error (${response.status}). Try again.`,
        duration: 4000,
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    toast.error("Network Error 🌐", {
      description: "Couldn't reach the server. Check your connection.",
      duration: 4000,
    });
  } finally {
    setIsLoading(false);
  }
};




    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            <AnimatedBackground />

            <motion.div
                className="w-full max-w-md space-y-5 sm:space-y-6 relative z-10"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
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
                                damping: 15,
                            }}
                            whileHover={{
                                scale: 1.05,
                                rotate: 5,
                                transition: { duration: 0.2 },
                            }}
                        >
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                        Welcome back to the auction experience
                    </motion.p>
                </motion.div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
                >
                    <Card className="bg-white/70 backdrop-blur-xl border border-purple-200/50 shadow-2xl shadow-purple-500/10 overflow-hidden">
                        <CardHeader className="relative">
                            <CardTitle className="text-purple-800 text-center text-xl sm:text-2xl">
                                Sign In
                            </CardTitle>
                            <motion.div
                                className="h-1 w-16 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mx-auto mt-2"
                                initial={{ width: 0 }}
                                animate={{ width: 64 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            />
                        </CardHeader>
                        <CardContent className="relative">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Identifier (email/phone) */}
                                <div className="space-y-2">
                                    <Label htmlFor="identifier" className="text-purple-700 font-medium">
                                        Email or Number
                                    </Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                                        <Input
                                            id="identifier"
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder="Enter your email or phone"
                                            className="pl-10 bg-white/50 border-purple-200 text-purple-900 placeholder-purple-400 focus:border-purple-500 focus:bg-white transition-all duration-200"
                                        />
                                    </div>
                                    {errors.identifier && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 text-sm"
                                        >
                                            {errors.identifier}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-purple-700 font-medium">
                                        Password
                                    </Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="pl-10 pr-10 bg-white/50 border-purple-200 text-purple-900 placeholder-purple-400 focus:border-purple-500 focus:bg-white transition-all duration-200"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 text-sm"
                                        >
                                            {errors.password}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Forgot Password */}
                                <div className="text-right">
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={onForgotPassword}
                                        className="text-sm text-purple-600 hover:text-purple-800 p-0 h-auto"
                                    >
                                        Forgot password?
                                    </Button>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </form>

                            {/* Switch to Signup */}
                            <div className="mt-6 text-center">
                                <p className="text-purple-600">
                                    Don't have an account?{" "}
                                    <Button
                                        onClick={onSwitchToSignup}
                                        variant="link"
                                        className="text-purple-700 hover:text-purple-800 p-0 h-auto"
                                    >
                                        Sign up
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