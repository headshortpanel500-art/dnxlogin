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
  Hash,
  Lock,
  Sparkles,
  Star,
  Gauge,
  ShieldCheck,
  Crown,
  Rocket
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
    if (!username || (!editingId && !password)) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingId) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingId, 
            username, 
            password: password || undefined, 
            durationDays, 
            deviceLimit,
            createdBy: selectedReseller || 'admin'
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('User updated successfully!');
          setEditingId(null);
          setUsername('');
          setPassword('');
          setDurationDays(30);
          setDeviceLimit(0);
          setSelectedReseller('');
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
          setUsername('');
          setPassword('');
          setDurationDays(30);
          setDeviceLimit(0);
          setSelectedReseller('');
        } else {
          showToast(data.error || 'Username already exists', 'error');
        }
      }

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
    setDurationDays(Math.ceil((new Date(user.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    setDeviceLimit(user.deviceLimit || 0);
    setSelectedReseller(user.createdBy || '');
    if (window.innerWidth < 768) {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (userId: string) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

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
      <div className="min-h-screen bg-[#05080f] text-slate-400 flex items-center justify-center font-sans relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse shadow-[0_0_80px_rgba(59,130,246,0.5)] flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-4 bg-blue-500/20 rounded-3xl blur-2xl animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-sm font-medium tracking-[0.3em] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              ESTABLISHING SECURE CONNECTION
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05080f] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-3xl animate-pulse [animation-delay:4s]"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse"></div>
            <div className="relative bg-[#0a0f1f]/90 backdrop-blur-2xl p-8 rounded-3xl border border-blue-500/20 shadow-2xl">
              <div className="mb-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-75 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.3)]">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DNX DYNAMICX
                </h1>
                <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Administrator Authentication Required
                  <Sparkles className="w-3 h-3 text-pink-400" />
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center backdrop-blur-sm flex items-center justify-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full bg-[#05080f]/80 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#05080f]/80 border border-blue-500/30 rounded-xl px-4 py-3.5 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/50"
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
                  className="relative w-full overflow-hidden group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-4 px-4 rounded-xl text-sm transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">
                    {loginLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <RefreshCw className="animate-spin h-4 w-4" />
                        Authenticating
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Rocket className="w-4 h-4" />
                        Launch Dashboard
                      </span>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                <Lock className="w-3 h-3" />
                <span>256-bit Encrypted Connection</span>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400/60">Secure</span>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-100 font-sans relative overflow-hidden selection:bg-purple-500/30 selection:text-white">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-[40%] -left-[20%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-pink-600/5 rounded-full blur-3xl animate-pulse [animation-delay:4s]"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwxMzAsMjQ2LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0f1f]/95 backdrop-blur-2xl border-b border-blue-500/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-xl"></div>
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
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
        <div className="md:hidden fixed inset-0 z-40 bg-[#05080f]/95 backdrop-blur-2xl pt-20 px-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Users className="w-5 h-5" />
              Users ({users.length})
            </button>
            <button
              onClick={() => { setActiveTab('resellers'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'resellers' 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-l-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Store className="w-5 h-5" />
              Resellers ({resellers.length})
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <div className="w-full max-w-xs border-t border-blue-500/10 pt-4 mt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                <span className="text-xs text-slate-400">{serverStatus === 'online' ? 'System Online' : 'System Offline'}</span>
              </div>
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all mt-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-72 bg-[#0a0f1f]/95 backdrop-blur-2xl border-r border-blue-500/10 flex-col items-center lg:items-start p-4 z-50 transition-all duration-500 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 mt-2 w-full">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -inset-2 bg-blue-500/20 rounded-2xl blur-2xl animate-pulse"></div>
          </div>
          <span className="hidden lg:block text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            DYNAMICX
          </span>
        </div>

        <nav className="w-full space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Users</span>
            <span className="hidden lg:inline ml-auto text-xs bg-blue-500/20 px-2.5 py-0.5 rounded-full text-blue-300 border border-blue-500/20">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resellers')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'resellers'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-l-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Resellers</span>
            <span className="hidden lg:inline ml-auto text-xs bg-emerald-500/20 px-2.5 py-0.5 rounded-full text-emerald-300 border border-emerald-500/20">
              {resellers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </nav>

        <div className="mt-auto w-full pt-4 border-t border-blue-500/10 space-y-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
            <span className="text-xs text-slate-400">{serverStatus === 'online' ? 'System Online' : 'System Offline'}</span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-20 lg:ml-72 p-3 md:p-6 lg:p-8 pt-20 md:pt-6 relative">
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 md:space-y-8">
          {/* Toast Alert */}
          {message && (
            <div
              className={`fixed top-20 md:top-6 right-3 md:right-6 z-50 px-5 md:px-6 py-4 md:py-5 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs md:text-sm font-medium transition-all duration-500 flex items-center gap-3 max-w-[90vw] md:max-w-md animate-slideIn ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 shadow-[0_0_40px_rgba(52,211,153,0.2)]'
                  : message.type === 'error'
                  ? 'bg-rose-500/20 border-rose-400/30 text-rose-200 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
                  : 'bg-blue-500/20 border-blue-400/30 text-blue-200 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : 
               message.type === 'error' ? <XCircle className="w-5 h-5 flex-shrink-0" /> : 
               <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="break-words">{message.text}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-blue-500/10">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-8 h-8 text-blue-400" />
                  <div className="absolute -inset-1 bg-blue-400/20 rounded-full blur-xl"></div>
                </div>
                Dashboard
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1 ml-1 tracking-wide flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Manage users, resellers, and server settings from one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1f]/80 rounded-2xl border border-blue-500/10 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`}></div>
                <span className="text-xs text-slate-400 font-medium">{serverStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-500/10">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-slate-400 font-medium">Admin</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Ultra Glow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#0a0f1f]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl border border-blue-500/10 p-4 md:p-5 shadow-2xl shadow-blue-900/5 hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">Total Users</p>
                  <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent mt-1 md:mt-2">{users.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#0a0f1f]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl border border-emerald-500/10 p-4 md:p-5 shadow-2xl shadow-emerald-900/5 hover:shadow-emerald-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">Active</p>
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent mt-1 md:mt-2">{activeUsers}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#0a0f1f]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl border border-purple-500/10 p-4 md:p-5 shadow-2xl shadow-purple-900/5 hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">Devices</p>
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent mt-1 md:mt-2">{totalDevices}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#0a0f1f]/90 to-[#0c1428]/90 backdrop-blur-2xl rounded-2xl border border-pink-500/10 p-4 md:p-5 shadow-2xl shadow-pink-900/5 hover:shadow-pink-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">Resellers</p>
                  <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <Store className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent mt-1 md:mt-2">{resellers.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {/* Form Card - Ultra Glow */}
              <div id="form-section" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
                  
                  <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    {editingId ? (
                      <span className="flex items-center gap-2 text-sm md:text-base">
                        <Edit className="w-5 h-5 text-blue-400" />
                        Edit License
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-sm md:text-base">
                        <Plus className="w-5 h-5 text-blue-400" />
                        Generate New License
                      </span>
                    )}
                  </h2>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-5">
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="client_01"
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        {editingId ? 'New Password' : 'Password'}
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editingId ? 'optional' : 'secret123'}
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40"
                        required={!editingId}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        min="1"
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        Device Limit
                      </label>
                      <select
                        value={deviceLimit}
                        onChange={(e) => setDeviceLimit(Number(e.target.value))}
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40 cursor-pointer"
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
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <UserCog className="w-3 h-3" />
                        Created By
                      </label>
                      <select
                        value={selectedReseller}
                        onChange={(e) => setSelectedReseller(e.target.value)}
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40 cursor-pointer"
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
                        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
                      >
                        {editingId ? (
                          <>
                            <Save className="w-4 h-4" />
                            <span className="hidden xs:inline">Save Changes</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span className="hidden xs:inline">Create License</span>
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
                          className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-slate-700/50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Table Card - Ultra Glow */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl rounded-3xl border border-blue-500/10 overflow-hidden shadow-2xl shadow-blue-900/10">
                  <div className="p-4 md:p-6 border-b border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h2 className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      </div>
                      <span className="hidden xs:inline">Registered Credentials</span>
                      <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-1 bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
                        {filteredUsers.length}
                      </span>
                    </h2>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search username..."
                        className="w-full bg-[#05080f]/80 border border-blue-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40"
                      />
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-blue-500/5">
                    {loading ? (
                      <div className="p-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                          Loading credentials...
                        </div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
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
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-base font-bold text-blue-300 border border-blue-500/30">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-xl"></div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">{user.username}</p>
                                  <p className="text-xs text-slate-400 font-mono truncate">{user.password || '••••••••'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                    isExpired
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                      : isDeviceLimitReached && deviceLimit > 0
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                    isExpired ? 'bg-rose-400 shadow-rose-400/50' : 
                                    isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                                  }`}></span>
                                  {isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}
                                </span>
                                <button
                                  onClick={() => toggleDropdown(user._id)}
                                  className="p-2 rounded-xl hover:bg-slate-800/50 transition"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <UserCog className="w-3.5 h-3.5 text-emerald-400" />
                                <span className={user.createdBy === 'admin' ? 'text-blue-300' : 'text-emerald-300'}>
                                  {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy || 'Unknown'}`}
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
                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                  isExpired ? 'bg-rose-400 shadow-rose-400/50' : 
                                  isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                                }`}></div>
                                <span>{isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}</span>
                              </div>
                              <div className="col-span-2 flex items-center gap-1.5 text-slate-400 truncate">
                                {hasHwid ? (
                                  <>
                                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span className="truncate font-mono text-[10px] text-emerald-300/80">
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

                            {activeDropdown === user._id && (
                              <div ref={dropdownRef} className="mt-3 p-2 bg-[#0a0f1f]/95 rounded-xl border border-blue-500/10 shadow-2xl grid grid-cols-2 gap-1.5">
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
                                      onClick={() => handleClearAllHwids(user.username)}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Clear
                                    </button>
                                    <button
                                      onClick={() => handleResetHwid(user.username)}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition col-span-2"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Reset HWID
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(user._id)}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium transition ${!hasHwid ? 'col-span-2' : ''}`}
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
                        <tr className="bg-[#05080f]/60 text-slate-400 text-xs uppercase tracking-widest border-b border-blue-500/10">
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
                            <td colSpan={9} className="p-12 text-center text-slate-500">
                              <div className="flex items-center justify-center gap-3">
                                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                                Loading credentials...
                              </div>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-12 text-center text-slate-500">
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
                                <td className="p-4 pl-6 font-medium text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-500/30">
                                        {user.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition"></div>
                                    </div>
                                    {user.username}
                                  </div>
                                </td>
                                <td className="p-4 text-slate-400 font-mono text-xs">{user.password || '••••••••'}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    user.createdBy === 'admin' 
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}>
                                    {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy || 'Unknown'}`}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    deviceLimit === 0
                                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                      : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                  }`}>
                                    {deviceLimit === 0 ? '♾️ Unlimited' : `📱 ${deviceLimit}`}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    deviceCount > 0
                                      ? isDeviceLimitReached
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
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
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                      isExpired
                                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                        : isDeviceLimitReached && deviceLimit > 0
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                      isExpired ? 'bg-rose-400 shadow-rose-400/50' : 
                                      isDeviceLimitReached && deviceLimit > 0 ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
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
                                  <div className="flex flex-wrap justify-end gap-1.5">
                                    <button
                                      onClick={() => handleEdit(user)}
                                      className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Edit
                                    </button>
                                    {hasHwid && (
                                      <>
                                        <button
                                          onClick={() => handleClearAllHwids(user.username)}
                                          className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-1"
                                          title="Clear all registered devices"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Clear
                                        </button>
                                        <button
                                          onClick={() => handleResetHwid(user.username)}
                                          className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-1"
                                          title="Reset HWID"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          Reset
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleDelete(user._id)}
                                      className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center gap-1"
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
            </>
          )}

          {/* Resellers Tab Content */}
          {activeTab === 'resellers' && (
            <>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-emerald-500/10 shadow-2xl shadow-emerald-900/10 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl"></div>
                  
                  <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-emerald-200 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <UserPlus className="w-5 h-5 text-emerald-400" />
                      {editingResellerId ? 'Edit Reseller' : 'Create New Reseller'}
                    </span>
                  </h2>

                  <form onSubmit={handleCreateReseller} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        Reseller Username
                      </label>
                      <input
                        type="text"
                        value={resellerUsername}
                        onChange={(e) => setResellerUsername(e.target.value)}
                        placeholder="reseller_01"
                        className="w-full bg-[#05080f]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 hover:border-emerald-500/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        Password
                      </label>
                      <input
                        type="text"
                        value={resellerPassword}
                        onChange={(e) => setResellerPassword(e.target.value)}
                        placeholder="securepass123"
                        className="w-full bg-[#05080f]/80 border border-emerald-500/20 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 hover:border-emerald-500/40"
                        required
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden xs:inline">{editingResellerId ? 'Update Reseller' : 'Create Reseller'}</span>
                      </button>
                      {editingResellerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingResellerId(null);
                            setResellerUsername('');
                            setResellerPassword('');
                          }}
                          className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-slate-700/50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl shadow-emerald-900/10">
                  <div className="p-4 md:p-6 border-b border-emerald-500/10">
                    <h2 className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Store className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                      </div>
                      <span className="hidden xs:inline">Reseller Management</span>
                      <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-1 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                        {resellers.length} total
                      </span>
                    </h2>
                  </div>

                  <div className="md:hidden divide-y divide-emerald-500/5">
                    {resellers.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
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
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-base font-bold text-emerald-300 border border-emerald-500/30">
                                    {reseller.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xl"></div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">{reseller.username}</p>
                                  <p className="text-xs text-slate-400 font-mono truncate">{reseller.password}</p>
                                </div>
                              </div>
                            </div>

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

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#05080f]/60 text-slate-400 text-xs uppercase tracking-widest border-b border-emerald-500/10">
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
                            <td colSpan={6} className="p-12 text-center text-slate-500">
                              No resellers found. Create your first reseller above.
                            </td>
                          </tr>
                        ) : (
                          resellers.map((reseller) => {
                            const userCount = getUsersByReseller(reseller.username);
                            const activeUserCount = userCount.filter(u => new Date(u.expiresAt) > new Date()).length;
                            
                            return (
                              <tr key={reseller._id} className="hover:bg-emerald-500/5 transition duration-200 group">
                                <td className="p-4 pl-6 font-medium text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 border border-emerald-500/30">
                                        {reseller.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition"></div>
                                    </div>
                                    {reseller.username}
                                  </div>
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
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                    <Users className="w-3 h-3" />
                                    {userCount.length}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    activeUserCount > 0 
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                  }`}>
                                    <CheckCircle className="w-3 h-3" />
                                    {activeUserCount}
                                  </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                  <div className="flex flex-wrap justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setActiveTab('users');
                                        setSearchTerm(reseller.username);
                                        showToast(`Showing users for ${reseller.username}`, 'info');
                                      }}
                                      className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3" />
                                      View Users
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReseller(reseller._id)}
                                      className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center gap-1"
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
              </div>
            </>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                  <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <Server className="w-5 h-5 text-blue-400" />
                    Server Status
                  </h2>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#05080f]/60 rounded-2xl border border-blue-500/10 gap-3 sm:gap-0">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-slate-300">Current Status</p>
                        <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-semibold border ${
                          serverStatus === 'online' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${serverStatus === 'online' ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse' : 'bg-rose-400 shadow-rose-400/50'}`}></span>
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
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                          serverStatus === 'online'
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/20 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {serverControlLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : serverStatus === 'online' ? (
                          <>
                            <Ban className="w-4 h-4" />
                            Take Offline
                          </>
                        ) : (
                          <>
                            <Wifi className="w-4 h-4" />
                            Bring Online
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-2">
                      {serverStatus === 'online' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Users can currently login and use the application.
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          Server is offline. No users can login.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                  <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <Cpu className="w-5 h-5 text-purple-400" />
                    Version Management
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-[#05080f]/60 rounded-2xl border border-blue-500/10">
                      <p className="text-xs md:text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Current Required Version
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <code className="px-4 py-2 bg-[#05080f] rounded-xl text-blue-300 font-mono text-xs md:text-sm border border-blue-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                          <HardDrive className="w-3 h-3" />
                          {requiredVersion}
                        </code>
                        <span className="text-[10px] md:text-xs text-slate-500">Clients must match this version</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#05080f]/60 rounded-2xl border border-blue-500/10">
                      <p className="text-xs md:text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        Update Required Version
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <input
                          type="text"
                          value={newVersion}
                          onChange={(e) => setNewVersion(e.target.value)}
                          placeholder="1.0.0"
                          className="flex-1 bg-[#05080f]/80 border border-blue-500/20 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/40"
                        />
                        <button
                          onClick={updateVersion}
                          disabled={versionLoading || newVersion === requiredVersion}
                          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {versionLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
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
              </div>

              <div className="lg:col-span-2 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-gradient-to-br from-[#0a0f1f]/95 to-[#0c1428]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-blue-500/10 shadow-2xl shadow-blue-900/10">
                  <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-200 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <Activity className="w-5 h-5 text-blue-400" />
                    System Overview
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    {[
                      { icon: Users, label: 'Total Users', value: users.length, color: 'blue' },
                      { icon: Smartphone, label: 'Devices', value: totalDevices, color: 'purple' },
                      { icon: CheckCircle, label: 'Active', value: activeUsers, color: 'emerald' },
                      { icon: Store, label: 'Resellers', value: resellers.length, color: 'teal' },
                      { icon: Server, label: 'Status', value: serverStatus === 'online' ? 'Online' : 'Offline', color: serverStatus === 'online' ? 'emerald' : 'rose' },
                    ].map((stat, idx) => (
                      <div key={idx} className="relative group/stat">
                        <div className="absolute -inset-1 bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-2xl blur-xl opacity-0 group-hover/stat:opacity-100 transition duration-500"></div>
                        <div className="relative p-4 bg-[#05080f]/60 rounded-2xl border border-${stat.color}-500/10 text-center hover:border-${stat.color}-500/30 transition-all duration-300">
                          <div className={`p-2 bg-${stat.color}-500/10 rounded-xl border border-${stat.color}-500/20 w-fit mx-auto mb-2 group-hover/stat:scale-110 transition-transform shadow-[0_0_20px_rgba(${stat.color === 'blue' ? '59,130,246' : stat.color === 'purple' ? '168,85,247' : stat.color === 'emerald' ? '52,211,153' : stat.color === 'teal' ? '20,184,166' : '244,63,94'},0.2)]`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                          </div>
                          <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className={`text-lg md:text-2xl font-bold text-${stat.color}-300 mt-0.5 md:mt-1`}>
                            {stat.value}
                          </p>
                          <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-${stat.color}-500/50 to-transparent`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}