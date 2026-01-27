import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Save,
  Trash2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  FileText,
  Plus,
  Edit,
  X,
  Loader2,
  Users,
  Tag,
  Download,
  Sparkles,
  Eye,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

interface User {
  user_id: string;
  username: string;
  email: string;
  userCode: string;
  mobile?: string;
}

interface EmailTemplate {
  template_id: string;
  name: string;
  subject: string;
  body: string;
  category: 'PRIZE_CLAIM' | 'GENERAL' | 'MARKETING' | 'NOTIFICATION' | 'CUSTOM';
  usageCount: number;
  createdAt: string;
  isActive: boolean;
}

interface AdminEmailManagementProps {
  adminUserId: string;
}

export const AdminEmailManagement = ({ adminUserId }: AdminEmailManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<EmailTemplate['category']>('CUSTOM');
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewExistingTemplate, setPreviewExistingTemplate] = useState<EmailTemplate | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users?user_id=${adminUserId}&limit=100`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.filter((u: any) => u.email)); // Only users with emails
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/emails/templates?user_id=${adminUserId}&limit=100`
      );
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchTemplates()]);
      setIsLoading(false);
    };
    loadData();
  }, [adminUserId]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Select all users
  const selectAllUsers = () => {
    const filtered = users.filter(
      (user) =>
        !searchTerm ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSelectedUsers(new Set(filtered.map((u) => u.user_id)));
  };

  // Deselect all users
  const deselectAllUsers = () => {
    setSelectedUsers(new Set());
  };

  // Load template
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.template_id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  // Send emails
  const handleSendEmails = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error('Please enter both subject and body');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: adminUserId,
          recipients: Array.from(selectedUsers),
          subject,
          body,
          templateId: selectedTemplate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Failed to send emails');
        setIsSending(false);
        return;
      }

      toast.success(
        `Emails sent successfully! ${data.data.totalSent} sent, ${data.data.totalFailed} failed`
      );

      // Clear form
      setSelectedUsers(new Set());
      setSubject('');
      setBody('');
      setSelectedTemplate('');

      // Refresh templates to update usage count
      await fetchTemplates();
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error('Please enter both subject and body');
      return;
    }

    setIsSavingTemplate(true);

    try {
      const url = editingTemplate
        ? `${API_BASE_URL}/admin/emails/templates/${editingTemplate.template_id}?user_id=${adminUserId}`
        : `${API_BASE_URL}/admin/emails/templates`;

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: adminUserId,
          name: templateName,
          subject,
          body,
          category: templateCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || `Failed to ${editingTemplate ? 'update' : 'save'} template`);
        setIsSavingTemplate(false);
        return;
      }

      toast.success(`Template ${editingTemplate ? 'updated' : 'saved'} successfully!`);

      // Refresh templates
      await fetchTemplates();

      // Close modal and reset
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateCategory('CUSTOM');
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/emails/templates/${templateId}?user_id=${adminUserId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Failed to delete template');
        return;
      }

      toast.success('Template deleted successfully');
      await fetchTemplates();

      // Clear selection if deleted template was selected
      if (selectedTemplate === templateId) {
        setSelectedTemplate('');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      !searchTerm ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = selectedUsers.size;
  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.has(u.user_id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-700 animate-spin mx-auto mb-4" />
          <p className="text-purple-700 font-semibold">Loading email management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-semibold">Total Users</p>
              <p className="text-2xl font-bold text-purple-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-semibold">Selected Users</p>
              <p className="text-2xl font-bold text-blue-900">{selectedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-semibold">Saved Templates</p>
              <p className="text-2xl font-bold text-green-900">{templates.length}</p>
            </div>
          </div>
        </div>
        </div>

        {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - User Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Select Recipients
          </h2>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Select All/None */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={selectAllUsers}
              className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={deselectAllUsers}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
            >
              Deselect All
            </button>
          </div>

          {/* User List */}
          <div className="border-2 border-purple-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-purple-600">
                {users.length === 0 ? 'No users with email addresses found' : 'No users match your search'}
              </div>
            ) : (
              <div className="divide-y divide-purple-100">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => toggleUser(user.user_id)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-purple-50 transition-colors ${
                      selectedUsers.has(user.user_id) ? 'bg-purple-50' : ''
                    }`}
                  >
                    {selectedUsers.has(user.user_id) ? (
                      <CheckSquare className="w-5 h-5 text-purple-700 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-purple-900">{user.username}</p>
                      <p className="text-sm text-purple-600 truncate">{user.email}</p>
                      <p className="text-xs text-purple-500 font-mono">{user.userCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Email Composition */}
        <div className="space-y-6">
          {/* Template Selector */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Templates
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                  setTemplateName('');
                  setTemplateCategory('CUSTOM');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>

            <select
              value={selectedTemplate}
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 mb-4"
            >
              <option value="">-- Select a template --</option>
              {templates.map((template) => (
                <option key={template.template_id} value={template.template_id}>
                  {template.name} ({template.category}) - Used {template.usageCount} times
                </option>
              ))}
            </select>

            {templates.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.template_id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-semibold text-purple-900 truncate">{template.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded-full">
                          {template.category}
                        </span>
                        <span className="text-xs text-purple-600">
                          Used {template.usageCount} times
                        </span>
                      </div>
                    </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewExistingTemplate(template)}
                          className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Preview template"
                        >
                          <Eye className="w-4 h-4 text-amber-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateName(template.name);
                            setTemplateCategory(template.category);
                            setSubject(template.subject);
                            setBody(template.body);
                            setShowTemplateModal(true);
                          }}
                          className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4 text-purple-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.template_id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Composition */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Email
            </h3>

            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Body (HTML Supported) *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter email body (HTML supported)..."
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
                <p className="text-xs text-purple-600 mt-2">
                  💡 You can use HTML tags for formatting: &lt;h1&gt;, &lt;p&gt;, &lt;b&gt;, &lt;a&gt;, etc.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!subject.trim() || !body.trim()) {
                      toast.error('Please enter subject and body to save as template');
                      return;
                    }
                    setEditingTemplate(null);
                    setTemplateName('');
                    setTemplateCategory('CUSTOM');
                    setShowTemplateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-green-500 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save as Template
                </button>
                <button
                  type="button"
                  onClick={handleSendEmails}
                  disabled={isSending || selectedCount === 0 || !subject.trim() || !body.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending to {selectedCount} users...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send to {selectedCount} User{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Save/Edit Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-900">
                {editingTemplate ? 'Update Template' : 'Save as Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-purple-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Newsletter"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Category *
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value as EmailTemplate['category'])}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="PRIZE_CLAIM">Prize Claim</option>
                  <option value="GENERAL">General</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="NOTIFICATION">Notification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Body (HTML Supported) *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter email body (HTML supported)..."
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
                >
                  {isSavingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>{editingTemplate ? 'Update' : 'Save'} Template</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Existing Template Preview Modal */}
        {previewExistingTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewExistingTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{previewExistingTemplate.subject}</p>
                </div>
                <button
                  onClick={() => setPreviewExistingTemplate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-semibold text-gray-700">Category:</span>
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    {previewExistingTemplate.category}
                  </span>
                  
                  {/* Extract variables from body/subject */}
                  {(() => {
                    const vars = new Set<string>();
                    const regex = /\{\{([^}]+)\}\}/g;
                    let match;
                    while ((match = regex.exec(previewExistingTemplate.subject + previewExistingTemplate.body)) !== null) {
                      vars.add(match[1]);
                    }
                    if (vars.size > 0) {
                      return (
                        <>
                          <span className="text-sm font-semibold text-gray-700 ml-4">Detected Variables:</span>
                          {Array.from(vars).map((variable) => (
                            <span
                              key={variable}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-mono"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-gray-100">
                <div
                  className="bg-white rounded-lg shadow-sm"
                  dangerouslySetInnerHTML={{ __html: previewExistingTemplate.body }}
                />
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewExistingTemplate(null)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};
