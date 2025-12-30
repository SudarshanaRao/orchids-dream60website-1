import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
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
  TrendingUp,
  TrendingDown,
  BarChart3,
  Gift,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';
import { SupportCenterHeader } from './SupportCenterHeader';
import { LoadingProfile } from './LoadingProfile';

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
    prizeWorth?: number | null;
    paymentMethod?: string | null;
    paymentDetails?: Record<string, any> | null;
  }


export function TransactionHistoryPage({ user, onBack }: TransactionHistoryPageProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [transactions, setTransactions] = useState<{
    entryFees: TransactionItem[];
    prizeClaims: TransactionItem[];
    vouchers: TransactionItem[];
  }>({ entryFees: [], prizeClaims: [], vouchers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const DETAIL_STORAGE_KEY = 'd60_last_transaction_detail';

  const allTransactions = useMemo(
    () => [
      ...(transactions.entryFees || []),
      ...(transactions.prizeClaims || []),
      ...(transactions.vouchers || []),
    ],
    [transactions]
  );

  const stats = useMemo(() => {
    const entryAmount = (transactions.entryFees || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const prizeAmount = (transactions.prizeClaims || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const voucherAmount = (transactions.vouchers || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const prizeWorth = (transactions.prizeClaims || []).reduce((sum, t) => sum + (t.productValue || t.prizeWorth || 0), 0);
    const voucherWorth = prizeWorth + (transactions.vouchers || []).reduce((sum, t) => sum + (t.productValue || t.prizeWorth || 0), 0);
    const netValue = voucherWorth - (entryAmount + prizeAmount + voucherAmount);
    const upiCount = allTransactions.filter((t) => (t.paymentMethod || t.paymentDetails?.method) === 'upi' || Boolean(t.paymentDetails?.vpa)).length;

    return {
      totalCount: allTransactions.length,
      entryCount: transactions.entryFees?.length || 0,
      prizeCount: transactions.prizeClaims?.length || 0,
      voucherCount: transactions.vouchers?.length || 0,
      entryAmount,
      prizeAmount,
      voucherAmount,
      prizeWorth,
      voucherWorth,
      netValue,
      upiCount,
    };
  }, [allTransactions, transactions]);

  const formatDateTime = (value?: string | number | Date | null) => {
    if (!value) return '--';
    const date = new Date(value);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const paymentTypeLabel = (type?: string) => {
    if (type === 'PRIZE_CLAIM') return 'Prize Claim';
    if (type === 'ENTRY_FEE') return 'Entry Fee';
    return type || 'Payment';
  };

  const statusBadgeClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'paid' || normalized === 'captured' || normalized === 'success') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (normalized === 'failed') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-purple-100 text-purple-800 border-purple-200';
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
    if (!orderId) return;
    setDetailLoading(true);
    try {
      const queryString = buildQueryString({ userId: user.id });
      // Remove any leading/trailing slashes from orderId
      const cleanOrderId = String(orderId).trim();
      const response = await fetch(`${API_ENDPOINTS.user.transactionDetail}/${encodeURIComponent(cleanOrderId)}${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const result = await response.json();
      if (result?.data) {
        // Merge with existing data
        setSelectedTransaction(prev => {
          const base = prev && (prev.orderId === cleanOrderId || prev.paymentId === cleanOrderId || (prev as any)._id === cleanOrderId) ? prev : {};
          return {
            ...base,
            ...result.data
          };
        });
        
        // Update session storage
        sessionStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(result.data));
      } else {
        throw new Error('No data in response');
      }
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      // fallback to whatever we have if it's already selected
      if (!selectedTransaction) {
        toast.error('Could not load transaction details', {
          description: 'Try clicking the item again in the list.'
        });
      }
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
    
    // Explicitly fetch fresh details if it's a specific order
    if (orderId) {
      fetchTransactionDetail(orderId);
    }
    
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

  const downloadReceipt = (tx: TransactionItem) => {
    const doc = new jsPDF();
    const isFailed = tx.status?.toLowerCase() === 'failed';
    
    // Theme Colors
    const emerald = [16, 185, 129]; 
    const rose = [225, 29, 72];
    const darkViolet = [83, 49, 123];
    const darkSlate = [30, 41, 59];
    const gray = [107, 114, 128];
    
    const primaryColor = isFailed ? rose : (tx.paymentType === 'PRIZE_CLAIM' ? [217, 119, 6] : emerald);
    const headerBg = isFailed ? darkSlate : darkViolet;
    
    // Header section with brand color
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60 INDIA', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM AUCTION PLATFORM', 20, 38);

    doc.setFontSize(18);
    doc.text(isFailed ? 'FAILURE REPORT' : 'OFFICIAL RECEIPT', 140, 30);
    
    // Receipt info line
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 45, 210, 15, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const getScenarioLabel = () => {
      if (isFailed) {
        if (tx.paymentType === 'PRIZE_CLAIM') return 'PRIZE CLAIM FAILURE';
        return 'ENTRY FAILURE';
      }
      if (tx.paymentType === 'PRIZE_CLAIM') return 'PRIZE CLAIM SUCCESS';
      return 'ENTRY SUCCESS';
    };
    
    doc.text(`Scenario: ${getScenarioLabel()}`, 20, 55);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    const displayDate = formatDateTime(tx.paidAt || tx.createdAt || new Date());
    doc.text(`Date: ${displayDate}`, 90, 55);
    doc.text(`ID: ${tx.orderId || tx.paymentId || 'TXN-' + Math.floor(Date.now() / 1000)}`, 150, 55);

    // Main content
    let curY = 80;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(isFailed ? 'Transaction Attempt Details' : 'Transaction Summary', 20, 72);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 75, 190, 75);

    const drawDetailRow = (label: string, value: string, isImportant = false) => {
      if (isImportant && !isFailed) {
        doc.setFillColor(243, 244, 246);
        doc.rect(20, curY - 8, 170, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(label, 25, curY);
      
      doc.setTextColor(31, 41, 55);
      if (isImportant) doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(value || 'N/A', 100, curY);
      
      doc.setDrawColor(243, 244, 246);
      doc.line(20, curY + 4, 190, curY + 4);
      curY += 12;
    };

    drawDetailRow('Service Type', paymentTypeLabel(tx.paymentType));
    drawDetailRow('Customer Name', user.username);
    drawDetailRow('Product Name', tx.auctionName || tx.productName || 'Auction Participation');
    if (tx.productValue || tx.prizeWorth) {
      drawDetailRow('Prize Worth', `INR ${(tx.productValue || tx.prizeWorth)?.toLocaleString('en-IN')}`);
    }
    drawDetailRow('Auction ID', tx.auctionId || 'N/A');
    if (tx.timeSlot || tx.productTimeSlot) {
      drawDetailRow('Auction Time Slot', tx.timeSlot || tx.productTimeSlot || '--');
    }
    drawDetailRow('Payment Method', paymentMethodLabel(tx));
    drawDetailRow('Order ID', tx.orderId || '--');
    drawDetailRow('Payment ID', tx.paymentId || '--');
    curY += 5;
    
    if (isFailed) {
      drawDetailRow('STATUS', tx.status?.toUpperCase() || 'FAILED', true);
    } else {
      drawDetailRow('TOTAL AMOUNT PAID', `INR ${tx.amount.toLocaleString('en-IN')}`, true);
    }

    // Authenticity Stamp
    curY += 30;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(140, curY - 15, 45, 20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(isFailed ? 'FAILED' : 'VERIFIED', isFailed ? 155 : 152, curY - 5);
    doc.setFontSize(7);
    doc.text(isFailed ? 'UNSUCCESSFUL ATTEMPT' : 'OFFICIALLY SIGNED', isFailed ? 142 : 147, curY);

    // Footer
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFontSize(8);
    doc.text('DREAM60 INDIA OFFICIAL | support@dream60.com | www.dream60.com', 105, 285, { align: 'center' });
    doc.text('This is a computer-generated document and does not require a physical signature.', 105, 290, { align: 'center' });
    
    doc.save(`Dream60_${tx.paymentType}_Receipt_${Date.now()}.pdf`);
  };

  const renderTransactionList = (items: TransactionItem[], emptyLabel: string) => {
    if (isLoading) {
      return <LoadingProfile message="Loading Transactions" subMessage="Updating History" />;
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
              className="relative overflow-hidden border-2 border-purple-200/60 bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition"
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
                  <Badge className={`w-fit border ${statusBadgeClass(item.status)}`}>
                  {item.status || 'pending'}
                </Badge>
              </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-purple-700">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(item.paidAt || item.createdAt)}</span>
                    </div>

                  {(item.productValue ?? item.prizeWorth) && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="truncate">Prize worth: ₹{(item.productValue ?? item.prizeWorth)?.toLocaleString('en-IN')}</span>
                    </div>
                  )}

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
          <SupportCenterHeader
            title="Transaction Details"
            icon={<IndianRupee className="w-6 h-6" />}
            onBack={closeDetails}
            backLabel="Back to Transactions"
          />
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="flex items-center justify-end mb-4 sm:mb-6">
              {detailLoading && <div className="text-xs text-purple-600 animate-pulse">Refreshing...</div>}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-2 border-purple-200/70 bg-white/90 backdrop-blur-xl shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50/90 via-violet-50/80 to-purple-50/90 border-b-2 border-purple-200/60 p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-semibold text-purple-700">{paymentTypeLabel(selectedTransaction.paymentType)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                    ₹{selectedTransaction.amount?.toLocaleString('en-IN') || 0}
                  </div>
                    {selectedTransaction.productValue !== undefined && selectedTransaction.productValue !== null && (
                      <div className="text-xs text-purple-600">Prize worth: ₹{selectedTransaction.productValue.toLocaleString('en-IN')}</div>
                    )}
                    {selectedTransaction.paymentType === 'PRIZE_CLAIM' &&
                      selectedTransaction.productValue !== undefined &&
                      selectedTransaction.productValue !== null && (
                        <div
                          className={`text-xs font-semibold ${(selectedTransaction.productValue - (selectedTransaction.amount || 0)) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                        >
                          Profit (before entry fee): {(selectedTransaction.productValue - (selectedTransaction.amount || 0)) >= 0 ? '+' : '-'}₹{Math.abs(selectedTransaction.productValue - (selectedTransaction.amount || 0)).toLocaleString('en-IN')}
                        </div>
                      )}
                    <div className="text-xs text-purple-600 mt-1">Paid on {formatDateTime(selectedTransaction.paidAt || selectedTransaction.createdAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-auto min-w-[160px]">
                    <Badge className={`border ${statusBadgeClass(selectedTransaction.status)}`}>
                    {selectedTransaction.status || 'pending'}
                  </Badge>
                  <div className="text-[11px] text-purple-700 flex items-center gap-2">
                    {detailMethodIcon}
                    <span className="truncate">{paymentMethodLabel(selectedTransaction)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-purple-100 bg-purple-50/60 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <Receipt className="w-4 h-4" />
                      <span>Payment Summary</span>
                    </div>
                    <div className="text-sm text-purple-900 font-semibold">{paymentTypeLabel(selectedTransaction.paymentType)}</div>
                    <div className="text-xs text-purple-600">Paid at {formatDateTime(selectedTransaction.paidAt || selectedTransaction.createdAt)}</div>
                      <div className="text-xs text-purple-600">
                        Status:{' '}
                        <span className={`font-semibold ${String(selectedTransaction.status || '').toLowerCase() === 'paid' ? 'text-emerald-700' : 'text-purple-700'}`}>
                          {selectedTransaction.status || 'pending'}
                        </span>
                      </div>
                  </CardContent>
                </Card>

                <Card className="border border-purple-100 bg-purple-50/60 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <CreditCard className="w-4 h-4" />
                      <span>Payment Method & UPI</span>
                    </div>
                    <div className="text-sm text-purple-900 flex items-center gap-2">
                      {detailMethodIcon}
                      <span className="truncate">{paymentMethodLabel(selectedTransaction)}</span>
                    </div>
                    {selectedTransaction.paymentDetails?.upiApp && (
                      <div className="text-xs text-purple-600">App: {selectedTransaction.paymentDetails.upiApp}</div>
                    )}
                    {selectedTransaction.paymentDetails?.wallet && (
                      <div className="text-xs text-purple-600">Wallet: {selectedTransaction.paymentDetails.wallet}</div>
                    )}
                    {selectedTransaction.paymentDetails?.vpa && (
                      <div className="text-xs text-purple-600">UPI ID: {selectedTransaction.paymentDetails.vpa}</div>
                    )}
                    {selectedTransaction.paymentDetails?.bank && (
                      <div className="text-xs text-purple-600">Bank: {selectedTransaction.paymentDetails.bank}</div>
                    )}
                    {selectedTransaction.paymentDetails?.card?.network && (
                      <div className="text-xs text-purple-600">Card Network: {selectedTransaction.paymentDetails.card.network}</div>
                    )}
                    {selectedTransaction.paymentDetails?.card?.last4 && (
                      <div className="text-xs text-purple-600">Last 4: •••• {selectedTransaction.paymentDetails.card.last4}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-purple-100 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <Target className="w-4 h-4" />
                      <span>Auction / Product</span>
                    </div>
                    <div className="text-base font-semibold text-purple-900">{selectedTransaction.auctionName || selectedTransaction.productName || 'Auction'}</div>
                    <div className="text-xs text-purple-600">Time Slot: {selectedTransaction.timeSlot || selectedTransaction.productTimeSlot || '--'}</div>
                    <div className="text-xs text-purple-600">Auction ID: {selectedTransaction.auctionId || '--'}</div>
                    {selectedTransaction.productValue !== undefined && selectedTransaction.productValue !== null && (
                      <div className="text-xs text-purple-600">Value: ₹{selectedTransaction.productValue.toLocaleString('en-IN')}</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-100 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <Sparkles className="w-4 h-4" />
                      <span>Order & Reference</span>
                    </div>
                    <div className="text-sm text-purple-900 break-all">Order ID: {selectedTransaction.orderId || '--'}</div>
                    <div className="text-sm text-purple-900 break-all">Payment ID: {selectedTransaction.paymentId || '--'}</div>
                    <div className="text-xs text-purple-600">Currency: {selectedTransaction.currency || 'INR'}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => downloadReceipt(selectedTransaction)}
                  className="w-full sm:w-auto h-12 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold rounded-xl px-8 shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Official Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 relative" data-whatsnew-target="transactions">
        <SupportCenterHeader
          title="Transaction History"
          icon={<IndianRupee className="w-6 h-6" />}
          onBack={onBack}
          backLabel="Back to Home"
        />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-6"
          >
              <Card className="relative overflow-hidden border-2 border-purple-200/70 shadow-xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white" data-whatsnew-target="transactions-hero">
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
          <Card className={`relative overflow-hidden border-2 shadow-xl ${user.username?.toLowerCase() === 'dharsh650' ? 'bg-gradient-to-r from-purple-100 via-violet-50 to-white border-purple-200' : 'bg-white border-purple-100'}`}>
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
              className="mb-3 sm:mb-4"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Card className="relative overflow-hidden border-2 border-purple-200/70 bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <BarChart3 className="w-4 h-4" />
                      <span>Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{stats.totalCount}</div>
                    <div className="text-[11px] text-purple-600">Entry {stats.entryCount} • Prize {stats.prizeCount}</div>
                  </CardContent>
                </Card>
                  <Card className="relative overflow-hidden border-2 border-purple-200/70 bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                        <IndianRupee className="w-4 h-4" />
                        <span>Entry Fee Paid</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">₹{stats.entryAmount.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-purple-600">{stats.entryCount} payments</div>
                    </CardContent>
                  </Card>
                  <Card className="relative overflow-hidden border-2 border-purple-200/70 bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                        <Target className="w-4 h-4" />
                        <span>Prize Claim Paid</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">₹{stats.prizeAmount.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-purple-600">{stats.prizeCount} payments</div>
                    </CardContent>
                  </Card>
                <Card className="border-2 border-emerald-200/70 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <Gift className="w-4 h-4" />
                      <span>Voucher Worth</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800">₹{stats.voucherWorth.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-emerald-700">{stats.prizeCount} vouchers</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${stats.netValue >= 0 ? 'border-emerald-200/70 bg-emerald-50/60' : 'border-red-200/70 bg-red-50/60'} shadow-sm`}>
                  <CardContent className="p-4 space-y-1">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${stats.netValue >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {stats.netValue >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>Net Value</span>
                    </div>
                    <div className={`text-2xl font-bold ${stats.netValue >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      {stats.netValue >= 0 ? '+' : '-'}₹{Math.abs(stats.netValue).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-purple-700">UPI uses: {stats.upiCount}</div>
                  </CardContent>
                </Card>
              </div>

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
