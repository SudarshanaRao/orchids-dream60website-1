'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

interface DescriptionItem {
  key: string;
  value: string;
}

interface ProductImage {
  imageUrl: string;
  description: (string | DescriptionItem)[];
}

interface ProductFlipCardProps {
  imageUrl?: string;
  description?: (string | DescriptionItem)[];
  productImages?: ProductImage[];
  productName: string;
  prizeValue: number;
}

export function ProductFlipCard({ imageUrl, description, productImages = [], productName, prizeValue }: ProductFlipCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Priority: 1. Top-level props, 2. Current image in gallery, 3. Empty
  const currentImages = productImages.length > 0 ? productImages : (imageUrl ? [{ imageUrl, description: description || [] }] : []);
  
  if (currentImages.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-purple-50 rounded-2xl border border-purple-200">
        <p className="text-purple-500">No product images available</p>
      </div>
    );
  }

  const activeImage = currentImages[currentIndex];
  // Fallback to top-level description if current image doesn't have one
  const activeDescription = (activeImage.description && activeImage.description.length > 0) 
    ? activeImage.description 
    : (description || []);

  const getFullImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:')) return url;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${API_BASE_URL}/${cleanUrl}`;
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
    }, 150);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1));
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setIsFlipped(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col min-h-[320px]">
      <div 
        className="relative w-full flex-1 min-h-[320px] cursor-pointer perspective-1000"
        onClick={handleFlip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? 'Show product image' : 'Show product details'}
      >
        <div
          className={`relative w-full h-full min-h-[320px] transition-transform duration-700 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side: Image */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative w-full h-full min-h-[320px] bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
              
              <div className="absolute top-3 left-3 z-10">
                <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-purple-200/50 shadow-lg">
                  <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{prizeValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {currentImages.length > 1 && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="px-2 py-1 bg-purple-600/90 backdrop-blur-md rounded-full">
                    <span className="text-xs text-white font-medium">
                      {currentIndex + 1}/{currentImages.length}
                    </span>
                  </div>
                </div>
              )}

              <div className="w-full h-full min-h-[320px] flex items-center justify-center p-8">
                <img
                  src={getFullImageUrl(activeImage.imageUrl)}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23e9d5ff" width="300" height="300"/%3E%3Ctext fill="%239333ea" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

                <div className="absolute bottom-3 left-0 right-0 text-center">
                    <p className="text-xs text-purple-600 font-bold bg-white/40 backdrop-blur-sm inline-block px-3 py-1 rounded-full border border-purple-200/50 animate-pulse">
                      Hover or click for details
                    </p>
                  </div>

              <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-300/30 ring-inset pointer-events-none" />
            </div>
          </div>

          {/* Back Side: Details */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
              <div className="relative w-full h-full min-h-[320px] bg-gradient-to-br from-purple-600/95 via-purple-700/95 to-indigo-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Product Image Background for Back Side */}
                <div 
                  className="absolute inset-0 opacity-10 bg-center bg-no-repeat bg-contain blur-[2px]"
                  style={{ backgroundImage: `url(${getFullImageUrl(activeImage.imageUrl)})` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                
                {currentImages.length > 1 && (
                  <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-full">
                      <span className="text-xs text-white font-medium">
                        {currentIndex + 1}/{currentImages.length}
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative h-full flex flex-col p-5">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg line-clamp-1">
                      {productName}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-pink-400 to-purple-300 rounded-full" />
                  </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeDescription && activeDescription.length > 0 ? (
                      <div className="space-y-3">
                        <table className="w-full text-left border-collapse">
                          <tbody>
                            {activeDescription.map((item, idx) => {
                              const isString = typeof item === 'string';
                              const key = isString ? `${idx + 1}` : item.key;
                              const value = isString ? item : item.value;
                              
                              if (!value) return null;

                                return (
                                  <tr key={idx} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors group/row">
                                    <td className="py-2.5 pr-4 align-top w-[40%]">
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-200/60 block leading-tight">
                                        {key}
                                      </span>
                                    </td>
                                    <td className="py-2.5 align-top">
                                      <span className="text-[13px] text-white font-semibold leading-relaxed block">
                                        {value}
                                      </span>
                                    </td>
                                  </tr>
                                );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-white/70 text-sm italic">
                        No description available for this product.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 text-center">
                    <p className="text-xs text-white/60 font-medium">
                      Move away or click for image
                    </p>
                  </div>
              </div>

              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 ring-inset pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {currentImages.length > 1 && (
        <div className="mt-4">
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handlePrevious}
              className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-purple-600" />
            </button>
            
            <div className="flex gap-1.5">
              {currentImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'bg-purple-600 w-4'
                      : 'bg-purple-300 hover:bg-purple-400'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
