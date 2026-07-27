'use client';

import React, { useState, useEffect } from 'react';

interface ISettings {
  exe_version: string;
  server_status: 'online' | 'offline' | 'maintenance';
  maintenance_message: string;
  allow_new_registration: boolean;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<ISettings>({
    exe_version: '1.0.0',
    server_status: 'online',
    maintenance_message: 'Server is under maintenance. Please try again later.',
    allow_new_registration: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchSettings();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const result = await res.json();
      if (result.success) {
        setSettings({
          exe_version: result.data.exe_version || '1.0.0',
          server_status: result.data.server_status || 'online',
          maintenance_message: result.data.maintenance_message || 'Server is under maintenance. Please try again later.',
          allow_new_registration: result.data.allow_new_registration !== undefined ? result.data.allow_new_registration : true,
        });
      }
    } catch (err) {
      showToast('Failed to fetch settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Settings saved successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Admin Login
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
        fetchSettings();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin Logout
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

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        <div className="relative flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
          <div className="text-sm font-medium tracking-wider bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-900/70 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/60 shadow-2xl shadow-indigo-900/20">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-slate-400 text-sm mt-1">Administrator authentication required</p>
            </div>

            {loginError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
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
                  {loginLoading ? 'Authenticating...' : 'Sign In'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans relative overflow-x-hidden">
      <div className="fixed -top-64 -left-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-64 -right-64 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        {/* Toast */}
        {message && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-medium transition-all duration-500 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
              : 'bg-rose-500/20 border-rose-400/30 text-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage EXE version and server settings</p>
          </div>
          <button
            onClick={handleAdminLogout}
            className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 px-5 py-3 rounded-2xl text-xs font-semibold transition-all duration-300"
          >
            Logout
          </button>
        </div>

        {/* Settings Form */}
        <div className="bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/60 shadow-2xl shadow-indigo-900/10">
          <h2 className="text-xl font-semibold mb-6 text-indigo-200 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            Server & Version Control
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* EXE Version */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">
                  EXE Version
                </label>
                <input
                  type="text"
                  value={settings.exe_version}
                  onChange={(e) => setSettings({ ...settings, exe_version: e.target.value })}
                  placeholder="e.g., 1.0.0"
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <p className="text-xs text-slate-400">
                  Current version required for EXE to connect
                </p>
              </div>

              {/* Server Status */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">
                  Server Status
                </label>
                <div className="flex gap-4">
                  {['online', 'offline', 'maintenance'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="server_status"
                        value={status}
                        checked={settings.server_status === status}
                        onChange={(e) => setSettings({ ...settings, server_status: e.target.value as any })}
                        className="w-4 h-4 accent-indigo-500"
                      />
                      <span className={`text-sm capitalize ${
                        status === 'online' ? 'text-emerald-400' :
                        status === 'offline' ? 'text-rose-400' :
                        'text-amber-400'
                      }`}>
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {settings.server_status === 'online' ? 'EXE can connect' :
                    settings.server_status === 'offline' ? 'EXE will show server offline error' :
                    'EXE will show maintenance message'}
                </p>
              </div>

              {/* Maintenance Message */}
              {settings.server_status === 'maintenance' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-slate-300">
                    Maintenance Message
                  </label>
                  <textarea
                    value={settings.maintenance_message}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                    placeholder="Enter maintenance message..."
                    rows={3}
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                </div>
              )}

              {/* Allow New Registration */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.allow_new_registration}
                  onChange={(e) => setSettings({ ...settings, allow_new_registration: e.target.checked })}
                  className="w-5 h-5 accent-indigo-500 rounded"
                />
                <label className="text-sm font-semibold text-slate-300">
                  Allow New User Registration
                </label>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-800/60">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Current Version</p>
            <p className="text-2xl font-bold text-indigo-300 mt-1">{settings.exe_version}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-800/60">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Server Status</p>
            <p className={`text-2xl font-bold mt-1 ${
              settings.server_status === 'online' ? 'text-emerald-400' :
              settings.server_status === 'offline' ? 'text-rose-400' :
              'text-amber-400'
            }`}>
              {settings.server_status.toUpperCase()}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-800/60">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Registration</p>
            <p className={`text-2xl font-bold mt-1 ${
              settings.allow_new_registration ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {settings.allow_new_registration ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}