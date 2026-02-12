import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Send, Clock, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, X, Mail, MessageSquare, FileText,
  User, Tag, Filter, Eye, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';

interface Reply {
  _id: string;
  message: string;
  sentBy: string;
  sentAt: string;
  emailSent: boolean;
}

interface Ticket {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  adminNotes: string;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface Template {
  template_id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface Stats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface AdminSupportManagementProps {
  adminUserId: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-50 text-blue-600',
  medium: 'bg-yellow-50 text-yellow-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
};

const categoryLabels: Record<string, string> = {
  account: 'Account', auction: 'Auction', payment: 'Payment', technical: 'Technical',
  prizes: 'Prizes', feedback: 'Feedback', partnership: 'Partnership', press: 'Press',
  legal: 'Legal', support: 'Support', other: 'Other',
};

// Extract all {{Variable}} and [Variable] placeholders from template body
const extractVariables = (body: string): string[] => {
  const vars = new Set<string>();
  const bracketRegex = /\[([A-Za-z_][A-Za-z0-9_ ]*)\]/g;
  const braceRegex = /\{\{([A-Za-z_][A-Za-z0-9_ ]*)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = bracketRegex.exec(body)) !== null) vars.add(m[1]);
  while ((m = braceRegex.exec(body)) !== null) vars.add(m[1]);
  return Array.from(vars);
};

// Replace variables in template text
const replaceVars = (text: string, vars: Record<string, string>): string => {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'gi'), value);
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value);
  }
  return result;
};

// Known auto-fill variable names (case-insensitive match)
const AUTO_FILL_KEYS: Record<string, (ticket: Ticket) => string> = {
  name: (t) => t.name,
  username: (t) => t.name,
  user: (t) => t.name,
  'user name': (t) => t.name,
  'ticket id': (t) => t.ticketId,
  ticketid: (t) => t.ticketId,
  'ticket number': (t) => t.ticketId,
  email: (t) => t.email,
  subject: (t) => t.subject,
  category: (t) => categoryLabels[t.category] || t.category,
};

const getAutoFillValue = (varName: string, ticket: Ticket): string | null => {
  const key = varName.toLowerCase().trim();
  for (const [k, fn] of Object.entries(AUTO_FILL_KEYS)) {
    if (key === k) return fn(ticket);
  }
  return null;
};

