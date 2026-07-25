'use client';

import React, { useState, useEffect } from 'react';

interface IUser {
  _id: string;
  username: string;
  password?: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ১. MongoDB থেকে ইউজার লোড করা
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ২. ইউজার তৈরি বা এডিট করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || (!editingId && !password)) return;

    if (editingId) {
      // Edit User (PUT)
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, username, password, durationDays }),
      });
      setEditingId(null);
    } else {
      // Add User (POST)
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, durationDays }),
      });
    }

    setUsername('');
    setPassword('');
    setDurationDays(30);
    fetchUsers(); // Refresh list
  };

  // ৩. ডিলিট করা
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  };

  // ৪. এডিট মোড চালু করা
  const handleEdit = (user: IUser) => {
    setEditingId(user._id);
    setUsername(user.username);
    setPassword(''); // Security reason: leave empty unless modifying
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-indigo-400">User Management Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            MongoDB Connected - Realtime User Control
          </p>
        </div>

        {/* User Form */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-indigo-300">
            {editingId ? 'Edit User' : 'Create New User'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {editingId ? 'New Password (Optional)' : 'Password'}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required={!editingId}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                min="1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
              >
                {editingId ? 'Update User' : 'Add User'}
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
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded-lg text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* User Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-slate-200">User List ({users.length})</h2>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <th className="p-4">Username</th>
                <th className="p-4">Password</th>
                <th className="p-4">Expires On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4 font-medium text-slate-200">{user.username}</td>
                    <td className="p-4 text-slate-400 font-mono">{user.password || '••••••••'}</td>
                    <td className="p-4 text-emerald-400">
                      {new Date(user.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-3 py-1 rounded text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 px-3 py-1 rounded text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}