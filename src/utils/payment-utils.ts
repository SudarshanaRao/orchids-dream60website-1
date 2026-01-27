export type PaymentProvider = 'razorpay' | 'airpay';

export const getPaymentProvider = (): PaymentProvider => {
  if (typeof window === 'undefined') return 'airpay'; // Default for SSR
  
  const hostname = window.location.hostname;
  
  // Rules:
  // 1. test.dream60.com -> Razorpay
  // 2. dream60.com -> Airpay
  // 3. localhost:3000 -> Airpay
  
  if (hostname === 'test.dream60.com') {
    return 'razorpay';
  }
  
  // localhost or dream60.com or anything else
  return 'airpay';
};
