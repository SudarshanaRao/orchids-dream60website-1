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
      const response = await fetch(`https://dev-api.dream60.com/admin/vouchers/woohoo-transactions?user_id=${adminUserId}`);
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

  useEffect(() => {
    loadData();
  }, [adminUserId]);

  const handleSendVoucher = async (winner: EligibleWinner) => {
    if (!confirm(`Are you sure you want to send a ₹${winner.prizeAmountWon} voucher to ${winner.userName}?`)) {
      return;
    }

    setIsSending(winner._id);
    try {
      const response = await fetch('https://dev-api.dream60.com/admin/vouchers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: adminUserId,
          claimId: winner._id,
          sku: 'AMAZON_GC', // Generic SKU for now, should be configurable
          amount: winner.prizeAmountWon
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Voucher sent successfully to ${winner.userName}`);
        await loadData();
      } else {
        toast.error(data.message || 'Failed to send voucher');
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
                                hour12: true
                              }) : '---'}
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
    </div>
  );
};
