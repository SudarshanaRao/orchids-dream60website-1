import { useState, useEffect } from 'react';
import {
  Ticket,
  Send,
  RefreshCw,
  Search,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  IndianRupee,
  History,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface EligibleWinner {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  auctionName: string;
  prizeAmountWon: number;
  entryFeePaid: number;
  lastRoundBidAmount: number;
  remainingProductFees: number;
  TimeSlot: string;
  prizeClaimStatus: string;
  remainingFeesPaid: boolean;
  claimedAt?: string;
}

interface IssuedVoucher {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  auctionId: string;
  woohooOrderId: string;
  amount: number;
  status: string;
  cardNumber?: string;
  cardPin?: string;
  expiry?: string;
  createdAt: string;
}

interface WoohooTransaction {
  orderId: string;
  refno: string;
  status: string;
  amount: number;
  createdAt: string;
  type: string;
}

interface WoohooCategory {
  id: number;
  name: string;
  description: string;
}

interface WoohooProduct {
  sku: string;
  name: string;
  description: string;
  minPrice: number;
  maxPrice: number;
}

interface AdminVoucherManagementProps {
  adminUserId: string;
}

export const AdminVoucherManagement = ({ adminUserId }: AdminVoucherManagementProps) => {
  const [eligibleWinners, setEligibleWinners] = useState<EligibleWinner[]>([]);
  const [issuedVouchers, setIssuedVouchers] = useState<IssuedVoucher[]>([]);
  const [woohooBalance, setWoohooBalance] = useState<number | null>(null);
  const [woohooTransactions, setWoohooTransactions] = useState<WoohooTransaction[]>([]);
  const [woohooCategories, setWoohooCategories] = useState<WoohooCategory[]>([]);
  const [woohooProducts, setWoohooProducts] = useState<WoohooProduct[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('AMAZON_GC');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'eligible' | 'issued' | 'woohoo-history'>('eligible');
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, winner: EligibleWinner | null}>({
    show: false,
    winner: null
  });

  const fetchEligibleWinners = async () => {
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/eligible-winners?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setEligibleWinners(data.data);
      }
    } catch (error) {
      console.error('Error fetching eligible winners:', error);
      toast.error('Failed to fetch eligible winners');
    }
  };

  const fetchIssuedVouchers = async () => {
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/issued?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setIssuedVouchers(data.data);
      }
    } catch (error) {
      console.error('Error fetching issued vouchers:', error);
      toast.error('Failed to fetch issued vouchers');
    }
  };

  const fetchWoohooBalance = async () => {
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/woohoo-balance?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        const balance = data.data?.balance || data.data?.[0]?.balance || 0;
        setWoohooBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching Woohoo balance:', error);
    }
  };

  const fetchWoohooTransactions = async () => {
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/woohoo-transactions?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setWoohooTransactions(data.data?.orders || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo transactions:', error);
    }
  };

  const fetchWoohooCategories = async () => {
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/woohoo-categories?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setWoohooCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo categories:', error);
    }
  };

  const fetchWoohooProducts = async (categoryId: string) => {
    if (!categoryId) return;
    setIsFetchingProducts(true);
    try {
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/woohoo-products/${categoryId}?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setWoohooProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo products:', error);
      toast.error('Failed to fetch products for this category');
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchEligibleWinners(), 
      fetchIssuedVouchers(),
      fetchWoohooBalance(),
      fetchWoohooTransactions(),
      fetchWoohooCategories()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [adminUserId]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchWoohooProducts(selectedCategoryId);
    } else {
      setWoohooProducts([]);
    }
  }, [selectedCategoryId]);

  const handleSendVoucher = async (winner: EligibleWinner) => {
    if (!selectedSku) {
      toast.error('Please select a voucher SKU first');
      return;
    }
    
    setShowConfirmModal({ show: true, winner });
  };

  const confirmSendVoucher = async () => {
    const winner = showConfirmModal.winner;
    if (!winner) return;

    setShowConfirmModal({ show: false, winner: null });
    setIsSending(winner._id);
    try {
      const response = await fetch('https://dev-api.dream60.com/admin/vouchers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: adminUserId,
          claimId: winner._id,
          sku: selectedSku,
          amount: winner.prizeAmountWon
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Voucher sent successfully to ${winner.userName}`);
        await loadData();
      } else {
        const errorMsg = data.error?.message || data.message || 'Failed to send voucher';
        toast.error(errorMsg);
        console.error('Voucher distribution error:', data);
      }
    } catch (error) {
      console.error('Error sending voucher:', error);
      toast.error('An error occurred while sending the voucher');
    } finally {
      setIsSending(null);
    }
  };

  const filteredEligible = eligibleWinners.filter(w => 
    w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.auctionName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIssued = issuedVouchers.filter(v => 
    v.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.woohooOrderId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = woohooTransactions.filter(t => 
    t.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.refno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-purple-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats & Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-semibold">Pending Distribution</p>
              <p className="text-2xl font-bold text-purple-900">{eligibleWinners.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-semibold">Total Distributed</p>
              <p className="text-2xl font-bold text-green-900">{issuedVouchers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-semibold">Woohoo Balance (SVC)</p>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-blue-900" />
                <p className="text-2xl font-bold text-blue-900">
                  {woohooBalance !== null ? woohooBalance.toLocaleString() : '---'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubTab('eligible')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'eligible' 
                ? 'bg-purple-700 text-white shadow-md' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Eligible Winners
            </button>
            <button
              onClick={() => setActiveSubTab('issued')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'issued' 
                ? 'bg-purple-700 text-white shadow-md' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Issued Vouchers
            </button>
            <button
              onClick={() => setActiveSubTab('woohoo-history')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'woohoo-history' 
                ? 'bg-purple-700 text-white shadow-md' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <History className="w-4 h-4" />
              Woohoo History
            </button>
          </div>
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or order ID..."
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {activeSubTab === 'eligible' ? (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">1. Select Category</label>
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">-- Choose Category --</option>
                  {woohooCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">2. Select Voucher (SKU)</label>
                <select 
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  disabled={!selectedCategoryId || isFetchingProducts}
                  className="w-full p-2.5 bg-white border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="AMAZON_GC">Amazon Gift Card (Default)</option>
                  {woohooProducts.map(prod => (
                    <option key={prod.sku} value={prod.sku}>{prod.name} ({prod.sku})</option>
                  ))}
                </select>
              </div>
              <div className="md:w-48 space-y-2">
                 <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">Status</label>
                 <div className="p-2.5 bg-white border-2 border-purple-100 rounded-lg text-sm text-purple-600 font-medium flex items-center gap-2">
                   {isFetchingProducts ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                   ) : (
                     <><CheckCircle className="w-4 h-4" /> Ready</>
                   )}
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-200">
                    <th className="text-left py-3 px-4 text-purple-700">Winner</th>
                    <th className="text-left py-3 px-4 text-purple-700">Auction</th>
                    <th className="text-left py-3 px-4 text-purple-700">Prize Amount</th>
                    <th className="text-left py-3 px-4 text-purple-700">Total Paid</th>
                    <th className="text-left py-3 px-4 text-purple-700">Won Date</th>
                    <th className="text-center py-3 px-4 text-purple-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEligible.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-purple-500">
                        No eligible winners found
                      </td>
                    </tr>
                  ) : (
                    filteredEligible.map((winner) => (
                      <tr key={winner._id} className="border-b border-purple-100 hover:bg-purple-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-purple-900">{winner.userName}</div>
                          <div className="text-xs text-purple-600">{winner.userEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{winner.auctionName}</div>
                          <div className="text-xs text-purple-500">{winner.TimeSlot}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-purple-900">₹{winner.prizeAmountWon.toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-purple-900">₹{(winner.entryFeePaid + winner.lastRoundBidAmount).toLocaleString()}</div>
                          <div className="text-[10px] text-purple-500">
                            Entry: ₹{winner.entryFeePaid} + Bid: ₹{winner.lastRoundBidAmount}
                          </div>
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-2 h-2" /> Paid
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-purple-900">
                            {winner.claimedAt ? (() => {
                              const date = new Date(winner.claimedAt);
                              const adjustedDate = new Date(date.getTime() - (330 * 60 * 1000));
                              return adjustedDate.toLocaleString('en-IN', {
                                timeZone: 'UTC',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            })() : '---'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleSendVoucher(winner)}
                            disabled={isSending === winner._id}
                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all disabled:opacity-50"
                          >
                            {isSending === winner._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Send Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeSubTab === 'issued' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-200">
                  <th className="text-left py-3 px-4 text-purple-700">Recipient</th>
                  <th className="text-left py-3 px-4 text-purple-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-purple-700">Amount</th>
                  <th className="text-left py-3 px-4 text-purple-700">Status</th>
                  <th className="text-left py-3 px-4 text-purple-700">Details</th>
                  <th className="text-left py-3 px-4 text-purple-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssued.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-purple-500">
                      No vouchers issued yet
                    </td>
                  </tr>
                ) : (
                  filteredIssued.map((voucher) => (
                    <tr key={voucher._id} className="border-b border-purple-100 hover:bg-purple-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-purple-900">{voucher.userName}</div>
                        <div className="text-xs text-purple-600">{voucher.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{voucher.woohooOrderId}</td>
                      <td className="py-3 px-4 font-bold">₹{voucher.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          voucher.status === 'complete' ? 'bg-green-100 text-green-700' : 
                          voucher.status === 'failed' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {voucher.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {voucher.cardNumber && (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono bg-purple-50 px-1 rounded">Card: {voucher.cardNumber}</span>
                            <span className="font-mono bg-amber-50 px-1 rounded">PIN: {voucher.cardPin}</span>
                          </div>
                        )}
                        {!voucher.cardNumber && voucher.status === 'complete' && 'Email Sent'}
                        {!voucher.cardNumber && voucher.status !== 'complete' && 'Processing...'}
                      </td>
                      <td className="py-3 px-4 text-xs text-purple-600">
                        {new Date(voucher.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-200">
                  <th className="text-left py-3 px-4 text-purple-700">Woohoo Order ID</th>
                  <th className="text-left py-3 px-4 text-purple-700">Reference No</th>
                  <th className="text-left py-3 px-4 text-purple-700">Amount</th>
                  <th className="text-left py-3 px-4 text-purple-700">Status</th>
                  <th className="text-left py-3 px-4 text-purple-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-purple-500">
                      No Woohoo transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, index) => (
                    <tr key={tx.orderId || index} className="border-b border-purple-100 hover:bg-purple-50">
                      <td className="py-3 px-4 font-mono text-xs">{tx.orderId}</td>
                      <td className="py-3 px-4 font-mono text-xs text-purple-600">{tx.refno}</td>
                      <td className="py-3 px-4 font-bold">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETE' || tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                          tx.status === 'CANCELLED' || tx.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-purple-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal.show && showConfirmModal.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-purple-700" />
                </div>
                <button 
                  onClick={() => setShowConfirmModal({ show: false, winner: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Voucher Distribution</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to send a <span className="font-bold text-purple-700">₹{showConfirmModal.winner.prizeAmountWon.toLocaleString()}</span> {selectedSku} voucher to <span className="font-bold text-gray-900">{showConfirmModal.winner.userName}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal({ show: false, winner: null })}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendVoucher}
                  className="flex-1 px-4 py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
