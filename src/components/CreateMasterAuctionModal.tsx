import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DescriptionItem {
  key: string;
  value: string;
}

interface ProductImage {
  imageUrl: string;
  description: (string | DescriptionItem)[];
}

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
  productImages?: ProductImage[];
}

interface MasterAuction {
  master_id: string;
  totalAuctionsPerDay: number;
  isActive: boolean;
  createdAt: string;
  dailyAuctionConfig: DailyAuctionConfigItem[];
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
          minEntryFee: 10,
          maxEntryFee: 100,
          FeeSplits: { BoxA: 50, BoxB: 50 },
          roundCount: 4,
          roundConfig: [
            { round: 1, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
            { round: 2, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
            { round: 3, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
            { round: 4, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          ],
          imageUrl: '',
          productImages: [],
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
        minEntryFee: 10,
        maxEntryFee: 100,
        FeeSplits: { BoxA: 50, BoxB: 50 },
        roundCount: 4,
        roundConfig: [
          { round: 1, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 2, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 3, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
          { round: 4, minPlayers: null, duration: 15, maxBid: null, roundCutoffPercentage: null, topBidAmountsPerRound: 3 },
        ],
        imageUrl: '',
        productImages: [],
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

  const handleAddProductImage = (configIndex: number) => {
    const updated = [...auctionConfigs];
    if (!updated[configIndex].productImages) {
      updated[configIndex].productImages = [];
    }
    updated[configIndex].productImages!.push({
      imageUrl: '',
      description: [''],
    });
    setAuctionConfigs(updated);
  };

  const handleRemoveProductImage = (configIndex: number, imageIndex: number) => {
    const updated = [...auctionConfigs];
    updated[configIndex].productImages = updated[configIndex].productImages?.filter((_, i) => i !== imageIndex);
    setAuctionConfigs(updated);
  };

  const handleProductImageChange = (configIndex: number, imageIndex: number, field: 'imageUrl' | 'description', value: string | (string | DescriptionItem)[]) => {
    const updated = [...auctionConfigs];
    if (updated[configIndex].productImages && updated[configIndex].productImages![imageIndex]) {
      (updated[configIndex].productImages![imageIndex] as any)[field] = value;
    }
    setAuctionConfigs(updated);
  };

  const handleAddDescriptionPoint = (configIndex: number, imageIndex: number) => {
    const updated = [...auctionConfigs];
    if (updated[configIndex].productImages && updated[configIndex].productImages![imageIndex]) {
      updated[configIndex].productImages![imageIndex].description.push({ key: '', value: '' });
    }
    setAuctionConfigs(updated);
  };

  const handleRemoveDescriptionPoint = (configIndex: number, imageIndex: number, descIndex: number) => {
    const updated = [...auctionConfigs];
    if (updated[configIndex].productImages && updated[configIndex].productImages![imageIndex]) {
      updated[configIndex].productImages![imageIndex].description = updated[configIndex].productImages![imageIndex].description.filter((_, i) => i !== descIndex);
    }
    setAuctionConfigs(updated);
  };

  const handleDescriptionPointChange = (configIndex: number, imageIndex: number, descIndex: number, field: 'key' | 'value', value: string) => {
    const updated = [...auctionConfigs];
    if (updated[configIndex].productImages && updated[configIndex].productImages![imageIndex]) {
      const item = updated[configIndex].productImages![imageIndex].description[descIndex];
      if (typeof item === 'string') {
        // Migration: convert string to object if editing
        updated[configIndex].productImages![imageIndex].description[descIndex] = { key: 'Feature', value: item };
      } else {
        item[field] = value;
      }
    }
    setAuctionConfigs(updated);
  };

  const handleBulkDescriptionPaste = (configIndex: number, imageIndex: number, text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newItems: DescriptionItem[] = lines.map(line => {
      // Try different delimiters: Colon, Dash, Tab, or 2+ spaces
      const regex = /[:\-\t]|\s{2,}/;
      const match = line.match(regex);
      
      if (match) {
        const delimiter = match[0];
        const index = line.indexOf(delimiter);
        const key = line.substring(0, index).trim();
        const value = line.substring(index + delimiter.length).trim();
        
        if (key && value) {
          return { key, value };
        }
      }
      
      return { key: 'Feature', value: line.trim() };
    });

    const updated = [...auctionConfigs];
    if (updated[configIndex].productImages && updated[configIndex].productImages![imageIndex]) {
      updated[configIndex].productImages![imageIndex].description = [
        ...updated[configIndex].productImages![imageIndex].description.filter(d => {
            if (typeof d === 'string') return d.trim() !== '';
            return d.key.trim() !== '' || d.value.trim() !== '';
        }),
        ...newItems
      ];
    }
    setAuctionConfigs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    for (let i = 0; i < auctionConfigs.length; i++) {
      const config = auctionConfigs[i];
      if (config.EntryFee === 'RANDOM') {
        if (!config.minEntryFee || !config.maxEntryFee) {
          toast.error(`Auction #${config.auctionNumber}: Min and Max Entry Fee are required for RANDOM type`);
          setIsSubmitting(false);
          return;
        }
        if (config.minEntryFee > config.maxEntryFee) {
          toast.error(`Auction #${config.auctionNumber}: Min Entry Fee cannot be greater than Max Entry Fee`);
          setIsSubmitting(false);
          return;
        }
      }
      if (config.EntryFee === 'MANUAL') {
        if (!config.FeeSplits || typeof config.FeeSplits.BoxA !== 'number' || typeof config.FeeSplits.BoxB !== 'number') {
          toast.error(`Auction #${config.auctionNumber}: Fee Splits (Box A and Box B) are required for MANUAL type`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const url = editingAuction
        ? `https://dev-api.dream60.com/admin/master-auctions/${editingAuction.master_id}?user_id=${adminUserId}`
        : `https://dev-api.dream60.com/admin/master-auctions?user_id=${adminUserId}`;

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
              <div key={index} className="border-2 border-purple-200 rounded-lg p-4 space-y-4">
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
                      Auction Name
                    </label>
                    <input
                      type="text"
                      value={config.auctionName}
                      onChange={(e) => handleConfigChange(index, 'auctionName', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
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
                        onChange={(e) => {
                          const newType = e.target.value as 'RANDOM' | 'MANUAL';
                          handleConfigChange(index, 'EntryFee', newType);
                          if (newType === 'RANDOM') {
                            handleConfigChange(index, 'minEntryFee', config.minEntryFee || 10);
                            handleConfigChange(index, 'maxEntryFee', config.maxEntryFee || 100);
                          }
                        }}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="RANDOM">Random</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </div>

                    {config.EntryFee === 'RANDOM' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Min Entry Fee (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={config.minEntryFee || ''}
                            onChange={(e) => handleConfigChange(index, 'minEntryFee', parseInt(e.target.value) || null)}
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
                            min="1"
                            value={config.maxEntryFee || ''}
                            onChange={(e) => handleConfigChange(index, 'maxEntryFee', parseInt(e.target.value) || null)}
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                      </>
                    )}

                    {config.EntryFee === 'MANUAL' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Fee Split - Box A (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.FeeSplits?.BoxA || 50}
                            onChange={(e) => handleConfigChange(index, 'FeeSplits', { ...config.FeeSplits, BoxA: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Fee Split - Box B (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.FeeSplits?.BoxB || 50}
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
                      <div className="mt-3 border-2 border-purple-200 rounded-lg p-3 bg-purple-50">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Image Preview:</p>
                        <div className="relative w-full h-48 bg-white rounded-lg overflow-hidden">
                          <img
                            src={config.imageUrl}
                            alt="Prize preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 mt-4 border-t-2 border-purple-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-purple-900">
                        <ImageIcon className="w-4 h-4 inline-block mr-1" />
                        Product Gallery (Multiple Images with Descriptions)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddProductImage(index)}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Add Image
                      </button>
                    </div>

                    {config.productImages && config.productImages.length > 0 ? (
                      <div className="space-y-4">
                        {config.productImages.map((productImage, imgIndex) => (
                          <div key={imgIndex} className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-purple-800">Image #{imgIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductImage(index, imgIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-purple-700 mb-1">
                                  Image URL
                                </label>
                                <input
                                  type="url"
                                  value={productImage.imageUrl}
                                  onChange={(e) => handleProductImageChange(index, imgIndex, 'imageUrl', e.target.value)}
                                  placeholder="https://example.com/image.jpg"
                                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                />
                              </div>

                              {productImage.imageUrl && (
                                <div className="w-24 h-24 bg-white rounded-lg overflow-hidden border border-purple-200">
                                  <img
                                    src={productImage.imageUrl}
                                    alt={`Product ${imgIndex + 1}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo img%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                </div>
                              )}

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-purple-700">
                                      Description Points (Key-Value Table)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleAddDescriptionPoint(index, imgIndex)}
                                      className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                                    >
                                      + Add Point
                                    </button>
                                  </div>

                                  <div className="mb-3">
                                    <textarea
                                      placeholder="Bulk Paste: Brand: Apple\nModel: iPhone 15..."
                                      className="w-full px-2 py-1 border border-dashed border-purple-300 rounded-lg bg-white text-xs focus:outline-none focus:border-purple-500 min-h-[60px]"
                                      onChange={(e) => {
                                        if (e.target.value.trim()) {
                                          handleBulkDescriptionPaste(index, imgIndex, e.target.value);
                                          e.target.value = ''; // Clear after paste
                                        }
                                      }}
                                    />
                                    <p className="text-[10px] text-purple-400 mt-1">Paste multiple lines (Key: Value or Key - Value) to add at once</p>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 px-1">
                                      <div className="col-span-4 text-[10px] font-bold text-purple-400 uppercase">Key</div>
                                      <div className="col-span-7 text-[10px] font-bold text-purple-400 uppercase">Value</div>
                                    </div>
                                    {productImage.description.map((desc, descIndex) => (
                                      <div key={descIndex} className="grid grid-cols-12 items-center gap-2">
                                        <div className="col-span-4">
                                          <input
                                            type="text"
                                            value={typeof desc === 'string' ? 'Feature' : desc.key}
                                            onChange={(e) => handleDescriptionPointChange(index, imgIndex, descIndex, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="w-full px-2 py-1 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-7">
                                          <input
                                            type="text"
                                            value={typeof desc === 'string' ? desc : desc.value}
                                            onChange={(e) => handleDescriptionPointChange(index, imgIndex, descIndex, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="w-full px-2 py-1 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                          />
                                        </div>
                                        <div className="col-span-1">
                                          {productImage.description.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveDescriptionPoint(index, imgIndex, descIndex)}
                                              className="text-red-400 hover:text-red-600"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-purple-500 italic">No product images added. Click "Add Image" to create flip-card gallery.</p>
                    )}
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
