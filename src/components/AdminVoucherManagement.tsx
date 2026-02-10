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
  Mail,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

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
  userMobile?: string;
  auctionId: string;
  woohooOrderId: string;
  transactionId?: string;
  amount: number;
  status: string;
  cardNumber?: string;
  cardPin?: string;
  expiry?: string;
  sentToUser?: boolean;
  sentAt?: string;
  createdAt: string;
  emailDetails?: {
    recipientEmail?: string;
    recipientEmailMasked?: string;
    emailSubject?: string;
    emailSentAt?: string;
    emailStatus?: string;
    cardNumberMasked?: string;
    cardPinMasked?: string;
    giftCardCode?: string;
    giftCardCodeMasked?: string;
    redeemLink?: string;
    voucherAmount?: number;
    totalEmailsSent?: number;
  };
}

interface WoohooTransaction {
  orderId: string;
  refno: string;
  status: string;
  amount: number;
  createdAt: string;
  type: string;
}

interface AdminVoucherManagementProps {
  adminUserId: string;
}

export const AdminVoucherManagement = ({ adminUserId }: AdminVoucherManagementProps) => {
  const [eligibleWinners, setEligibleWinners] = useState<EligibleWinner[]>([]);
  const [issuedVouchers, setIssuedVouchers] = useState<IssuedVoucher[]>([]);
  const [woohooBalance, setWoohooBalance] = useState<number | null>(null);
  const [woohooTransactions, setWoohooTransactions] = useState<WoohooTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'eligible' | 'issued' | 'woohoo-history'>('eligible');
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, winner: EligibleWinner | null}>({
    show: false,
    winner: null
  });
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string>('AMAZON_GC');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [woohooCategories, setWoohooCategories] = useState<any[]>([]);
  const [woohooProducts, setWoohooProducts] = useState<any[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // Manual voucher modal state
  const [showVoucherChoiceModal, setShowVoucherChoiceModal] = useState<{show: boolean, winner: EligibleWinner | null}>({
    show: false,
    winner: null
  });
  const [showManualVoucherModal, setShowManualVoucherModal] = useState(false);
  const [manualVoucherWinner, setManualVoucherWinner] = useState<EligibleWinner | null>(null);
  const [manualVoucherForm, setManualVoucherForm] = useState({
    voucherAmount: '',
    GiftCardCode: '',
    paymentAmount: '',
    redeem_link: '',
  });
  const [isSendingManual, setIsSendingManual] = useState(false);

    const fetchEligibleWinners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/vouchers/eligible-winners?user_id=${adminUserId}`);
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
        const response = await fetch(`${API_BASE_URL}/admin/vouchers/issued?user_id=${adminUserId}`);
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
        const response = await fetch(`${API_BASE_URL}/admin/vouchers/woohoo-balance?user_id=${adminUserId}`);
        const data = await response.json();
      if (data.success) {
        // Woohoo API v3 balance is usually in data.balance or data[0].balance
        const balance = data.data?.balance || data.data?.[0]?.balance || 0;
        setWoohooBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching Woohoo balance:', error);
    }
  };

    const fetchWoohooTransactions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/vouchers/woohoo-transactions?user_id=${adminUserId}`);
        const data = await response.json();
      if (data.success) {
        setWoohooTransactions(data.data?.orders || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo transactions:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchEligibleWinners(), 
      fetchIssuedVouchers(),
      fetchWoohooBalance(),
      fetchWoohooTransactions()
    ]);
    setIsLoading(false);
  };

  // Fetch Woohoo categories
  const fetchWoohooCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vouchers/woohoo-categories?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setWoohooCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo categories:', error);
    }
  };

  // Fetch Woohoo products by category
  const fetchWoohooProducts = async (categoryId: string) => {
    if (!categoryId) return;
    setIsFetchingProducts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vouchers/woohoo-products/${categoryId}?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setWoohooProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Woohoo products:', error);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchWoohooCategories();
  }, [adminUserId]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchWoohooProducts(selectedCategoryId);
    } else {
      setWoohooProducts([]);
    }
  }, [selectedCategoryId]);

  const handleSendVoucher = async (winner: EligibleWinner) => {
    setShowVoucherChoiceModal({ show: true, winner });
  };

  const handleChooseAuto = () => {
    const winner = showVoucherChoiceModal.winner;
    if (!winner) return;
    if (!selectedSku) {
      toast.error('Please select a voucher SKU first');
      return;
    }
    setShowVoucherChoiceModal({ show: false, winner: null });
    setShowConfirmModal({ show: true, winner });
  };

  const handleChooseManual = () => {
    const winner = showVoucherChoiceModal.winner;
    if (!winner) return;
    setShowVoucherChoiceModal({ show: false, winner: null });
    setManualVoucherWinner(winner);
    setManualVoucherForm({
      voucherAmount: String(winner.prizeAmountWon),
      GiftCardCode: '',
      paymentAmount: '',
      redeem_link: '',
    });
    setShowManualVoucherModal(true);
  };

  const handleSendManualVoucher = async () => {
    if (!manualVoucherWinner) return;
    const { voucherAmount, GiftCardCode, paymentAmount, redeem_link } = manualVoucherForm;
    
    if (!voucherAmount || !GiftCardCode || !paymentAmount || !redeem_link) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSendingManual(true);
    try {
      // 1. Call backend API to create voucher record and send email
      const response = await fetch(`${API_BASE_URL}/admin/vouchers/send-manual?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claimId: manualVoucherWinner._id,
            voucherAmount,
            giftCardCode: GiftCardCode,
            paymentAmount,
            redeemLink: redeem_link,
            forceResend: true,
          }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Manual voucher created and sent to ${manualVoucherWinner.userName}`);
        setShowManualVoucherModal(false);
        setManualVoucherWinner(null);
        await loadData();
      } else {
        toast.error(data.message || 'Failed to create manual voucher');
      }
    } catch (error) {
      console.error('Error sending manual voucher:', error);
      toast.error('An error occurred while sending the manual voucher');
    } finally {
      setIsSendingManual(false);
    }
  };

    const confirmSendVoucher = async () => {
      const winner = showConfirmModal.winner;
      if (!winner) return;
  
      setShowConfirmModal({ show: false, winner: null });
      setIsSending(winner._id);
      try {
        const response = await fetch(`${API_BASE_URL}/admin/vouchers/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: adminUserId,
              claimId: winner._id,
              sku: selectedSku || 'AMAZON_GC',
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

  const handleResendEmail = async (voucherId: string) => {
    setIsResending(voucherId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vouchers/${voucherId}/resend-email?user_id=${adminUserId}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Voucher email resent successfully');
        await fetchIssuedVouchers();
      } else {
        toast.error(data.message || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend voucher email');
    } finally {
      setIsResending(null);
    }
  };

  const handleSyncVoucher = async (voucherId: string) => {
    setIsSyncing(voucherId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vouchers/${voucherId}/sync?user_id=${adminUserId}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Voucher status synced');
        await fetchIssuedVouchers();
      } else {
        toast.error(data.message || 'Failed to sync voucher');
      }
    } catch (error) {
      console.error('Error syncing voucher:', error);
      toast.error('Failed to sync voucher status');
    } finally {
      setIsSyncing(null);
    }
  };

  const filteredEligible = eligibleWinners
    .filter(w => 
      w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.auctionName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.claimedAt ? new Date(a.claimedAt).getTime() : 0;
      const dateB = b.claimedAt ? new Date(b.claimedAt).getTime() : 0;
      return dateB - dateA;
    });

  const isExpired24hrs = (claimedAt?: string) => {
    if (!claimedAt) return false;
    const claimedTime = new Date(claimedAt).getTime();
    // claimedAt is stored as IST-in-UTC (backend getISTTime() adds 5.5hrs to UTC then stores as UTC)
    // So we need to compare with current IST-in-UTC to get accurate elapsed time
    const nowIST = Date.now() + (5.5 * 60 * 60 * 1000);
    return (nowIST - claimedTime) > 24 * 60 * 60 * 1000;
  };

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
                          {winner.claimedAt ? new Date(winner.claimedAt).toLocaleString('en-IN', {
                                timeZone: 'UTC',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              }) : '---'}
                          </div>
                          <div className="text-[10px] text-purple-400 mt-0.5">IST (GMT+5:30)</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExpired24hrs(winner.claimedAt) ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">
                                Expired (24hrs passed)
                              </span>
                            </div>
                          ) : (
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
                          )}
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
                  <th className="text-left py-3 px-4 text-purple-700">Transaction / Order</th>
                  <th className="text-left py-3 px-4 text-purple-700">Amount</th>
                  <th className="text-left py-3 px-4 text-purple-700">Status</th>
                  <th className="text-left py-3 px-4 text-purple-700">Card Details (Masked)</th>
                  <th className="text-left py-3 px-4 text-purple-700">Email Delivery</th>
                  <th className="text-left py-3 px-4 text-purple-700">Date</th>
                  <th className="text-center py-3 px-4 text-purple-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssued.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-purple-500">
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
                      <td className="py-3 px-4">
                        {voucher.transactionId && (
                          <div className="font-mono text-xs font-semibold text-purple-900">{voucher.transactionId}</div>
                        )}
                        <div className="font-mono text-[10px] text-purple-500">{voucher.woohooOrderId}</div>
                      </td>
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
                        {voucher.emailDetails?.cardNumberMasked ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono bg-purple-50 px-1.5 py-0.5 rounded text-purple-800">Card: {voucher.emailDetails.cardNumberMasked}</span>
                            {voucher.emailDetails.cardPinMasked && (
                              <span className="font-mono bg-amber-50 px-1.5 py-0.5 rounded text-amber-800">PIN: {voucher.emailDetails.cardPinMasked}</span>
                            )}
                          </div>
                        ) : voucher.cardNumber ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono bg-purple-50 px-1 rounded">Card: {voucher.cardNumber}</span>
                            <span className="font-mono bg-amber-50 px-1 rounded">PIN: {voucher.cardPin}</span>
                          </div>
                        ) : (
                          <span className="text-purple-400 italic">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {voucher.emailDetails ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-purple-700">
                              To: <span className="font-mono font-semibold">{voucher.emailDetails.recipientEmail || voucher.userEmail}</span>
                            </span>
                            {voucher.emailDetails.emailSubject && (
                              <span className="text-purple-500 text-[10px] truncate max-w-[180px] block">{voucher.emailDetails.emailSubject}</span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              voucher.emailDetails.emailStatus === 'sent' ? 'text-green-700' : 'text-amber-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${voucher.emailDetails.emailStatus === 'sent' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                              {voucher.emailDetails.emailStatus === 'sent' ? 'Email Sent' : (voucher.emailDetails.emailStatus || 'Pending')}
                            </span>
                            {voucher.emailDetails.emailSentAt && (
                              <span className="text-purple-400 text-[10px]">
                                {new Date(voucher.emailDetails.emailSentAt).toLocaleString('en-IN', {
                                  timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-purple-400 italic">
                            {voucher.status === 'complete' ? 'Email Sent' : 'No email data'}
                          </span>
                        )}
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
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          {voucher.status === 'complete' && (
                            <button
                              onClick={() => handleResendEmail(voucher._id)}
                              disabled={isResending === voucher._id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all text-[10px] font-semibold disabled:opacity-50"
                            >
                              {isResending === voucher._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Resend Email
                            </button>
                          )}
                          {voucher.status === 'processing' && (
                            <button
                              onClick={() => handleSyncVoucher(voucher._id)}
                              disabled={isSyncing === voucher._id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all text-[10px] font-semibold disabled:opacity-50"
                            >
                              {isSyncing === voucher._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              Sync Status
                            </button>
                          )}
                        </div>
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
      {/* Voucher Choice Modal (Auto vs Manual) */}
      {showVoucherChoiceModal.show && showVoucherChoiceModal.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Send className="w-6 h-6 text-purple-700" />
                </div>
                <button
                  onClick={() => setShowVoucherChoiceModal({ show: false, winner: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Send Voucher</h3>
              <p className="text-gray-600 mb-1">
                Sending <span className="font-bold text-purple-700">₹{showVoucherChoiceModal.winner.prizeAmountWon.toLocaleString()}</span> voucher to <span className="font-bold text-gray-900">{showVoucherChoiceModal.winner.userName}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">Choose how you want to send the voucher:</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleChooseAuto}
                  className="w-full px-4 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-100 transition-all text-left flex items-center gap-3"
                >
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-900">Auto (Woohoo)</div>
                    <div className="text-xs text-purple-600">Send via Woohoo API automatically</div>
                  </div>
                </button>
                <button
                  onClick={handleChooseManual}
                  className="w-full px-4 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-100 transition-all text-left flex items-center gap-3"
                >
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">Manual (Email Template)</div>
                    <div className="text-xs text-blue-600">Fill in voucher details and send via email</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Voucher Form Modal */}
      {showManualVoucherModal && manualVoucherWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-blue-700" />
                </div>
                <button
                  onClick={() => { setShowManualVoucherModal(false); setManualVoucherWinner(null); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">Manual Voucher Email</h3>
              <p className="text-sm text-gray-500 mb-4">
                Sending to <span className="font-semibold text-gray-700">{manualVoucherWinner.userName}</span> ({manualVoucherWinner.userEmail})
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Voucher Amount (₹)</label>
                  <input
                    type="text"
                    value={manualVoucherForm.voucherAmount}
                    onChange={(e) => setManualVoucherForm(prev => ({ ...prev, voucherAmount: e.target.value }))}
                    className="w-full mt-1 p-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Gift Card Code</label>
                  <input
                    type="text"
                    value={manualVoucherForm.GiftCardCode}
                    onChange={(e) => setManualVoucherForm(prev => ({ ...prev, GiftCardCode: e.target.value }))}
                    className="w-full mt-1 p-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. XXXX-XXXX-XXXX"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Amount (₹)</label>
                  <input
                    type="text"
                    value={manualVoucherForm.paymentAmount}
                    onChange={(e) => setManualVoucherForm(prev => ({ ...prev, paymentAmount: e.target.value }))}
                    className="w-full mt-1 p-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Redeem Link</label>
                  <input
                    type="text"
                    value={manualVoucherForm.redeem_link}
                    onChange={(e) => setManualVoucherForm(prev => ({ ...prev, redeem_link: e.target.value }))}
                    className="w-full mt-1 p-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. https://www.amazon.in/gc/redeem"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowManualVoucherModal(false); setManualVoucherWinner(null); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendManualVoucher}
                  disabled={isSendingManual}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingManual ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Voucher Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
