import { useState, useEffect } from 'react';
import { IndianRupee, Users, Search, RefreshCw, AlertCircle, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';
import { toast } from 'sonner';

interface AdminRefundManagementProps {
  adminUserId: string;
}

export function AdminRefundManagement({ adminUserId }: AdminRefundManagementProps) {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      // For now using transaction endpoint filtered by status or specialized refund endpoint if it exists
      const response = await fetch(`${API_BASE}/admin/refunds?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setRefunds(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to fetch refund records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [adminUserId]);

  const handleUpdateStatus = async (refundId: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/refunds/${refundId}?user_id=${adminUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Refund status updated to ${status}`);
        fetchRefunds();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = 
      r.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === filter;
  });

  const totalPendingAmount = refunds
    .filter(r => r.status === 'PENDING')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-purple-700" />
            </div>
            <span className="text-2xl font-bold text-purple-900">₹{totalPendingAmount.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-semibold text-purple-600">Pending Refunds</h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="w-6 h-6 text-amber-700" />
            </div>
            <span className="text-2xl font-bold text-amber-900">{refunds.filter(r => r.status === 'PENDING').length}</span>
          </div>
          <h3 className="text-sm font-semibold text-amber-600">Total Users Pending</h3>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <span className="text-2xl font-bold text-green-900">{refunds.filter(r => r.status === 'COMPLETED').length}</span>
          </div>
          <h3 className="text-sm font-semibold text-green-600">Refunds Processed</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, order ID or reason..."
                className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>
            <select 
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
              className="px-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
            >
              <option value="PENDING">Pending Only</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="ALL">All Status</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRefunds}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 border-2 border-purple-100"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-100">
                <th className="text-left py-4 px-4 text-purple-700 font-bold">User / Order ID</th>
                <th className="text-left py-4 px-4 text-purple-700 font-bold">Amount</th>
                <th className="text-left py-4 px-4 text-purple-700 font-bold">Reason</th>
                <th className="text-left py-4 px-4 text-purple-700 font-bold">Status</th>
                <th className="text-left py-4 px-4 text-purple-700 font-bold">Date</th>
                <th className="text-right py-4 px-4 text-purple-700 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse border-b border-purple-50">
                    <td colSpan={6} className="py-6 h-12 bg-purple-50/30"></td>
                  </tr>
                ))
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <AlertCircle className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                    No refund records found
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund, idx) => (
                  <tr key={idx} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-purple-900">{refund.username}</div>
                      <div className="text-[10px] font-mono text-purple-500">{refund.orderId}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-black text-purple-900">₹{refund.amount}</div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-sm text-gray-600 line-clamp-2">{refund.reason}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        refund.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {refund.status === 'PENDING' && (
                        <button 
                          onClick={() => handleUpdateStatus(refund.id, 'COMPLETED')}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Mark Processed
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
    </div>
  );
}
