// app/reseller/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  LogOut,
  Shield,
  ShieldCheck,
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
  Minus,
  Save,
  Ban,
  Unlock,
  Database,
  Store,
  Menu,
  X,
  Eye,
  EyeOff,
  Fingerprint,
  Crown,
  Copy,
  Check,
  Zap,
  Infinity as InfinityIcon,
  Download,
  SlidersHorizontal,
  RotateCw,
  Activity,
  Wifi,
  WifiOff,
  Lock,
  Wand2,
  ArrowUpDown,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface IUser {
  _id: string;
  username: string;
  password?: string;
  licenseKey?: string | null;
  expiresAt: string;
  createdAt: string;
  hwid?: string | null;
  hwidReset?: boolean;
  loginCount?: number;
  lastLoginIP?: string | null;
  registeredHwids?: string[];
  deviceLimit?: number;
  createdBy?: string;
  createdByReseller?: string | null;
}

type StatusFilter = 'all' | 'active' | 'expiring' | 'full' | 'expired';
type SortOption = 'newest' | 'expiring' | 'logins' | 'username';

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void> | void;
}

interface CreatedReceipt {
  username: string;
  password?: string;
  licenseKey?: string | null;
  deviceLimit: number;
  expiresAt: string;
  isUpdate?: boolean;
}

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generatePreviewKey(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let chunk = '';
    for (let i = 0; i < 4; i++) {
      chunk += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
    }
    groups.push(chunk);
  }
  return groups.join('-');
}

function generateRandomPassword(len = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function getDeviceCount(user: IUser): number {
  if (Array.isArray(user.registeredHwids) && user.registeredHwids.length > 0) {
    return user.registeredHwids.length;
  }
  return user.hwid && user.hwid !== 'null' && user.hwid !== '' ? 1 : 0;
}

function getDeviceLimitValue(user: IUser): number {
  return typeof user.deviceLimit === 'number' ? user.deviceLimit : 1;
}

function formatRemaining(expiresAt: string): { label: string; daysLeft: number; isExpired: boolean; isExpiringSoon: boolean } {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / 86_400_000);
  if (diffMs <= 0) {
    const ago = Math.max(1, Math.floor(Math.abs(diffMs) / 86_400_000));
    return { label: `Expired ${ago}d ago`, daysLeft: 0, isExpired: true, isExpiringSoon: false };
  }
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return { label: `${Math.max(1, hours)}h left`, daysLeft: 1, isExpired: false, isExpiringSoon: true };
  }
  const days = Math.floor(diffMs / 86_400_000);
  return {
    label: `${days}d left`,
    daysLeft,
    isExpired: false,
    isExpiringSoon: days <= 7,
  };
}

function AmbientBackdrop() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#090b0e]">
      <div className="absolute -top-40 -left-20 w-[640px] h-[640px] rounded-full bg-zinc-800/20 blur-[140px]" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-slate-800/20 blur-[150px]" />
      <div className="absolute -bottom-40 left-1/3 w-[620px] h-[620px] rounded-full bg-zinc-700/15 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

