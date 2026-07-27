// app/reseller/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LogOut, 
  Shield, 
  Key, 
  Smartphone,
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
  Database,
  UserPlus,
  Activity
} from 'lucide-react';

interface IUser {
  _id: string;
  username: string;
  password?: string;
  expiresAt: string;
  createdAt: string;
  deviceLimit?: number;
  createdBy?: string;
}

interface IResellerInfo {
  username: string;
  email: string;
  level: number;
  maxUsers: number;
  totalUsersCreated: number;
  activeUsersCount: number;
}

export default function ResellerPage() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [token, setToken] = useState('');

  // Dashboard State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resellerInfo, setResellerInfo] = useState<IResellerInfo | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deviceLimit, setDeviceLimit] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Toast
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Check reseller auth
  useEffect(() => {
    const savedToken = localStorage.getItem('resellerToken');
    if (savedToken) {
      setToken(savedToken);
      checkAuth(savedToken);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const checkAuth = async (authToken: string) => {
    try {
      const res = await fetch('/api/reseller/check-auth', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setResellerInfo(data.reseller);
        fetchUsers(authToken);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('resellerToken');
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Reseller Login
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
        setToken(data.token);
        localStorage.setItem('resellerToken', data.token);
        setIsAuthenticated(true);
        setResellerInfo(data.reseller);
        fetchUsers(data.token);
        showToast('Welcome back!', 'success');
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/reseller/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      localStorage.removeItem('resellerToken');
      setIsAuthenticated(false);
      setToken('');
      setResellerUsername('');
      setResellerPassword('');
      showToast('Logged out successfully');
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  // Fetch users
  const fetchUsers = async (authToken: string = token) => {
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
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

  // Create/Update User
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || (!editingId && !password)) return;

    try {
      const url = editingId ? '/api/reseller/users' : '/api/reseller/users';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, username, password, durationDays, deviceLimit }
        : { username, password, durationDays, deviceLimit };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(editingId ? 'User updated successfully!' : 'New user created successfully!');
        setEditingId(null);
        setUsername('');
        setPassword('');
        setDurationDays(30);
        setDeviceLimit(0);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to save user', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  // Delete User
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch('/api/reseller/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id }),
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

  const handleEdit = (user: IUser) => {
    setEditingId(user._id);
    setUsername(user.username);
    setPassword('');
    setDeviceLimit(user.deviceLimit || 0);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => new Date(u.expiresAt) > new Date()).length;

  // Loading Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-400 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0c1428]/90 backdrop-blur-2xl p-8 rounded-3xl border border-blue-500/20 shadow-2xl shadow-blue-900/30">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Reseller Panel
              </h1>
              <p className="text-slate-400 text-sm mt-1">Manage your users and licenses</p>
            </div>

            {loginError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleResellerLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3" />
                  Username
                </label>
                <input
                  type="text"
                  value={resellerUsername}
                  onChange={(e) => setResellerUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#060a17]/80 border border-blue-500/30 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Key className="w-3 h-3" />
                  Password
                </label>
                <input
                  type="password"
                  value={resellerPassword}
                  onChange={(e) => setResellerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#060a17]/80 border border-blue-500/30 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100">
      {/* Toast */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-medium flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' :
          message.type === 'error' ? 'bg-rose-500/20 border-rose-400/30 text-rose-200' :
          'bg-blue-500/20 border-blue-400/30 text-blue-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <XCircle className="w-5 h-5" /> :
           <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-[#0a1225]/90 backdrop-blur-xl border-b border-blue-500/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Reseller Panel</h1>
              <p className="text-xs text-slate-400">Welcome, {resellerInfo?.username || 'Reseller'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-xs">
              <span className="text-slate-400">Users: <span className="text-blue-300 font-semibold">{users.length}</span></span>
              <span className="text-slate-400">Active: <span className="text-emerald-300 font-semibold">{activeUsers}</span></span>
              <span className="text-slate-400">Limit: <span className="text-purple-300 font-semibold">{resellerInfo?.maxUsers === 0 ? '♾️' : resellerInfo?.maxUsers}</span></span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-xl text-sm font-medium transition-all border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0a1225]/80 rounded-2xl border border-blue-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-300 mt-2">{users.length}</p>
          </div>
          <div className="bg-[#0a1225]/80 rounded-2xl border border-blue-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Active</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-300 mt-2">{activeUsers}</p>
          </div>
          <div className="bg-[#0a1225]/80 rounded-2xl border border-blue-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Expired</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-300 mt-2">{users.length - activeUsers}</p>
          </div>
          <div className="bg-[#0a1225]/80 rounded-2xl border border-blue-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">User Limit</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-300 mt-2">{resellerInfo?.maxUsers === 0 ? '♾️' : resellerInfo?.maxUsers}</p>
          </div>
        </div>

        {/* Create User Form */}
        <div className="bg-[#0a1225]/80 backdrop-blur-2xl p-6 rounded-3xl border border-blue-500/10">
          <h2 className="text-lg font-semibold text-blue-200 flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            {editingId ? 'Edit User' : 'Create New User'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="client_01"
                className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {editingId ? 'New Password' : 'Password'}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? 'optional' : 'secret123'}
                className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required={!editingId}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                min="1"
                className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'}
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
                  }}
                  className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-2.5 px-4 rounded-xl text-sm border border-slate-700/50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-[#0a1225]/80 backdrop-blur-2xl rounded-3xl border border-blue-500/10 overflow-hidden">
          <div className="p-4 border-b border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              My Users
              <span className="text-xs text-slate-400 ml-2 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {filteredUsers.length}
              </span>
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#060a17]/80 border border-blue-500/20 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#060a17]/60 text-slate-400 text-xs uppercase tracking-wider border-b border-blue-500/10">
                  <th className="p-3 pl-4 font-medium">User</th>
                  <th className="p-3 font-medium">Password</th>
                  <th className="p-3 font-medium">Device Limit</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Expires</th>
                  <th className="p-3 text-right pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <RefreshCw className="w-4 h-4 text-blue-400 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No users found. Create your first user!
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isExpired = new Date(user.expiresAt) < new Date();
                    const deviceLimit = user.deviceLimit || 0;

                    return (
                      <tr key={user._id} className="hover:bg-blue-500/5 transition">
                        <td className="p-3 pl-4 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-500/20">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            {user.username}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-xs">{user.password || '••••••••'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deviceLimit === 0 ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                            'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}>
                            {deviceLimit === 0 ? '♾️ Unlimited' : `📱 ${deviceLimit}`}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isExpired ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                            'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(user.expiresAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="p-3 text-right pr-4">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1"
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
      </main>
    </div>
  );
}