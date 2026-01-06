import { useState } from 'react';
import { toast } from 'sonner';

interface PrizeClaimPaymentData {
  userId: string;
  hourlyAuctionId: string;
  amount: number;
  currency: string;
  username: string;
}

interface UserDetails {
  name: string;
  email: string;
  contact: string;
  upiId: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const usePrizeClaimPayment = () => {
  const [loading, setLoading] = useState(false);

  const initiatePrizeClaimPayment = (
    paymentData: PrizeClaimPaymentData,
    userDetails: UserDetails,
    onSuccess: (response: any) => void,
    onFailure: (error: string) => void
  ) => {
    setLoading(true);

    // Create Razorpay order for prize claim payment
    fetch('https://dev-api.dream60.com/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: `prize_claim_${paymentData.hourlyAuctionId}_${Date.now()}`,
        notes: {
          userId: paymentData.userId,
          hourlyAuctionId: paymentData.hourlyAuctionId,
          username: paymentData.username,
          type: 'PRIZE_CLAIM',
        },
      }),
    })
      .then((res) => res.json())
      .then((orderData) => {
        if (!orderData.success || !orderData.data) {
          throw new Error('Failed to create payment order');
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_w8ybF9gV5hCbD5',
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'Dream60 - Prize Claim',
          description: `Prize Claim Payment - ${paymentData.username}`,
          order_id: orderData.data.id,
          prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.contact,
          },
          theme: {
            color: '#8456BC',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.error('Payment cancelled');
            },
          },
          handler: async (response: any) => {
            try {
              // Verify payment with backend
              const verifyRes = await fetch('https://dev-api.dream60.com/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: paymentData.userId,
                  hourlyAuctionId: paymentData.hourlyAuctionId,
                  type: 'PRIZE_CLAIM',
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                // Submit prize claim to backend
                const claimRes = await fetch('https://dev-api.dream60.com/scheduler/user-auction-history/claim-prize', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: paymentData.userId,
                    hourlyAuctionId: paymentData.hourlyAuctionId,
                    upiId: userDetails.email, // Use email as identifier
                    paymentReference: response.razorpay_payment_id,
                  }),
                });

                const claimData = await claimRes.json();

                if (claimData.success) {
                  setLoading(false);
                  onSuccess(claimData);
                } else {
                  throw new Error(claimData.message || 'Failed to claim prize');
                }
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error: any) {
              setLoading(false);
              onFailure(error.message || 'Payment verification failed');
            }
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      })
      .catch((error) => {
        console.error('Prize claim payment error:', error);
        setLoading(false);
        onFailure(error.message || 'Failed to initiate payment');
      });
  };

  return { initiatePrizeClaimPayment, loading };
};