export default function ResellerDashboard() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resellerInfo, setResellerInfo] = useState<{ username: string } | null>(null);

  // Dashboard data
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverInfo, setServerInfo] = useState<{ online: boolean; version: string } | null>(null);

  // Filter / Search / Sort / Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Create / Edit Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deviceLimit, setDeviceLimit] = useState<number>(1);
  const [customDeviceMode, setCustomDeviceMode] = useState<boolean>(false);
  const [customLicenseKey, setCustomLicenseKey] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<CreatedReceipt | null>(null);

  // Modals & UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Recharge & Device Inspector Modal State
  const [inspectorUser, setInspectorUser] = useState<IUser | null>(null);
  const [rechargeDeviceLimit, setRechargeDeviceLimit] = useState<number>(1);
  const [rechargeExtendDays, setRechargeExtendDays] = useState<number>(0);
  const [inspectorBusy, setInspectorBusy] = useState(false);

  // Toast Alert
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev));
    }, 4200);
  }, []);

  const copyText = useCallback(
    (text: string, label = 'Copied to clipboard', keyId?: string) => {
      navigator.clipboard.writeText(text);
      if (keyId) {
        setCopiedKeyId(keyId);
        setTimeout(() => setCopiedKeyId((prev) => (prev === keyId ? null : prev)), 2000);
      }
      showToast(label, 'success');
    },
    [showToast]
  );

  const copyClientBundle = useCallback(
    (user: { username: string; password?: string; licenseKey?: string | null; deviceLimit?: number; expiresAt: string }) => {
      const limit = typeof user.deviceLimit === 'number' ? user.deviceLimit : 1;
      const lines = [
        `Username: ${user.username}`,
        user.password ? `Password: ${user.password}` : null,
        user.licenseKey ? `License Key: ${user.licenseKey}` : null,
        `Device Limit: ${limit === 0 ? 'Unlimited' : `${limit} Device${limit > 1 ? 's' : ''}`}`,
        `Expires: ${new Date(user.expiresAt).toLocaleDateString()}`,
      ].filter(Boolean);
      copyText(lines.join('\n'), `Client credentials copied for ${user.username}`);
    },
    [copyText]
  );

  const fetchServerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/login');
      if (res.ok) {
        const data = await res.json();
        setServerInfo({
          online: Boolean(data.serverOnline),
          version: String(data.requiredVersion || '1.0.0'),
        });
      }
    } catch {
      // Ignore silent status check failure
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
        setInspectorUser((prev) =>
          prev ? result.data.find((u: IUser) => u._id === prev._id) || null : null
        );
      } else if (res.status === 401) {
        localStorage.removeItem('resellerAuth');
        localStorage.removeItem('resellerUsername');
        setIsAuthenticated(false);
      } else {
        showToast(result.error || 'Failed to fetch users', 'error');
      }
    } catch {
      showToast('Network error while fetching data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/reseller/check-auth');
        const data = await res.json();
        if (data.authenticated && data.username) {
          setIsAuthenticated(true);
          setResellerInfo({ username: data.username });
          localStorage.setItem('resellerUsername', data.username);
          fetchUsers();
          fetchServerStatus();
        } else {
          localStorage.removeItem('resellerAuth');
          localStorage.removeItem('resellerUsername');
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [fetchUsers, fetchServerStatus]);

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
        const name = data.reseller?.username || resellerUsername;
        localStorage.setItem('resellerUsername', name);
        setIsAuthenticated(true);
        setResellerInfo({ username: name });
        fetchUsers();
        fetchServerStatus();
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
      setUsers([]);
      setSelectedIds([]);
      showToast('Logged out successfully');
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setDurationDays(30);
    setDeviceLimit(1);
    setCustomDeviceMode(false);
    setCustomLicenseKey('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || (!editingId && !password)) {
      showToast('Username and password are required', 'error');
      return;
    }
    if (!Number.isInteger(deviceLimit) || deviceLimit < 0) {
      showToast('Device limit must be 0 (unlimited) or a positive whole number', 'error');
      return;
    }
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      showToast('Duration must be at least 1 day', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const reseller = localStorage.getItem('resellerUsername');

      if (editingId) {
        const payload: Record<string, unknown> = {
          id: editingId,
          username: cleanUsername,
          durationDays,
          deviceLimit,
          reseller,
        };
        if (password) payload.password = password;
        if (customLicenseKey.trim()) payload.licenseKey = customLicenseKey.trim();

        const res = await fetch('/api/reseller/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast('License updated successfully!');
          setCreatedReceipt({
            username: data.data?.username || cleanUsername,
            password: password || undefined,
            licenseKey: data.data?.licenseKey,
            deviceLimit,
            expiresAt: data.data?.expiresAt || new Date(Date.now() + durationDays * 86_400_000).toISOString(),
            isUpdate: true,
          });
          resetForm();
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to update license', 'error');
        }
      } else {
        const payload: Record<string, unknown> = {
          username: cleanUsername,
          password,
          durationDays,
          deviceLimit,
          reseller,
        };
        if (customLicenseKey.trim()) payload.licenseKey = customLicenseKey.trim();

        const res = await fetch('/api/reseller/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast('New license generated!');
          setCreatedReceipt({
            username: data.data?.username || cleanUsername,
            password,
            licenseKey: data.data?.licenseKey,
            deviceLimit,
            expiresAt: data.data?.expiresAt || new Date(Date.now() + durationDays * 86_400_000).toISOString(),
          });
          resetForm();
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to create license', 'error');
        }
      }
    } catch {
      showToast('Network error while saving license', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: IUser) => {
    const currentLimit = getDeviceLimitValue(user);
    const remaining = Math.max(1, formatRemaining(user.expiresAt).daysLeft || 30);
    setEditingId(user._id);
    setUsername(user.username);
    setPassword('');
    setDurationDays(remaining);
    setDeviceLimit(currentLimit);
    setCustomDeviceMode(![0, 1, 2, 3, 5, 10].includes(currentLimit));
    setCustomLicenseKey(user.licenseKey || '');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openInspector = (user: IUser) => {
    setInspectorUser(user);
    setRechargeDeviceLimit(getDeviceLimitValue(user));
    setRechargeExtendDays(0);
  };

  const handleApplyRecharge = async (override?: { extendDays?: number; deviceLimit?: number; rotateKey?: boolean }) => {
    if (!inspectorUser) return;
    const daysToAdd = override?.extendDays ?? rechargeExtendDays;
    const targetLimit = override?.deviceLimit ?? rechargeDeviceLimit;
    const rotate = Boolean(override?.rotateKey);

    if (!rotate && daysToAdd === 0 && targetLimit === getDeviceLimitValue(inspectorUser)) {
      showToast('Select a new device limit or extension days first', 'info');
      return;
    }

    setInspectorBusy(true);
    try {
      const reseller = localStorage.getItem('resellerUsername');
      const payload: Record<string, unknown> = {
        id: inspectorUser._id,
        reseller,
      };
      if (daysToAdd > 0) payload.extendDays = daysToAdd;
      if (targetLimit !== getDeviceLimitValue(inspectorUser)) payload.deviceLimit = targetLimit;
      if (rotate) payload.rotateKey = true;

      const res = await fetch('/api/reseller/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          rotate
            ? `License key rotated for ${inspectorUser.username}`
            : `Updated ${inspectorUser.username} successfully!`,
          'success'
        );
        setRechargeExtendDays(0);
        if (data.data) {
          setInspectorUser(data.data);
          setRechargeDeviceLimit(getDeviceLimitValue(data.data));
        }
        fetchUsers();
      } else {
        showToast(data.error || 'Recharge failed', 'error');
      }
    } catch {
      showToast('Error applying recharge', 'error');
    } finally {
      setInspectorBusy(false);
    }
  };

  const requestDelete = (user: IUser) => {
    setConfirmState({
      title: `Delete "${user.username}"?`,
      description: 'This permanently revokes the license key and deletes all registered HWIDs.',
      confirmLabel: 'Delete License',
      tone: 'danger',
      onConfirm: async () => {
        const reseller = localStorage.getItem('resellerUsername');
        const res = await fetch('/api/reseller/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user._id, reseller }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Deleted ${user.username}`);
          setSelectedIds((prev) => prev.filter((id) => id !== user._id));
          if (inspectorUser?._id === user._id) setInspectorUser(null);
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to delete user', 'error');
        }
      },
    });
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      title: `Delete ${selectedIds.length} selected license(s)?`,
      description: 'All selected accounts and their license keys will be permanently removed.',
      confirmLabel: `Delete ${selectedIds.length} License(s)`,
      tone: 'danger',
      onConfirm: async () => {
        const reseller = localStorage.getItem('resellerUsername');
        const res = await fetch('/api/reseller/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds, reseller }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Selected licenses deleted');
          setSelectedIds([]);
          fetchUsers();
        } else {
          showToast(data.error || 'Bulk delete failed', 'error');
        }
      },
    });
  };

  const requestResetHwid = (targetUsername: string) => {
    setConfirmState({
      title: `Reset HWID for "${targetUsername}"?`,
      description: 'Clears the bound hardware ID and flags the account for fresh device binding.',
      confirmLabel: 'Reset HWID',
      tone: 'warning',
      onConfirm: async () => {
        const reseller = localStorage.getItem('resellerUsername');
        const res = await fetch('/api/reseller/reset-hwid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUsername, reseller }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`HWID reset successful for ${targetUsername}!`);
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to reset HWID', 'error');
        }
      },
    });
  };

  const requestClearAllHwids = (targetUsername: string) => {
    setConfirmState({
      title: `Clear all devices for "${targetUsername}"?`,
      description: 'Every registered HWID slot on this license will be freed immediately.',
      confirmLabel: 'Clear Devices',
      tone: 'info',
      onConfirm: async () => {
        const reseller = localStorage.getItem('resellerUsername');
        const res = await fetch('/api/reseller/clear-hwids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUsername, reseller }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`All devices cleared for ${targetUsername}!`);
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to clear devices', 'error');
        }
      },
    });
  };

  const runConfirm = async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      await confirmState.onConfirm();
    } finally {
      setConfirmBusy(false);
      setConfirmState(null);
    }
  };

  // Derived analytics & filtered list
  const stats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let full = 0;
    let totalDevices = 0;
    let totalLogins = 0;
    let unlimitedCount = 0;

    for (const u of users) {
      const rem = formatRemaining(u.expiresAt);
      const count = getDeviceCount(u);
      const limit = getDeviceLimitValue(u);
      totalDevices += count;
      totalLogins += u.loginCount || 0;
      if (limit === 0) unlimitedCount += 1;

      if (rem.isExpired) {
        expired += 1;
      } else {
        active += 1;
        if (rem.isExpiringSoon) expiringSoon += 1;
        if (limit > 0 && count >= limit) full += 1;
      }
    }

    return {
      total: users.length,
      active,
      expiringSoon,
      expired,
      full,
      totalDevices,
      totalLogins,
      unlimitedCount,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = users.filter((u) => {
      const matchesQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        (u.licenseKey || '').toLowerCase().includes(q) ||
        (u.lastLoginIP || '').toLowerCase().includes(q);
      if (!matchesQuery) return false;

      const rem = formatRemaining(u.expiresAt);
      const count = getDeviceCount(u);
      const limit = getDeviceLimitValue(u);
      const isFull = limit > 0 && count >= limit;

      if (statusFilter === 'active') return !rem.isExpired;
      if (statusFilter === 'expiring') return !rem.isExpired && rem.isExpiringSoon;
      if (statusFilter === 'full') return !rem.isExpired && isFull;
      if (statusFilter === 'expired') return rem.isExpired;
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'expiring') {
      sorted.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    } else if (sortBy === 'logins') {
      sorted.sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0));
    } else if (sortBy === 'username') {
      sorted.sort((a, b) => a.username.localeCompare(b.username));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [users, searchTerm, statusFilter, sortBy]);

  const exportCsv = () => {
    if (filteredUsers.length === 0) {
      showToast('No licenses to export', 'info');
      return;
    }
    const headers = ['Username', 'LicenseKey', 'DeviceLimit', 'DevicesUsed', 'Logins', 'LastIP', 'Status', 'ExpiresAt'];
    const rows = filteredUsers.map((u) => {
      const rem = formatRemaining(u.expiresAt);
      const count = getDeviceCount(u);
      const limit = getDeviceLimitValue(u);
      const status = rem.isExpired ? 'Expired' : limit > 0 && count >= limit ? 'Full' : 'Active';
      return [
        u.username,
        u.licenseKey || '',
        limit === 0 ? 'Unlimited' : String(limit),
        String(count),
        String(u.loginCount || 0),
        u.lastLoginIP || '',
        status,
        new Date(u.expiresAt).toISOString(),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reseller-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredUsers.length} license(s) to CSV`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Shared glass design classes
  const glassCard =
    'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_rgba(0,0,0,0.45)]';
  const glassInput =
    'w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 backdrop-blur-md focus:outline-none focus:bg-white/[0.06] focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all duration-150';
  const primaryGlassBtn =
    'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-150 active:scale-[0.99]';
  const accentText = 'text-zinc-100';

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden">
        <AmbientBackdrop />
        <div className={`relative z-10 ${glassCard} rounded-2xl px-7 py-6 flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-zinc-200 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Initializing Partner Portal</p>
            <p className="text-xs text-zinc-400 mt-0.5">Verifying encrypted session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden">
        <AmbientBackdrop />

        <div className="w-full max-w-md relative z-10">
          <div className={`${glassCard} rounded-2xl p-8 relative overflow-hidden`}>
            {/* Top specular sheen */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="text-center mb-7">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <Store className="w-5 h-5 text-zinc-100" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-1.5">
                Aegis Partner Portal
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Partner Sign In</h1>
              <p className="text-zinc-400 text-xs mt-1.5">
                Issue custom-limit keys &amp; manage client devices
              </p>
            </div>

            {loginError && (
              <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/12 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-300" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleResellerLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-white/55 uppercase tracking-widest">
                  Reseller Username
                </label>
                <input
                  type="text"
                  value={resellerUsername}
                  onChange={(e) => setResellerUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={glassInput}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-white/55 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={resellerPassword}
                    onChange={(e) => setResellerPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${glassInput} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full ${primaryGlassBtn} rounded-xl py-3.5 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-300/70" />
                Signed Cookie Session
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Encrypted
              </span>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/25 mt-5 tracking-[0.25em] uppercase">
            Aegis • Partner Portal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden selection:bg-cyan-400/30 selection:text-white">
      <AmbientBackdrop />

      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-20 md:top-6 right-4 md:right-6 z-[70] px-4 py-3.5 rounded-2xl backdrop-blur-2xl border text-xs md:text-sm font-medium flex items-center gap-3 max-w-[92vw] md:max-w-md shadow-[0_18px_50px_rgba(0,0,0,0.5)] transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-100'
              : message.type === 'error'
              ? 'bg-rose-500/15 border-rose-400/35 text-rose-100'
              : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-100'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-cyan-300 flex-shrink-0" />
          )}
          <span className="break-words">{message.text}</span>
        </div>
      )}

      {/* Mobile Topbar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-black/45 backdrop-blur-2xl border-b border-white/[0.1] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <span className={`text-sm font-bold block leading-tight ${accentText}`}>Reseller Studio</span>
            <span className="text-[10px] text-white/45 block">{resellerInfo?.username}</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 hover:text-white transition"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-2xl pt-20 px-5 pb-6 flex flex-col justify-between">
          <div className="space-y-2">
            {(
              [
                { id: 'all', label: 'All Licenses', count: stats.total },
                { id: 'active', label: 'Active', count: stats.active },
                { id: 'expiring', label: 'Expiring Soon', count: stats.expiringSoon },
                { id: 'full', label: 'Full Devices', count: stats.full },
                { id: 'expired', label: 'Expired', count: stats.expired },
              ] as { id: StatusFilter; label: string; count: number }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setStatusFilter(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm transition ${
                  statusFilter === item.id
                    ? 'bg-white/[0.1] border-cyan-400/40 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10">{item.count}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleResellerLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium text-rose-300 bg-rose-500/12 border border-rose-400/25"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* Desktop Glass Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 z-40 flex-col rounded-3xl bg-white/[0.035] backdrop-blur-2xl border border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_25px_70px_rgba(0,0,0,0.5)] p-5">
        <div className="flex items-center gap-3 pb-5 border-b border-white/[0.08]">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/30 via-indigo-400/20 to-violet-500/30 border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <Store className="w-5 h-5 text-cyan-200" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-base font-bold tracking-tight truncate ${accentText}`}>Reseller Studio</h2>
            <p className="text-[11px] text-zinc-400 truncate">Aegis Partner Network</p>
          </div>
        </div>

        <div className="mt-5 space-y-1.5 flex-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">
            License Views
          </p>
          {(
            [
              { id: 'all', label: 'All Licenses', count: stats.total, dot: 'bg-cyan-300' },
              { id: 'active', label: 'Active', count: stats.active, dot: 'bg-emerald-400' },
              { id: 'expiring', label: 'Expiring ≤ 7d', count: stats.expiringSoon, dot: 'bg-amber-400' },
              { id: 'full', label: 'Devices Full', count: stats.full, dot: 'bg-violet-400' },
              { id: 'expired', label: 'Expired', count: stats.expired, dot: 'bg-rose-400' },
            ] as { id: StatusFilter; label: string; count: number; dot: string }[]
          ).map((nav) => {
            const active = statusFilter === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setStatusFilter(nav.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-white/[0.1] border border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'border border-transparent text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${nav.dot}`} />
                  {nav.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.07] text-white/75">
                  {nav.count}
                </span>
              </button>
            );
          })}

          <div className="pt-5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">
              Capabilities
            </p>
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-violet-500/10 border border-white/[0.1] space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-200">
                <InfinityIcon className="w-4 h-4" />
                <span>Custom Device Limits</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/50">
                Set any device cap per key (1, 5, 25, or Unlimited) and recharge days anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/25 to-violet-500/25 border border-white/15 flex items-center justify-center text-xs font-bold text-white">
              {resellerInfo?.username?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{resellerInfo?.username}</p>
              <p className="text-[10px] text-emerald-300/80 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" />
                Verified Reseller
              </p>
            </div>
          </div>

          <button
            onClick={handleResellerLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 lg:pl-72 pt-20 lg:pt-6 pb-12 px-4 md:px-7 lg:pr-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className={`${glassCard} rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${accentText}`}>
                  License & Device Control
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-400/12 text-cyan-200 border border-cyan-400/25">
                  Custom Limits
                </span>
              </div>
              <p className="text-xs md:text-sm text-white/50 mt-1">
                Create licenses with custom device limits, recharge expiry days, and monitor HWID bindings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {serverInfo && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-xs">
                  {serverInfo.online ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-200/90">API Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-200/90">Maintenance</span>
                    </>
                  )}
                  <span className="text-white/25">•</span>
                  <span className="font-mono text-[11px] text-white/55">v{serverInfo.version}</span>
                </div>
              )}

              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-medium text-white/80 transition"
                title="Export filtered licenses to CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-300" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  fetchUsers();
                  fetchServerStatus();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-medium text-white/80 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* KPI Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
            <div className={`${glassCard} rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:border-cyan-400/30 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-white/45 font-medium">Total Licenses</span>
                <div className="p-2 rounded-xl bg-cyan-400/12 border border-cyan-400/20 text-cyan-200">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-white">{stats.total}</p>
              <p className="text-[11px] text-white/45 mt-1">{stats.unlimitedCount} unlimited device key(s)</p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:border-emerald-400/30 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-white/45 font-medium">Active Keys</span>
                <div className="p-2 rounded-xl bg-emerald-400/12 border border-emerald-400/20 text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-emerald-300">{stats.active}</p>
              <p className="text-[11px] text-amber-300/80 mt-1">
                {stats.expiringSoon > 0 ? `${stats.expiringSoon} expiring within 7d` : 'All healthy'}
              </p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:border-indigo-400/30 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-white/45 font-medium">Bound Devices</span>
                <div className="p-2 rounded-xl bg-indigo-400/12 border border-indigo-400/20 text-indigo-200">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-indigo-200">{stats.totalDevices}</p>
              <p className="text-[11px] text-white/45 mt-1">{stats.full} license(s) at full capacity</p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 md:p-5 relative overflow-hidden group hover:border-violet-400/30 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-white/45 font-medium">Total Logins</span>
                <div className="p-2 rounded-xl bg-violet-400/12 border border-violet-400/20 text-violet-200">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-violet-200">{stats.totalLogins}</p>
              <p className="text-[11px] text-rose-300/80 mt-1">{stats.expired} expired license(s)</p>
            </div>
          </div>

          {/* Instant Receipt Banner after creating/updating */}
          {createdReceipt && (
            <div className="rounded-3xl bg-gradient-to-r from-emerald-500/12 via-cyan-500/10 to-indigo-500/12 backdrop-blur-2xl border border-emerald-400/30 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>{createdReceipt.isUpdate ? 'License Updated' : 'License Ready for Delivery'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 font-mono">
                  <span>User: <strong className="text-white">{createdReceipt.username}</strong></span>
                  {createdReceipt.password && (
                    <span>Pass: <strong className="text-white">{createdReceipt.password}</strong></span>
                  )}
                  {createdReceipt.licenseKey && (
                    <span>Key: <strong className="text-cyan-200">{createdReceipt.licenseKey}</strong></span>
                  )}
                  <span>
                    Limit:{' '}
                    <strong className="text-indigo-200">
                      {createdReceipt.deviceLimit === 0 ? 'Unlimited' : `${createdReceipt.deviceLimit} Device(s)`}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyClientBundle(createdReceipt)}
                  className="px-4 py-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-300/30 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Client Bundle
                </button>
                <button
                  onClick={() => setCreatedReceipt(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
                  aria-label="Dismiss receipt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Create / Edit License Studio */}
          <section id="form-section" className={`${glassCard} rounded-3xl p-5 md:p-7 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-white/15 flex items-center justify-center">
                  {editingId ? <Edit className="w-4 h-4 text-amber-200" /> : <Plus className="w-5 h-5 text-cyan-200" />}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${accentText}`}>
                    {editingId ? `Editing License: ${username}` : 'Issue New License'}
                  </h2>
                  <p className="text-xs text-white/45">
                    Configure credentials, validity duration, and custom device allowance.
                  </p>
                </div>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-white/75 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-300" />
                      Username
                    </label>
                    {!editingId && (
                      <button
                        type="button"
                        onClick={() => setUsername(`client_${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 transition"
                      >
                        <Wand2 className="w-3 h-3" />
                        Random
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="client_01"
                    className={glassInput}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-300" />
                      {editingId ? 'New Password' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword(generateRandomPassword())}
                      className="text-[10px] text-indigo-300/80 hover:text-indigo-200 flex items-center gap-1 transition"
                    >
                      <Wand2 className="w-3 h-3" />
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingId ? 'Leave blank to keep' : 'secret123'}
                      className={`${glassInput} pr-10`}
                      required={!editingId}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                      aria-label="Toggle password"
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Duration Days */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-300" />
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36500}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                    className={glassInput}
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 7, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition ${
                          durationDays === d
                            ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-200'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/55 hover:text-white'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional License Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-violet-300" />
                      License Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomLicenseKey(generatePreviewKey())}
                      className="text-[10px] text-violet-300/85 hover:text-violet-200 flex items-center gap-1 transition"
                    >
                      <RotateCw className="w-3 h-3" />
                      New Key
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customLicenseKey}
                    onChange={(e) => setCustomLicenseKey(e.target.value.toUpperCase())}
                    placeholder="Auto-generated XXXX-XXXX..."
                    className={`${glassInput} font-mono text-xs uppercase`}
                  />
                </div>
              </div>

              {/* Custom Device Limit Control Bar */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.1] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-300" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Custom Device Limit
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-400/15 border border-cyan-400/30 text-cyan-200">
                      {deviceLimit === 0 ? 'Unlimited Devices' : `${deviceLimit} Device${deviceLimit > 1 ? 's' : ''} Max`}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/45">
                    Pick a preset or enter any custom device count (0 = Unlimited HWID slots).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { val: 0, label: 'Unlimited' },
                    { val: 1, label: '1' },
                    { val: 2, label: '2' },
                    { val: 3, label: '3' },
                    { val: 5, label: '5' },
                    { val: 10, label: '10' },
                  ].map((preset) => {
                    const selected = !customDeviceMode && deviceLimit === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          setCustomDeviceMode(false);
                          setDeviceLimit(preset.val);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          selected
                            ? 'bg-cyan-400/20 border-cyan-400/45 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                            : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCustomDeviceMode(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                      customDeviceMode
                        ? 'bg-violet-400/20 border-violet-400/45 text-violet-100'
                        : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Custom
                  </button>

                  {/* Always-accessible stepper for custom numeric entry */}
                  <div className="flex items-center rounded-xl bg-black/30 border border-white/[0.12] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDeviceMode(true);
                        setDeviceLimit((prev) => Math.max(0, prev - 1));
                      }}
                      className="px-2.5 py-2 text-white/60 hover:text-white hover:bg-white/10 transition"
                      aria-label="Decrease device limit"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={deviceLimit}
                      onChange={(e) => {
                        setCustomDeviceMode(true);
                        const parsed = parseInt(e.target.value, 10);
                        setDeviceLimit(Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(10000, parsed)));
                      }}
                      className="w-16 bg-transparent text-center text-xs font-mono font-semibold text-white focus:outline-none py-2"
                      aria-label="Custom device limit"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDeviceMode(true);
                        setDeviceLimit((prev) => Math.min(10000, prev + 1));
                      }}
                      className="px-2.5 py-2 text-white/60 hover:text-white hover:bg-white/10 transition"
                      aria-label="Increase device limit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`${primaryGlassBtn} px-6 py-3 rounded-2xl text-sm flex items-center gap-2 disabled:opacity-60`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {editingId ? 'Saving...' : 'Generating...'}
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save License Changes
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate License
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Licenses Table Card */}
          <section className={`${glassCard} rounded-3xl overflow-hidden relative`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Toolbar */}
            <div className="p-5 md:p-6 border-b border-white/[0.08] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                    <Database className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base font-bold ${accentText}`}>Issued Licenses</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/70">
                        {filteredUsers.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45">
                      Click any device badge or Recharge icon to adjust custom limits or extend days.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search user, key, or IP..."
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/35 focus:outline-none focus:border-cyan-400/50 transition"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-white/[0.05] border border-white/[0.12] rounded-xl pl-8 pr-4 py-2 text-xs text-white/85 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                    >
                      <option value="newest" className="bg-[#0b0d16]">Sort: Newest</option>
                      <option value="expiring" className="bg-[#0b0d16]">Sort: Expiring Soon</option>
                      <option value="logins" className="bg-[#0b0d16]">Sort: Most Logins</option>
                      <option value="username" className="bg-[#0b0d16]">Sort: Username A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter Pills + Bulk Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: `All (${stats.total})` },
                      { id: 'active', label: `Active (${stats.active})` },
                      { id: 'expiring', label: `Expiring (${stats.expiringSoon})` },
                      { id: 'full', label: `Full (${stats.full})` },
                      { id: 'expired', label: `Expired (${stats.expired})` },
                    ] as { id: StatusFilter; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        statusFilter === tab.id
                          ? 'bg-cyan-400/18 border-cyan-400/40 text-cyan-100'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/55 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/12 border border-rose-400/30">
                    <span className="text-xs text-rose-100 font-medium">{selectedIds.length} selected</span>
                    <button
                      onClick={requestBulkDelete}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-white/50 hover:text-white text-xs px-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/[0.07]">
              {loading ? (
                <div className="p-10 text-center text-white/45 text-sm flex items-center justify-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  Loading licenses...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-white/45 text-sm">
                  No licenses match this filter.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const rem = formatRemaining(user.expiresAt);
                  const count = getDeviceCount(user);
                  const limit = getDeviceLimitValue(user);
                  const isFull = limit > 0 && count >= limit;
                  const pct = limit === 0 ? Math.min(100, count * 20) : Math.min(100, Math.round((count / limit) * 100));

                  return (
                    <div key={user._id} className="p-4 space-y-3 hover:bg-white/[0.03] transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user._id)}
                            onChange={() => toggleSelectOne(user._id)}
                            className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-0"
                          />
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/25 to-violet-500/25 border border-white/15 flex items-center justify-center text-sm font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                            {user.licenseKey && (
                              <button
                                onClick={() => copyText(user.licenseKey!, `Copied key: ${user.licenseKey}`, user._id)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-200/85 mt-0.5"
                              >
                                <Key className="w-3 h-3" />
                                <span className="truncate">{user.licenseKey}</span>
                                {copiedKeyId === user._id ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 opacity-50" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${
                            rem.isExpired
                              ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                              : isFull
                              ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                              : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                          }`}
                        >
                          {rem.isExpired ? 'Expired' : isFull ? 'Full' : 'Active'}
                        </span>
                      </div>

                      {/* Device bar */}
                      <button
                        onClick={() => openInspector(user)}
                        className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                            Devices: <strong className="text-white">{count} / {limit === 0 ? '∞' : limit}</strong>
                          </span>
                          <span className="text-[11px] text-white/45">{rem.label}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-violet-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => openInspector(user)}
                          className="flex-1 px-3 py-2 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-100 text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Recharge
                        </button>
                        <button
                          onClick={() => copyClientBundle(user)}
                          className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-xs flex items-center justify-center"
                          title="Copy bundle"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-2 rounded-xl bg-indigo-400/15 border border-indigo-400/25 text-indigo-200 text-xs flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDelete(user)}
                          className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-400/25 text-rose-200 text-xs flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-white/45 text-[11px] uppercase tracking-wider border-b border-white/[0.08]">
                    <th className="py-3.5 pl-6 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-white/25 bg-white/5 text-cyan-400 focus:ring-0 cursor-pointer"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="py-3.5 px-3 font-medium">Client</th>
                    <th className="py-3.5 px-3 font-medium">License Key</th>
                    <th className="py-3.5 px-3 font-medium">Device Allowance</th>
                    <th className="py-3.5 px-3 font-medium">HWID / Telemetry</th>
                    <th className="py-3.5 px-3 font-medium">Status</th>
                    <th className="py-3.5 px-3 font-medium">Validity</th>
                    <th className="py-3.5 pl-3 pr-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-white/45">
                        <div className="flex items-center justify-center gap-2.5">
                          <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
                          <span>Loading licenses...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-white/45">
                        No licenses found. Issue a new license above or adjust your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const rem = formatRemaining(user.expiresAt);
                      const count = getDeviceCount(user);
                      const limit = getDeviceLimitValue(user);
                      const isFull = limit > 0 && count >= limit;
                      const pct =
                        limit === 0
                          ? Math.min(100, count * 20)
                          : Math.min(100, Math.round((count / limit) * 100));
                      const hasHwid = Boolean(user.hwid && user.hwid !== 'null') || count > 0;

                      return (
                        <tr key={user._id} className="hover:bg-white/[0.035] transition-colors group">
                          <td className="py-4 pl-6 pr-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(user._id)}
                              onChange={() => toggleSelectOne(user._id)}
                              className="rounded border-white/25 bg-white/5 text-cyan-400 focus:ring-0 cursor-pointer"
                              aria-label={`Select ${user.username}`}
                            />
                          </td>

                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400/25 via-indigo-400/20 to-violet-500/25 border border-white/15 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{user.username}</p>
                                <p className="text-[11px] text-white/40">
                                  Added {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            {user.licenseKey ? (
                              <button
                                onClick={() => copyText(user.licenseKey!, `License key copied: ${user.licenseKey}`, user._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] font-mono text-xs text-cyan-200 transition"
                                title="Click to copy license key"
                              >
                                <Key className="w-3 h-3 text-cyan-300" />
                                <span>{user.licenseKey}</span>
                                {copiedKeyId === user._id ? (
                                  <Check className="w-3 h-3 text-emerald-300" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-45" />
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-white/30 italic">No key</span>
                            )}
                          </td>

                          <td className="py-4 px-3 min-w-[170px]">
                            <button
                              onClick={() => openInspector(user)}
                              className="w-full text-left group/dev space-y-1.5 p-2 -m-2 rounded-xl hover:bg-white/[0.05] transition"
                              title="Click to inspect devices or recharge limit"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1.5 font-medium text-white/90">
                                  <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                                  {count} / {limit === 0 ? '∞' : limit}
                                </span>
                                <span className="text-[10px] text-cyan-200/75 opacity-0 group-hover/dev:opacity-100 transition flex items-center gap-0.5">
                                  Adjust <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isFull
                                      ? 'bg-amber-400'
                                      : limit === 0
                                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                                      : 'bg-gradient-to-r from-cyan-400 to-violet-400'
                                  }`}
                                  style={{ width: `${Math.max(count > 0 ? 12 : 0, pct)}%` }}
                                />
                              </div>
                            </button>
                          </td>

                          <td className="py-4 px-3">
                            <div className="space-y-1 text-xs">
                              {hasHwid && user.hwid ? (
                                <div className="flex items-center gap-1.5 font-mono text-emerald-300/90" title={user.hwid}>
                                  <Monitor className="w-3 h-3 flex-shrink-0" />
                                  <span>
                                    {user.hwid.length > 14
                                      ? `${user.hwid.slice(0, 6)}...${user.hwid.slice(-6)}`
                                      : user.hwid}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-white/30">
                                  <Ban className="w-3 h-3" />
                                  <span>Unbound</span>
                                </div>
                              )}
                              <div className="text-[11px] text-white/40 flex items-center gap-2">
                                <span>{user.loginCount || 0} logins</span>
                                {user.lastLoginIP && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{user.lastLoginIP}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  rem.isExpired
                                    ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                                    : isFull
                                    ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                                    : rem.isExpiringSoon
                                    ? 'bg-amber-400/12 border-amber-300/25 text-amber-100'
                                    : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    rem.isExpired
                                      ? 'bg-rose-400'
                                      : isFull
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-400'
                                  }`}
                                />
                                {rem.isExpired ? 'Expired' : isFull ? 'Full' : rem.isExpiringSoon ? 'Expiring' : 'Active'}
                              </span>
                              {user.hwidReset && (
                                <span className="text-[10px] text-amber-300/85">Reset Pending</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="text-xs">
                              <p className="text-white/85 font-medium">
                                {new Date(user.expiresAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className={`text-[11px] mt-0.5 ${rem.isExpired ? 'text-rose-300/80' : rem.isExpiringSoon ? 'text-amber-300/85' : 'text-white/45'}`}>
                                {rem.label}
                              </p>
                            </div>
                          </td>

                          <td className="py-4 pl-3 pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openInspector(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-100 text-xs font-medium inline-flex items-center gap-1 transition"
                                title="Recharge days or change custom device limit"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Recharge</span>
                              </button>

                              <button
                                onClick={() => copyClientBundle(user)}
                                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-white/70 hover:text-white transition"
                                title="Copy client credentials bundle"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 rounded-xl bg-indigo-400/15 hover:bg-indigo-400/25 border border-indigo-400/25 text-indigo-200 transition"
                                title="Edit license"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {hasHwid && (
                                <button
                                  onClick={() => requestResetHwid(user.username)}
                                  className="p-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/25 text-amber-200 transition"
                                  title="Reset HWID"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => requestDelete(user)}
                                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-200 transition"
                                title="Delete license"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </section>
        </div>
      </main>

      {/* Recharge & Device Inspector Modal */}
      {inspectorUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
          <div className={`${glassCard} w-full max-w-xl rounded-3xl p-6 md:p-7 relative overflow-hidden max-h-[90vh] overflow-y-auto`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/25 to-violet-500/25 border border-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${accentText}`}>
                    Recharge & Device Inspector
                  </h3>
                  <p className="text-xs text-white/50">
                    Client: <strong className="text-white">{inspectorUser.username}</strong> •{' '}
                    {formatRemaining(inspectorUser.expiresAt).label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectorUser(null)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {/* Custom Device Limit Recharge */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/75 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                    Device Limit
                  </label>
                  <span className="text-xs text-cyan-200 font-medium">
                    Current: {getDeviceLimitValue(inspectorUser) === 0 ? 'Unlimited' : getDeviceLimitValue(inspectorUser)} →{' '}
                    New: {rechargeDeviceLimit === 0 ? 'Unlimited' : rechargeDeviceLimit}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 0, label: 'Unlimited' },
                    { val: 1, label: '1' },
                    { val: 2, label: '2' },
                    { val: 3, label: '3' },
                    { val: 5, label: '5' },
                    { val: 10, label: '10' },
                    { val: 25, label: '25' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setRechargeDeviceLimit(p.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        rechargeDeviceLimit === p.val
                          ? 'bg-cyan-400/20 border-cyan-400/45 text-cyan-100'
                          : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <div className="flex items-center rounded-xl bg-black/35 border border-white/[0.12] overflow-hidden ml-auto">
                    <button
                      type="button"
                      onClick={() => setRechargeDeviceLimit((v) => Math.max(0, v - 1))}
                      className="px-2.5 py-1.5 text-white/70 hover:bg-white/10"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={rechargeDeviceLimit}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setRechargeDeviceLimit(Number.isNaN(n) ? 0 : Math.max(0, Math.min(10000, n)));
                      }}
                      className="w-16 bg-transparent text-center text-xs font-mono font-semibold text-white focus:outline-none py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => setRechargeDeviceLimit((v) => Math.min(10000, v + 1))}
                      className="px-2.5 py-1.5 text-white/70 hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Extend / Recharge Days */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/75 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-300" />
                    Recharge Validity (+Days)
                  </label>
                  <span className="text-xs text-emerald-200">
                    {rechargeExtendDays > 0 ? `+${rechargeExtendDays} day(s) added` : 'No days added'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[0, 7, 15, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRechargeExtendDays(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        rechargeExtendDays === d
                          ? 'bg-emerald-400/20 border-emerald-400/45 text-emerald-100'
                          : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white'
                      }`}
                    >
                      {d === 0 ? 'Keep Expiry' : `+${d}d`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0}
                    max={36500}
                    value={rechargeExtendDays}
                    onChange={(e) => setRechargeExtendDays(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="+Days"
                    className="w-24 bg-black/35 border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs font-mono text-white text-center focus:outline-none ml-auto"
                  />
                </div>
              </div>

              {/* Registered HWIDs Inspector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/75 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-violet-300" />
                    Bound Hardware IDs ({getDeviceCount(inspectorUser)})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => requestResetHwid(inspectorUser.username)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/25 text-amber-200 text-[11px] font-medium transition"
                    >
                      Reset HWID
                    </button>
                    <button
                      type="button"
                      onClick={() => requestClearAllHwids(inspectorUser.username)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-200 text-[11px] font-medium transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/35 border border-white/[0.08] p-3 max-h-36 overflow-y-auto space-y-1.5">
                  {Array.isArray(inspectorUser.registeredHwids) && inspectorUser.registeredHwids.length > 0 ? (
                    inspectorUser.registeredHwids.map((hw, idx) => (
                      <div
                        key={hw}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] text-[11px] font-mono text-white/80"
                      >
                        <span className="truncate">
                          #{idx + 1} • {hw}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(hw, 'HWID copied')}
                          className="text-white/40 hover:text-white flex-shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : inspectorUser.hwid ? (
                    <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] text-[11px] font-mono text-white/80 truncate">
                      #1 • {inspectorUser.hwid}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 text-center py-2">No devices registered yet.</p>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={inspectorBusy}
                  onClick={() => handleApplyRecharge({ rotateKey: true })}
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-violet-200 inline-flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate Key
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInspectorUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/75 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={inspectorBusy}
                    onClick={() => handleApplyRecharge()}
                    className={`${primaryGlassBtn} px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-1.5 disabled:opacity-60`}
                  >
                    {inspectorBusy ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Apply Recharge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glass Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
          <div className={`${glassCard} w-full max-w-md rounded-3xl p-6 space-y-4 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-2xl border ${
                  confirmState.tone === 'danger'
                    ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                    : confirmState.tone === 'warning'
                    ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                    : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmState.title}</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">{confirmState.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-white/75 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={runConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  confirmState.tone === 'danger'
                    ? 'bg-rose-500/25 hover:bg-rose-500/35 border-rose-400/40 text-rose-100'
                    : confirmState.tone === 'warning'
                    ? 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-400/40 text-amber-100'
                    : 'bg-cyan-500/25 hover:bg-cyan-500/35 border-cyan-400/40 text-cyan-100'
                }`}
              >
                {confirmBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
