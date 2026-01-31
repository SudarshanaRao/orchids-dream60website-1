import { useState, useCallback } from 'react';
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';
import { toast } from 'sonner';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api-config';
import { getPaymentProvider } from '@/utils/payment-utils';

interface CreatePrizeClaimOrderPayload {
  userId: string;
  hourlyAuctionId: string;
  amount: number;
  currency?: string;
  username?: string;
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    razorpayKeyId?: string;
    orderId: string;
    amount?: number;
    currency?: string;
    hourlyAuctionId?: string;
    paymentId?: string;
    rank?: number;
    prizeValue?: number;
    userInfo?: {
      name: string;
      email: string;
      contact: string;
    };
    // Airpay fields
    url?: string;
    params?: Record<string, any>;
  };
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data: {
    payment: any;
    claimed: boolean;
    hourlyAuctionId: string;
    rank: number;
    prizeAmount: number;
    upiId: string;
    claimedAt: string;
    username: string;
  };
}

export const usePrizeClaimPayment = () => {
  const { error: razorpayError, isLoading: razorpayLoading, Razorpay } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const initiatePrizeClaimPayment = useCallback(
    async (
      payload: CreatePrizeClaimOrderPayload,
      userDetails: { name: string; email: string; contact: string; upiId: string },
      onSuccess: (response: VerifyResponse) => void,
      onFailure: (error: string) => void
    ) => {
      try {
        setLoading(true);
        setPaymentStatus('idle');

        const provider = getPaymentProvider();

        if (provider === 'airpay') {
          // 1. Create Airpay order on backend
          const response = await fetch(API_ENDPOINTS.airpay.createOrder, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: payload.userId,
              hourlyAuctionId: payload.hourlyAuctionId,
              amount: payload.amount,
              username: payload.username || userDetails.name,
              paymentType: 'PRIZE_CLAIM',
            }),
          });

          const orderData: OrderResponse = await response.json();

          if (!response.ok || !orderData.success || !orderData.data) {
            throw new Error(orderData.message || 'Failed to create Airpay order');
          }

          // 2. Store pending details in cookies for recovery
          const pendingDetails = {
            auctionId: payload.hourlyAuctionId,
            amount: payload.amount,
            paymentType: 'PRIZE_CLAIM',
            timestamp: Date.now()
          };
          document.cookie = `pending_payment_details=${encodeURIComponent(JSON.stringify(pendingDetails))}; path=/; max-age=3600`;

          // 3. Airpay uses a form redirect
          const { url, params } = orderData.data;
          if (!url || !params) {
            throw new Error('Airpay redirect data missing');
          }

          const form = document.createElement('form');
          form.method = 'POST';
          form.action = url;

          Object.entries(params).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
          return;
        }

        // --- Razorpay Flow ---
        
        // 1. Create prize claim order on backend
        const orderResponse = await fetch(API_ENDPOINTS.razorpay.prizeClaimCreateOrder, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const orderData: OrderResponse = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
          throw new Error(orderData.message || 'Failed to create prize claim order');
        }

        if (!orderData.data.orderId) {
          throw new Error('Order ID not received');
        }

        const actualUserDetails = orderData.data.userInfo || userDetails;
        const finalEmail = actualUserDetails.email || userDetails.email;
        const finalUpiId = userDetails.upiId || actualUserDetails.email || finalEmail;
        
        if (!finalEmail) {
          throw new Error('Email not found. Please update your profile with a valid email address.');
        }

        // 2. Razorpay checkout options
        const options: RazorpayOrderOptions = {
          key: orderData.data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.data.amount || payload.amount * 100,
          currency: orderData.data.currency || 'INR',
          name: 'DREAM60',
          description: `Prize Claim Payment`,
          order_id: orderData.data.orderId,
          
          handler: async (response: PaymentResponse) => {
            try {
              if (!finalUpiId) {
                throw new Error('UPI ID/Email is required for prize claim verification');
              }
              
              const verifyResponse = await fetch(
                API_ENDPOINTS.razorpay.prizeClaimVerifyPayment,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    username: actualUserDetails.name,
                    upiId: finalUpiId,
                  }),
                }
              );

              const verifyData: VerifyResponse = await verifyResponse.json();

              if (verifyResponse.ok && verifyData.success) {
                setPaymentStatus('success');
                toast.success('Prize Claimed Successfully!', {
                  description: `Your prize has been claimed. Payment received!`,
                });
                onSuccess(verifyData);
              } else {
                throw new Error(verifyData.message || 'Prize claim verification failed');
              }
            } catch (verifyError) {
              const errorMsg = verifyError instanceof Error ? verifyError.message : 'Prize claim verification failed';
              setPaymentStatus('failed');
              toast.error('Verification Failed', {
                description: errorMsg,
              });
              onFailure(errorMsg);
            }
          },

          modal: {
            ondismiss: () => {
              setLoading(false);
              setPaymentStatus('failed');
              toast.error('Payment Cancelled', {
                description: 'You cancelled the prize claim payment.',
              });
              onFailure('Payment cancelled by user');
            },
          },

          prefill: {
            name: actualUserDetails.name,
            email: finalEmail,
            contact: actualUserDetails.contact || '9999999999',
          },

          theme: {
            color: '#6B3FA0',
          },

          retry: {
            enabled: true,
            max_count: 3,
          },
        };

        if (Razorpay) {
          const rzpInstance = new Razorpay(options);
          
          rzpInstance.on('payment.failed', (response: any) => {
            setPaymentStatus('failed');
            toast.error('Payment Failed', {
              description: response.error.description || 'Prize claim payment failed',
            });
            onFailure(response.error.description || 'Payment failed');
          });

          rzpInstance.open();
        } else {
          throw new Error('Razorpay SDK not loaded');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Prize claim payment initiation failed';
        setPaymentStatus('failed');
        toast.error('Error', {
          description: errorMessage,
        });
        onFailure(errorMessage);
        console.error('Prize claim payment error:', err);
      } finally {
        setLoading(false);
      }
    },
    [Razorpay]
  );

  return {
    initiatePrizeClaimPayment,
    loading,
    paymentStatus,
    error: razorpayError,
  };
};
