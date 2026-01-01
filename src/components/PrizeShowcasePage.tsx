'use client';

import { useState, useEffect } from 'react';
import { Gift, Clock, IndianRupee, Loader2, ArrowLeft } from 'lucide-react';
import { ProductFlipCard } from './ProductFlipCard';
import { API_ENDPOINTS } from '@/lib/api-config';

interface ProductImage {
  imageUrl: string;
  description: string[];
}

interface UpcomingProduct {
  hourlyAuctionId: string;
  hourlyAuctionCode: string;
  auctionName: string;
  prizeValue: number;
  imageUrl: string | null;
  productImages: ProductImage[];
  TimeSlot: string;
  auctionDate: string;
  Status: string;
  EntryFee: string;
  minEntryFee: number | null;
  maxEntryFee: number | null;
  FeeSplits: { BoxA: number; BoxB: number } | null;
}

interface PrizeShowcasePageProps {
  onBack: () => void;
  onJoinAuction: () => void;
}

export function PrizeShowcasePage({ onBack, onJoinAuction }: PrizeShowcasePageProps) {
  const [product, setProduct] = useState<UpcomingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_ENDPOINTS.scheduler.firstUpcomingProduct);
        const data = await response.json();

        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setError(data.message || 'No upcoming product found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-purple-700 font-medium">Loading product showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-purple-900 mb-2">No Upcoming Products</h2>
          <p className="text-purple-600 mb-6">{error || 'There are no upcoming products to display right now.'}</p>
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const productImagesToShow = product.productImages && product.productImages.length > 0
    ? product.productImages
    : product.imageUrl
    ? [{ imageUrl: product.imageUrl, description: [] }]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
            <Gift className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">Upcoming Prize</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            {product.auctionName}
          </h1>
          <p className="text-purple-600">Tap on the card to see product details</p>
        </div>

        <div className="mb-8">
          <ProductFlipCard
            productImages={productImagesToShow}
            productName={product.auctionName}
            prizeValue={product.prizeValue}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Prize Value</span>
            </div>
            <p className="text-xl font-bold text-purple-900">
              ₹{product.prizeValue.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Time Slot</span>
            </div>
            <p className="text-xl font-bold text-purple-900">{product.TimeSlot}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Status</span>
            </div>
            <p className="text-xl font-bold text-purple-900">{product.Status}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Entry Fee</span>
            </div>
            <p className="text-xl font-bold text-purple-900">
              {product.FeeSplits 
                ? `₹${(product.FeeSplits.BoxA + product.FeeSplits.BoxB).toLocaleString('en-IN')}`
                : product.minEntryFee && product.maxEntryFee
                ? `₹${product.minEntryFee} - ₹${product.maxEntryFee}`
                : 'TBD'
              }
            </p>
          </div>
        </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center text-white">
            <h3 className="text-xl font-bold mb-2">Ready to Win?</h3>
            <p className="text-white/80 mb-4">Join the auction at {product.TimeSlot} and compete for this amazing prize!</p>
            <button
              onClick={onJoinAuction}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors"
            >
              Join Auction
            </button>
          </div>
      </div>
    </div>
  );
}
