import { useState, useEffect } from 'react';
import { IndianRupee, Users, Search, RefreshCw, AlertCircle, CheckCircle, Clock, X, ArrowRight, History, CreditCard, Loader2 } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';
import { toast } from 'sonner';

interface AdminRefundManagementProps {
  adminUserId: string;
}

interface Payment {
  _id: string;
  orderId: string;
  airpayTransactionId: string;
  userId: string;
  amount: number;
  status: string;
  paymentType: string;
  paymentMethod?: string;
  vpa?: string;
  bankName?: string;
  createdAt: string;
  paidAt?: string;
  refundRequested?: boolean;
  refundStatus?: string;
  refundAmount?: number;
  refundId?: string;
  refundMessage?: string;
  refundRequestedAt?: string;
  user?: {
    username: string;
    email: string;
    mobile?: string;
    userCode?: string;
  };
  refundedByAdmin?: {
    username: string;
  };
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSubmit: (transactionId: string, amount: string) => void;
  isProcessing: boolean;
}

const RefundModal = ({ isOpen, onClose, payment, onSubmit, isProcessing }: RefundModalProps) => {
  const [refundAmount, setRefundAmount] = useState('');
  const [isFullRefund, setIsFullRefund] = useState(true);

  useEffect(() => {
    if (payment) {
      setRefundAmount(payment.amount.toFixed(2));
      setIsFullRefund(true);
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = () => {
    if (!refundAmount || isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (parseFloat(refundAmount) > payment.amount) {
      toast.error('Refund amount cannot exceed original payment');
      return;
    }
    onSubmit(payment.airpayTransactionId, refundAmount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Process Refund</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-purple-600">User</span>
              <span className="font-bold text-purple-900">{payment.user?.username || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-purple-600">Order ID</span>
              <span className="font-mono text-xs text-purple-700">{payment.orderId}</span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-purple-600">Airpay Txn ID</span>
              <span className="font-mono text-xs text-purple-700">{payment.airpayTransactionId}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-purple-600">Original Amount</span>
              <span className="font-black text-purple-900">₹{payment.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={isFullRefund}
                onChange={() => {
                  setIsFullRefund(true);
                  setRefundAmount(payment.amount.toFixed(2));
                }}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700">Full Refund (₹{payment.amount.toFixed(2)})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isFullRefund}
                onChange={() => setIsFullRefund(false)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700">Partial Refund</span>
            </label>
          </div>

          {!isFullRefund && (
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">Refund Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">₹</span>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0.01"
                  max={payment.amount}
                  className="w-full pl-8 pr-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Refunds are processed through Airpay and may take 5-7 business days to reflect in the user's account.
            </p>
          </div>
        </div>

        <div className="border-t border-purple-100 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Process Refund
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export function AdminRefundManagement({ adminUserId }: AdminRefundManagementProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'history'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refundHistory, setRefundHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRefundablePayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/airpay/refundable-payments?user_id=${adminUserId}&page=${page}&limit=20&search=${searchTerm}`
      );
      const data = await response.json();
      if (data.success) {
        setPayments(data.data.payments || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        toast.error(data.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefundHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/airpay/refund-history?user_id=${adminUserId}&page=${page}&limit=20`
      );
      const data = await response.json();
      if (data.success) {
        setRefundHistory(data.data.refunds || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        toast.error(data.message || 'Failed to fetch refund history');
      }
    } catch (error) {
      console.error('Error fetching refund history:', error);
      toast.error('Failed to fetch refund history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchRefundablePayments();
    } else {
      fetchRefundHistory();
    }
  }, [adminUserId, activeTab, page, searchTerm]);

  const handleRefund = async (transactionId: string, amount: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/api/airpay/refund?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: [
            { ap_transactionid: transactionId, amount: amount }
          ]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const txnResult = data.data?.transactions?.[0];
        if (txnResult?.success === 'true') {
          toast.success(`Refund initiated! Reference: ${txnResult.refund_id}`);
        } else {
          toast.warning(txnResult?.message || 'Refund request submitted');
        }
        setIsRefundModalOpen(false);
        setSelectedPayment(null);
        fetchRefundablePayments();
      } else {
        toast.error(data.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRefundModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsRefundModalOpen(true);
  };

  const totalRefundedAmount = refundHistory.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const pendingRefunds = refundHistory.filter(r => r.refundStatus === 'initiated').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-700" />
            </div>
            <span className="text-2xl font-bold text-purple-900">{payments.length}</span>
          </div>
          <h3 className="text-sm font-semibold text-purple-600">Refundable Payments</h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <span className="text-2xl font-bold text-amber-900">{pendingRefunds}</span>
          </div>
          <h3 className="text-sm font-semibold text-amber-600">Pending Refunds</h3>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-green-700" />
            </div>
            <span className="text-2xl font-bold text-green-900">₹{totalRefundedAmount.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-semibold text-green-600">Total Refunded</h3>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'payments'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payments
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50'
          }`}
        >
          <History className="w-4 h-4" />
          Refund History
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order ID, user ID, or transaction ID..."
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <button
            onClick={() => activeTab === 'payments' ? fetchRefundablePayments() : fetchRefundHistory()}
            disabled={isLoading}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 border-2 border-purple-100"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">User</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Order ID</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Txn ID</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Amount</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Type</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Date</th>
                  <th className="text-right py-4 px-4 text-purple-700 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse border-b border-purple-50">
                      <td colSpan={7} className="py-6 h-12 bg-purple-50/30"></td>
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-purple-900">{payment.user?.username || 'Unknown'}</div>
                        <div className="text-[10px] text-purple-500">{payment.user?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-purple-700">{payment.orderId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-purple-700">{payment.airpayTransactionId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-purple-900">₹{payment.amount?.toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          payment.paymentType === 'ENTRY_FEE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {payment.paymentType === 'ENTRY_FEE' ? 'Entry Fee' : 'Prize Claim'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {payment.refundRequested ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                            Refund Requested
                          </span>
                        ) : (
                          <button
                            onClick={() => openRefundModal(payment)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">User</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Order ID</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Refund Amount</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Status</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Refund ID</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">Requested At</th>
                  <th className="text-left py-4 px-4 text-purple-700 font-bold">By</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse border-b border-purple-50">
                      <td colSpan={7} className="py-6 h-12 bg-purple-50/30"></td>
                    </tr>
                  ))
                ) : refundHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      <History className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                      No refund history found
                    </td>
                  </tr>
                ) : (
                  refundHistory.map((refund) => (
                    <tr key={refund._id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-purple-900">{refund.user?.username || 'Unknown'}</div>
                        <div className="text-[10px] text-purple-500">{refund.user?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-purple-700">{refund.orderId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-purple-900">₹{refund.refundAmount?.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-500">of ₹{refund.amount?.toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          refund.refundStatus === 'initiated' ? 'bg-amber-100 text-amber-700' :
                          refund.refundStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {refund.refundStatus?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-purple-700">{refund.refundId || '-'}</div>
                        {refund.refundMessage && (
                          <div className="text-[10px] text-gray-500 max-w-xs truncate">{refund.refundMessage}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {refund.refundRequestedAt ? new Date(refund.refundRequestedAt).toLocaleString('en-IN') : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-purple-600">{refund.refundedByAdmin?.username || '-'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1 border-2 border-purple-200 rounded-lg text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
            >
              Previous
            </button>
            <span className="text-sm text-purple-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="px-3 py-1 border-2 border-purple-200 rounded-lg text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onSubmit={handleRefund}
        isProcessing={isProcessing}
      />
    </div>
  );
}
