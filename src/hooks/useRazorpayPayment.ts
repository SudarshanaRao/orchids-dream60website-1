import { useState, useCallback } from 'react';
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

interface CreateOrderPayload {
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
    razorpayKeyId: string;
    orderId: string;
    amount: number;
    currency: string;
    auctionId: string;
    paymentId: string;
    userInfo?: {
      name: string;
      email: string;
      contact: string;
    };
  };
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data: {
    payment: any;
    joined: boolean;
    hourlyAuctionId: string;
    totalParticipants?: number;
  };
}

export const useRazorpayPayment = () => {
  const { error: razorpayError, isLoading: razorpayLoading, Razorpay } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const initiatePayment = useCallback(
    async (
      payload: CreateOrderPayload,
      userDetails: { name: string; email: string; contact: string },
      onSuccess: (response: VerifyResponse) => void,
      onFailure: (error: string) => void
    ) => {
      try {
        setLoading(true);
        setPaymentStatus('idle');

        // 1. Create order on backend
        const orderResponse = await fetch(API_ENDPOINTS.razorpay.createOrder, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const orderData: OrderResponse = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        if (!orderData.data.orderId) {
          throw new Error('Order ID not received');
        }

        // ✅ Use actual user data from backend response if available, otherwise fallback to provided userDetails
        const actualUserDetails = orderData.data.userInfo || userDetails;
        
        console.log('✅ [RAZORPAY_PREFILL] Using user data:', {
          name: actualUserDetails.name,
          email: actualUserDetails.email,
          contact: actualUserDetails.contact,
          source: orderData.data.userInfo ? 'backend' : 'frontend'
        });

        // 2. Razorpay checkout options
        const options: RazorpayOrderOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'DREAM60',
          description: 'Hourly Auction Entry Fee',
          order_id: orderData.data.orderId,
          
          handler: async (response: PaymentResponse) => {
            try {
              // 3. Verify payment on backend
              const verifyResponse = await fetch(
                API_ENDPOINTS.razorpay.verifyPayment,
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
                  }),
                }
              );

              const verifyData: VerifyResponse = await verifyResponse.json();

              if (verifyResponse.ok && verifyData.success) {
                setPaymentStatus('success');
                toast.success('Payment Successful!', {
                  description: `You have successfully joined the auction. Total participants: ${verifyData.data.totalParticipants || 0}`,
                });
                onSuccess(verifyData);
              } else {
                throw new Error(verifyData.message || 'Payment verification failed');
              }
            } catch (verifyError) {
              const errorMsg = verifyError instanceof Error ? verifyError.message : 'Payment verification failed';
              setPaymentStatus('failed');
              toast.error('Verification Failed', {
                description: errorMsg,
              });
              onFailure(errorMsg);
            }
          },

          modal: {
            ondismiss: () => {
              setPaymentStatus('failed');
              toast.error('Payment Cancelled', {
                description: 'You cancelled the payment process.',
              });
              onFailure('Payment cancelled by user');
            },
          },

          prefill: {
            name: actualUserDetails.name,
            email: actualUserDetails.email,
            contact: actualUserDetails.contact,
          },

          theme: {
            color: '#6B3FA0',
          },

          retry: {
            enabled: true,
            max_count: 3,
          },
        };

        // 4. Open Razorpay checkout
        if (Razorpay) {
          const rzpInstance = new Razorpay(options);
          
          rzpInstance.on('payment.failed', (response: any) => {
            setPaymentStatus('failed');
            toast.error('Payment Failed', {
              description: response.error.description || 'Payment processing failed',
            });
            onFailure(response.error.description || 'Payment failed');
          });

          rzpInstance.open();
        } else {
          throw new Error('Razorpay SDK not loaded');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
        setPaymentStatus('failed');
        toast.error('Error', {
          description: errorMessage,
        });
        onFailure(errorMessage);
        console.error('Payment error:', err);
      } finally {
        setLoading(false);
      }
    },
    [Razorpay]
  );

  return {
    initiatePayment,
    loading,
    paymentStatus,
    error: razorpayError,
  };
};