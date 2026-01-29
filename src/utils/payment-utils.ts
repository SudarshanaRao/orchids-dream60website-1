export type PaymentProvider = 'razorpay' | 'airpay';

export const getPaymentProvider = (): PaymentProvider => {
  // 1. Check environment variable first
  const envProvider = import.meta.env.VITE_PAYMENT_PROVIDER as PaymentProvider;
  if (envProvider && (envProvider === 'razorpay' || envProvider === 'airpay')) {
    return envProvider;
  }

  // 2. Fallback to runtime detection
  if (typeof window === 'undefined') return 'airpay'; // Default for SSR
  
  const hostname = window.location.hostname;
  
    // Rules:
    // 1. test.dream60.com -> Airpay
    // 2. dream60.com -> Airpay
    // 3. localhost:3000 -> Airpay
    
    if (hostname === 'test.dream60.com') {
      return 'airpay';
    }
  
  // localhost or dream60.com or anything else
  return 'airpay';
};
