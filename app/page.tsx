// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Settings, 
  LogOut, 
  Shield, 
  Server, 
  HardDrive, 
  Activity,
  Key,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  Plus,
  Save,
  Ban,
  Unlock,
  Database,
  Cpu,
  Wifi,
  Zap,
  UserCog,
  Store,
  UserPlus,
  UserMinus,
  Menu,
  X,
  Eye,
  EyeOff,
  MoreVertical,
  Fingerprint,
  Calendar,
  Hash
} from 'lucide-react';

interface IUser {
  _id: string;
  username: string;
  password?: string;
  expiresAt: string;
  createdAt: string;
  hwid?: string | null;
  hwidReset?: boolean;
  loginCount?: number;
  lastLoginIP?: string;
  registeredHwids?: string[];
  deviceLimit?: number;
  createdBy?: string;
  createdByReseller?: string;
}

interface IReseller {
  _id: string;
  username: string;
  password: string;
  createdAt: string;
  totalUsers: number;
  activeUsers: number;
}

export default function Home() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard State
  const [users, setUsers] = useState<IUser[]>([]);
  const [resellers, setResellers] = useState<IReseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deviceLimit, setDeviceLimit] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<string>('');

  // Reseller Form State
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [editingResellerId, setEditingResellerId] = useState<string | null>(null);

  // Server Control State
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  const [requiredVersion, setRequiredVersion] = useState('1.0.0');
  const [newVersion, setNewVersion] = useState('');
  const [versionLoading, setVersionLoading] = useState(false);
  const [serverControlLoading, setServerControlLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'resellers' | 'settings'>('users');

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toast Alert State
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchUsers();
          fetchResellers();
          fetchServerSettings();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        fetchUsers();
        fetchResellers();
        fetchServerSettings();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setAdminUsername('');
      setAdminPassword('');
      showToast('Logged out successfully');
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
      } else {
        showToast(result.error || 'Failed to fetch users', 'error');
      }
    } catch {
      showToast('Network error while fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchResellers = async () => {
    try {
      const res = await fetch('/api/resellers');
      const data = await res.json();
      if (data.success) {
        setResellers(data.data);
      }
    } catch {
      console.error('Failed to fetch resellers');
    }
  };

  const fetchServerSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setServerStatus(data.serverStatus || 'online');
        setRequiredVersion(data.requiredVersion || '1.0.0');
        setNewVersion(data.requiredVersion || '1.0.0');
      }
    } catch {
      console.error('Failed to fetch settings');
    }
  };

  const updateServerStatus = async (status: 'online' | 'offline') => {
    setServerControlLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'serverStatus', value: status }),
      });
      const data = await res.json();
      if (data.success) {
        setServerStatus(status);
        showToast(`Server is now ${status}`, 'success');
      } else {
        showToast(data.error || 'Failed to update server status', 'error');
      }
    } catch {
      showToast('Error updating server status', 'error');
    } finally {
      setServerControlLoading(false);
    }
  };

  const updateVersion = async () => {
    if (!newVersion.trim()) {
      showToast('Please enter a version number', 'error');
      return;
    }

    setVersionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'requiredVersion', value: newVersion.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRequiredVersion(newVersion.trim());
        showToast(`Version updated to ${newVersion.trim()}`, 'success');
      } else {
        showToast(data.error || 'Failed to update version', 'error');
      }
    } catch {
      showToast('Error updating version', 'error');
    } finally {
      setVersionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || (!editingId && !password)) return;

    try {
      if (editingId) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingId, 
            username, 
            password, 
            durationDays, 
            deviceLimit,
            createdBy: selectedReseller || 'admin'
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('User updated successfully!');
          setEditingId(null);
        } else {
          showToast(data.error || 'Failed to update user', 'error');
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username, 
            password, 
            durationDays, 
            deviceLimit,
            createdBy: selectedReseller || 'admin'
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('New user created successfully!');
        } else {
          showToast(data.error || 'Username already exists', 'error');
        }
      }

      setUsername('');
      setPassword('');
      setDurationDays(30);
      setDeviceLimit(0);
      setSelectedReseller('');
      fetchUsers();
      fetchResellers();
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('User deleted successfully');
        fetchUsers();
        fetchResellers();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch {
      showToast('Error deleting user', 'error');
    }
  };

  const handleResetHwid = async (username: string) => {
    if (!confirm(`Are you sure you want to reset HWID for "${username}"?`)) return;

    try {
      const res = await fetch('/api/admin/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`HWID reset successful for ${username}!`, 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to reset HWID', 'error');
      }
    } catch {
      showToast('Error resetting HWID', 'error');
    }
  };

  const handleClearAllHwids = async (username: string) => {
    if (!confirm(`Are you sure you want to clear ALL registered devices for "${username}"?`)) return;

    try {
      const res = await fetch('/api/admin/clear-hwids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`All devices cleared for ${username}!`, 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to clear devices', 'error');
      }
    } catch {
      showToast('Error clearing devices', 'error');
    }
  };

  const handleEdit = (user: IUser) => {
    setEditingId(user._id);
    setUsername(user.username);
    setPassword('');
    setDeviceLimit(user.deviceLimit || 0);
    setSelectedReseller(user.createdBy || '');
    // Scroll to form on mobile
    if (window.innerWidth < 768) {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (userId: string) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  // Reseller CRUD operations
  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resellerUsername || !resellerPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: resellerUsername, 
          password: resellerPassword 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reseller created successfully!');
        setResellerUsername('');
        setResellerPassword('');
        fetchResellers();
      } else {
        showToast(data.error || 'Failed to create reseller', 'error');
      }
    } catch {
      showToast('Error creating reseller', 'error');
    }
  };

  const handleDeleteReseller = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reseller? This will not delete their users.')) return;
    try {
      const res = await fetch('/api/resellers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reseller deleted successfully');
        fetchResellers();
      } else {
        showToast(data.error || 'Failed to delete reseller', 'error');
      }
    } catch {
      showToast('Error deleting reseller', 'error');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDevices = users.reduce((acc, u) => acc + (u.registeredHwids ? u.registeredHwids.length : (u.hwid && u.hwid !== 'null' && u.hwid !== '' ? 1 : 0)), 0);
  const activeUsers = users.filter(u => new Date(u.expiresAt) > new Date()).length;
  const expiredUsers = users.filter(u => new Date(u.expiresAt) < new Date()).length;

  const getUsersByReseller = (resellerUsername: string) => {
    return users.filter(u => u.createdBy === resellerUsername);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-400 flex items-center justify-center font-sans">
        <div className="relative flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
          <div className="text-sm font-medium tracking-wider bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
            Establishing secure connection...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0c1428]/90 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-blue-500/20 shadow-2xl shadow-blue-900/30">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl"></div>
                <Shield className="w-10 h-10 text-white relative z-10" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                DNX DYNAMICX
              </h1>
              <p className="text-slate-400 text-sm mt-1">Administrator authentication required💫</p>
            </div>

            {loginError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium backdrop-blur-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-[#060a17]/80 border border-blue-500/30 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060a17]/80 border border-blue-500/30 rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="relative w-full overflow-hidden group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="animate-spin h-4 w-4 text-white" />
                      Authenticating
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </span>
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              </button>
            </form>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-6 tracking-widest uppercase flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Secured • Encrypted Connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a1225]/95 backdrop-blur-xl border-b border-blue-500/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            DYNAMICX
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white transition p-2 rounded-xl hover:bg-slate-800/50"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#060a17]/90 backdrop-blur-lg pt-20 px-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-l-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Users className="w-5 h-5" />
              Users ({users.length})
            </button>
            <button
              onClick={() => { setActiveTab('resellers'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'resellers' 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-300 border-l-2 border-emerald-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Store className="w-5 h-5" />
              Resellers ({resellers.length})
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-l-2 border-blue-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <div className="w-full max-w-xs border-t border-blue-500/10 pt-4 mt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                <span className="text-xs text-slate-400">{serverStatus === 'online' ? 'System Online' : 'System Offline'}</span>
              </div>
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition mt-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-[#0a1225]/95 backdrop-blur-xl border-r border-blue-500/10 flex-col items-center lg:items-start p-4 z-50 transition-all duration-300 shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-3 mb-10 mt-2 w-full">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
            <Shield className="w-6 h-6 text-white relative z-10" />
          </div>
          <span className="hidden lg:block text-lg font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            DYNAMICX
          </span>
        </div>

        <nav className="w-full space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-l-2 border-blue-400 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Users</span>
            <span className="hidden lg:inline ml-auto text-xs bg-blue-500/20 px-2 py-0.5 rounded-full text-blue-300">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resellers')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'resellers'
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-300 border-l-2 border-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Resellers</span>
            <span className="hidden lg:inline ml-auto text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
              {resellers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-l-2 border-blue-400 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </nav>

        <div className="mt-auto w-full pt-4 border-t border-blue-500/10 space-y-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
            <span className="text-xs text-slate-400">{serverStatus === 'online' ? 'System Online' : 'System Offline'}</span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-20 lg:ml-64 p-3 md:p-6 lg:p-8 pt-20 md:pt-6 relative">
        {/* Background Orbs */}
        <div className="fixed -top-64 -right-64 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-64 -left-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6 md:space-y-8">
          {/* Toast Alert */}
          {message && (
            <div
              className={`fixed top-20 md:top-6 right-3 md:right-6 z-50 px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs md:text-sm font-medium transition-all duration-500 flex items-center gap-2 md:gap-3 max-w-[90vw] md:max-w-md ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 shadow-emerald-500/10'
                  : message.type === 'error'
                  ? 'bg-rose-500/20 border-rose-400/30 text-rose-200 shadow-rose-500/10'
                  : 'bg-blue-500/20 border-blue-400/30 text-blue-200 shadow-blue-500/10'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> : 
               message.type === 'error' ? <XCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> : 
               <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
              <span className="break-words">{message.text}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-blue-500/10">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                Dashboard
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1 ml-1 tracking-wide">
                Manage users, resellers, and server settings from one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#0a1225]/80 rounded-2xl border border-blue-500/10">
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                <span className="text-[10px] md:text-xs text-slate-400">{serverStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-blue-500/10 p-4 md:p-5 shadow-xl shadow-blue-900/5 hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Users</p>
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-blue-300 mt-1 md:mt-2">{users.length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-blue-500/10 p-4 md:p-5 shadow-xl shadow-blue-900/5 hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Active</p>
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-300 mt-1 md:mt-2">{activeUsers}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-blue-500/10 p-4 md:p-5 shadow-xl shadow-blue-900/5 hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Devices</p>
                <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-purple-300 mt-1 md:mt-2">{totalDevices}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-blue-500/10 p-4 md:p-5 shadow-xl shadow-blue-900/5 hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Resellers</p>
                <Store className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-300 mt-1 md:mt-2">{resellers.length}</p>
            </div>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {/* Form Card */}
              <div id="form-section" className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                  <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  {editingId ? (
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Edit className="w-4 h-4 md:w-5 md:h-5" />
                      Edit License
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                      Generate New License
                    </span>
                  )}
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-5">
                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="client_01"
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {editingId ? 'New Password' : 'Password'}
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingId ? 'optional' : 'secret123'}
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition"
                      required={!editingId}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      min="1"
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      Device Limit
                    </label>
                    <select
                      value={deviceLimit}
                      onChange={(e) => setDeviceLimit(Number(e.target.value))}
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition cursor-pointer"
                    >
                      <option value="0">♾️ Unlimited</option>
                      <option value="1">📱 1 Device</option>
                      <option value="2">📱📱 2 Devices</option>
                      <option value="3">📱📱📱 3 Devices</option>
                      <option value="4">📱📱📱📱 4 Devices</option>
                      <option value="5">📱📱📱📱📱 5 Devices</option>
                      <option value="10">📱 10 Devices</option>
                      <option value="20">📱 20 Devices</option>
                      <option value="50">📱 50 Devices</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCog className="w-3 h-3" />
                      Created By
                    </label>
                    <select
                      value={selectedReseller}
                      onChange={(e) => setSelectedReseller(e.target.value)}
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition cursor-pointer"
                    >
                      <option value="admin">👑 Admin</option>
                      {resellers.map((r) => (
                        <option key={r._id} value={r.username}>🏪 {r.username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {editingId ? (
                        <>
                          <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="hidden xs:inline">Save</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="hidden xs:inline">Create</span>
                        </>
                      )}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setUsername('');
                          setPassword('');
                          setDurationDays(30);
                          setDeviceLimit(0);
                          setSelectedReseller('');
                        }}
                        className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-slate-700/50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Table Card - Mobile Optimized */}
              <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-blue-500/10 overflow-hidden shadow-2xl shadow-blue-900/10">
                <div className="p-3 md:p-5 lg:p-6 border-b border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                  <h2 className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    <span className="hidden xs:inline">Registered Credentials</span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {filteredUsers.length}
                    </span>
                  </h2>

                  <div className="relative w-full sm:w-64 md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search username..."
                      className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl md:rounded-2xl pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-[10px] md:text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-blue-500/5">
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        Loading...
                      </div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No matching credentials found.
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isExpired = new Date(user.expiresAt) < new Date();
                      const hasHwid = user.hwid && user.hwid !== 'null' && user.hwid !== '';
                      const deviceCount = user.registeredHwids ? user.registeredHwids.length : (hasHwid ? 1 : 0);
                      const deviceLimit = user.deviceLimit || 0;
                      const isDeviceLimitReached = deviceLimit > 0 && deviceCount >= deviceLimit;

                      return (
                        <div key={user._id} className="p-4 hover:bg-blue-500/5 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-blue-300 border border-blue-500/20 flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{user.username}</p>
                                <p className="text-xs text-slate-400 font-mono truncate">{user.password || '••••••••'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isExpired
                                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                    : isDeviceLimitReached && deviceLimit > 0
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isExpired ? 'bg-rose-400' : 
                                  isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}></span>
                                {isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}
                              </span>
                              <button
                                onClick={() => toggleDropdown(user._id)}
                                className="p-1.5 rounded-xl hover:bg-slate-800/50 transition"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>
                          </div>

                          {/* User Details */}
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <UserCog className="w-3.5 h-3.5 text-emerald-400" />
                              <span className={user.createdBy === 'admin' ? 'text-blue-300' : 'text-emerald-300'}>
                                {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                              <span>{deviceCount > 0 ? `📱 ${deviceCount}${deviceLimit > 0 ? `/${deviceLimit}` : ''}` : 'No devices'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>{new Date(user.expiresAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isExpired ? 'bg-rose-400' : 
                                isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}></div>
                              <span>{isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 text-slate-400 truncate">
                              {hasHwid ? (
                                <>
                                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  <span className="truncate font-mono text-[10px]">
                                    {user.hwid && user.hwid.length > 12 ? (
                                      <>
                                        {user.hwid.substring(0, 6)}...{user.hwid.substring(user.hwid.length - 6)}
                                      </>
                                    ) : (
                                      user.hwid
                                    )}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                  <span className="text-slate-500">Not Registered</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Dropdown Actions */}
                          {activeDropdown === user._id && (
                            <div ref={dropdownRef} className="mt-3 p-2 bg-[#0a1225]/90 rounded-xl border border-blue-500/10 shadow-xl grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleEdit(user)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-medium transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              {hasHwid && (
                                <>
                                  <button
                                    onClick={() => handleResetHwid(user.username)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    Reset
                                  </button>
                                  {deviceCount > 0 && (
                                    <button
                                      onClick={() => handleClearAllHwids(user.username)}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Clear
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium transition col-span-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#060a17]/60 text-slate-400 text-xs uppercase tracking-wider border-b border-blue-500/10">
                        <th className="p-4 pl-6 font-medium">User</th>
                        <th className="p-4 font-medium">Password</th>
                        <th className="p-4 font-medium">Created By</th>
                        <th className="p-4 font-medium">Device Limit</th>
                        <th className="p-4 font-medium">Devices</th>
                        <th className="p-4 font-medium">HWID</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Expires</th>
                        <th className="p-4 text-right pr-6 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-500/5">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                              Loading credentials...
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500">
                            No matching credentials found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isExpired = new Date(user.expiresAt) < new Date();
                          const hasHwid = user.hwid && user.hwid !== 'null' && user.hwid !== '';
                          const deviceCount = user.registeredHwids ? user.registeredHwids.length : (hasHwid ? 1 : 0);
                          const deviceLimit = user.deviceLimit || 0;
                          const isDeviceLimitReached = deviceLimit > 0 && deviceCount >= deviceLimit;

                          return (
                            <tr key={user._id} className="hover:bg-blue-500/5 transition duration-200 group">
                              <td className="p-4 pl-6 font-medium text-slate-200 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-500/20">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                {user.username}
                              </td>
                              <td className="p-4 text-slate-400 font-mono text-xs">{user.password || '••••••••'}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.createdBy === 'admin' 
                                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                }`}>
                                  {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy}`}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  deviceLimit === 0
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                }`}>
                                  {deviceLimit === 0 ? '♾️ Unlimited' : `📱 ${deviceLimit}`}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  deviceCount > 0
                                    ? isDeviceLimitReached
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {deviceCount > 0 ? `📱 ${deviceCount}${deviceLimit > 0 ? `/${deviceLimit}` : ''}` : 'No devices'}
                                  {isDeviceLimitReached && deviceLimit > 0 && ' 🔒'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 font-mono text-xs">
                                {hasHwid ? (
                                  <span className="text-emerald-400 flex items-center gap-1" title={`Full HWID: ${user.hwid}`}>
                                    <Monitor className="w-3 h-3" />
                                    {user.hwid && user.hwid.length > 16 ? (
                                      <>
                                        {user.hwid.substring(0, 8)}...{user.hwid.substring(user.hwid.length - 8)}
                                      </>
                                    ) : (
                                      user.hwid
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Ban className="w-3 h-3" />
                                    Not Registered
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                    isExpired
                                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                      : isDeviceLimitReached && deviceLimit > 0
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isExpired ? 'bg-rose-400' : 
                                    isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}></span>
                                  {isExpired ? 'Expired' : 
                                   isDeviceLimitReached && deviceLimit > 0 ? 'Full' : 'Active'}
                                </span>
                                {user.hwidReset && (
                                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Reset Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-slate-300 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {new Date(user.expiresAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex flex-wrap justify-end gap-1">
                                  <button
                                    onClick={() => handleEdit(user)}
                                    className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  {hasHwid && (
                                    <>
                                      <button
                                        onClick={() => handleResetHwid(user.username)}
                                        className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 flex items-center gap-1"
                                        title="Reset HWID - Allows login from any device"
                                      >
                                        <Unlock className="w-3 h-3" />
                                        Reset
                                      </button>
                                      {deviceCount > 0 && (
                                        <button
                                          onClick={() => handleClearAllHwids(user.username)}
                                          className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 flex items-center gap-1"
                                          title="Clear all registered devices"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Clear
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(user._id)}
                                    className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/10 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Resellers Tab Content - Mobile Optimized */}
          {activeTab === 'resellers' && (
            <>
              {/* Create Reseller Form */}
              <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-emerald-500/10 shadow-2xl shadow-emerald-900/10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-emerald-200 flex items-center gap-3">
                  <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full"></div>
                  <span className="flex items-center gap-2 text-sm md:text-base">
                    <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                    {editingResellerId ? 'Edit Reseller' : 'Create New Reseller'}
                  </span>
                </h2>

                <form onSubmit={handleCreateReseller} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      Reseller Username
                    </label>
                    <input
                      type="text"
                      value={resellerUsername}
                      onChange={(e) => setResellerUsername(e.target.value)}
                      placeholder="reseller_01"
                      className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Password
                    </label>
                    <input
                      type="text"
                      value={resellerPassword}
                      onChange={(e) => setResellerPassword(e.target.value)}
                      placeholder="securepass123"
                      className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="hidden xs:inline">{editingResellerId ? 'Update' : 'Create'}</span>
                    </button>
                    {editingResellerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingResellerId(null);
                          setResellerUsername('');
                          setResellerPassword('');
                        }}
                        className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-slate-700/50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Resellers List - Mobile Optimized */}
              <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl shadow-emerald-900/10">
                <div className="p-3 md:p-5 lg:p-6 border-b border-emerald-500/10">
                  <h2 className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-2">
                    <Store className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    <span className="hidden xs:inline">Reseller Management</span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {resellers.length} total
                    </span>
                  </h2>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-emerald-500/5">
                  {resellers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No resellers found. Create your first reseller above.
                    </div>
                  ) : (
                    resellers.map((reseller) => {
                      const userCount = getUsersByReseller(reseller.username);
                      const activeUserCount = userCount.filter(u => new Date(u.expiresAt) > new Date()).length;
                      
                      return (
                        <div key={reseller._id} className="p-4 hover:bg-emerald-500/5 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 flex items-center justify-center text-sm font-bold text-emerald-300 border border-emerald-500/20 flex-shrink-0">
                                {reseller.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{reseller.username}</p>
                                <p className="text-xs text-slate-400 font-mono truncate">{reseller.password}</p>
                              </div>
                            </div>
                          </div>

                          {/* Reseller Details */}
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{new Date(reseller.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Users className="w-3.5 h-3.5 text-blue-400" />
                              <span>Users: {userCount.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Active: {activeUserCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Hash className="w-3.5 h-3.5 text-slate-400" />
                              <span>ID: {reseller._id.slice(-6)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('users');
                                setSearchTerm(reseller.username);
                                showToast(`Showing users for ${reseller.username}`, 'info');
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-medium transition"
                            >
                              <Users className="w-3.5 h-3.5" />
                              View Users
                            </button>
                            <button
                              onClick={() => handleDeleteReseller(reseller._id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium transition"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#060a17]/60 text-slate-400 text-xs uppercase tracking-wider border-b border-emerald-500/10">
                        <th className="p-4 pl-6 font-medium">Reseller</th>
                        <th className="p-4 font-medium">Password</th>
                        <th className="p-4 font-medium">Created At</th>
                        <th className="p-4 font-medium">Total Users</th>
                        <th className="p-4 font-medium">Active Users</th>
                        <th className="p-4 text-right pr-6 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/5">
                      {resellers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No resellers found. Create your first reseller above.
                          </td>
                        </tr>
                      ) : (
                        resellers.map((reseller) => {
                          const userCount = getUsersByReseller(reseller.username);
                          const activeUserCount = userCount.filter(u => new Date(u.expiresAt) > new Date()).length;
                          
                          return (
                            <tr key={reseller._id} className="hover:bg-emerald-500/5 transition duration-200 group">
                              <td className="p-4 pl-6 font-medium text-slate-200 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 flex items-center justify-center text-xs font-bold text-emerald-300 border border-emerald-500/20">
                                  {reseller.username.charAt(0).toUpperCase()}
                                </div>
                                {reseller.username}
                              </td>
                              <td className="p-4 text-slate-400 font-mono text-xs">{reseller.password}</td>
                              <td className="p-4 text-slate-400 text-xs">
                                {new Date(reseller.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  <Users className="w-3 h-3" />
                                  {userCount.length}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  activeUserCount > 0 
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  <CheckCircle className="w-3 h-3" />
                                  {activeUserCount}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex flex-wrap justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setActiveTab('users');
                                      setSearchTerm(reseller.username);
                                      showToast(`Showing users for ${reseller.username}`, 'info');
                                    }}
                                    className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex items-center gap-1"
                                  >
                                    <Users className="w-3 h-3" />
                                    View Users
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReseller(reseller._id)}
                                    className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/10 flex items-center gap-1"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Server Status */}
              <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                  <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <Server className="w-4 h-4 md:w-5 md:h-5" />
                  Server Status
                </h2>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 gap-3 sm:gap-0">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-slate-300">Current Status</p>
                      <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                        serverStatus === 'online' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        {serverStatus === 'online' ? (
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3 h-3" />
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => updateServerStatus(serverStatus === 'online' ? 'offline' : 'online')}
                      disabled={serverControlLoading}
                      className={`w-full sm:w-auto px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        serverStatus === 'online'
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/20'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {serverControlLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                      ) : serverStatus === 'online' ? (
                        <>
                          <Ban className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Take Offline
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Bring Online
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-2">
                    {serverStatus === 'online' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                        Users can currently login and use the application.
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400" />
                        Server is offline. No users can login.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Version Control */}
              <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                  <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <Cpu className="w-4 h-4 md:w-5 md:h-5" />
                  Version Management
                </h2>

                <div className="space-y-4">
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10">
                    <p className="text-xs md:text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                      Current Required Version
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <code className="px-3 md:px-4 py-1.5 md:py-2 bg-[#060a17] rounded-xl text-blue-300 font-mono text-xs md:text-sm border border-blue-500/20 flex items-center gap-2">
                        <HardDrive className="w-3 h-3" />
                        {requiredVersion}
                      </code>
                      <span className="text-[10px] md:text-xs text-slate-500">Clients must match this version</span>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10">
                    <p className="text-xs md:text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                      Update Required Version
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <input
                        type="text"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="flex-1 bg-[#060a17]/80 border border-blue-500/20 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition"
                      />
                      <button
                        onClick={updateVersion}
                        disabled={versionLoading || newVersion === requiredVersion}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {versionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        )}
                        Update
                      </button>
                    </div>
                    <p className="text-[10px] md:text-xs text-amber-400/80 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Changing version will require all clients to update
                    </p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                  <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <Activity className="w-4 h-4 md:w-5 md:h-5" />
                  System Overview
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 text-center group hover:border-blue-500/30 transition-all">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-300 mt-0.5 md:mt-1">{users.length}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 text-center group hover:border-blue-500/30 transition-all">
                    <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mx-auto mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Devices</p>
                    <p className="text-lg md:text-2xl font-bold text-purple-300 mt-0.5 md:mt-1">{totalDevices}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 text-center group hover:border-blue-500/30 transition-all">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Active</p>
                    <p className="text-lg md:text-2xl font-bold text-emerald-300 mt-0.5 md:mt-1">{activeUsers}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 text-center group hover:border-blue-500/30 transition-all">
                    <Store className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Resellers</p>
                    <p className="text-lg md:text-2xl font-bold text-emerald-300 mt-0.5 md:mt-1">{resellers.length}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#060a17]/60 rounded-2xl border border-blue-500/10 text-center group hover:border-blue-500/30 transition-all">
                    <Server className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 group-hover:scale-110 transition-transform ${serverStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Status</p>
                    <p className={`text-lg md:text-2xl font-bold mt-0.5 md:mt-1 ${serverStatus === 'online' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {serverStatus === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Missing Lock component for login screen
const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);