import { useState, useCallback } from 'react';
import { useRazorpay } from 'react-razorpay';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';
import { getPaymentProvider } from '@/utils/payment-utils';

interface CreateOrderPayload {
  userId: string;
  hourlyAuctionId: string;
  amount: number;
  currency?: string;
  username?: string;
  paymentType?: 'ENTRY_FEE' | 'PRIZE_CLAIM';
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    // Razorpay specific
    razorpayKeyId?: string;
    orderId: string;
    amount?: number;
    currency?: string;
    userInfo?: {
      name: string;
      email: string;
      contact: string;
    };
    
    // Airpay specific
    url?: string;
    params?: {
      mid: string;
      data: string;
      privatekey: string;
      checksum: string;
    };
  };
}

export const usePayment = () => {
  const { Razorpay } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [airpayData, setAirpayData] = useState<{ url: string; params: any } | null>(null);

  const initiatePayment = useCallback(
    async (
      payload: CreateOrderPayload,
      userDetails: { name: string; email: string; contact: string; upiId?: string },
      onSuccess: (response: any) => void,
      onFailure: (error: string) => void
    ) => {
      const provider = getPaymentProvider();
      setLoading(true);
      setAirpayData(null);

      try {
        // 1. Create order on backend based on provider
        const endpoint = provider === 'razorpay' 
          ? (payload.paymentType === 'PRIZE_CLAIM' ? API_ENDPOINTS.razorpay.prizeClaimCreateOrder : API_ENDPOINTS.razorpay.createOrder)
          : API_ENDPOINTS.airpay.createOrder;

        const orderResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const orderData: OrderResponse = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        // 2. Handle provider specific flow
        if (provider === 'razorpay') {
          // RAZORPAY FLOW
          const actualUserDetails = orderData.data.userInfo || userDetails;
          
          const options: any = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.data.razorpayKeyId,
            amount: orderData.data.amount,
            currency: orderData.data.currency || 'INR',
            name: 'DREAM60',
            description: payload.paymentType === 'PRIZE_CLAIM' ? 'Prize Claim Payment' : 'Auction Entry Fee',
            order_id: orderData.data.orderId,
            prefill: {
              name: actualUserDetails.name,
              email: actualUserDetails.email,
              contact: actualUserDetails.contact,
            },
            theme: { color: '#6B3FA0' },
            handler: async (response: any) => {
              try {
                // Verify payment
                const verifyEndpoint = payload.paymentType === 'PRIZE_CLAIM' 
                  ? API_ENDPOINTS.razorpay.prizeClaimVerifyPayment 
                  : API_ENDPOINTS.razorpay.verifyPayment;

                const verifyResponse = await fetch(verifyEndpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    username: actualUserDetails.name,
                    upiId: userDetails.upiId // for prize claim
                  }),
                });

                const verifyData = await verifyResponse.json();
                if (verifyResponse.ok && verifyData.success) {
                  onSuccess(verifyData);
                } else {
                  throw new Error(verifyData.message || 'Payment verification failed');
                }
              } catch (err: any) {
                onFailure(err.message);
              }
            },
            modal: {
              ondismiss: () => onFailure('Payment cancelled by user'),
            }
          };

          if (Razorpay) {
            const rzp = new Razorpay(options);
            rzp.open();
          } else {
            throw new Error('Razorpay SDK not loaded');
          }
        } else {
          // AIRPAY FLOW
          if (!orderData.data.url || !orderData.data.params) {
            throw new Error('Airpay redirect data missing');
          }
          
          // Set airpay data to trigger the AirpayForm component in the UI
          setAirpayData({
            url: orderData.data.url,
            params: orderData.data.params
          });
          
          // Note: Success/Failure for Airpay is handled via backend redirect to /payment/success or /payment/failure
        }
      } catch (err: any) {
        const msg = err.message || 'Payment initiation failed';
        toast.error(msg);
        onFailure(msg);
      } finally {
        setLoading(false);
      }
    },
    [Razorpay]
  );

  return {
    initiatePayment,
    loading,
    airpayData,
  };
};
