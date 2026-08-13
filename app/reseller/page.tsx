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
  CreditCard,
  Sparkles,
  Rainbow,
  Crown,
  Swords,
  Target,
  Radar,
  Crosshair,
  Gem
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

  const gradientText = "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent";
  const cardBorder = "border border-white/10 hover:border-purple-500/50";

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
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 animate-pulse shadow-[0_0_40px_rgba(168,85,247,0.3)] flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl animate-pulse"></div>
          </div>
          <div className="text-sm font-medium tracking-wider bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 bg-clip-text text-transparent animate-pulse">
            Connecting to reseller panel...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNjgsODUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse"></div>
            <div className="relative bg-[#0a0a1a]/95 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="mb-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-2xl opacity-75 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.2)]">
                    <Store className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className={`text-3xl font-bold ${gradientText}`}>Reseller Panel</h1>
                <p className="text-white/40 text-sm mt-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  Manage your licenses
                  <Sparkles className="w-3 h-3 text-blue-400" />
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center backdrop-blur-sm flex items-center justify-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleResellerLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    reseller username
                  </label>
                  <input
                    type="text"
                    value={resellerUsername}
                    onChange={(e) => setResellerUsername(e.target.value)}
                    placeholder="Enter reseller username"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={resellerPassword}
                      onChange={(e) => setResellerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="relative w-full overflow-hidden group bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400 text-white font-bold py-4 px-4 rounded-xl text-sm transition-all duration-300 shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">
                    {loginLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <RefreshCw className="animate-spin h-4 w-4" />
                        Authenticating
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Swords className="w-4 h-4" />
                        Access Panel
                      </span>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-white/20">
                <Lock className="w-3 h-3" />
                <span>encrypted connection</span>
                <div className="w-1 h-1 rounded-full bg-white/20"></div>
                <ShieldCheck className="w-3 h-3 text-green-400" />
                <span className="text-green-400/40">secure</span>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/10 mt-6 tracking-widest uppercase flex items-center justify-center gap-2">
            <Rainbow className="w-3 h-3" />
            Reseller Access • ADIAT X
          </p>
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
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNjgsODUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[40%] -left-[20%] w-[800px] h-[800px] bg-pink-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-purple-500/20 rounded-xl blur-xl"></div>
          </div>
          <span className={`text-sm font-bold ${gradientText}`}>Reseller Panel</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white/60 hover:text-white transition p-2 rounded-xl hover:bg-white/5 border border-white/10"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0a0a1a]/98 backdrop-blur-2xl pt-20 px-6">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 w-full max-w-xs">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              <span className={`text-sm ${gradientText}`}>Reseller: {resellerInfo?.username}</span>
            </div>
            <button
              onClick={handleResellerLogout}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-[#0a0a1a]/95 backdrop-blur-2xl border-r border-white/10 flex-col items-center lg:items-start p-4 z-50 transition-all duration-500 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 mt-2 w-full">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.2)]">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-2 bg-purple-500/20 rounded-2xl blur-2xl animate-pulse"></div>
          </div>
          <span className={`hidden lg:block text-lg font-bold ${gradientText}`}>Reseller Panel</span>
        </div>

        <nav className="w-full space-y-2">
          <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 text-white border-l-2 border-purple-400 shadow-lg shadow-purple-500/10">
            <Users className="w-5 h-5 flex-shrink-0 text-purple-400" />
            <span className="hidden lg:inline">My Users</span>
            <span className="hidden lg:inline ml-auto text-xs bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-2.5 py-0.5 rounded-full text-purple-300 border border-purple-500/20">
              {users.length}
            </span>
          </div>
        </nav>

        <div className="mt-auto w-full pt-4 border-t border-white/10 space-y-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-xl border border-white/10">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            <span className="text-xs text-white/40">Reseller: {resellerInfo?.username}</span>
          </div>
          <button
            onClick={handleResellerLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-red-500/20"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-20 lg:ml-64 p-3 md:p-6 lg:p-8 pt-20 md:pt-6 relative">
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 md:space-y-8">
          {/* Toast Alert */}
          {message && (
            <div
              className={`fixed top-20 md:top-6 right-3 md:right-6 z-50 px-5 md:px-6 py-4 md:py-5 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs md:text-sm font-medium transition-all duration-500 flex items-center gap-3 max-w-[90vw] md:max-w-md animate-slideIn ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200 shadow-[0_0_40px_rgba(52,211,153,0.1)]'
                  : message.type === 'error'
                  ? 'bg-red-500/10 border-red-400/30 text-red-200 shadow-[0_0_40px_rgba(244,63,94,0.1)]'
                  : 'bg-blue-500/10 border-blue-400/30 text-blue-200 shadow-[0_0_40px_rgba(59,130,246,0.1)]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : 
               message.type === 'error' ? <XCircle className="w-5 h-5 flex-shrink-0" /> : 
               <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="break-words">{message.text}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-white/10">
            <div>
              <h1 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight ${gradientText} flex items-center gap-3`}>
                <div className="relative">
                  <Target className="w-8 h-8 text-purple-400" />
                  <div className="absolute -inset-1 bg-purple-400/20 rounded-full blur-xl"></div>
                </div>
                Reseller Panel
              </h1>
              <p className="text-white/30 text-xs md:text-sm mt-1 ml-1 tracking-wide flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-pink-400" />
                Manage your created licenses and monitor their status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                <span className="text-xs text-white/40">Connected</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full border border-white/10">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-white/40 font-medium">RESELLER</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-purple-900/5 hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Total Users</p>
                  <div className="p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <p className={`text-2xl md:text-3xl font-bold ${gradientText} mt-1 md:mt-2`}>{users.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-teal-900/5 hover:shadow-teal-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Active</p>
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1 md:mt-2">{activeUsers}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-blue-900/5 hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Devices</p>
                  <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Radar className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1 md:mt-2">{totalDevices}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-red-900/5 hover:shadow-red-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Expired</p>
                  <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 group-hover:scale-110 transition-transform">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-red-400 mt-1 md:mt-2">{expiredUsers}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div id="form-section" className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/10 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
              
              <h2 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 ${gradientText} flex items-center gap-3`}>
                <div className="w-1 h-6 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
                {editingId ? (
                  <span className="flex items-center gap-2 text-sm md:text-base">
                    <Edit className="w-5 h-5 text-pink-400" />
                    Edit License
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-sm md:text-base">
                    <Plus className="w-5 h-5 text-purple-400" />
                    Generate New License
                  </span>
                )}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="client_01"
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {editingId ? 'new password' : 'password'}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingId ? 'optional' : 'secret123'}
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                    required={!editingId}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    duration (days)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                    required
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
                  >
                    {editingId ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="hidden xs:inline">Update</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span className="hidden xs:inline">Generate</span>
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
                      className="bg-black/50 hover:bg-white/10 text-white/60 py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-white/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Info Banner */}
              <div className="mt-4 p-4 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 border border-white/10 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs md:text-sm font-medium ${gradientText}`}>Device Limit: 1 Device</p>
                  <p className="text-[10px] md:text-xs text-white/30 mt-0.5">
                    As a reseller, each user can only have 1 device. This is fixed and cannot be changed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-900/10">
              <div className="p-4 md:p-6 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className={`text-sm md:text-base font-bold ${gradientText} flex items-center gap-2`}>
                  <div className="p-1.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-purple-500/20">
                    <Database className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  </div>
                  <span className="hidden xs:inline">My Credentials</span>
                  <span className="text-[10px] md:text-xs text-white/30 font-normal ml-1 bg-white/5 px-3 py-0.5 rounded-full border border-white/10">
                    {filteredUsers.length}
                  </span>
                </h2>

                <div className="relative w-full sm:w-64 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search username..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30"
                  />
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/5">
                {loading ? (
                  <div className="p-12 text-center text-white/30">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                      Loading...
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-white/30">
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
                      <div key={user._id} className="p-4 hover:bg-white/5 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{user.username}</p>
                              <p className="text-xs text-white/30 truncate">{user.password || '••••••••'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                isExpired
                                  ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                  : isDeviceLimitReached && deviceLimit > 0
                                  ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isExpired ? 'bg-red-400' : 
                                isDeviceLimitReached && deviceLimit > 0 ? 'bg-yellow-400' : 'bg-emerald-400'
                              }`}></span>
                              {isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}
                            </span>
                            <button
                              onClick={() => toggleDropdown(user._id)}
                              className="p-1.5 rounded-xl hover:bg-white/5 transition"
                            >
                              <MoreVertical className="w-4 h-4 text-white/40" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="flex items-center gap-1.5 text-white/40">
                            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                            <span>{deviceCount > 0 ? `${deviceCount}/1` : 'No devices'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/40">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>{new Date(user.expiresAt).toLocaleDateString()}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 text-white/40 truncate">
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
                                <Ban className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                                <span className="text-white/20">Not Registered</span>
                              </>
                            )}
                          </div>
                        </div>

                        {activeDropdown === user._id && (
                          <div ref={dropdownRef} className="mt-3 p-2 bg-black/90 rounded-xl border border-white/10 shadow-2xl grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleEdit(user)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {hasHwid && (
                              <>
                                <button
                                  onClick={() => handleResetHwid(user.username)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-xs font-medium transition"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  Reset
                                </button>
                                <button
                                  onClick={() => handleClearAllHwids(user.username)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-medium transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Clear
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium transition col-span-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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
                    <tr className="bg-black/30 text-white/30 text-xs uppercase tracking-widest border-b border-white/10">
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
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-white/30">
                          <div className="flex items-center justify-center gap-3">
                            <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                            Loading...
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-white/30">
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
                          <tr key={user._id} className="hover:bg-white/5 transition duration-200 group">
                            <td className="p-4 pl-6 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                {user.username}
                              </div>
                            </td>
                            <td className="p-4 text-white/30 font-mono text-xs">{user.password || '••••••••'}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-purple-300 border border-purple-500/20">
                                📱 1
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                deviceCount > 0
                                  ? isDeviceLimitReached
                                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : 'bg-white/5 text-white/30 border-white/10'
                              }`}>
                                {deviceCount > 0 ? `📱 ${deviceCount}/1` : 'No devices'}
                                {isDeviceLimitReached && ' 🔒'}
                              </span>
                            </td>
                            <td className="p-4 text-white/30 font-mono text-xs">
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
                                <span className="text-white/20 flex items-center gap-1">
                                  <Ban className="w-3 h-3" />
                                  Not Registered
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                  isExpired
                                    ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                    : isDeviceLimitReached && deviceLimit > 0
                                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isExpired ? 'bg-red-400' : 
                                  isDeviceLimitReached && deviceLimit > 0 ? 'bg-yellow-400' : 'bg-emerald-400'
                                }`}></span>
                                {isExpired ? 'Expired' : 
                                 isDeviceLimitReached && deviceLimit > 0 ? 'Full' : 'Active'}
                              </span>
                              {user.hwidReset && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Reset Pending
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-white/40 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/20" />
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
                                  className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </button>
                                {hasHwid && (
                                  <>
                                    <button
                                      onClick={() => handleResetHwid(user.username)}
                                      className="bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-1"
                                      title="Reset HWID - Allows login from any device"
                                    >
                                      <Unlock className="w-3 h-3" />
                                      Reset
                                    </button>
                                    <button
                                      onClick={() => handleClearAllHwids(user.username)}
                                      className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-1"
                                      title="Clear all registered devices"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Clear
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(user._id)}
                                  className="bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center gap-1"
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

// Missing Lock component
const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
