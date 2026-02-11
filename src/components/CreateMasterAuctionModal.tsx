import { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Plus, Trash2, Search, Package, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface DailyAuctionConfigItem {
  auctionNumber: number;
  auctionId?: string;
  TimeSlot: string;
  auctionName: string;
  prizeValue: number;
  Status: string;
  maxDiscount: number;
  EntryFee: 'RANDOM' | 'MANUAL';
  minEntryFee: number | null;
  maxEntryFee: number | null;
  FeeSplits: { BoxA: number; BoxB: number } | null;
  roundCount: number;
  roundConfig: Array<{
    round: number;
    minPlayers: number | null;
    duration: number;
    maxBid: number | null;
    roundCutoffPercentage: number | null;
    topBidAmountsPerRound: number;
  }>;
  imageUrl?: string;
  productDescription?: Record<string, string>;
  minSlotsCriteria: 'AUTO' | 'MANUAL';
  minSlotsValue: number;
}

interface MasterAuction {
  master_id: string;
  totalAuctionsPerDay: number;
  isActive: boolean;
  createdAt: string;
  dailyAuctionConfig: DailyAuctionConfigItem[];
  editingProductIndex?: number;
}

interface ProductSuggestion {
  product_id: string;
  name: string;
  prizeValue: number;
  imageUrl?: string;
  productDescription?: Record<string, string>;
  entryFeeType?: 'RANDOM' | 'MANUAL';
  minEntryFee?: number | null;
  maxEntryFee?: number | null;
  feeSplits?: { BoxA: number | null; BoxB: number | null };
  roundCount?: number;
}

interface CreateMasterAuctionModalProps {
  adminUserId: string;
  editingAuction: MasterAuction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMasterAuctionModal({
  adminUserId,
  editingAuction,
  onClose,
  onSuccess,
}: CreateMasterAuctionModalProps) {
  const [totalAuctions, setTotalAuctions] = useState(editingAuction?.totalAuctionsPerDay || 1);
  const [isActive, setIsActive] = useState(editingAuction?.isActive ?? true);
  const [auctionConfigs, setAuctionConfigs] = useState<DailyAuctionConfigItem[]>(
    editingAuction?.dailyAuctionConfig || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<Record<number, ProductSuggestion[]>>({});
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<Record<number, boolean>>({});
  const [openSuggestionIndex, setOpenSuggestionIndex] = useState<number | null>(null);
  const productRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const suggestionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({});

  // Scroll to specific product when editingProductIndex is set
  useEffect(() => {
    if (editingAuction?.editingProductIndex !== undefined) {
      const targetIndex = auctionConfigs.findIndex(
        cfg => cfg.auctionNumber === editingAuction.editingProductIndex
      );
      if (targetIndex !== -1) {
        setTimeout(() => {
          productRefs.current[targetIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          productRefs.current[targetIndex]?.classList.add('ring-2', 'ring-purple-500');
          setTimeout(() => {
            productRefs.current[targetIndex]?.classList.remove('ring-2', 'ring-purple-500');
          }, 2000);
        }, 300);
      }
    }
  }, [editingAuction?.editingProductIndex]);

  // Close suggestion dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openSuggestionIndex !== null) {
        const ref = suggestionRefs.current[openSuggestionIndex];
        if (ref && !ref.contains(e.target as Node)) {
          setOpenSuggestionIndex(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSuggestionIndex]);

  useEffect(() => {
    if (!editingAuction && auctionConfigs.length === 0) {
      const defaultConfig: DailyAuctionConfigItem = {
        auctionNumber: 1,
        TimeSlot: '14:00',
        auctionName: 'Auction 1',
        prizeValue: 1000,
        Status: 'UPCOMING',
        maxDiscount: 0,
        EntryFee: 'RANDOM',
        minEntryFee: null,
        maxEntryFee: null,
        FeeSplits: { BoxA: 50, BoxB: 50 },
        roundCount: 4,
        roundConfig: [
          { round: 1, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 2, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 3, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 4, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
        ],
        imageUrl: '',
        minSlotsCriteria: 'AUTO',
        minSlotsValue: 0,
      };
      setAuctionConfigs([defaultConfig]);
    }
  }, [editingAuction]);

  const handleAddAuction = () => {
    const newNumber = auctionConfigs.length + 1;
    setAuctionConfigs([
      ...auctionConfigs,
      {
        auctionNumber: newNumber,
        TimeSlot: '14:00',
        auctionName: `Auction ${newNumber}`,
        prizeValue: 1000,
        Status: 'UPCOMING',
        maxDiscount: 0,
        EntryFee: 'RANDOM',
        minEntryFee: null,
        maxEntryFee: null,
        FeeSplits: { BoxA: 50, BoxB: 50 },
        roundCount: 4,
        roundConfig: [
          { round: 1, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 2, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 3, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 4, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
        ],
        imageUrl: '',
        minSlotsCriteria: 'AUTO',
        minSlotsValue: 0,
      },
    ]);
  };

  const handleRemoveAuction = (index: number) => {
    const updated = auctionConfigs.filter((_, i) => i !== index);
    updated.forEach((config, i) => {
      config.auctionNumber = i + 1;
    });
    setAuctionConfigs(updated);
  };

  const handleConfigChange = (index: number, field: string, value: any) => {
    const updated = [...auctionConfigs];
    (updated[index] as any)[field] = value;
    setAuctionConfigs(updated);
  };

    const handleDescriptionChange = (configIndex: number, text: string) => {
      const updated = [...auctionConfigs];
      // Store as a single key "description" with the full text
      updated[configIndex].productDescription = text ? { description: text } : {};
      setAuctionConfigs(updated);
    };

    const getDescriptionString = (description?: Record<string, string>) => {
      if (!description) return '';
      // If it has a single "description" key, return its value directly
      if (description.description && Object.keys(description).length === 1) {
        return description.description;
      }
      // Legacy format: convert key-value pairs to readable text
      return Object.entries(description)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    };

  const applyProductSuggestion = (index: number, product: ProductSuggestion) => {
    const updated = [...auctionConfigs];
    // Convert productDescription from backend (may be key-value map) to single description string
    let description: Record<string, string> = {};
    if (product.productDescription) {
      const entries = Object.entries(product.productDescription);
      if (entries.length === 1 && entries[0][0] === 'description') {
        description = { description: entries[0][1] };
      } else if (entries.length > 0) {
        // Convert key-value pairs to a single description text
        const text = entries.map(([key, value]) => `${key}: ${value}`).join('\n');
        description = { description: text };
      }
    }
    updated[index] = {
      ...updated[index],
      auctionName: product.name,
      prizeValue: product.prizeValue || updated[index].prizeValue,
      imageUrl: product.imageUrl || '',
      productDescription: description,
      EntryFee: product.entryFeeType || updated[index].EntryFee,
      minEntryFee: product.minEntryFee ?? updated[index].minEntryFee,
      maxEntryFee: product.maxEntryFee ?? updated[index].maxEntryFee,
      FeeSplits: product.feeSplits
        ? { BoxA: product.feeSplits.BoxA || 0, BoxB: product.feeSplits.BoxB || 0 }
        : updated[index].FeeSplits,
      roundCount: product.roundCount || updated[index].roundCount,
    };
    setAuctionConfigs(updated);
  };

  const fetchProductSuggestions = async (index: number, query: string) => {
    if (!query || query.trim().length < 2) {
      setProductSuggestions(prev => ({ ...prev, [index]: [] }));
      setOpenSuggestionIndex(null);
      return;
    }

    // Debounce: clear existing timer for this index
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    debounceTimers.current[index] = setTimeout(async () => {
      setIsSuggestionsLoading(prev => ({ ...prev, [index]: true }));
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/products/search?user_id=${adminUserId}&q=${encodeURIComponent(query.trim())}&limit=8`
        );
        const data = await response.json();
        if (data.success) {
          const uniqueByName = (data.data || []).reduce((acc: ProductSuggestion[], item: ProductSuggestion) => {
            if (!acc.find(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
              acc.push(item);
            }
            return acc;
          }, []);
          setProductSuggestions(prev => ({ ...prev, [index]: uniqueByName }));
          if (uniqueByName.length > 0) {
            setOpenSuggestionIndex(index);
          }
        }
      } catch (error) {
        console.error('Error fetching product suggestions:', error);
      } finally {
        setIsSuggestionsLoading(prev => ({ ...prev, [index]: false }));
      }
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingAuction
        ? `${API_BASE_URL}/admin/master-auctions/${editingAuction.master_id}?user_id=${adminUserId}`
        : `${API_BASE_URL}/admin/master-auctions?user_id=${adminUserId}`;

      const response = await fetch(url, {
        method: editingAuction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAuctionsPerDay: totalAuctions,
          isActive,
          dailyAuctionConfig: auctionConfigs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingAuction ? 'Master auction updated successfully' : 'Master auction created successfully');
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to save master auction');
      }
    } catch (error) {
      console.error('Error saving master auction:', error);
      toast.error('Failed to save master auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-purple-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-900">
            {editingAuction ? 'Edit Master Auction' : 'Create Master Auction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-purple-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">
                Total Auctions Per Day
              </label>
              <input
                type="number"
                min="1"
                value={totalAuctions}
                onChange={(e) => setTotalAuctions(parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">
                Status
              </label>
              <select
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-purple-900">Auction Configurations</h3>
              <button
                type="button"
                onClick={handleAddAuction}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Auction
              </button>
            </div>

            {auctionConfigs.map((config, index) => (
              <div 
                key={index} 
                ref={(el) => { productRefs.current[index] = el; }}
                className="border-2 border-purple-200 rounded-lg p-4 space-y-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-purple-900">Auction #{config.auctionNumber}</h4>
                  {auctionConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAuction(index)}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Min Slots Criteria
                    </label>
                    <select
                      value={config.minSlotsCriteria}
                      onChange={(e) => handleConfigChange(index, 'minSlotsCriteria', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="AUTO">AUTO (Formula)</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </div>

                  {config.minSlotsCriteria === 'MANUAL' ? (
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Min Slots Value
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={config.minSlotsValue}
                        onChange={(e) => handleConfigChange(index, 'minSlotsValue', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2 opacity-50">
                        Min Slots Value (Auto)
                      </label>
                      <div className="px-4 py-2 bg-purple-50 border-2 border-purple-100 rounded-lg text-purple-400 italic">
                        Calculated automatically
                      </div>
                    </div>
                  )}

                    <div className="relative" ref={(el) => { suggestionRefs.current[index] = el; }}>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        <Search className="w-3.5 h-3.5 inline-block mr-1" />
                        Auction Name
                      </label>
                        <input
                          type="text"
                          value={config.auctionName}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleConfigChange(index, 'auctionName', value);
                            fetchProductSuggestions(index, value);
                          }}
                          onFocus={() => {
                            if ((productSuggestions[index] || []).length > 0) {
                              setOpenSuggestionIndex(index);
                            }
                          }}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                          placeholder="Type product name to search..."
                          required
                        />
                        <p className="text-xs text-purple-500 mt-1">
                          {isSuggestionsLoading[index] ? 'Searching products...' : 'Type 2+ characters to search saved products.'}
                        </p>

                        {/* Rich Product Suggestions Dropdown */}
                        {openSuggestionIndex === index && (productSuggestions[index] || []).length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-purple-300 rounded-xl shadow-2xl max-h-[360px] overflow-y-auto">
                            <div className="sticky top-0 bg-purple-50 px-3 py-2 border-b border-purple-200">
                              <p className="text-xs font-semibold text-purple-700">
                                <Package className="w-3 h-3 inline-block mr-1" />
                                {productSuggestions[index].length} product{productSuggestions[index].length !== 1 ? 's' : ''} found — click to use
                              </p>
                            </div>
                            {productSuggestions[index].map((product) => (
                              <button
                                key={product.product_id}
                                type="button"
                                onClick={() => {
                                  applyProductSuggestion(index, product);
                                  setOpenSuggestionIndex(null);
                                  setProductSuggestions(prev => ({ ...prev, [index]: [] }));
                                  toast.success(`Applied product: ${product.name}`);
                                }}
                                className="w-full text-left px-3 py-3 hover:bg-purple-50 border-b border-purple-100 last:border-b-0 transition-colors group"
                              >
                                <div className="flex gap-3">
                                  {/* Product Image */}
                                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-purple-100 border border-purple-200">
                                    {product.imageUrl ? (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                                      <Package className="w-6 h-6 text-purple-300" />
                                    </div>
                                  </div>

                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-purple-900 truncate group-hover:text-purple-700">
                                      {product.name}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                        <IndianRupee className="w-3 h-3 mr-0.5" />
                                        {product.prizeValue?.toLocaleString() || '—'}
                                      </span>
                                      {product.entryFeeType && (
                                        <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                          Fee: {product.entryFeeType === 'RANDOM'
                                            ? `₹${product.minEntryFee ?? '?'}–₹${product.maxEntryFee ?? '?'}`
                                            : `Box A: ₹${product.feeSplits?.BoxA ?? '?'} / Box B: ₹${product.feeSplits?.BoxB ?? '?'}`
                                          }
                                        </span>
                                      )}
                                      {product.roundCount && (
                                        <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                          {product.roundCount} rounds
                                        </span>
                                      )}
                                    </div>

                                    {/* Description preview */}
                                    {product.productDescription && Object.keys(product.productDescription).length > 0 && (
                                      <div className="mt-1.5 flex flex-wrap gap-1">
                                        {Object.entries(product.productDescription).slice(0, 3).map(([key, value]) => (
                                          <span key={key} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            {key}: {String(value).length > 20 ? String(value).substring(0, 20) + '...' : value}
                                          </span>
                                        ))}
                                        {Object.keys(product.productDescription).length > 3 && (
                                          <span className="text-[10px] text-gray-400 px-1">
                                            +{Object.keys(product.productDescription).length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Time Slot (HH:MM)
                    </label>
                    <input
                      type="text"
                      pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                      value={config.TimeSlot}
                      onChange={(e) => handleConfigChange(index, 'TimeSlot', e.target.value)}
                      placeholder="14:00"
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Prize Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={config.prizeValue}
                      onChange={(e) => handleConfigChange(index, 'prizeValue', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Round Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.roundCount}
                      onChange={(e) => handleConfigChange(index, 'roundCount', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Entry Fee Type
                    </label>
                    <select
                      value={config.EntryFee}
                      onChange={(e) => handleConfigChange(index, 'EntryFee', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="RANDOM">RANDOM</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </div>

                  {config.EntryFee === 'RANDOM' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Min Entry Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.minEntryFee || ''}
                          onChange={(e) => handleConfigChange(index, 'minEntryFee', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Max Entry Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.maxEntryFee || ''}
                          onChange={(e) => handleConfigChange(index, 'maxEntryFee', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Box 1 Entry Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.FeeSplits?.BoxA || ''}
                          onChange={(e) => handleConfigChange(index, 'FeeSplits', { ...config.FeeSplits, BoxA: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Box 2 Entry Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.FeeSplits?.BoxB || ''}
                          onChange={(e) => handleConfigChange(index, 'FeeSplits', { ...config.FeeSplits, BoxB: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      <ImageIcon className="w-4 h-4 inline-block mr-1" />
                      Prize Image URL
                    </label>
                      <input
                        type="url"
                        value={config.imageUrl || ''}
                        onChange={(e) => handleConfigChange(index, 'imageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                      {config.imageUrl && (
                        <div className="mt-2 inline-block">
                          <img
                            src={config.imageUrl}
                            alt="Product preview"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-purple-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={(e) => {
                              (e.target as HTMLImageElement).style.display = 'block';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Product Description
                      </label>
                      <textarea
                        value={getDescriptionString(config.productDescription)}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        placeholder="Enter product description here... You can paste or type freely."
                        rows={4}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-purple-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingAuction ? 'Update Auction' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
