'use client';

import React, { useState, useEffect } from 'react';

interface IUser {
  _id: string;
  username: string;
  password?: string;
  expiresAt: string;
  createdAt: string;
}

export default function Home() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Toast Alert State
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Check if Admin is logged in on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchUsers();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Admin Login Handler
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
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin Logout Handler
  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setAdminUsername('');
      setAdminPassword('');
    } catch (err) {
      showToast('Failed to logout', 'error');
    }
  };

  // Fetch Users
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
    } catch (err) {
      showToast('Network error while fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // User Submit (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || (!editingId && !password)) return;

    try {
      if (editingId) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, username, password, durationDays }),
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
          body: JSON.stringify({ username, password, durationDays }),
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
      fetchUsers();
    } catch (err) {
      showToast('An error occurred', 'error');
    }
  };

  // Delete User
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
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Error deleting user', 'error');
    }
  };

  const handleEdit = (user: IUser) => {
    setEditingId(user._id);
    setUsername(user.username);
    setPassword('');
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading Screen while checking session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        <div className="relative flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
          <div className="text-sm font-medium tracking-wider bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
            Establishing secure connection...
          </div>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN — ULTRA PREMIUM
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Abstract background orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-900/70 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/60 shadow-2xl shadow-indigo-900/20">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Control Center
              </h1>
              <p className="text-slate-400 text-sm mt-1">Administrator authentication required</p>
            </div>

            {loginError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium backdrop-blur-sm">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="relative w-full overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
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
          <p className="text-center text-[10px] text-slate-600 mt-6 tracking-widest uppercase">
            Secured • Encrypted Connection
          </p>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD — ULTRA PREMIUM
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Ambient background orbs */}
      <div className="fixed -top-64 -left-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-64 -right-64 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Toast Alert */}
        {message && (
          <div
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-medium transition-all duration-500 animate-in slide-in-from-top-5 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-500/20 border-rose-400/30 text-rose-200 shadow-rose-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {message.type === 'success' ? '✓' : '✕'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/60 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50"></div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                License Vault
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1 ml-1 tracking-wide">
              Secure credential management • real-time access control
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/60 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active credentials</p>
              <p className="text-2xl font-bold text-indigo-300">{users.length}</p>
            </div>

            <button
              onClick={handleAdminLogout}
              className="group relative overflow-hidden bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-5 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/10"
            >
              <span className="relative z-10">Logout</span>
              <span className="absolute inset-0 bg-rose-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-slate-800/60 shadow-2xl shadow-indigo-900/10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-xl font-semibold mb-6 text-indigo-200 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            {editingId ? 'Edit License' : 'Generate New License'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="client_01"
                className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {editingId ? 'New Password' : 'Password'}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? 'optional' : 'secret123'}
                className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition"
                required={!editingId}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Duration (days)
              </label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                min="1"
                className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-600/20"
              >
                {editingId ? 'Save Changes' : 'Create User'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setUsername('');
                    setPassword('');
                    setDurationDays(30);
                  }}
                  className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 py-3 px-4 rounded-2xl text-sm transition backdrop-blur-sm border border-slate-700/50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl shadow-indigo-900/10">
          <div className="p-5 md:p-6 border-b border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Registered Credentials
              <span className="text-xs text-slate-400 font-normal ml-2">({filteredUsers.length})</span>
            </h2>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search username..."
                className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/60">
                  <th className="p-4 pl-6 font-medium">Username</th>
                  <th className="p-4 font-medium">Password</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Expires On</th>
                  <th className="p-4 text-right pr-6 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading credentials...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No matching credentials found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isExpired = new Date(user.expiresAt) < new Date();
                    return (
                      <tr key={user._id} className="hover:bg-slate-800/30 transition duration-200 group">
                        <td className="p-4 pl-6 font-medium text-slate-200">{user.username}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{user.password || '••••••••'}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              isExpired
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 text-xs">
                          {new Date(user.expiresAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right pr-6 space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/10"
                          >
                            Delete
                          </button>
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
  );
}