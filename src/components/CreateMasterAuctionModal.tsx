import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Plus, Trash2 } from 'lucide-react';
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
    const lines = text.split('\n');
    const description: Record<string, string> = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('\t');
      if (key && valueParts.length > 0) {
        description[key.trim()] = valueParts.join('\t').trim();
      }
    });
    
    updated[configIndex].productDescription = description;
    setAuctionConfigs(updated);
  };

  const getDescriptionString = (description?: Record<string, string>) => {
    if (!description) return '';
    return Object.entries(description)
      .map(([key, value]) => `${key}\t${value}`)
      .join('\n');
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
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Product Description (Key [Tab] Value)
                    </label>
                    <textarea
                      value={getDescriptionString(config.productDescription)}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      placeholder="Weight	500g&#10;Color	Midnight Black&#10;Warranty	1 Year"
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm"
                    />
                    <p className="text-xs text-purple-500 mt-1 italic">
                      Each line should be "Key [Tab] Value".
                    </p>

                    {config.productDescription && Object.keys(config.productDescription).length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <h5 className="text-xs font-bold text-purple-900 mb-2 uppercase tracking-wider">Description Preview</h5>
                        <div className="overflow-hidden rounded-md border border-purple-200 bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-purple-100">
                              <tr>
                                <th className="px-3 py-2 text-left font-bold text-purple-900 border-b border-purple-200">Attribute</th>
                                <th className="px-3 py-2 text-left font-bold text-purple-900 border-b border-purple-200">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(config.productDescription).map(([key, value], idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'}>
                                  <td className="px-3 py-2 font-semibold text-purple-800 border-b border-purple-100">{key}</td>
                                  <td className="px-3 py-2 text-purple-700 border-b border-purple-100">{value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
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
