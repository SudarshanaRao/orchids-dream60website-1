import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

interface CreatePrizeClaimOrderPayload {
  userId: string;
  hourlyAuctionId: string;
  amount: number;
  currency?: string;
  username?: string;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
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

        // Always use Airpay as requested
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
    []
  );

  return {
    initiatePrizeClaimPayment,
    loading,
    paymentStatus,
    error: null,
  };
};
