import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Filter, 
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Phone,
  Trophy,
  Target,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  FileText,
  Zap,
  UserCheck,
  UserX,
  Award,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

interface SmsTemplate {
  key: string;
  id: string;
  name: string;
  template: string;
  variables: string[];
}

interface User {
  user_id: string;
  username: string;
  email?: string;
  mobile: string;
  userCode?: string;
  totalAuctions?: number;
  totalWins?: number;
  finalRound?: number;
  isWinner?: boolean;
  eliminatedInRound?: number;
  prizeAmountWon?: number;
}

interface Auction {
  hourlyAuctionId: string;
  hourlyAuctionCode: string;
  auctionName: string;
  TimeSlot: string;
  Status: string;
  auctionDate: string;
  totalParticipants: number;
  currentRound: number;
  roundCount: number;
}

interface FilterStats {
  all: number;
  active_players: number;
  winners: number;
  never_played: number;
  claim_pending: number;
}

interface AdminSmsManagementProps {
  adminUserId: string;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Users, description: 'All registered users with mobile numbers' },
  { value: 'active_players', label: 'Active Players', icon: Play, description: 'Users who have participated in at least one auction' },
  { value: 'top_players', label: 'Top Players', icon: Trophy, description: 'Users sorted by most auctions played' },
  { value: 'winners', label: 'Winners', icon: Award, description: 'Users who have won at least one auction' },
  { value: 'never_played', label: 'Never Played', icon: UserX, description: 'Registered users who never participated' },
  { value: 'claim_pending', label: 'Claim Pending', icon: Clock, description: 'Winners with pending prize claims' },
  { value: 'auction_participants', label: 'Auction Participants', icon: Target, description: 'All participants of a specific auction' },
  { value: 'round1_players', label: 'Round 1 Players', icon: Zap, description: 'Users who played Round 1 in an auction' },
  { value: 'advanced_round2', label: 'Advanced to Round 2+', icon: UserCheck, description: 'Users who advanced beyond Round 1' },
  { value: 'eliminated_current', label: 'Eliminated Users', icon: XCircle, description: 'Users eliminated in current auction' },
  { value: 'specific_round', label: 'Specific Round', icon: Target, description: 'Users who reached a specific round' },
];

