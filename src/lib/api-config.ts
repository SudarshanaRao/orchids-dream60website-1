/**
 * Centralized API Configuration
 * 
 * This file manages all API endpoint URLs for the application.
 * It automatically detects the environment and uses the correct API base URL.
 */

// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  const envApiUrl = import.meta.env.VITE_BACKEND_API_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback to default production API
  return 'https://dev-api.dream60.com';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Utility
  serverTime: `${API_BASE_URL}/utility/server-time`,
  
  // Authentication
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    sendOtp: `${API_BASE_URL}/auth/send-otp`,
    verifyOTP: `${API_BASE_URL}/auth/verify-otp`,
    resendOtp: `${API_BASE_URL}/auth/resend-otp`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    updatePassword: `${API_BASE_URL}/auth/update-password`,
    deleteAccount: `${API_BASE_URL}/auth/me`,
    adminLogin: `${API_BASE_URL}/admin/login`,
    me: {
      profile: `${API_BASE_URL}/auth/me/profile`,
    },
  },
  
  // Scheduler (Auctions)
  scheduler: {
    liveAuction: `${API_BASE_URL}/scheduler/live-auction`,
    placeBid: `${API_BASE_URL}/scheduler/place-bid`,
    auctionDetails: `${API_BASE_URL}/scheduler/auction-details`,
    userAuctionHistory: `${API_BASE_URL}/scheduler/user-auction-history`,
    updatePrizeClaim: `${API_BASE_URL}/scheduler/update-prize-claim`,
    upcomingAuctions: `${API_BASE_URL}/scheduler/upcoming-auctions`,
    dailyAuction: `${API_BASE_URL}/scheduler/daily-auction`,
    leaderboard: `${API_BASE_URL}/scheduler/leaderboard`,
    adminDashboard: `${API_BASE_URL}/scheduler/admin/dashboard`,
    adminAuctionHistory: `${API_BASE_URL}/scheduler/admin/auction-history`,
    adminAuctionDetails: `${API_BASE_URL}/scheduler/admin/auction-details`,
  },
  
  // User Management
  user: {
    profile: `${API_BASE_URL}/user/profile`,
    update: `${API_BASE_URL}/user/update`,
    updateDetails: `${API_BASE_URL}/auth/updateUserDetails`,
    updatePreferences: `${API_BASE_URL}/auth/me/preferences`,
    delete: `${API_BASE_URL}/user/delete`,
  },
  
  // Razorpay Payments
  razorpay: {
    createOrder: `${API_BASE_URL}/api/razorpay/hourly/create-order`,
    verifyPayment: `${API_BASE_URL}/api/razorpay/hourly/verify-payment`,
    prizeClaimCreateOrder: `${API_BASE_URL}/api/razorpay/prize-claim/create-order`,
    prizeClaimVerifyPayment: `${API_BASE_URL}/api/razorpay/prize-claim/verify-payment`,
    billingPortal: `${API_BASE_URL}/api/billing-portal`,
  },
};

// Helper function to build query string
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Helper function to make API calls with error handling
export const apiCall = async <T = any>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

console.log('🔧 API Configuration Loaded:', {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.MODE,
});