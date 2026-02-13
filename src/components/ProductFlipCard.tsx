'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';

interface ProductImage {
  imageUrl: string;
  description: string[];
  productDescription?: Record<string, string>;
}

interface ProductFlipCardProps {
  productImages: ProductImage[];
  productName: string;
  prizeValue: number;
  productDescription?: Record<string, string>;
  maxDiscount?: number;
}

  export function ProductFlipCard({ productImages, productName, prizeValue, productDescription: topLevelDescription, maxDiscount }: ProductFlipCardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const currentImage = productImages[currentIndex];
    
    // Combine descriptions: check current image description, then top level description
    const currentProductDescription = currentImage?.productDescription || topLevelDescription;
    const legacyDescription = currentImage?.description || [];


  if (!productImages || productImages.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-purple-50 rounded-2xl border border-purple-200">
        <p className="text-purple-500">No product images available</p>
      </div>
    );
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
    }, 150);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (isFlipped) {
      setIsFlipped(false);
    }
  };

  return (
      <div className="relative w-full max-w-md mx-auto">
        {/* Info button - top right corner */}
<button 
className="absolute top-2 right-2 z-30 w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-colors"
onClick={(e) => {
            e.stopPropagation();
            setShowDisclaimer(true);
          }}
          aria-label="Important information about prize"
        >
          <Info className="w-3.5 h-3.5 text-white" />
        </button>

        <div 
          className="relative w-full h-96 cursor-pointer perspective-1000"
        onClick={handleFlip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? 'Show product image' : 'Show product details'}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative w-full h-full bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
              
              <div className="absolute top-3 left-3 z-10">
                <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-purple-200/50 shadow-lg">
                  <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{prizeValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

                {productImages.length > 1 && (
                  <div className="absolute top-10 right-3 z-10">
                    <div className="px-2 py-1 bg-purple-600/90 backdrop-blur-md rounded-full">
                      <span className="text-xs text-white font-medium">
                        {currentIndex + 1}/{productImages.length}
                      </span>
                    </div>
                  </div>
                )}

                <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={currentImage.imageUrl}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23e9d5ff" width="300" height="300"/%3E%3Ctext fill="%239333ea" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-xs text-purple-600 font-medium animate-pulse">
                    Hover or tap to see details
                  </p>
                </div>

              <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-300/30 ring-inset pointer-events-none" />
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
              <div className="relative w-full h-full bg-gradient-to-br from-purple-600/95 via-purple-700/95 to-indigo-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                
                {productImages.length > 1 && (
                  <div className="absolute top-10 right-3">
                    <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-full">
                      <span className="text-xs text-white font-medium">
                        {currentIndex + 1}/{productImages.length}
                      </span>
                    </div>
                  </div>
                )}

                  <div className="relative h-full flex flex-col p-5">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                        {productName}
                      </h3>
                      <div className="w-16 h-1 bg-gradient-to-r from-pink-400 to-purple-300 rounded-full" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {currentProductDescription && Object.keys(currentProductDescription).length > 0 ? (
                        <div className="rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-white/20">
                              <tr>
                                <th className="px-3 py-2 text-white/70 font-bold uppercase tracking-wider">Attribute</th>
                                <th className="px-3 py-2 text-white/70 font-bold uppercase tracking-wider">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {Object.entries(currentProductDescription).map(([key, value], idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="px-3 py-2 text-pink-200 font-semibold align-top">{key}</td>
                                  <td className="px-3 py-2 text-white/90">{value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : legacyDescription && legacyDescription.length > 0 ? (
                        <ul className="space-y-2.5">
                          {legacyDescription.filter(d => d.trim()).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-bold text-white">{idx + 1}</span>
                              </span>
                              <span className="text-sm text-white/90 leading-relaxed">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-white/70 text-sm italic">
                          No description available for this product.
                        </p>
                      )}
                    </div>

                <div className="mt-4 pt-3 border-t border-white/20 text-center">
                    <p className="text-xs text-white/60 font-medium">
                      Move away or tap to see image
                    </p>
                  </div>
              </div>

              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 ring-inset pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {productImages.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-purple-200/50 shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 text-purple-600" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-purple-200/50 shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 text-purple-600" />
          </button>
        </>
      )}

      {productImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {productImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
                setCurrentIndex(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'bg-purple-600 w-6'
                  : 'bg-purple-300 hover:bg-purple-400'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
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
              scrollbar-width: thin;
              scrollbar-color: #d1d5db transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 4px;
            }
        `}</style>

        {/* Disclaimer Modal */}
        {showDisclaimer && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDisclaimer(false)}
            >
                  <div 
                    className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl flex flex-col"
                    style={{ maxHeight: '50vh' }}
                  onClick={(e) => e.stopPropagation()}
                >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex-shrink-0 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-white" />
                    <h3 className="text-base font-bold text-white">Important Notice</h3>
                  </div>
                  <button 
                    onClick={() => setShowDisclaimer(false)}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

                {/* Content */}
                <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                    {/* Max Discount Info - Most Important */}
                    {maxDiscount !== undefined && maxDiscount !== null && Number(maxDiscount) > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-300">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow">
                          <span className="text-sm font-bold text-white">%</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800 text-sm mb-0.5">Company Discount: {Number(maxDiscount)}% OFF</h4>
                          <p className="text-xs text-green-700 leading-relaxed">
                            The company is offering a <strong>{Number(maxDiscount)}% mandatory discount</strong> on this auction. You can place your bid up to a maximum of <strong>{100 - Number(maxDiscount)}%</strong> of the product value (₹{Math.round(prizeValue * (100 - Number(maxDiscount)) / 100).toLocaleString('en-IN')}). Place your auction amount accordingly.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Representation Disclaimer - Red */}
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">⚠️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-0.5">Representation Only</h4>
                      <p className="text-xs text-red-700 leading-relaxed">
                        Images shown are for illustrative purposes. Actual products may vary.
                      </p>
                    </div>
                  </div>

                  {/* Amazon Voucher Info - Highlighted */}
                  <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-400">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow">
                      <span className="text-base">🎁</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-800 text-sm mb-1">Prize: Amazon Voucher</h4>
                      <p className="text-xs text-purple-700 leading-relaxed">
                        <strong>Winners get Amazon Gift Voucher</strong> worth ₹{prizeValue.toLocaleString('en-IN')}, not the product shown.
                      </p>
                      <p className="text-[10px] text-purple-600 mt-1 italic">
                        Redeem on Amazon.in for any item
                      </p>
                    </div>
                  </div>
                </div>

              {/* Footer */}
              <div className="px-4 py-3 flex-shrink-0 border-t border-gray-100 rounded-b-xl">
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-sm"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
