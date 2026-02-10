import { useState, useEffect, useMemo } from 'react';
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
    Plus,
    Trash2,
    Calendar,
    BarChart3,
    Tag,
    Eye,
    X,
  } from 'lucide-react';

import { toast } from 'sonner';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';

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

interface RestTemplate {
  TemplateId: string;
  TemplateName: string;
  Message: string;
  CreatedDate: string;
}

interface SenderId {
  SenderId: string;
  Status: string;
}

interface SmsReport {
  MessageId: string;
  Number: string;
  Text: string;
  SenderId: string;
  Status: string;
  DeliveryDate: string;
  SubmittedDate: string;
}

interface StarVariable {
  position: number;
  index: number;
  label: string;
  isUsername: boolean;
  value: string;
}

function extractStarVariables(template: string): StarVariable[] {
  const variables: StarVariable[] = [];
  let position = 0;
  let dearFound = false;

  const regex = /\*/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    position++;
    const beforeStar = template.substring(0, match.index).toLowerCase();
    const isAfterDear = !dearFound && beforeStar.trimEnd().endsWith('dear');

    variables.push({
      position,
      index: match.index,
      label: isAfterDear ? 'Username (auto-filled)' : `Variable ${position}`,
      isUsername: isAfterDear,
      value: '',
    });

    if (isAfterDear) dearFound = true;
  }

  return variables;
}

function renderSmsWithVariables(template: string, variables: StarVariable[], username: string): string {
  let result = '';
  let lastIndex = 0;
  const sorted = [...variables].sort((a, b) => a.index - b.index);

  for (const v of sorted) {
    result += template.substring(lastIndex, v.index);
    result += v.isUsername ? username : v.value;
    lastIndex = v.index + 1; // skip the *
  }
  result += template.substring(lastIndex);
  return result;
}

