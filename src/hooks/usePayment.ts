import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

interface CreateOrderPayload {
  userId: string;
  hourlyAuctionId: string;
  amount: number;
  currency?: string;
  username?: string;
  paymentType?: 'ENTRY_FEE' | 'PRIZE_CLAIM';
  productName?: string;
  productWorth?: number;
  timeSlot?: string;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
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
    params?: Record<string, any>;
  };
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [airpayData, setAirpayData] = useState<{ url: string; params: any } | null>(null);

  const initiatePayment = useCallback(
    async (
      payload: CreateOrderPayload,
      userDetails: { name: string; email: string; contact: string; upiId?: string },
      onSuccess: (response: any) => void,
      onFailure: (error: string) => void
    ) => {
      setLoading(true);
      setAirpayData(null);

      try {
        // Always use Airpay as requested
        const endpoint = API_ENDPOINTS.airpay.createOrder;

        const orderResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const orderData: OrderResponse = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success || !orderData.data) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        // AIRPAY FLOW
        if (!orderData.data.url || !orderData.data.params) {
          throw new Error('Airpay redirect data missing');
        }
        
        // Store pending payment details in cookies for recovery after redirect
        const pendingDetails = {
          auctionId: payload.hourlyAuctionId,
          amount: payload.amount,
          paymentType: payload.paymentType || 'ENTRY_FEE',
          productName: payload.productName,
          productWorth: payload.productWorth,
          timeSlot: payload.timeSlot,
          timestamp: Date.now()
        };
        document.cookie = `pending_payment_details=${encodeURIComponent(JSON.stringify(pendingDetails))}; path=/; max-age=3600`;

        // Set airpay data to trigger the AirpayForm component in the UI
        setAirpayData({
          url: orderData.data.url,
          params: orderData.data.params
        });
        
        // Success/Failure for Airpay is handled via backend redirect to /payment/success or /payment/failure
        
      } catch (err: any) {
        const msg = err.message || 'Payment initiation failed';
        toast.error(msg);
        onFailure(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    initiatePayment,
    loading,
    airpayData,
  };
};
