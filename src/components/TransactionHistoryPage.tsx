import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  IndianRupee,
  Clock,
  Target,
  Sparkles,
  Receipt,
  CreditCard,
  Wallet,
  Banknote,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';

interface TransactionHistoryPageProps {
  user: { id: string; username: string };
  onBack: () => void;
}

interface TransactionItem {
  paymentType: 'ENTRY_FEE' | 'PRIZE_CLAIM' | string;
  amount: number;
  currency?: string;
  status: string;
  orderId?: string;
  paymentId?: string;
  auctionId?: string;
  auctionName?: string | null;
  timeSlot?: string | null;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  paidAt?: string | number | Date | null;
  roundNumber?: number | null;
  productName?: string | null;
  productTimeSlot?: string | null;
  productValue?: number | null;
  paymentMethod?: string | null;
  paymentDetails?: Record<string, any> | null;
}

export function TransactionHistoryPage({ user, onBack }: TransactionHistoryPageProps) {
  const [transactions, setTransactions] = useState<{
    entryFees: TransactionItem[];
    prizeClaims: TransactionItem[];
    vouchers: TransactionItem[];
  }>({ entryFees: [], prizeClaims: [], vouchers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const DETAIL_STORAGE_KEY = 'd60_last_transaction_detail';

  const formatDateTime = (value?: string | number | Date | null) => {
    if (!value) return '--';
    const date = new Date(value);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const paymentTypeLabel = (type?: string) => {
    if (type === 'PRIZE_CLAIM') return 'Prize Claim';
    if (type === 'ENTRY_FEE') return 'Entry Fee';
    return type || 'Payment';
  };

  const paymentMethodLabel = (tx?: TransactionItem | null) => {
    if (!tx) return '--';
    const method = tx.paymentMethod || tx.paymentDetails?.method;
    if (!method) return '--';

    if (method === 'card' && tx.paymentDetails?.card) {
      const card = tx.paymentDetails.card;
      return `Card •••• ${card.last4 || ''} (${card.network || card.type || ''})`.trim();
    }
    if (method === 'upi' && tx.paymentDetails?.vpa) {
      return `UPI • ${tx.paymentDetails.vpa}`;
    }
    if (method === 'netbanking' && tx.paymentDetails?.bank) {
      return `Netbanking • ${tx.paymentDetails.bank}`;
    }
    if (method === 'wallet' && tx.paymentDetails?.wallet) {
      return `Wallet • ${tx.paymentDetails.wallet}`;
    }
    return method.toUpperCase();
  };

  const fetchTransactions = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    try {
      const queryString = buildQueryString({ userId: user.id });
      const response = await fetch(`${API_ENDPOINTS.user.transactions}${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      const data = result.data || {};

      setTransactions({
        entryFees: data.entryFees || [],
        prizeClaims: data.prizeClaims || [],
        vouchers: data.voucherTransactions || [],
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(true);
    const interval = setInterval(() => fetchTransactions(false), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchTransactionDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const queryString = buildQueryString({ userId: user.id });
      const response = await fetch(`${API_ENDPOINTS.user.transactionDetail}/${encodeURIComponent(orderId)}${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction detail');
      }
      const result = await response.json();
      if (result?.data) {
        setSelectedTransaction(result.data);
        sessionStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Could not load transaction details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.pathname.startsWith('/transactions/details')) {
        const orderId = url.searchParams.get('orderId');
        if (orderId) {
          fetchTransactionDetail(orderId);
        } else {
          const cached = sessionStorage.getItem(DETAIL_STORAGE_KEY);
          if (cached) {
            setSelectedTransaction(JSON.parse(cached));
          }
        }
      }
    } catch (error) {
      console.error('Failed to hydrate transaction detail from URL/storage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const openDetails = (tx: TransactionItem) => {
    setSelectedTransaction(tx);
    sessionStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(tx));
    const orderId = tx.orderId || tx.paymentId;
    try {
      const path = orderId ? `/transactions/details?orderId=${encodeURIComponent(orderId)}` : '/transactions/details';
      window.history.pushState({}, '', path);
    } catch (_) {
      // no-op
    }
  };

  const closeDetails = () => {
    setSelectedTransaction(null);
    sessionStorage.removeItem(DETAIL_STORAGE_KEY);
    try {
      window.history.pushState({}, '', '/transactions');
    } catch (_) {
      // no-op
    }
  };

  const renderTransactionList = (items: TransactionItem[], emptyLabel: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-6 text-purple-700">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full mr-2"
          />
          Loading transactions...
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm font-semibold text-purple-800">{emptyLabel}</p>
          <p className="text-xs text-purple-600 mt-1">Your payments will appear here once processed.</p>
        </div>
      );
    }

    return (
        <div className="space-y-2 sm:space-y-3" data-whatsnew-target="transactions-list">
          {items.map((item, idx) => (
            <Card
              key={`${item.orderId || item.paymentId || idx}`}
              className="border-2 border-purple-200/60 bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition"
              onClick={() => openDetails(item)}
              role="button"
            >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.paymentType === 'PRIZE_CLAIM'
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                        : 'bg-gradient-to-br from-purple-500 to-violet-600'
                    } text-white font-bold`}
                  >
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-900">₹{item.amount?.toLocaleString('en-IN') || 0}</div>
                    <div className="text-[11px] text-purple-600">{paymentTypeLabel(item.paymentType)}</div>
                  </div>
                </div>
                <Badge
                  className={`w-fit ${
                    item.paymentType === 'PRIZE_CLAIM'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {item.status || 'pending'}
                </Badge>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-purple-700">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(item.paidAt || item.createdAt)}</span>
                  </div>

                {item.auctionId && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {item.auctionName || item.productName || 'Auction'}{' '}
                      {item.timeSlot ? `(${item.timeSlot})` : ''}
                    </span>
                  </div>
                )}
                {item.orderId && (
                  <div className="flex items-center gap-1 col-span-1 sm:col-span-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="truncate">Order: {item.orderId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const detailMethodIcon = useMemo(() => {
    if (!selectedTransaction) return null;
    const method = selectedTransaction.paymentMethod || selectedTransaction.paymentDetails?.method;
    if (!method) return <Info className="w-4 h-4" />;
    if (method === 'card') return <CreditCard className="w-4 h-4" />;
    if (method === 'upi') return <Wallet className="w-4 h-4" />;
    if (method === 'netbanking') return <Banknote className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  }, [selectedTransaction]);

  if (selectedTransaction) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <Button
                variant="ghost"
                onClick={closeDetails}
                className="flex items-center gap-2 text-purple-700 hover:text-purple-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                {detailLoading && (
                  <div className="text-xs text-purple-600 animate-pulse">Refreshing...</div>
                )}
                <div className="flex items-center gap-2 text-purple-800 font-semibold">
                  <IndianRupee className="w-4 h-4" />
                  Transaction Details
                </div>
              </div>
            </div>


          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-2 border-purple-200/70 bg-white/90 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50/90 via-violet-50/80 to-purple-50/90 border-b-2 border-purple-200/60 p-4 sm:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg">
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-purple-700">{paymentTypeLabel(selectedTransaction.paymentType)}</div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                      ₹{selectedTransaction.amount?.toLocaleString('en-IN') || 0}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">{user.username}'s payment</div>
                  </div>
                  <div className="ml-auto">
                    <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedTransaction.status || 'pending'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-purple-700 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Paid: {formatDateTime(selectedTransaction.paidAt || selectedTransaction.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Round: {selectedTransaction.roundNumber ?? '--'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailMethodIcon}
                    <span>{paymentMethodLabel(selectedTransaction)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50">
                    <div className="text-xs font-semibold text-purple-700 mb-1">Auction</div>
                    <div className="text-base font-semibold text-purple-900">{selectedTransaction.auctionName || selectedTransaction.productName || 'Auction'}</div>
                    <div className="text-xs text-purple-600">Time Slot: {selectedTransaction.timeSlot || selectedTransaction.productTimeSlot || '--'}</div>
                    <div className="text-xs text-purple-600">Auction ID: {selectedTransaction.auctionId || '--'}</div>
                  </div>

                  <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50">
                    <div className="text-xs font-semibold text-purple-700 mb-1">Order</div>
                    <div className="text-sm text-purple-900 break-all">Order ID: {selectedTransaction.orderId || '--'}</div>
                    <div className="text-sm text-purple-900 break-all">Payment ID: {selectedTransaction.paymentId || '--'}</div>
                    <div className="text-xs text-purple-600">Status: {selectedTransaction.status || 'pending'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50">
                    <div className="text-xs font-semibold text-purple-700 mb-1">Product</div>
                    <div className="text-base font-semibold text-purple-900">{selectedTransaction.productName || selectedTransaction.auctionName || '—'}</div>
                    <div className="text-xs text-purple-600">Time Slot: {selectedTransaction.productTimeSlot || selectedTransaction.timeSlot || '--'}</div>
                    {selectedTransaction.productValue !== undefined && selectedTransaction.productValue !== null && (
                      <div className="text-xs text-purple-600">Value: ₹{selectedTransaction.productValue.toLocaleString('en-IN')}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 space-y-1">
                    <div className="text-xs font-semibold text-purple-700 mb-1">Payment Method</div>
                    <div className="text-sm text-purple-900 flex items-center gap-2">
                      {detailMethodIcon}
                      <span>{paymentMethodLabel(selectedTransaction)}</span>
                    </div>
                    {selectedTransaction.paymentDetails?.card?.network && (
                      <div className="text-xs text-purple-600">Card Network: {selectedTransaction.paymentDetails.card.network}</div>
                    )}
                    {selectedTransaction.paymentDetails?.card?.last4 && (
                      <div className="text-xs text-purple-600">Last 4: •••• {selectedTransaction.paymentDetails.card.last4}</div>
                    )}
                    {selectedTransaction.paymentDetails?.vpa && (
                      <div className="text-xs text-purple-600">UPI: {selectedTransaction.paymentDetails.vpa}</div>
                    )}
                    {selectedTransaction.paymentDetails?.bank && (
                      <div className="text-xs text-purple-600">Bank: {selectedTransaction.paymentDetails.bank}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50" data-whatsnew-target="transactions">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-purple-700 hover:text-purple-800">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-6"
          >
            <Card className="overflow-hidden border-2 border-purple-200/70 shadow-xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white" data-whatsnew-target="transactions-hero">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Transaction History</div>
                    <div className="text-xl sm:text-2xl font-bold">{user.username}'s transactions</div>
                    <div className="text-xs opacity-90 mt-0.5">Entry fees, prize claims, and vouchers</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm bg-white/15 px-3 py-2 rounded-full border border-white/30">
                  <Sparkles className="w-4 h-4" />
                  Tap any transaction to view details
                </div>
              </CardContent>
            </Card>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-3 sm:mb-4"
        >
          <Card className={`border-2 shadow-xl overflow-hidden ${user.username?.toLowerCase() === 'dharsh650' ? 'bg-gradient-to-r from-purple-100 via-violet-50 to-white border-purple-200' : 'bg-white border-purple-100'}`}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-purple-600 font-semibold">{user.username}&apos;s wallet trail</div>
                  <div className="text-sm sm:text-base text-purple-900 font-semibold">Track entry fees, prize claims, and refunds in one place.</div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                <Clock className="w-4 h-4" />
                Live updates every 10s
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 sm:mb-6"
        >
          <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-2xl bg-white/90 shadow-2xl">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl opacity-15"
                style={{
                  background: 'radial-gradient(circle, #C4B5FD, #7C3AED)',
                  top: '-20%',
                  right: '-15%',
                }}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <CardHeader className="relative bg-gradient-to-r from-purple-50/90 via-violet-50/80 to-purple-50/90 border-b-2 border-purple-200/50 backdrop-blur-xl p-3 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-purple-900">Transaction History</h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-purple-600 mt-0.5">Entry fees, prize claims, and vouchers</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 p-3 sm:p-5">
              <Tabs defaultValue="entry" className="w-full">
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full grid-cols-3 mb-3 sm:mb-4 bg-purple-100/60 backdrop-blur-xl p-0.5 sm:p-1 rounded-xl sm:rounded-xl border border-purple-200/50 shadow-inner">
                    <TabsTrigger
                      value="entry"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      Entry Fee
                    </TabsTrigger>
                    <TabsTrigger
                      value="prize"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      Prize Claim
                    </TabsTrigger>
                    <TabsTrigger
                      value="voucher"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      Amazon Voucher
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="entry" className="mt-0">
                  {renderTransactionList(transactions.entryFees, 'No entry fee payments yet')}
                </TabsContent>
                <TabsContent value="prize" className="mt-0">
                  {renderTransactionList(transactions.prizeClaims, 'No prize claim payments yet')}
                </TabsContent>
                <TabsContent value="voucher" className="mt-0">
                  <div className="text-center py-6 sm:py-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                    Amazon voucher transactions are coming soon.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