export function AdminSmsManagement({ adminUserId }: AdminSmsManagementProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'reports' | 'senderids'>('compose');
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [restTemplates, setRestTemplates] = useState<RestTemplate[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [reports, setReports] = useState<SmsReport[]>([]);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  const [reportDateRange, setReportDateRange] = useState({ 
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  
  const [selectedSenderId, setSelectedSenderId] = useState('');
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
    const [selectAllPages, setSelectAllPages] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [showStarVariablesModal, setShowStarVariablesModal] = useState(false);
  const [starVariables, setStarVariables] = useState<StarVariable[]>([]);
  const [pendingSendType, setPendingSendType] = useState<'selected' | 'bulk' | null>(null);

  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLimit] = useState(20);
  const [totalReports, setTotalReports] = useState(0);
  
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(50);
  const [totalUsers, setTotalUsers] = useState(0);

  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesLimit] = useState(10);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedFilter, selectedAuction, selectedRound, searchTerm, usersPage]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [reportsPage]);

    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadTemplates(),
        loadRestTemplates(),
        loadSenderIds(),
        loadAuctions(),
        loadFilterStats(),
        loadBalance(),
        loadUsers(),
      ]);
      setIsLoading(false);
    };

  const loadRestTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/rest/templates?user_id=${adminUserId}`);
      const data = await response.json();
    if (data.success) {
      // Filter out duplicates by TemplateId
      const uniqueTemplates = (data.data || []).reduce((acc: RestTemplate[], current: RestTemplate) => {
        const x = acc.find(item => item.TemplateId === current.TemplateId);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      setRestTemplates(uniqueTemplates);
    }
    } catch (error) {
      console.error('Error loading REST templates:', error);
    }
  };

  const loadSenderIds = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/rest/sender-ids?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setSenderIds(data.data || []);
      }
    } catch (error) {
      console.error('Error loading Sender IDs:', error);
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/admin/sms/rest/reports?user_id=${adminUserId}&fromDate=${reportDateRange.from}&toDate=${reportDateRange.to}&page=${reportsPage}&limit=${reportsLimit}`
      );
      const data = await response.json();
      if (data.success) {
        // Ensure reports are an array and unique
        const uniqueReports = (data.data || []).reduce((acc: SmsReport[], current: SmsReport) => {
          const x = acc.find(item => item.MessageId === current.MessageId);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);
        setReports(uniqueReports);
        // If API doesn't return total count, we'll handle it via the presence of data
        if (data.data?.length === reportsLimit) {
          // Potentially more pages
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load delivery reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateMessage) {
      toast.error('Please enter template name and message');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const response = await fetch(`${API_BASE}/admin/sms/rest/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: adminUserId,
          templateName: newTemplateName,
          message: newTemplateMessage
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Template created successfully');
        setNewTemplateName('');
        setNewTemplateMessage('');
        loadRestTemplates();
      } else {
        toast.error(data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/sms/rest/templates/${templateId}?user_id=${adminUserId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Template deleted successfully');
        loadRestTemplates();
      } else {
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sms/templates?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
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
        setAuctions(data.data || []);
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
      let url = `${API_BASE}/admin/sms/users?user_id=${adminUserId}&filter=${selectedFilter}&page=${usersPage}&limit=${usersLimit}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (['auction_participants', 'round1_players', 'advanced_round2', 'eliminated_current', 'specific_round'].includes(selectedFilter)) {
        if (!selectedAuction) {
          setUsers([]);
          setTotalUsers(0);
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
          setTotalUsers(data.meta?.total || data.data.length);
          if (!selectAllPages) {
            setSelectedUsers(new Set());
            setSelectAll(false);
          }
        }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

    const handleSelectAll = async () => {
      if (selectAllPages) {
        // Deselect all
        setSelectedUsers(new Set());
        setSelectAll(false);
        setSelectAllPages(false);
      } else {
        // Fetch ALL user IDs across all pages
        try {
          let url = `${API_BASE}/admin/sms/users?user_id=${adminUserId}&filter=${selectedFilter}&page=1&limit=10000`;
          if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
          if (['auction_participants', 'round1_players', 'advanced_round2', 'eliminated_current', 'specific_round'].includes(selectedFilter) && selectedAuction) {
            url += `&auctionId=${selectedAuction}`;
          }
          if (selectedFilter === 'specific_round' && selectedRound) {
            url += `&round=${selectedRound}`;
          }
          const response = await fetch(url);
          const data = await response.json();
          if (data.success) {
            const allUserIds = new Set(data.data.map((u: User) => u.user_id));
            setSelectedUsers(allUserIds);
            setSelectAll(true);
            setSelectAllPages(true);
          }
        } catch (error) {
          console.error('Error fetching all users:', error);
          // Fallback: select current page only
          setSelectedUsers(new Set(users.map(u => u.user_id)));
          setSelectAll(true);
        }
      }
    };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      setSelectAllPages(false);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const getPreviewMessage = () => {
    if (selectedTemplate && selectedTemplate !== 'CUSTOM') {
      if (selectedTemplate.startsWith('rest_')) {
        const templateId = selectedTemplate.replace('rest_', '');
        const template = restTemplates.find(t => String(t.TemplateId) === templateId);
        return template?.Message || '';
      }
      
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

  const getRawTemplateMessage = (): string => {
    if (selectedTemplate && selectedTemplate.startsWith('rest_')) {
      const templateId = selectedTemplate.replace('rest_', '');
      const template = restTemplates.find(t => String(t.TemplateId) === templateId);
      return template?.Message || '';
    }
    if (selectedTemplate && selectedTemplate !== 'CUSTOM') {
      const template = templates.find(t => t.key === selectedTemplate);
      return template?.template || '';
    }
    return customMessage;
  };

  const checkStarsAndSend = (sendType: 'selected' | 'bulk') => {
    const rawMessage = getRawTemplateMessage();
    if (!rawMessage || rawMessage.trim().length === 0) {
      toast.error('Please enter a message or select a template');
      return;
    }

    if (sendType === 'selected' && selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const vars = extractStarVariables(rawMessage);
    const nonUsernameVars = vars.filter(v => !v.isUsername);

    if (nonUsernameVars.length > 0) {
      setStarVariables(vars.map(v => ({ ...v, value: '' })));
      setPendingSendType(sendType);
      setShowStarVariablesModal(true);
      return;
    }

    // No non-username stars, or no stars at all — send directly
    if (sendType === 'selected') {
      executeSendSms(rawMessage, vars);
    } else {
      executeSendBulk(rawMessage, vars);
    }
  };

  const handleSendSms = () => checkStarsAndSend('selected');

  const handleSendBulk = () => checkStarsAndSend('bulk');

  const handleConfirmStarVariables = () => {
    const missing = starVariables.filter(v => !v.isUsername && !v.value.trim());
    if (missing.length > 0) {
      toast.error('Please fill in all variables before sending');
      return;
    }
    const rawMessage = getRawTemplateMessage();
    setShowStarVariablesModal(false);
    if (pendingSendType === 'selected') {
      executeSendSms(rawMessage, starVariables);
    } else {
      executeSendBulk(rawMessage, starVariables);
    }
    setPendingSendType(null);
  };

  const executeSendSms = async (rawMessage: string, vars: StarVariable[]) => {
    setIsSending(true);
    try {
      const selectedUsersList = users.filter(u => selectedUsers.has(u.user_id));
      const hasStars = vars.length > 0;

      if (hasStars) {
        // Send personalized messages per user
        let totalSent = 0;
        let totalFailed = 0;
        for (const user of selectedUsersList) {
          if (!user.mobile) continue;
          const personalizedMessage = renderSmsWithVariables(rawMessage, vars, user.username);
          try {
            const response = await fetch(`${API_BASE}/admin/sms/send?user_id=${adminUserId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mobileNumbers: [user.mobile],
                senderId: selectedSenderId || undefined,
                message: personalizedMessage,
              }),
            });
            const data = await response.json();
            if (data.success) totalSent++; else totalFailed++;
          } catch {
            totalFailed++;
          }
        }
        toast.success(`SMS sent: ${totalSent} delivered, ${totalFailed} failed`);
      } else {
        const mobileNumbers = selectedUsersList.map(u => u.mobile).filter(Boolean);
        const response = await fetch(`${API_BASE}/admin/sms/send?user_id=${adminUserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobileNumbers,
            senderId: selectedSenderId || undefined,
            message: rawMessage,
            templateKey: selectedTemplate && selectedTemplate !== 'CUSTOM' ? selectedTemplate : undefined,
            templateVariables: selectedTemplate && selectedTemplate !== 'CUSTOM' ? templateVariables : undefined,
          }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`SMS sent to ${mobileNumbers.length} recipients`);
        } else {
          toast.error(data.message || 'Failed to send SMS');
        }
      }

      setSelectedUsers(new Set());
      setSelectAll(false);
      loadBalance();
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

    const executeSendBulk = async (rawMessage: string, vars: StarVariable[]) => {
      if (!['all', 'active_players', 'winners', 'never_played'].includes(selectedFilter)) {
        toast.error('Bulk send is only available for general filters');
        return;
      }

      // Fill non-username star variables but keep * for username — backend will personalize per user
      const finalMessage = vars.length > 0
        ? (() => {
            let result = '';
            let lastIndex = 0;
            const sorted = [...vars].sort((a, b) => a.index - b.index);
            for (const v of sorted) {
              result += rawMessage.substring(lastIndex, v.index);
              result += v.isUsername ? '*' : v.value;
              lastIndex = v.index + 1;
            }
            result += rawMessage.substring(lastIndex);
            return result;
          })()
        : undefined;

      setIsSending(true);
      try {
        const response = await fetch(`${API_BASE}/admin/sms/send-bulk?user_id=${adminUserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter: selectedFilter,
            senderId: selectedSenderId || undefined,
            message: finalMessage || (selectedTemplate === 'CUSTOM' || !selectedTemplate ? customMessage : undefined),
            templateKey: !finalMessage && selectedTemplate && selectedTemplate !== 'CUSTOM' ? selectedTemplate : undefined,
            templateVariables: !finalMessage && selectedTemplate && selectedTemplate !== 'CUSTOM' ? templateVariables : undefined,
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

  const Pagination = ({ 
    currentPage, 
    totalItems, 
    pageSize, 
    onPageChange,
    loading = false
  }: { 
    currentPage: number, 
    totalItems: number, 
    pageSize: number, 
    onPageChange: (page: number) => void,
    loading?: boolean
  }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1 && totalItems > 0) return null;
    if (totalItems === 0) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              
              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronUp className="w-5 h-5 rotate-90" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderTabs = () => (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      <button
        onClick={() => setActiveTab('compose')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
          activeTab === 'compose'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        Compose
      </button>
      <button
        onClick={() => setActiveTab('templates')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
          activeTab === 'templates'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <FileText className="w-4 h-4" />
        Templates
      </button>
      <button
        onClick={() => setActiveTab('reports')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
          activeTab === 'reports'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Reports
      </button>
      <button
        onClick={() => setActiveTab('senderids')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
          activeTab === 'senderids'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Tag className="w-4 h-4" />
        Sender IDs
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">SMS Management</h2>
        <div className="flex items-center gap-3">
          {smsBalance !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg border border-purple-200">
              <Wallet className="w-4 h-4" />
              <span className="font-semibold">{smsBalance.toFixed(2)} Credits</span>
            </div>
          )}
          <button
            onClick={loadInitialData}
            className="p-2 text-gray-500 hover:text-purple-600 bg-white border border-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {renderTabs()}

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Total Users</p>
                <p className="text-2xl font-bold">{filterStats?.all || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Active Players</p>
                <p className="text-2xl font-bold">{filterStats?.active_players || 0}</p>
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
      )}

      {activeTab === 'compose' && (
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
                              <option key={round} value={round.toString()}>Round {round}</option>
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
                    <h3 className="font-semibold text-gray-800">Users ({totalUsers})</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectAllPages && (
                      <span className="text-xs text-green-600 font-medium">
                        All {selectedUsers.size} users selected
                      </span>
                    )}
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      {selectAllPages ? 'Deselect All' : 'Select All'}
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-10">
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
                <Pagination 
                  currentPage={usersPage}
                  totalItems={totalUsers}
                  pageSize={usersLimit}
                  onPageChange={setUsersPage}
                  loading={isLoading}
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                  <select
                    value={selectedSenderId}
                    onChange={(e) => setSelectedSenderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Default (FINPGS)</option>
                      {Array.isArray(senderIds) && senderIds.map((sid) => (
                        <option key={sid.SenderId} value={sid.SenderId}>{sid.SenderId}</option>
                      ))}
                  </select>
                </div>

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
                      <optgroup label="SMSCountry Templates">
                        {Array.isArray(restTemplates) && restTemplates.map((template, idx) => (
                          <option key={`${template.TemplateId}_${idx}`} value={`rest_${template.TemplateId}`}>
                            {template.Message.length > 40 ? template.Message.substring(0, 40) + '...' : template.Message}
                          </option>
                        ))}
                      </optgroup>
                      <option value="CUSTOM">Custom Message</option>
                    </select>
                  </div>

                {selectedTemplate && !selectedTemplate.startsWith('rest_') && selectedTemplate !== 'CUSTOM' && (
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

                {selectedTemplate && selectedTemplate.startsWith('rest_') && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> SMSCountry templates are predefined. The content will be populated automatically by the provider.
                    </p>
                    <p className="text-sm mt-2 font-medium">
                      {restTemplates.find(t => `rest_${t.TemplateId}` === selectedTemplate)?.Message}
                    </p>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    SMSCountry API Templates ({restTemplates.length})
                  </h3>
                  <button onClick={loadRestTemplates} className="text-purple-600 hover:text-purple-700">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-3 text-left">ID</th>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Message Content</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.isArray(restTemplates) && restTemplates.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No templates found in SMSCountry account</td>
                          </tr>
                        ) : (
                          Array.isArray(restTemplates) && restTemplates.map((template, idx) => (
                            <tr key={`${template.TemplateId}_${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono text-xs">{template.TemplateId}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{template.TemplateName}</td>
                            <td className="px-6 py-4 text-gray-600 max-w-md whitespace-pre-wrap">{template.Message}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(template.Message);
                                    toast.success('Template copied to clipboard');
                                  }}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Copy Message"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template.TemplateId)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Template"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={reportDateRange.from}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={reportDateRange.to}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={loadReports}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Fetch Reports
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">Message ID</th>
                    <th className="px-6 py-3 text-left">Mobile</th>
                    <th className="px-6 py-3 text-left">Message</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Submitted</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(reports) && reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No reports found for the selected period</td>
                      </tr>
                    ) : (
                      Array.isArray(reports) && reports.map((report, idx) => (
                        <tr key={`${report.MessageId}_${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs">{report.MessageId}</td>
                        <td className="px-6 py-4 font-medium">{report.Number}</td>
                        <td className="px-6 py-4 text-gray-600 max-w-md whitespace-pre-wrap">{report.Text}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            report.Status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            report.Status === 'Failed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {report.Status}
                          </span>
                        </td>
                          <td className="px-6 py-4 text-gray-500">
                            {(() => {
                              if (!report.SubmittedDate) return 'N/A';
                              const date = new Date(report.SubmittedDate);
                              if (isNaN(date.getTime())) {
                                // Fallback for formats like "Jan 27 2026 10:41AM"
                                return report.SubmittedDate;
                              }
                              return date.toLocaleString();
                            })()}
                          </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={reportsPage}
              totalItems={reports.length >= reportsLimit ? reportsPage * reportsLimit + 1 : reports.length + (reportsPage - 1) * reportsLimit}
              pageSize={reportsLimit}
              onPageChange={setReportsPage}
              loading={isLoading}
            />
          </div>
        </div>
      )}

      {activeTab === 'senderids' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {senderIds.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <Tag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No Sender IDs found in your account</p>
            </div>
          ) : (
            senderIds.map((sid) => (
              <div key={sid.SenderId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span className="text-xl font-bold text-gray-800">{sid.SenderId}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sid.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sid.Status}
                  </span>
                </div>
                {sid.Status === 'Active' && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Star Variables Modal for SMS */}
      {showStarVariablesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Fill Template Variables</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Replace the <code className="bg-gray-100 px-1 rounded">*</code> placeholders in the template.
                  {starVariables.some(v => v.isUsername) && (
                    <span className="text-purple-600"> The first star after "Dear" will be auto-replaced with each user's name.</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => { setShowStarVariablesModal(false); setPendingSendType(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Raw template display */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Template</p>
                <p className="text-sm text-gray-800 font-mono whitespace-pre-wrap">{getRawTemplateMessage()}</p>
              </div>

              {/* Variable inputs */}
              <div className="space-y-3">
                {starVariables.map((v, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                          * position {v.position}
                        </span>
                        {v.label}
                      </span>
                    </label>
                    {v.isUsername ? (
                      <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        Auto-filled with each user's username
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={v.value}
                        onChange={(e) => {
                          setStarVariables(prev =>
                            prev.map((sv, i) => i === idx ? { ...sv, value: e.target.value } : sv)
                          );
                        }}
                        placeholder={`Enter value for ${v.label}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Live Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Preview {(() => {
                      if (pendingSendType === 'selected') {
                        const firstUser = users.find(u => selectedUsers.has(u.user_id));
                        return firstUser ? `(for ${firstUser.username})` : '';
                      }
                      return '(username shown as *)';
                    })()}
                  </span>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {(() => {
                      const raw = getRawTemplateMessage();
                      const previewUsername = pendingSendType === 'selected'
                        ? (users.find(u => selectedUsers.has(u.user_id))?.username || 'User')
                        : '*';
                      return renderSmsWithVariables(raw, starVariables, previewUsername);
                    })()}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {renderSmsWithVariables(getRawTemplateMessage(), starVariables, 
                      pendingSendType === 'selected' ? (users.find(u => selectedUsers.has(u.user_id))?.username || 'User') : '*'
                    ).length} characters
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowStarVariablesModal(false); setPendingSendType(null); }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStarVariables}
                disabled={isSending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {pendingSendType === 'selected'
                  ? `Send to ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}`
                  : `Bulk Send to ${FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label || 'All'}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
