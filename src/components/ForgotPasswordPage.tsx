import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, Lock, Phone, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { API_ENDPOINTS } from '../lib/api-config';

interface ForgotPasswordProps {
    onBack: () => void;
    onNavigate?: (page: "login") => void;
}

// Reusable Aesthetic OTP Input
function OTPInput({ value, onChange, onComplete, disabled, length = 6 }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; disabled?: boolean; length?: number }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastCompletedOtp = useRef<string>('');

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const updatedValue = newValue.join('');
    onChange(updatedValue);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  useEffect(() => {
    if (value.length === length && onComplete && value !== lastCompletedOtp.current) {
      lastCompletedOtp.current = value;
      onComplete(value);
    } else if (value.length !== length) {
      lastCompletedOtp.current = '';
    }
  }, [value, length, onComplete]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/\D/g, '');
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-1.5 sm:gap-3 py-6 max-w-full overflow-hidden" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            delay: i * 0.04, 
            type: "spring", 
            stiffness: 400, 
            damping: 25 
          }}
          className="relative flex-1 max-w-[48px] sm:max-w-[64px]"
        >
          <input
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            disabled={disabled}
            onChange={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-full h-12 sm:h-16 text-center text-2xl sm:text-3xl font-black rounded-xl sm:rounded-2xl border-2 transition-all duration-300 outline-none
              ${value[i] 
                ? 'border-purple-600 bg-white text-purple-900 shadow-[0_8px_20px_-4px_rgba(147,51,234,0.3)] ring-4 ring-purple-500/10' 
                : 'border-purple-100 bg-purple-50/30 text-purple-400 focus:border-purple-500 focus:bg-white focus:shadow-[0_4px_12px_-4px_rgba(147,51,234,0.2)] focus:ring-4 focus:ring-purple-500/5'
              }
              disabled:opacity-50 disabled:cursor-not-allowed select-none`}
          />
          <AnimatePresence>
            {value[i] && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"
              >
                <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75" />
              </motion.div>
            )}
          </AnimatePresence>
          {!value[i] && !disabled && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <motion.div 
                animate={{ opacity: [0, 1, 0], scaleY: [0.7, 1, 0.7] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-0.5 h-6 sm:h-8 bg-purple-500/40 rounded-full"
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function ForgotPasswordPage({
                                         onBack,
                                         onNavigate,
                                     }: ForgotPasswordProps) {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [step, setStep] = useState<"enter" | "verify" | "reset" | "done">(
        "enter"
    );
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        mobile?: string;
        otp?: string;
        newPassword?: string;
    }>({});
    const [resendTimer, setResendTimer] = useState(0);
    const RESEND_DELAY = 60; // seconds

    useEffect(() => {
        let timer: number | undefined;
        if (resendTimer > 0) {
            timer = window.setTimeout(() => setResendTimer((t) => t - 1), 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [resendTimer]);

    const validateMobile = () => {
        const mErr = !mobile
            ? "Mobile number is required"
            : !/^[0-9]{10}$/.test(mobile)
                ? "Enter a valid 10-digit mobile number"
                : undefined;
        setErrors((p) => ({ ...p, mobile: mErr }));
        return !mErr;
    };

    const validateOtp = () => {
        const oErr = !otp
            ? "OTP is required"
            : otp.length < 4
                ? "Enter a valid OTP"
                : undefined;
        setErrors((p) => ({ ...p, otp: oErr }));
        return !oErr;
    };

    const validateNewPassword = () => {
        const pErr = !newPassword
            ? "Password is required"
            : newPassword.length < 6
                ? "Password must be at least 6 characters"
                : undefined;
        setErrors((p) => ({ ...p, newPassword: pErr }));
        return !pErr;
    };

    // Request OTP
    const requestOtp = async () => {
        if (!validateMobile()) return;
        setIsLoading(true);
        try {
            const res = await fetch(
                API_ENDPOINTS.auth.sendOtp,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile }),
                }
            );

            // safe parse
            const data = await (async () => {
                try {
                    return await res.json();
                } catch {
                    return {};
                }
            })();

            if (res.ok) {
                setStep("verify");
                setResendTimer(RESEND_DELAY);
            } else {
                alert(data.message || "Failed to send OTP");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP
    const verifyOtp = useCallback(async () => {
        if (!validateOtp()) return;
        setIsLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.auth.verifyOtp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, otp }),
            });
            const data = await res.json();
            if (res.ok) {
                setStep("reset");
            } else {
                alert(data.message || "OTP verification failed");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [mobile, otp, validateOtp, API_ENDPOINTS.auth.verifyOtp]);

    // Reset password
    const resetPassword = async () => {
        if (!validateNewPassword()) return;
        setIsLoading(true);
        try {
            const res = await fetch(
                API_ENDPOINTS.auth.resetPassword,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile, otp, newPassword }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                setStep("done");
                // Optionally auto-navigate to login
                setTimeout(() => {
                    if (onNavigate) onNavigate("login");
                }, 1200);
            } else {
                alert(data.message || "Failed to reset password");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resendOtp = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.auth.resendOtp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile }),
            });

            const data = await (async () => {
                try {
                    return await res.json();
                } catch {
                    return {};
                }
            })();

            if (res.ok) {
                setResendTimer(RESEND_DELAY);
            } else {
                alert(data.message || "Failed to resend OTP");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-md space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 left-3 sm:top-4 sm:left-4 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Back</span>
                    </Button>

                    <div className="flex items-center justify-center space-x-2 pt-8 sm:pt-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-purple-800">
                            Dream60
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-purple-600 px-4">
                        Forgot password — we will help you reset it
                    </p>
                </div>

                <Card className="bg-white border-purple-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-purple-800 text-center">
                            {step === "enter" && "Enter Mobile"}
                            {step === "verify" && "Verify OTP"}
                            {step === "reset" && "Set New Password"}
                            {step === "done" && "Success"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {step === "enter" && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    requestOtp();
                                }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="mobile" className="text-purple-700">
                                        Mobile Number
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            placeholder="Enter your mobile number"
                                            className="pl-10 bg-white border-purple-300 text-purple-800 placeholder-purple-400 focus:border-purple-500"
                                        />
                                    </div>
                                    {errors.mobile && (
                                        <p className="text-red-500 text-sm">{errors.mobile}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600"
                                >
                                    {isLoading ? "Sending OTP..." : "Send OTP"}
                                </Button>
                            </form>
                        )}

                        {step === "verify" && (
                            <div className="space-y-4">
                                    <div className="space-y-2 text-center">
                                        <Label className="text-purple-700 font-semibold">
                                            Verify Mobile Number
                                        </Label>
                                        <p className="text-xs text-purple-500 mb-2">
                                            We've sent a 6-digit code to {mobile}
                                        </p>
                                        <OTPInput 
                                            value={otp} 
                                            onChange={setOtp} 
                                            onComplete={verifyOtp}
                                            disabled={isLoading}
                                        />
                                        {isLoading && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-center gap-2 text-purple-600 text-xs font-medium mt-2"
                                            >
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                Verifying...
                                            </motion.div>
                                        )}
                                        {errors.otp && (
                                            <p className="text-red-500 text-sm">{errors.otp}</p>
                                        )}
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="text-center">

                                        <p className="text-xs text-purple-600">
                                            Didn't receive?{" "}
                                            <Button
                                                type="button"
                                                variant="link"
                                                onClick={resendOtp}
                                                className="text-purple-700 hover:text-purple-800 p-0 h-auto font-bold"
                                                disabled={resendTimer > 0 || isLoading}
                                            >
                                                {resendTimer > 0
                                                    ? `Resend in ${resendTimer}s`
                                                    : "Resend OTP"}
                                            </Button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "reset" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-purple-700">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pl-10 pr-10 bg-white border-purple-300 text-purple-800 placeholder-purple-400 focus:border-purple-500"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.newPassword && (
                                        <p className="text-red-500 text-sm">{errors.newPassword}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={resetPassword}
                                        variant="default"
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting..." : "Reset Password"}
                                    </Button>

                                    <Button
                                        onClick={() => setStep("verify")}
                                        variant="ghost"
                                        className="text-purple-600 hover:text-purple-800 p-0 h-auto"
                                    >
                                        Back
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "done" && (
                            <div className="py-6 text-center">
                                <h3 className="text-lg font-semibold text-purple-800">
                                    Password reset successful
                                </h3>
                                <p className="text-sm text-purple-600 mt-2">
                                    You can now sign in with your new password.
                                </p>
                                <div className="mt-4">
                                    <Button
                                        onClick={() => (onNavigate ? onNavigate("login") : null)}
                                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600"
                                    >
                                        Go to Login
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;