export const AdminSupportManagement = ({ adminUserId }: AdminSupportManagementProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Template variable fill state
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [showVarModal, setShowVarModal] = useState(false);

  // Preview/confirm state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ user_id: adminUserId, page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`${API_BASE}/admin/support/tickets?${params}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  }, [adminUserId, page, statusFilter, categoryFilter, searchTerm]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/support/templates?user_id=${adminUserId}`);
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch { /* ignore */ }
  }, [adminUserId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // When a template is selected, auto-fill known vars and prompt for missing ones
  const useTemplate = (template: Template) => {
    if (!selectedTicket) return;
    const allVars = extractVariables(template.body);
    const autoFilled: Record<string, string> = {};
    const missing: string[] = [];

    for (const v of allVars) {
      const auto = getAutoFillValue(v, selectedTicket);
      if (auto !== null) {
        autoFilled[v] = auto;
      } else {
        missing.push(v);
      }
    }

    setPendingTemplate(template);
    setVarValues(autoFilled);

    if (missing.length > 0) {
      setMissingVars(missing);
      setShowVarModal(true);
    } else {
      // All variables filled, go straight to preview
      applyTemplateAndPreview(template, autoFilled);
    }
    setShowTemplates(false);
  };

  const applyTemplateAndPreview = (template: Template, vars: Record<string, string>) => {
    const filledBody = replaceVars(template.body, vars);
    const filledSubject = replaceVars(template.subject, vars);
    setReplyText(filledBody);
    setPreviewSubject(filledSubject);
    setPreviewHtml(filledBody);
    setShowPreview(true);
    setShowVarModal(false);
    setPendingTemplate(null);
    setMissingVars([]);
  };

  const handleVarSubmit = () => {
    if (!pendingTemplate) return;
    const allFilled = missingVars.every(v => varValues[v]?.trim());
    if (!allFilled) {
      toast.error('Please fill in all required variables');
      return;
    }
    applyTemplateAndPreview(pendingTemplate, varValues);
  };

  const handleSendFromPreview = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${selectedTicket.ticketId}/reply?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          isHtml: true,
          templateId: pendingTemplate?.template_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.emailSent ? 'Reply sent via email' : 'Reply saved (email failed)');
        setSelectedTicket(data.data);
        setReplyText('');
        setPreviewHtml('');
        setPreviewSubject('');
        setShowPreview(false);
        fetchTickets();
      } else toast.error(data.message);
    } catch { toast.error('Failed to send reply'); }
    setSending(false);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    // Show preview before sending
    setPreviewHtml(replyText);
    setPreviewSubject(`Re: ${selectedTicket.subject}`);
    setShowPreview(true);
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/status?user_id=${adminUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status updated');
        if (selectedTicket?.ticketId === ticketId) setSelectedTicket(data.data);
        fetchTickets();
      } else toast.error(data.message);
    } catch { toast.error('Failed to update status'); }
    setUpdatingStatus(false);
  };

  const handlePriorityUpdate = async (ticketId: string, newPriority: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/status?user_id=${adminUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Priority updated');
        if (selectedTicket?.ticketId === ticketId) setSelectedTicket(data.data);
        fetchTickets();
      }
    } catch { toast.error('Failed to update priority'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // Write iframe content after render
  useEffect(() => {
    if (showPreview && previewRef.current && previewHtml) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [showPreview, previewHtml]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', count: stats.open, color: 'red', icon: AlertCircle },
          { label: 'In Progress', count: stats.in_progress, color: 'amber', icon: Clock },
          { label: 'Resolved', count: stats.resolved, color: 'green', icon: CheckCircle },
          { label: 'Closed', count: stats.closed, color: 'gray', icon: X },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border-2 border-${s.color}-200 shadow-sm`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
              <span className="text-sm font-medium text-gray-600">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => fetchTickets()} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Ticket List */}
        <div className={`${selectedTicket ? 'w-2/5' : 'w-full'} space-y-3 transition-all`}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tickets found</p>
            </div>
          ) : (
            <>
              {tickets.map(ticket => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTicket?.ticketId === ticket.ticketId ? 'border-purple-500 shadow-md' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{ticket.subject}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{ticket.ticketId}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.name}</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{categoryLabels[ticket.category]}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(ticket.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${priorityColors[ticket.priority]}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    {ticket.replies?.length > 0 && (
                      <span className="text-[10px] text-purple-600 font-medium">{ticket.replies.length} replies</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">Prev</button>
                  <span className="px-3 py-1 text-sm text-purple-700 font-medium">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">Next</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Ticket Detail Panel */}
        {selectedTicket && (
          <div className="w-3/5 bg-white rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-purple-900 text-lg truncate">{selectedTicket.subject}</h3>
                  <p className="text-xs text-purple-600 mt-1">{selectedTicket.ticketId} | {selectedTicket.email}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-purple-100 rounded-lg">
                  <X className="w-5 h-5 text-purple-600" />
                </button>
              </div>

              {/* Status & Priority Controls */}
              <div className="flex items-center gap-3 mt-3">
                <select
                  value={selectedTicket.status}
                  onChange={e => handleStatusUpdate(selectedTicket.ticketId, e.target.value)}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 text-xs font-semibold border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={selectedTicket.priority}
                  onChange={e => handlePriorityUpdate(selectedTicket.ticketId, e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <span className="text-xs text-gray-500">{categoryLabels[selectedTicket.category]}</span>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedTicket.name}</p>
                    <p className="text-[10px] text-gray-500">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((reply, idx) => (
                <div key={reply._id || idx} className="bg-purple-50 rounded-xl p-4 border border-purple-200 ml-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Support ({reply.sentBy})</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-purple-600">{formatDate(reply.sentAt)}</p>
                        {reply.emailSent ? (
                          <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />Sent</span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />Failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: reply.message }} />
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-purple-100 bg-gray-50 flex-shrink-0">
              {/* Template Suggestions */}
              <div className="mb-3">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
                >
                  <FileText className="w-3 h-3" />
                  Use Template
                  {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showTemplates && templates.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-purple-200 rounded-lg bg-white">
                    {templates.map(t => (
                      <button
                        key={t.template_id}
                        onClick={() => useTemplate(t)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply or select a template... (sent from support@dream60.com)"
                  rows={3}
                  className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none font-mono"
                />
                <div className="flex flex-col gap-1 self-end">
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    title="Preview & Send"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all"
                  >
                    {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Click the preview button to see and confirm the email before sending.</p>
            </div>
          </div>
        )}
      </div>

      {/* Variable Fill Modal */}
      {showVarModal && pendingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-600 to-purple-700">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Fill Template Variables
              </h3>
              <p className="text-purple-200 text-xs mt-1">Template: {pendingTemplate.name}</p>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Show auto-filled variables (read-only) */}
              {Object.entries(varValues).filter(([k]) => !missingVars.includes(k)).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Auto-filled from ticket
                  </p>
                  {Object.entries(varValues).filter(([k]) => !missingVars.includes(k)).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-green-800 py-0.5">
                      <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded">[{key}]</span>
                      <span>=</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing variables that need user input */}
              {missingVars.map(v => (
                <div key={v}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <span className="font-mono text-purple-600">[{v}]</span>
                  </label>
                  <input
                    type="text"
                    value={varValues[v] || ''}
                    onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter value for ${v}...`}
                    className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => { setShowVarModal(false); setPendingTemplate(null); setMissingVars([]); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVarSubmit}
                className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Preview Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview & Confirmation Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="p-5 bg-gradient-to-r from-purple-600 to-purple-700 flex-shrink-0">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Preview
              </h3>
              <p className="text-purple-200 text-xs mt-1">
                To: {selectedTicket?.email} | Subject: {previewSubject || `Re: ${selectedTicket?.subject}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {/* Rendered HTML Preview */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Email Preview (as recipient will see it)</span>
                </div>
                <iframe
                  ref={previewRef}
                  title="Email Preview"
                  className="w-full bg-white"
                  style={{ minHeight: '400px', border: 'none' }}
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Raw HTML source (collapsed) */}
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-purple-600 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> View raw HTML source
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto font-mono">
                  {previewHtml}
                </pre>
              </details>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 justify-between items-center flex-shrink-0">
              <p className="text-xs text-gray-400">
                Sending from: support@dream60.com
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPreview(false); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleSendFromPreview}
                  disabled={sending}
                  className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
