// app/reseller/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  LogOut, 
  Shield, 
  Activity,
  Key,
  Smartphone,
  Monitor,
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
  Store,
  Info,
  Menu,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  Fingerprint,
  CreditCard
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

export default function ResellerDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resellerInfo, setResellerInfo] = useState<{ username: string } | null>(null);

  // Dashboard State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deviceLimit, setDeviceLimit] = useState<number>(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    const checkAuth = () => {
      const auth = localStorage.getItem('resellerAuth');
      const username = localStorage.getItem('resellerUsername');
      
      if (auth === 'true' && username) {
        setIsAuthenticated(true);
        setResellerInfo({ username });
        fetchUsers();
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleResellerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resellerUsername, password: resellerPassword }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('resellerAuth', 'true');
        localStorage.setItem('resellerUsername', resellerUsername);
        
        setIsAuthenticated(true);
        setResellerInfo({ username: resellerUsername });
        fetchUsers();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResellerLogout = async () => {
    try {
      await fetch('/api/reseller/logout', { method: 'POST' });
      localStorage.removeItem('resellerAuth');
      localStorage.removeItem('resellerUsername');
      setIsAuthenticated(false);
      setResellerInfo(null);
      setResellerUsername('');
      setResellerPassword('');
      showToast('Logged out successfully');
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const username = localStorage.getItem('resellerUsername');
      const res = await fetch(`/api/reseller/users?reseller=${username}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || (!editingId && !password)) return;

    try {
      const reseller = localStorage.getItem('resellerUsername');
      
      if (editingId) {
        const res = await fetch('/api/reseller/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingId, 
            username, 
            password, 
            durationDays, 
            deviceLimit: 1,
            reseller
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
        const res = await fetch('/api/reseller/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username, 
            password, 
            durationDays, 
            deviceLimit: 1,
            reseller
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
      setDeviceLimit(1);
      fetchUsers();
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const reseller = localStorage.getItem('resellerUsername');
      const res = await fetch('/api/reseller/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reseller }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('User deleted successfully');
        fetchUsers();
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
      const reseller = localStorage.getItem('resellerUsername');
      const res = await fetch('/api/reseller/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, reseller }),
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
      const reseller = localStorage.getItem('resellerUsername');
      const res = await fetch('/api/reseller/clear-hwids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, reseller }),
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
    setDurationDays(30);
    setDeviceLimit(1);
    // Scroll to form on mobile
    if (window.innerWidth < 768) {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (userId: string) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDevices = users.reduce((acc, u) => acc + (u.registeredHwids ? u.registeredHwids.length : (u.hwid && u.hwid !== 'null' && u.hwid !== '' ? 1 : 0)), 0);
  const activeUsers = users.filter(u => new Date(u.expiresAt) > new Date()).length;
  const expiredUsers = users.filter(u => new Date(u.expiresAt) < new Date()).length;

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-400 flex items-center justify-center font-sans">
        <div className="relative flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50"></div>
          <div className="text-sm font-medium tracking-wider bg-gradient-to-r from-emerald-300 to-emerald-200 bg-clip-text text-transparent animate-pulse">
            Connecting to reseller panel...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0c1428]/90 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-900/30">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl"></div>
                <Store className="w-10 h-10 text-white relative z-10" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Reseller Panel
              </h1>
              <p className="text-slate-400 text-sm mt-1">Manage your licenses 💫</p>
            </div>

            {loginError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium backdrop-blur-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleResellerLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Reseller Username
                </label>
                <input
                  type="text"
                  value={resellerUsername}
                  onChange={(e) => setResellerUsername(e.target.value)}
                  placeholder="Enter reseller username"
                  className="w-full bg-[#060a17]/80 border border-emerald-500/30 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition"
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
                    value={resellerPassword}
                    onChange={(e) => setResellerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060a17]/80 border border-emerald-500/30 rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition"
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
                className="relative w-full overflow-hidden group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
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
            Secured • Reseller Access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a1225]/95 backdrop-blur-xl border-b border-emerald-500/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
            Reseller Panel
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
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-full max-w-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-slate-300">Reseller: {resellerInfo?.username}</span>
            </div>
            <button
              onClick={handleResellerLogout}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-[#0a1225]/95 backdrop-blur-xl border-r border-emerald-500/10 flex-col items-center lg:items-start p-4 z-50 transition-all duration-300 shadow-2xl shadow-emerald-900/20">
        <div className="flex items-center gap-3 mb-10 mt-2 w-full">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-sm"></div>
            <Store className="w-6 h-6 text-white relative z-10" />
          </div>
          <span className="hidden lg:block text-lg font-bold bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
           DNX Reseller Panel
          </span>
        </div>

        <nav className="w-full space-y-2">
          <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-l-2 border-emerald-400 shadow-lg shadow-emerald-500/10">
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">My Users</span>
            <span className="hidden lg:inline ml-auto text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
              {users.length}
            </span>
          </div>
        </nav>

        <div className="mt-auto w-full pt-4 border-t border-emerald-500/10 space-y-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-slate-400">Reseller: {resellerInfo?.username}</span>
          </div>
          <button
            onClick={handleResellerLogout}
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
        <div className="fixed -top-64 -right-64 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-64 -left-64 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-emerald-500/10">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                Reseller Panel
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1 ml-1 tracking-wide">
                Manage your created licenses and monitor their status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#0a1225]/80 rounded-2xl border border-emerald-500/10">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] md:text-xs text-slate-400">Connected</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/10 p-4 md:p-5 shadow-xl shadow-emerald-900/5 hover:shadow-emerald-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Users</p>
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-300 mt-1 md:mt-2">{users.length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/10 p-4 md:p-5 shadow-xl shadow-emerald-900/5 hover:shadow-emerald-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Active Users</p>
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-300 mt-1 md:mt-2">{activeUsers}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/10 p-4 md:p-5 shadow-xl shadow-emerald-900/5 hover:shadow-emerald-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Devices</p>
                <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-purple-300 mt-1 md:mt-2">{totalDevices}</p>
            </div>
            <div className="bg-gradient-to-br from-[#0a1225]/80 to-[#0c1428]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/10 p-4 md:p-5 shadow-xl shadow-emerald-900/5 hover:shadow-emerald-500/10 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Expired</p>
                <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-rose-300 mt-1 md:mt-2">{expiredUsers}</p>
            </div>
          </div>

          {/* Form Card */}
          <div id="form-section" className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-emerald-500/10 shadow-2xl shadow-emerald-900/10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-emerald-200 flex items-center gap-3">
              <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
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
                  className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
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
                  className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
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
                  className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
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
                      setDeviceLimit(1);
                    }}
                    className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-2.5 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-slate-700/50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Info Banner */}
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-2 md:gap-3">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs md:text-sm text-emerald-300 font-medium">Device Limit: 1 Device</p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">
                  As a reseller, each user can only have 1 device. This is fixed and cannot be changed.
                </p>
              </div>
            </div>
          </div>

          {/* Table Card - Mobile Optimized */}
          <div className="bg-gradient-to-br from-[#0a1225]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl shadow-emerald-900/10">
            <div className="p-3 md:p-5 lg:p-6 border-b border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
              <h2 className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                <span className="hidden xs:inline">My Credentials</span>
                <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
                  className="w-full bg-[#060a17]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-[10px] md:text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-emerald-500/5">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                    Loading...
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No credentials found. Create your first user above.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isExpired = new Date(user.expiresAt) < new Date();
                  const hasHwid = user.hwid && user.hwid !== 'null' && user.hwid !== '';
                  const deviceCount = user.registeredHwids ? user.registeredHwids.length : (hasHwid ? 1 : 0);
                  const deviceLimit = user.deviceLimit || 1;
                  const isDeviceLimitReached = deviceLimit > 0 && deviceCount >= deviceLimit;

                  return (
                    <div key={user._id} className="p-4 hover:bg-emerald-500/5 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-sm font-bold text-emerald-300 border border-emerald-500/20 flex-shrink-0">
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
                          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                          <span>{deviceCount > 0 ? `${deviceCount}/1` : 'No devices'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{new Date(user.expiresAt).toLocaleDateString()}</span>
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
                        <div ref={dropdownRef} className="mt-3 p-2 bg-[#0a1225]/90 rounded-xl border border-emerald-500/10 shadow-xl grid grid-cols-2 gap-1.5">
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
                  <tr className="bg-[#060a17]/60 text-slate-400 text-xs uppercase tracking-wider border-b border-emerald-500/10">
                    <th className="p-4 pl-6 font-medium">User</th>
                    <th className="p-4 font-medium">Password</th>
                    <th className="p-4 font-medium">Device Limit</th>
                    <th className="p-4 font-medium">Devices</th>
                    <th className="p-4 font-medium">HWID</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Expires</th>
                    <th className="p-4 text-right pr-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/5">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                          Loading credentials...
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No credentials found. Create your first user above.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isExpired = new Date(user.expiresAt) < new Date();
                      const hasHwid = user.hwid && user.hwid !== 'null' && user.hwid !== '';
                      const deviceCount = user.registeredHwids ? user.registeredHwids.length : (hasHwid ? 1 : 0);
                      const deviceLimit = user.deviceLimit || 1;
                      const isDeviceLimitReached = deviceLimit > 0 && deviceCount >= deviceLimit;

                      return (
                        <tr key={user._id} className="hover:bg-emerald-500/5 transition duration-200 group">
                          <td className="p-4 pl-6 font-medium text-slate-200 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-xs font-bold text-emerald-300 border border-emerald-500/20">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            {user.username}
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-xs">{user.password || '••••••••'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              📱 1
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
                              {deviceCount > 0 ? `📱 ${deviceCount}/1` : 'No devices'}
                              {isDeviceLimitReached && ' 🔒'}
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
        </div>
      </main>
    </div>
  );
}

// Missing Lock component
const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);