export function AdminSmsManagement({ adminUserId }: AdminSmsManagementProps) {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filterStats, setFilterStats] = useState<FilterStats | null>(null);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const API_BASE = 'https://dev-api.dream60.com';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedFilter, selectedAuction, selectedRound, searchTerm]);

  const loadInitialData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadTemplates(),
      loadAuctions(),
      loadFilterStats(),
      loadBalance(),
    ]);
    setIsLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/templates?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAuctions = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/auctions?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setAuctions(data.data);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  const loadFilterStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/filter-stats?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setFilterStats(data.data);
      }
    } catch (error) {
      console.error('Error loading filter stats:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/balance?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setSmsBalance(data.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadUsers = async () => {
    try {
      let url = `${API_BASE}/admin/sms/users?user_id=${adminUserId}&filter=${selectedFilter}&limit=100`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (['auction_participants', 'round1_players', 'advanced_round2', 'eliminated_current', 'specific_round'].includes(selectedFilter)) {
        if (!selectedAuction) {
          setUsers([]);
          return;
        }
        url += `&auctionId=${selectedAuction}`;
      }
      
      if (selectedFilter === 'specific_round' && selectedRound) {
        url += `&round=${selectedRound}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setSelectedUsers(new Set());
        setSelectAll(false);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.user_id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const getPreviewMessage = () => {
    if (selectedTemplate && selectedTemplate !== 'CUSTOM') {
      const template = templates.find(t => t.key === selectedTemplate);
      if (template) {
        let message = template.template;
        for (const [key, value] of Object.entries(templateVariables)) {
          message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
        }
        return message;
      }
    }
    return customMessage;
  };

  const handleSendSms = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const message = getPreviewMessage();
    if (!message || message.trim().length === 0) {
      toast.error('Please enter a message or select a template');
      return;
    }

    setIsSending(true);
    try {
      const selectedUsersList = users.filter(u => selectedUsers.has(u.user_id));
      const mobileNumbers = selectedUsersList.map(u => u.mobile).filter(Boolean);

      const response = await fetch(`${API_BASE}/admin/sms/send?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumbers,
          message: selectedTemplate === 'CUSTOM' || !selectedTemplate ? customMessage : undefined,
          templateKey: selectedTemplate && selectedTemplate !== 'CUSTOM' ? selectedTemplate : undefined,
          templateVariables: selectedTemplate && selectedTemplate !== 'CUSTOM' ? templateVariables : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`SMS sent to ${mobileNumbers.length} recipients`);
        setSelectedUsers(new Set());
        setSelectAll(false);
        loadBalance();
      } else {
        toast.error(data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulk = async () => {
    const message = getPreviewMessage();
    if (!message || message.trim().length === 0) {
      toast.error('Please enter a message or select a template');
      return;
    }

    if (!['all', 'active_players', 'winners', 'never_played'].includes(selectedFilter)) {
      toast.error('Bulk send is only available for general filters');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/admin/sms/send-bulk?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: selectedFilter,
          message: selectedTemplate === 'CUSTOM' || !selectedTemplate ? customMessage : undefined,
          templateKey: selectedTemplate && selectedTemplate !== 'CUSTOM' ? selectedTemplate : undefined,
          templateVariables: selectedTemplate && selectedTemplate !== 'CUSTOM' ? templateVariables : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Bulk SMS sent to ${data.data.recipientCount} recipients`);
        loadBalance();
      } else {
        toast.error(data.message || 'Failed to send bulk SMS');
      }
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      toast.error('Failed to send bulk SMS');
    } finally {
      setIsSending(false);
    }
  };

  const requiresAuction = ['auction_participants', 'round1_players', 'advanced_round2', 'eliminated_current', 'specific_round'].includes(selectedFilter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">SMS Balance</p>
              <p className="text-2xl font-bold">{smsBalance !== null ? smsBalance.toFixed(2) : '---'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Total Users</p>
              <p className="text-2xl font-bold">{filterStats?.all || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Winners</p>
              <p className="text-2xl font-bold">{filterStats?.winners || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Selected</p>
              <p className="text-2xl font-bold">{selectedUsers.size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">User Filters</h3>
              </div>
              {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            {showFilters && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {FILTER_OPTIONS.map((filter) => {
                    const Icon = filter.icon;
                    const count = filterStats?.[filter.value as keyof FilterStats];
                    return (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setSelectedFilter(filter.value);
                          if (!requiresAuction) {
                            setSelectedAuction('');
                          }
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedFilter === filter.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${selectedFilter === filter.value ? 'text-purple-600' : 'text-gray-500'}`} />
                          <span className={`text-sm font-medium ${selectedFilter === filter.value ? 'text-purple-700' : 'text-gray-700'}`}>
                            {filter.label}
                          </span>
                        </div>
                        {count !== undefined && (
                          <span className="text-xs text-gray-500">{count} users</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {requiresAuction && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Auction</label>
                      <select
                        value={selectedAuction}
                        onChange={(e) => setSelectedAuction(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">-- Select Auction --</option>
                        {auctions.map((auction) => (
                          <option key={auction.hourlyAuctionId} value={auction.hourlyAuctionId}>
                            {auction.auctionName} - {auction.TimeSlot} ({auction.Status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedFilter === 'specific_round' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Round</label>
                        <select
                          value={selectedRound}
                          onChange={(e) => setSelectedRound(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">-- Select Round --</option>
                          {[1, 2, 3, 4, 5].map((round) => (
                            <option key={round} value={round}>Round {round}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, mobile, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Users ({users.length})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={loadUsers}
                  className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No users found for this filter</p>
                  {requiresAuction && !selectedAuction && (
                    <p className="text-sm mt-1">Please select an auction first</p>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr 
                        key={user.user_id}
                        onClick={() => handleSelectUser(user.user_id)}
                        className={`cursor-pointer transition-colors ${
                          selectedUsers.has(user.user_id) ? 'bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.user_id)}
                            onChange={() => handleSelectUser(user.user_id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.userCode || user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span className="text-sm">{user.mobile}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            {user.totalAuctions !== undefined && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {user.totalAuctions} played
                              </span>
                            )}
                            {user.totalWins !== undefined && user.totalWins > 0 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                {user.totalWins} wins
                              </span>
                            )}
                            {user.finalRound !== undefined && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                Round {user.finalRound}
                              </span>
                            )}
                            {user.isWinner && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                Winner
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Compose SMS</h3>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setTemplateVariables({});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Select Template --</option>
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>{template.name}</option>
                  ))}
                  <option value="CUSTOM">Custom Message</option>
                </select>
              </div>

              {selectedTemplate && selectedTemplate !== 'CUSTOM' && (
                <div className="space-y-3">
                  {templates.find(t => t.key === selectedTemplate)?.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {variable.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="text"
                        value={templateVariables[variable] || ''}
                        onChange={(e) => setTemplateVariables({ ...templateVariables, [variable]: e.target.value })}
                        placeholder={`Enter ${variable}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(selectedTemplate === 'CUSTOM' || !selectedTemplate) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your SMS message here..."
                    rows={4}
                    maxLength={160}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{customMessage.length}/160 characters</p>
                </div>
              )}

              {(selectedTemplate || customMessage) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{getPreviewMessage()}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleSendSms}
                  disabled={isSending || selectedUsers.size === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Send to Selected ({selectedUsers.size})
                </button>

                {['all', 'active_players', 'winners', 'never_played'].includes(selectedFilter) && (
                  <button
                    onClick={handleSendBulk}
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    Bulk Send to All {FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label}
                  </button>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">SMS Credits</p>
                  <p>Each SMS uses credits from your SmsCountry balance. Bulk messages are sent in batches of 500.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="font-medium text-gray-800 mb-3">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Players</span>
                <span className="font-medium">{filterStats?.active_players || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Never Played</span>
                <span className="font-medium">{filterStats?.never_played || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Claims</span>
                <span className="font-medium text-amber-600">{filterStats?.claim_pending || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
