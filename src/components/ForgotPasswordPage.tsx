import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Phone, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { API_ENDPOINTS } from '../lib/api-config';

interface ForgotPasswordProps {
    onBack: () => void;
    onNavigate?: (page: "login") => void; // optional navigation callback
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
    const [hintOtp, setHintOtp] = useState<string | null>(null);
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
        setHintOtp(null); // clear previous hint
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

                // show backend-provided otp as hint (for dev/testing)
                if (data && data.otp) {
                    setHintOtp(String(data.otp));
                }
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
    const verifyOtp = async () => {
        if (!validateOtp()) return;
        setIsLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.auth.verifyOTP, {
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
    };

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
        setHintOtp(null);
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
                if (data && data.otp) {
                    setHintOtp(String(data.otp));
                }
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
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-purple-700">
                                        Enter OTP
                                    </Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter the OTP sent to your mobile"
                                        className="bg-white border-purple-300 text-purple-800 placeholder-purple-400 focus:border-purple-500"
                                    />
                                    {hintOtp && (
                                        <p className="text-xs text-purple-600 mt-1">
                                            Hint otp:{" "}
                                            <span className="font-mono text-sm text-purple-800 bg-purple-50 px-1 rounded">
                        {hintOtp}
                      </span>
                                        </p>
                                    )}
                                    {errors.otp && (
                                        <p className="text-red-500 text-sm">{errors.otp}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Button
                                            onClick={verifyOtp}
                                            variant="default"
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Verifying..." : "Verify OTP"}
                                        </Button>
                                    </div>

                                    <div className="text-sm text-right">
                                        <p className="text-xs text-purple-600">
                                            Didn't receive?{" "}
                                            <Button
                                                type="button"
                                                variant="link"
                                                onClick={resendOtp}
                                                className="text-purple-700 hover:text-purple-800 p-0 h-auto"
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