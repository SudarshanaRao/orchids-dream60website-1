import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Coins, IndianRupee, Clock, Target, Sparkles } from 'lucide-react';
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
}

export function TransactionHistoryPage({ user, onBack }: TransactionHistoryPageProps) {
  const [transactions, setTransactions] = useState<{
    entryFees: TransactionItem[];
    prizeClaims: TransactionItem[];
    vouchers: TransactionItem[];
  }>({ entryFees: [], prizeClaims: [], vouchers: [] });
  const [isLoading, setIsLoading] = useState(true);

  const formatDateTime = (value?: string | number | Date) => {
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
      <div className="space-y-2 sm:space-y-3">
        {items.map((item, idx) => (
          <Card key={`${item.orderId || item.paymentId || idx}`} className="border-2 border-purple-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.paymentType === 'PRIZE_CLAIM' ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-purple-500 to-violet-600'} text-white font-bold`}>
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-900">₹{item.amount?.toLocaleString('en-IN') || 0}</div>
                    <div className="text-[11px] text-purple-600">{item.paymentType === 'PRIZE_CLAIM' ? 'Prize claim payment' : 'Entry fee payment'}</div>
                  </div>
                </div>
                <Badge className={`w-fit ${item.paymentType === 'PRIZE_CLAIM' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                  {item.status || 'pending'}
                </Badge>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-purple-700">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
                {item.auctionId && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="truncate">{item.auctionName || 'Auction'} {item.timeSlot ? `(${item.timeSlot})` : ''}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-purple-700 hover:text-purple-800">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-purple-800 font-semibold">
            <Coins className="w-4 h-4" />
            {user.username}'s Transactions
          </div>
        </div>

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
