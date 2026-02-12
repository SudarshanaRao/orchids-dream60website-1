import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, Key, Lock, Eye, EyeOff, X, RefreshCw, Ban, CheckCircle2, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';

interface AdminManagementProps {
  adminUser: { admin_id: string; username: string; adminType: string };
}

interface AdminRecord {
  admin_id: string;
  username: string;
  email: string;
  mobile: string;
  adminType: string;
  isActive: boolean;
  createdAt: string;
  accessCodeCreatedAt?: string;
  tabPermissions?: Record<string, boolean>;
}

export const AdminManagement = ({ adminUser }: AdminManagementProps) => {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; admin: AdminRecord } | null>(null);
  const [actionValue, setActionValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [createForm, setCreateForm] = useState({
    username: '', email: '', mobile: '', password: '', adminType: 'ADMIN',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [tabPermModal, setTabPermModal] = useState<AdminRecord | null>(null);
  const [tabPermLoading, setTabPermLoading] = useState(false);

  const ALL_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'auctions', label: 'Master Auctions' },
    { key: 'daily-auctions', label: 'Daily Auctions' },
    { key: 'hourly-auctions', label: 'Hourly Auctions' },
    { key: 'refunds', label: 'Refunds' },
    { key: 'emails', label: 'Email Management' },
    { key: 'sms', label: 'SMS Management' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'notifications', label: 'Push Notifications' },
    { key: 'userAnalytics', label: 'User Tracking' },
    { key: 'vouchers', label: 'Voucher Management' },
    { key: 'admin-management', label: 'Admin Management' },
  ];

  const handleToggleTabPermission = async (admin: AdminRecord, tabKey: string, enabled: boolean) => {
    setTabPermLoading(true);
    const current = admin.tabPermissions || ALL_TABS.reduce((acc, t) => ({ ...acc, [t.key]: true }), {} as Record<string, boolean>);
    const updated = { ...current, [tabKey]: enabled };
    try {
      const res = await fetch(`${API_BASE}/admin/admins/${admin.admin_id}?user_id=${adminUser.admin_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabPermissions: updated }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Tab "${ALL_TABS.find(t => t.key === tabKey)?.label}" ${enabled ? 'enabled' : 'disabled'}`);
        // Update local state
        setAdmins(prev => prev.map(a => a.admin_id === admin.admin_id ? { ...a, tabPermissions: updated } : a));
        if (tabPermModal?.admin_id === admin.admin_id) {
          setTabPermModal({ ...admin, tabPermissions: updated });
        }
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update tab permissions');
    } finally {
      setTabPermLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/admins?user_id=${adminUser.admin_id}`);
      const data = await res.json();
      if (data.success) setAdmins(data.data);
    } catch {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/admins?user_id=${adminUser.admin_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin created successfully');
        setShowCreate(false);
        setCreateForm({ username: '', email: '', mobile: '', password: '', adminType: 'ADMIN' });
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to create admin');
      }
    } catch {
      toast.error('Failed to create admin');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminRecord, status: string) => {
    if (!confirm(`Are you sure you want to ${status} ${admin.username}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/admins/${admin.admin_id}?user_id=${adminUser.admin_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Admin ${status === 'blocked' ? 'blocked' : 'activated'} successfully`);
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update admin');
    }
  };

  const handleDelete = async (admin: AdminRecord) => {
    if (!confirm(`Delete admin "${admin.username}" permanently? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/admins/${admin.admin_id}?user_id=${adminUser.admin_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin deleted');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to delete admin');
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    const { type, admin } = actionModal;
    const endpoint = type === 'reset-password'
      ? `${API_BASE}/admin/admins/${admin.admin_id}/reset-password`
      : `${API_BASE}/admin/admins/${admin.admin_id}/reset-access-code`;
    const body = type === 'reset-password'
      ? { requester_id: adminUser.admin_id, newPassword: actionValue }
      : { requester_id: adminUser.admin_id, newAccessCode: actionValue };

    try {
      const res = await fetch(`${endpoint}?user_id=${adminUser.admin_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(type === 'reset-password' ? 'Password reset successfully' : 'Access code reset successfully');
        setActionModal(null);
        setActionValue('');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateType = async (admin: AdminRecord, newType: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/admins/${admin.admin_id}?user_id=${adminUser.admin_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminType: newType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin type updated');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update admin type');
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
      SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      DEVELOPER: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[type] || styles.ADMIN;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-900">Admin Management</h2>
          <p className="text-sm text-purple-600 mt-1">Manage admins, super admins, and developers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAdmins} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg">
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm">
          <div className="text-2xl font-bold text-purple-900">{admins.length}</div>
          <div className="text-sm text-purple-600">Total Admins</div>
        </div>
        <div className="bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
          <div className="text-2xl font-bold text-blue-900">{admins.filter(a => a.adminType === 'ADMIN').length}</div>
          <div className="text-sm text-blue-600">Admins</div>
        </div>
        <div className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm">
          <div className="text-2xl font-bold text-purple-900">{admins.filter(a => a.adminType === 'SUPER_ADMIN').length}</div>
          <div className="text-sm text-purple-600">Super Admins</div>
        </div>
        <div className="bg-white rounded-xl p-4 border-2 border-green-100 shadow-sm">
          <div className="text-2xl font-bold text-green-900">{admins.filter(a => a.adminType === 'DEVELOPER').length}</div>
          <div className="text-sm text-green-600">Developers</div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-200">
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Username</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Mobile</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Role</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Joined</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-purple-400"><RefreshCw className="w-6 h-6 animate-spin inline mr-2" />Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No admins found</td></tr>
              ) : admins.map(admin => (
                <tr key={admin.admin_id} className="border-b border-purple-100 hover:bg-purple-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">{admin.username}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{admin.email}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{admin.mobile}</td>
                  <td className="py-3 px-4">
                    <select
                      value={admin.adminType}
                      onChange={(e) => handleUpdateType(admin, e.target.value)}
                      disabled={admin.admin_id === adminUser.admin_id}
                      className={`px-2 py-1 text-xs font-bold rounded-lg border ${getTypeBadge(admin.adminType)} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      <option value="DEVELOPER">DEVELOPER</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {admin.isActive ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-lg bg-green-100 text-green-700 border border-green-200">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700 border border-red-200">Blocked</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTabPermModal(admin)} title="Manage Tabs" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        {admin.isActive ? (
                        <button onClick={() => handleToggleStatus(admin, 'blocked')} title="Block" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleToggleStatus(admin, 'active')} title="Activate" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => { setActionModal({ type: 'reset-password', admin }); setActionValue(''); }} title="Reset Password" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Lock className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setActionModal({ type: 'reset-access-code', admin }); setActionValue(''); }} title="Reset Access Code" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Key className="w-4 h-4" />
                      </button>
                      {admin.admin_id !== adminUser.admin_id && (
                        <button onClick={() => handleDelete(admin)} title="Delete" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-purple-200">
              <h3 className="text-lg font-bold text-purple-900">Create New Admin</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-purple-50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input type="text" required value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" required value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile</label>
                <input type="text" required value={createForm.mobile} onChange={e => setCreateForm({...createForm, mobile: e.target.value})} className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={6} value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full px-3 py-2 pr-10 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select value={createForm.adminType} onChange={e => setCreateForm({...createForm, adminType: e.target.value})} className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500">
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="DEVELOPER">Developer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg font-semibold hover:bg-purple-50">Cancel</button>
                <button type="submit" disabled={createLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50">{createLoading ? 'Creating...' : 'Create Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password / Access Code Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center justify-between p-5 border-b border-purple-200">
              <h3 className="text-lg font-bold text-purple-900">
                {actionModal.type === 'reset-password' ? 'Reset Password' : 'Reset Access Code'}
              </h3>
              <button onClick={() => setActionModal(null)} className="p-2 hover:bg-purple-50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                {actionModal.type === 'reset-password'
                  ? `Set a new password for ${actionModal.admin.username}`
                  : `Set a new 4-digit access code for ${actionModal.admin.username}`}
              </p>
              <input
                type={actionModal.type === 'reset-password' ? 'password' : 'text'}
                placeholder={actionModal.type === 'reset-password' ? 'New password (min 6 chars)' : 'New 4-digit code'}
                value={actionValue}
                onChange={e => setActionValue(e.target.value)}
                maxLength={actionModal.type === 'reset-access-code' ? 4 : undefined}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg font-semibold hover:bg-purple-50">Cancel</button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading || !actionValue || (actionModal.type === 'reset-password' ? actionValue.length < 6 : actionValue.length !== 4)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Permissions Modal */}
      {tabPermModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-purple-200">
              <div>
                <h3 className="text-lg font-bold text-purple-900">Manage Tab Visibility</h3>
                <p className="text-sm text-slate-500 mt-0.5">{tabPermModal.username} ({tabPermModal.adminType.replace('_', ' ')})</p>
              </div>
              <button onClick={() => setTabPermModal(null)} className="p-2 hover:bg-purple-50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-2">
              {tabPermModal.adminType === 'DEVELOPER' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  Developers always have access to all tabs.
                </div>
              )}
              {ALL_TABS.map(tab => {
                const perms = tabPermModal.tabPermissions || {};
                const isEnabled = perms[tab.key] !== false;
                const isDevTarget = tabPermModal.adminType === 'DEVELOPER';
                return (
                  <div key={tab.key} className={`flex items-center justify-between p-3 rounded-lg border ${isEnabled ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`font-medium text-sm ${isEnabled ? 'text-purple-900' : 'text-gray-500'}`}>{tab.label}</span>
                    <button
                      onClick={() => handleToggleTabPermission(tabPermModal, tab.key, !isEnabled)}
                      disabled={tabPermLoading || isDevTarget}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isDevTarget ? 'Developers always have all tabs' : isEnabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-8 h-8 text-purple-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
