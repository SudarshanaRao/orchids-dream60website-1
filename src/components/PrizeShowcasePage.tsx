'use client';

import { useState, useEffect } from 'react';
import { Gift, Clock, IndianRupee, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { ProductFlipCard } from './ProductFlipCard';
import { API_ENDPOINTS } from '@/lib/api-config';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface ProductImage {
  imageUrl: string;
  description: (string | { key: string; value: string })[];
}

interface UpcomingProduct {
  hourlyAuctionId: string;
  hourlyAuctionCode: string;
  auctionName: string;
  prizeValue: number;
  imageUrl: string | null;
  description: (string | { key: string; value: string })[];
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
  hourlyAuctionId?: string | null;
}

export function PrizeShowcasePage({ onBack, onJoinAuction, hourlyAuctionId }: PrizeShowcasePageProps) {
  const [product, setProduct] = useState<UpcomingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const url = hourlyAuctionId 
          ? `${API_ENDPOINTS.scheduler.firstUpcomingProduct}?hourlyAuctionId=${hourlyAuctionId}`
          : API_ENDPOINTS.scheduler.firstUpcomingProduct;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setError(data.message || 'No upcoming auctions currently');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [hourlyAuctionId]);

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
              Back to Auction
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
        {/* Header with Logo */}
        <motion.header 
          className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Auction
                </Button>
                <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
                <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-purple-800">Prize Showcase</h1>
              </div>
              
              {/* Logo */}
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={onBack}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                  <p className="text-[10px] text-purple-600">Live Auction Play</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Mobile Title */}
          <motion.h1 
            className="sm:hidden text-2xl font-bold text-purple-800 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Prize Showcase
          </motion.h1>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Upcoming Prize</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
              {product.auctionName}
            </h1>
            <p className="text-purple-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Click on the card to view details
            </p>
          </div>

          <div className="mb-8 h-[320px] sm:h-[400px] flex items-center justify-center">
            <div className="w-full h-full max-w-md">
              <ProductFlipCard
                productImages={productImagesToShow}
                productName={product.auctionName}
                prizeValue={product.prizeValue}
                description={product.description}
              />
            </div>
          </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-4 h-4 text-purple-50" />
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

        {/* Product Description Table */}
        {product.description && product.description.length > 0 && (
          <motion.div 
            className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-xl overflow-hidden mb-8 group/specs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-100 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#3A2257] to-[#6B3FA0] bg-clip-text text-transparent">
                Product Specifications
              </h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-purple-100/60 bg-white/40">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {product.description.map((item, idx) => {
                    const isString = typeof item === 'string';
                    const key = isString ? `Spec ${idx + 1}` : item.key;
                    const value = isString ? item : item.value;
                    
                    if (!value) return null;

                    return (
                      <tr key={idx} className="border-b border-purple-100/30 last:border-0 hover:bg-purple-50/50 transition-colors">
                        <td className="py-3 px-4 w-[40%] bg-purple-50/30 border-r border-purple-100/20">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#8456BC] block leading-tight">
                            {key}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#3A2257] font-semibold leading-relaxed block">
                            {value}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

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
