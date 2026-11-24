// app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  Server,
  HardDrive,
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
  UserCog,
  Store,
  UserPlus,
  UserMinus,
  Menu,
  X,
  Eye,
  EyeOff,
  Fingerprint,
  Calendar,
  Hash,
  Lock,
  Crown,
  Terminal,
  Upload,
  Download,
  File,
  Copy,
  Check,
  History,
  FolderOpen,
  Info,
  Layers,
  Zap,
  Wifi,
  WifiOff,
  Wand2,
  ArrowUpDown,
  ChevronRight,
  RotateCw,
  SlidersHorizontal,
  Bell,
  Radio,
  Sliders,
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

interface IReseller {
  _id: string;
  username: string;
  password?: string;
  createdAt: string;
  totalUsers?: number;
  activeUsers?: number;
}

interface IUploadedFile {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: string;
  downloadCount?: number;
  fileId: string;
  permanentLinkId?: string;
  slug?: string;
}

type AdminTab = 'users' | 'resellers' | 'upload' | 'settings';
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
  owner: string;
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
  return typeof user.deviceLimit === 'number' ? user.deviceLimit : 0;
}

function formatRemaining(expiresAt: string): {
  label: string;
  daysLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AmbientBackdrop() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-[#08090d]" />
      <div className="absolute -top-56 left-1/4 w-[680px] h-[680px] rounded-full bg-slate-300/[0.05] blur-[150px]" />
      <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] rounded-full bg-indigo-400/[0.05] blur-[150px]" />
      <div className="absolute -bottom-56 -left-32 w-[620px] h-[620px] rounded-full bg-sky-300/[0.04] blur-[150px]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] via-transparent to-black/50" />
    </div>
  );
}

export default function Home() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Dashboard Data
  const [users, setUsers] = useState<IUser[]>([]);
  const [resellers, setResellers] = useState<IReseller[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<IUploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Search / Filter / Sort / Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // User Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(true);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deviceLimit, setDeviceLimit] = useState<number>(0);
  const [customDeviceMode, setCustomDeviceMode] = useState<boolean>(false);
  const [customLicenseKey, setCustomLicenseKey] = useState<string>('');
  const [selectedReseller, setSelectedReseller] = useState<string>('admin');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<CreatedReceipt | null>(null);

  // Reseller Form State
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [resellerSubmitting, setResellerSubmitting] = useState(false);

  // Server Control & Enterprise Settings State
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  const [requiredVersion, setRequiredVersion] = useState('1.0.0');
  const [newVersion, setNewVersion] = useState('1.0.0');
  const [versionLoading, setVersionLoading] = useState(false);
  const [serverControlLoading, setServerControlLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Server undergoing scheduled maintenance. Please check back shortly.'
  );
  const [updateDownloadUrl, setUpdateDownloadUrl] = useState('');
  const [resellerMaxDeviceLimit, setResellerMaxDeviceLimit] = useState<number>(100);
  const [allowResellerUnlimited, setAllowResellerUnlimited] = useState<boolean>(true);
  const [hwidLockStrictness, setHwidLockStrictness] = useState<'strict' | 'flexible'>('strict');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookAlerts, setWebhookAlerts] = useState({
    onLogin: true,
    onKeyCreated: true,
    onHwidReset: true,
  });
  const [diagnostics, setDiagnostics] = useState<{
    pingMs: number;
    expiredCount: number;
    totalBoundDevices: number;
  }>({ pingMs: 12, expiredCount: 0, totalBoundDevices: 0 });
  const [pruneLoading, setPruneLoading] = useState(false);
  const [flushHwidLoading, setFlushHwidLoading] = useState(false);
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);

  // Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [replaceFileId, setReplaceFileId] = useState<string | null>(null);

  // Modals & UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Recharge & Device Inspector Modal State
  const [inspectorUser, setInspectorUser] = useState<IUser | null>(null);
  const [rechargeDeviceLimit, setRechargeDeviceLimit] = useState<number>(0);
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
    (user: {
      username: string;
      password?: string;
      licenseKey?: string | null;
      deviceLimit?: number;
      expiresAt: string;
    }) => {
      const limit = typeof user.deviceLimit === 'number' ? user.deviceLimit : 0;
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
        setInspectorUser((prev) =>
          prev ? result.data.find((u: IUser) => u._id === prev._id) || null : null
        );
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      } else {
        showToast(result.error || 'Failed to fetch users', 'error');
      }
    } catch {
      showToast('Network error while fetching users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchResellers = useCallback(async () => {
    try {
      const res = await fetch('/api/resellers');
      const data = await res.json();
      if (data.success) setResellers(data.data);
    } catch {
      // Ignore silent fetch error
    }
  }, []);

  const fetchServerSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        if (data.settings) {
          setServerStatus(data.settings.serverStatus || 'online');
          setRequiredVersion(data.settings.requiredVersion || '1.0.0');
          setNewVersion(data.settings.requiredVersion || '1.0.0');
          setMaintenanceMessage(data.settings.maintenanceMessage || '');
          setUpdateDownloadUrl(data.settings.updateDownloadUrl || '');
          setResellerMaxDeviceLimit(
            typeof data.settings.resellerMaxDeviceLimit === 'number'
              ? data.settings.resellerMaxDeviceLimit
              : 100
          );
          setAllowResellerUnlimited(
            typeof data.settings.allowResellerUnlimited === 'boolean'
              ? data.settings.allowResellerUnlimited
              : true
          );
          setHwidLockStrictness(data.settings.hwidLockStrictness || 'strict');
          setWebhookUrl(data.settings.webhookUrl || '');
          if (data.settings.webhookAlerts) setWebhookAlerts(data.settings.webhookAlerts);
        } else {
          setServerStatus(data.serverStatus || 'online');
          setRequiredVersion(data.requiredVersion || '1.0.0');
          setNewVersion(data.requiredVersion || '1.0.0');
        }
        if (data.diagnostics) {
          setDiagnostics(data.diagnostics);
        }
      }
    } catch {
      // Ignore silent fetch error
    }
  }, []);

  const fetchUploadedFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) setUploadedFiles(data.data);
    } catch {
      // Ignore silent fetch error
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchUsers();
    fetchResellers();
    fetchServerSettings();
    fetchUploadedFiles();
  }, [fetchUsers, fetchResellers, fetchServerSettings, fetchUploadedFiles]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          refreshAll();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [refreshAll]);

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
        refreshAll();
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
      setUsers([]);
      setSelectedIds([]);
      showToast('Logged out successfully');
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  // User Form Handlers
  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setDurationDays(30);
    setDeviceLimit(0);
    setCustomDeviceMode(false);
    setCustomLicenseKey('');
    setSelectedReseller('admin');
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

    setSubmitting(true);
    try {
      const owner = selectedReseller || 'admin';
      if (editingId) {
        const payload: Record<string, unknown> = {
          id: editingId,
          username: cleanUsername,
          durationDays,
          deviceLimit,
          createdBy: owner,
        };
        if (password) payload.password = password;
        if (customLicenseKey.trim()) payload.licenseKey = customLicenseKey.trim();

        const res = await fetch('/api/users', {
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
            owner,
            isUpdate: true,
          });
          resetForm();
          fetchUsers();
          fetchResellers();
        } else {
          showToast(data.error || 'Failed to update user', 'error');
        }
      } else {
        const payload: Record<string, unknown> = {
          username: cleanUsername,
          password,
          durationDays,
          deviceLimit,
          createdBy: owner,
        };
        if (customLicenseKey.trim()) payload.licenseKey = customLicenseKey.trim();

        const res = await fetch('/api/users', {
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
            owner,
          });
          resetForm();
          fetchUsers();
          fetchResellers();
        } else {
          showToast(data.error || 'Username already exists', 'error');
        }
      }
    } catch {
      showToast('Network error while saving user', 'error');
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
    setSelectedReseller(user.createdBy || 'admin');
    setActiveTab('users');
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
      const payload: Record<string, unknown> = { id: inspectorUser._id };
      if (daysToAdd > 0) payload.extendDays = daysToAdd;
      if (targetLimit !== getDeviceLimitValue(inspectorUser)) payload.deviceLimit = targetLimit;
      if (rotate) payload.rotateKey = true;

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          rotate
            ? `License key rotated for ${inspectorUser.username}`
            : `Updated ${inspectorUser.username} successfully!`
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

  // Confirmation Actions
  const requestDeleteUser = (user: IUser) => {
    setConfirmState({
      title: `Delete "${user.username}"?`,
      description: 'This permanently revokes the license key and deletes all registered HWIDs.',
      confirmLabel: 'Delete License',
      tone: 'danger',
      onConfirm: async () => {
        const res = await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user._id }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Deleted ${user.username}`);
          setSelectedIds((prev) => prev.filter((id) => id !== user._id));
          if (inspectorUser?._id === user._id) setInspectorUser(null);
          fetchUsers();
          fetchResellers();
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
        const res = await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Selected licenses deleted');
          setSelectedIds([]);
          fetchUsers();
          fetchResellers();
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
        const res = await fetch('/api/admin/reset-hwid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUsername }),
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
        const res = await fetch('/api/admin/clear-hwids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUsername }),
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

  // Reseller Handlers
  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resellerUsername.trim() || !resellerPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setResellerSubmitting(true);
    try {
      const res = await fetch('/api/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resellerUsername.trim(), password: resellerPassword }),
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
    } finally {
      setResellerSubmitting(false);
    }
  };

  const requestDeleteReseller = (reseller: IReseller) => {
    setConfirmState({
      title: `Delete reseller "${reseller.username}"?`,
      description: 'This removes the reseller login account. Their existing users will remain intact.',
      confirmLabel: 'Delete Reseller',
      tone: 'danger',
      onConfirm: async () => {
        const res = await fetch('/api/resellers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: reseller._id }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('Reseller deleted successfully');
          fetchResellers();
        } else {
          showToast(data.error || 'Failed to delete reseller', 'error');
        }
      },
    });
  };

  // Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        showToast('Maximum 3 files can be selected!', 'error');
        e.target.value = '';
        return;
      }
      const validFiles = files.filter((f) => f.size <= 50 * 1024 * 1024);
      if (validFiles.length !== files.length) {
        showToast('Some files exceed 50MB!', 'error');
      }
      setSelectedFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast('No file selected!', 'error');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(25);

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    if (replaceFileId) formData.append('replaceFileId', replaceFileId);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        showToast(
          replaceFileId
            ? `${selectedFiles.length} file(s) updated successfully! Link remains the same.`
            : `${selectedFiles.length} file(s) uploaded successfully!`
        );
        setSelectedFiles([]);
        setReplaceFileId(null);
        setUploadProgress(100);
        fetchUploadedFiles();
      } else {
        showToast(data.error || 'Upload failed!', 'error');
      }
    } catch {
      showToast('Upload error occurred!', 'error');
    } finally {
      setUploadLoading(false);
      setTimeout(() => setUploadProgress(0), 2500);
    }
  };

  const requestDeleteFile = (file: IUploadedFile) => {
    setConfirmState({
      title: `Delete "${file.filename}"?`,
      description: 'This permanently removes the file from GridFS storage and breaks its download link.',
      confirmLabel: 'Delete File',
      tone: 'danger',
      onConfirm: async () => {
        const res = await fetch('/api/files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: file.fileId }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('File deleted successfully!');
          fetchUploadedFiles();
          if (replaceFileId === file.fileId) setReplaceFileId(null);
        } else {
          showToast(data.error || 'Delete failed!', 'error');
        }
      },
    });
  };

  const copyFileLink = (link: string, fileId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(fileId);
    showToast('Download link copied!');
    setTimeout(() => setCopiedLink((prev) => (prev === fileId ? null : prev)), 2500);
  };

  // Server Control Handlers
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
        showToast(`Server is now ${status}`);
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
        showToast(`Required version updated to ${newVersion.trim()}`);
      } else {
        showToast(data.error || 'Failed to update version', 'error');
      }
    } catch {
      showToast('Error updating version', 'error');
    } finally {
      setVersionLoading(false);
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    setSavingSettingKey(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Setting saved successfully');
        fetchServerSettings();
      } else {
        showToast(data.error || 'Failed to save setting', 'error');
      }
    } catch {
      showToast('Network error saving setting', 'error');
    } finally {
      setSavingSettingKey(null);
    }
  };

  const handlePruneExpired = () => {
    setConfirmState({
      title: 'Prune Expired Licenses',
      description: `Permanently delete ${diagnostics.expiredCount} expired licenses from the database? This cannot be undone.`,
      confirmLabel: 'Prune All Expired',
      tone: 'danger',
      onConfirm: async () => {
        setPruneLoading(true);
        try {
          const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pruneExpired' }),
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'Expired licenses pruned');
            fetchUsers();
            fetchServerSettings();
          } else {
            showToast(data.error || 'Failed to prune licenses', 'error');
          }
        } catch {
          showToast('Error pruning licenses', 'error');
        } finally {
          setPruneLoading(false);
        }
      },
    });
  };

  const handleResetAllHwids = () => {
    setConfirmState({
      title: 'Mass HWID Flush',
      description:
        'This will clear all device bindings across all licenses. Users will rebind on next launch. Continue?',
      confirmLabel: 'Flush All Devices',
      tone: 'danger',
      onConfirm: async () => {
        setFlushHwidLoading(true);
        try {
          const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resetAllHwids' }),
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'All device bindings flushed');
            fetchUsers();
            fetchServerSettings();
          } else {
            showToast(data.error || 'Failed to reset device bindings', 'error');
          }
        } catch {
          showToast('Error resetting device bindings', 'error');
        } finally {
          setFlushHwidLoading(false);
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

  // Derived Analytics & Filtered Users
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

    const totalDownloads = uploadedFiles.reduce((acc, f) => acc + (f.downloadCount || 0), 0);

    return {
      total: users.length,
      active,
      expiringSoon,
      expired,
      full,
      totalDevices,
      totalLogins,
      unlimitedCount,
      totalDownloads,
    };
  }, [users, uploadedFiles]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = users.filter((u) => {
      const owner = u.createdBy || 'admin';
      if (ownerFilter !== 'all' && owner !== ownerFilter) return false;

      const matchesQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        (u.licenseKey || '').toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
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
  }, [users, searchTerm, statusFilter, ownerFilter, sortBy]);

  const getUsersByReseller = useCallback(
    (resellerName: string) => users.filter((u) => u.createdBy === resellerName),
    [users]
  );

  const exportCsv = () => {
    if (filteredUsers.length === 0) {
      showToast('No licenses to export', 'info');
      return;
    }
    const headers = [
      'Username',
      'LicenseKey',
      'Owner',
      'DeviceLimit',
      'DevicesUsed',
      'Logins',
      'LastIP',
      'Status',
      'ExpiresAt',
    ];
    const rows = filteredUsers.map((u) => {
      const rem = formatRemaining(u.expiresAt);
      const count = getDeviceCount(u);
      const limit = getDeviceLimitValue(u);
      const status = rem.isExpired ? 'Expired' : limit > 0 && count >= limit ? 'Full' : 'Active';
      return [
        u.username,
        u.licenseKey || '',
        u.createdBy || 'admin',
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
    a.download = `admin-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
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

  // Shared Executive Glass Design Tokens
  const glassCard =
    'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_rgba(0,0,0,0.45)]';
  const glassInput =
    'w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 backdrop-blur-md focus:outline-none focus:bg-white/[0.06] focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all duration-150';
  const primaryGlassBtn =
    'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-150 active:scale-[0.99]';
  const accentText = 'text-zinc-100';

  // Loading Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden">
        <AmbientBackdrop />
        <div className={`relative z-10 ${glassCard} rounded-2xl px-7 py-6 flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-zinc-200 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Initializing Console</p>
            <p className="text-xs text-zinc-400 mt-0.5">Verifying administrator session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden">
        <AmbientBackdrop />

        <div className="w-full max-w-md relative z-10">
          <div className={`${glassCard} rounded-2xl p-8 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="text-center mb-7">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <Terminal className="w-5 h-5 text-zinc-100" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-1.5">
                Aegis Core
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Administrator Sign In</h1>
              <p className="text-zinc-400 text-xs mt-1.5">
                License management, resellers, files &amp; server control
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-400/25 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-300" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className={glassInput}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${glassInput} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full ${primaryGlassBtn} rounded-xl py-3 px-4 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                Signed Cookie Session
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Encrypted
              </span>
            </div>
          </div>
          <p className="text-center text-[11px] text-zinc-600 mt-4">
            Aegis Core • Master Control Panel
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
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-black/55 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center">
            <Terminal className="w-4 h-4 text-zinc-100" />
          </div>
          <div>
            <span className={`text-sm font-bold block leading-tight ${accentText}`}>Aegis Core</span>
            <span className="text-[10px] text-white/45 block">
              {serverStatus === 'online' ? 'API Online' : 'Maintenance'} • v{requiredVersion}
            </span>
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
                { id: 'users', label: 'Users & Licenses', count: users.length, icon: Users },
                { id: 'resellers', label: 'Resellers', count: resellers.length, icon: Store },
                { id: 'upload', label: 'File Vault', count: uploadedFiles.length, icon: Upload },
                { id: 'settings', label: 'Server Settings', count: null, icon: Settings },
              ] as { id: AdminTab; label: string; count: number | null; icon: React.ComponentType<{ className?: string }> }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm transition ${
                  activeTab === item.id
                    ? 'bg-white/[0.1] border-cyan-400/40 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-cyan-300" />
                  {item.label}
                </span>
                {item.count !== null && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10">{item.count}</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium text-rose-300 bg-rose-500/12 border border-rose-400/25"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* Desktop Glass Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 z-40 flex-col rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_rgba(0,0,0,0.45)] p-5">
        <div className="flex items-center gap-3 pb-5 border-b border-white/[0.07]">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Terminal className="w-4 h-4 text-zinc-100" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight truncate text-zinc-100">Aegis Core</h2>
            <p className="text-[11px] text-zinc-500 truncate">Admin Console</p>
          </div>
        </div>

        <nav className="mt-5 space-y-1 flex-1">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-2">
            Navigation
          </p>
          {(
            [
              { id: 'users', label: 'Users & Licenses', count: users.length, icon: Users },
              { id: 'resellers', label: 'Resellers', count: resellers.length, icon: Store },
              { id: 'upload', label: 'File Vault', count: uploadedFiles.length, icon: Upload },
              { id: 'settings', label: 'Server Settings', count: null, icon: Settings },
            ] as {
              id: AdminTab;
              label: string;
              count: number | null;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((nav) => {
            const active = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-white/[0.09] border border-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'border border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <nav.icon className={`w-4 h-4 ${active ? 'text-zinc-100' : 'text-zinc-500'}`} />
                  {nav.label}
                </span>
                {nav.count !== null && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.06] text-zinc-300 tabular-nums">
                    {nav.count}
                  </span>
                )}
              </button>
            );
          })}

          {activeTab === 'users' && (
            <div className="pt-5 space-y-1">
              <p className="px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-2">
                Filters
              </p>
              {(
                [
                  { id: 'all', label: 'All Keys', count: stats.total, dot: 'bg-zinc-300' },
                  { id: 'active', label: 'Active', count: stats.active, dot: 'bg-emerald-400' },
                  { id: 'expiring', label: 'Expiring ≤ 7d', count: stats.expiringSoon, dot: 'bg-amber-400' },
                  { id: 'full', label: 'Devices Full', count: stats.full, dot: 'bg-sky-400' },
                  { id: 'expired', label: 'Expired', count: stats.expired, dot: 'bg-rose-400' },
                ] as { id: StatusFilter; label: string; count: number; dot: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition ${
                    statusFilter === f.id
                      ? 'bg-white/[0.07] text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                    {f.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="pt-4 border-t border-white/[0.07] space-y-2.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-zinc-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200 truncate">Administrator</p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {serverStatus === 'online' ? 'Server Online' : 'Maintenance'}
              </p>
            </div>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-rose-200 bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-400/25 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 lg:pl-72 pt-20 lg:pt-6 pb-12 px-4 md:px-7 lg:pr-8">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Header Bar */}
          <div className={`${glassCard} rounded-2xl p-5 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className={`text-xl md:text-2xl font-semibold tracking-tight ${accentText}`}>
                  Admin Dashboard
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-white/[0.06] text-zinc-300 border border-white/[0.1]">
                  Master
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Manage licenses, custom device limits, resellers, vault files &amp; server status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
                {serverStatus === 'online' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-200">API Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-rose-200">Maintenance</span>
                  </>
                )}
                <span className="text-white/20">•</span>
                <span className="font-mono text-[11px] text-zinc-400">v{requiredVersion}</span>
              </div>

              {activeTab === 'users' && (
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-zinc-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export CSV</span>
                </button>
              )}

              <button
                onClick={refreshAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-zinc-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* KPI Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className={`${glassCard} rounded-2xl p-4 hover:border-white/15 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Total Users</span>
                <Layers className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-semibold mt-2 text-zinc-100 tabular-nums">{stats.total}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{stats.unlimitedCount} unlimited key(s)</p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 hover:border-white/15 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Active</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              </div>
              <p className="text-2xl font-semibold mt-2 text-emerald-300 tabular-nums">{stats.active}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                {stats.expiringSoon > 0 ? `${stats.expiringSoon} expiring ≤7d` : 'All healthy'}
              </p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 hover:border-white/15 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Devices</span>
                <Smartphone className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-semibold mt-2 text-zinc-100 tabular-nums">{stats.totalDevices}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{stats.full} at full capacity</p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 hover:border-white/15 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Resellers</span>
                <Store className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-semibold mt-2 text-zinc-100 tabular-nums">{resellers.length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{stats.totalLogins} total logins</p>
            </div>

            <div className={`${glassCard} rounded-2xl p-4 col-span-2 md:col-span-1 hover:border-white/15 transition`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Vault Files</span>
                <File className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-semibold mt-2 text-zinc-100 tabular-nums">{uploadedFiles.length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{stats.totalDownloads} download(s)</p>
            </div>
          </div>

          {/* ===================== USERS TAB ===================== */}
          {activeTab === 'users' && (
            <>
              {/* Receipt Banner */}
              {createdReceipt && (
                <div className="rounded-3xl bg-gradient-to-r from-emerald-500/12 via-cyan-500/10 to-indigo-500/12 backdrop-blur-2xl border border-emerald-400/30 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>{createdReceipt.isUpdate ? 'License Updated' : 'License Ready for Delivery'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 font-mono">
                      <span>
                        User: <strong className="text-white">{createdReceipt.username}</strong>
                      </span>
                      {createdReceipt.password && (
                        <span>
                          Pass: <strong className="text-white">{createdReceipt.password}</strong>
                        </span>
                      )}
                      {createdReceipt.licenseKey && (
                        <span>
                          Key: <strong className="text-cyan-200">{createdReceipt.licenseKey}</strong>
                        </span>
                      )}
                      <span>
                        Owner: <strong className="text-violet-200">{createdReceipt.owner}</strong>
                      </span>
                      <span>
                        Limit:{' '}
                        <strong className="text-indigo-200">
                          {createdReceipt.deviceLimit === 0
                            ? 'Unlimited'
                            : `${createdReceipt.deviceLimit} Device(s)`}
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

              {/* Create / Edit License Form */}
              <section id="form-section" className={`${glassCard} rounded-3xl p-5 md:p-7 relative overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center">
                      {editingId ? <Edit className="w-4 h-4 text-amber-200" /> : <Plus className="w-4 h-4 text-zinc-100" />}
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${accentText}`}>
                        {editingId ? `Editing License: ${username}` : 'Generate New License'}
                      </h2>
                      <p className="text-xs text-white/45">
                        Assign owner, validity duration, custom license key &amp; device allowance.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            onClick={() => setUsername(`user_${Math.floor(1000 + Math.random() * 9000)}`)}
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
                        placeholder="user_01"
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

                    {/* Duration */}
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
                      <div className="flex flex-wrap gap-1 pt-1">
                        {[1, 7, 30, 90, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDurationDays(d)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition ${
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

                    {/* License Key */}
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
                        placeholder="Auto XXXX-XXXX..."
                        className={`${glassInput} font-mono text-xs uppercase`}
                      />
                    </div>

                    {/* Created By / Owner */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCog className="w-3.5 h-3.5 text-amber-200" />
                        Owner
                      </label>
                      <select
                        value={selectedReseller}
                        onChange={(e) => setSelectedReseller(e.target.value)}
                        className={`${glassInput} cursor-pointer`}
                      >
                        <option value="admin" className="bg-[#0b0d16]">
                          Admin (Direct)
                        </option>
                        {resellers.map((r) => (
                          <option key={r._id} value={r.username} className="bg-[#0b0d16]">
                            Reseller: {r.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom Device Limit Control Bar */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.1] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-cyan-300" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                          Device Allowance
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-400/15 border border-cyan-400/30 text-cyan-200">
                          {deviceLimit === 0
                            ? 'Unlimited Devices'
                            : `${deviceLimit} Device${deviceLimit > 1 ? 's' : ''} Max`}
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
                                ? 'bg-white/[0.14] border-white/30 text-white'
                                : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.07]'
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

                  <div className="flex justify-end">
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

              {/* Credentials Table Card */}
              <section className={`${glassCard} rounded-3xl overflow-hidden relative`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="p-5 md:p-6 border-b border-white/[0.08] space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                        <Database className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className={`text-base font-bold ${accentText}`}>Registered Credentials</h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/70">
                            {filteredUsers.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/45">
                          Click any device bar or Recharge button to extend days, inspect HWIDs, or rotate keys.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search user, key, owner, IP..."
                          className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/35 focus:outline-none focus:border-cyan-400/50 transition"
                        />
                      </div>

                      <select
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white/85 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                      >
                        <option value="all" className="bg-[#0b0d16]">Owner: All</option>
                        <option value="admin" className="bg-[#0b0d16]">Owner: Admin</option>
                        {resellers.map((r) => (
                          <option key={r._id} value={r.username} className="bg-[#0b0d16]">
                            Reseller: {r.username}
                          </option>
                        ))}
                      </select>

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

                  {/* Filter Pills + Bulk Action */}
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
                    <div className="p-10 text-center text-white/45 text-sm">No credentials found.</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const rem = formatRemaining(user.expiresAt);
                      const count = getDeviceCount(user);
                      const limit = getDeviceLimitValue(user);
                      const isFull = limit > 0 && count >= limit;
                      const pct =
                        limit === 0 ? Math.min(100, count * 20) : Math.min(100, Math.round((count / limit) * 100));

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
                              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-sm font-semibold text-zinc-100">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/65">
                                    {user.createdBy === 'admin' ? 'Admin' : user.createdBy || 'Admin'}
                                  </span>
                                </div>
                                {user.licenseKey && (
                                  <button
                                    onClick={() => copyText(user.licenseKey!, `Copied key: ${user.licenseKey}`, user._id)}
                                    className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-200/85 mt-0.5"
                                  >
                                    <Key className="w-3 h-3" />
                                    <span className="truncate">{user.licenseKey}</span>
                                    {copiedKeyId === user._id ? (
                                      <Check className="w-3 h-3 text-emerald-300" />
                                    ) : (
                                      <Copy className="w-3 h-3 opacity-50" />
                                    )}
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
                                  isFull ? 'bg-amber-400' : 'bg-zinc-200'
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
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="px-3 py-2 rounded-xl bg-indigo-400/15 border border-indigo-400/25 text-indigo-200 text-xs flex items-center justify-center"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requestDeleteUser(user)}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-400/25 text-rose-200 text-xs flex items-center justify-center"
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
                        <th className="py-3.5 px-3 font-medium">Owner</th>
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
                          <td colSpan={9} className="p-12 text-center text-white/45">
                            <div className="flex items-center justify-center gap-2.5">
                              <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
                              <span>Loading licenses...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-white/45">
                            No credentials found.
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
                          const isAdminOwned = !user.createdBy || user.createdBy === 'admin';

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
                                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-xs font-semibold text-zinc-100 flex-shrink-0">
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
                                    onClick={() =>
                                      copyText(user.licenseKey!, `License key copied: ${user.licenseKey}`, user._id)
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] font-mono text-xs text-cyan-200 transition"
                                    title="Copy license key"
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

                              <td className="py-4 px-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                    isAdminOwned
                                      ? 'bg-amber-400/12 border-amber-300/25 text-amber-200'
                                      : 'bg-indigo-400/12 border-indigo-300/25 text-indigo-200'
                                  }`}
                                >
                                  {isAdminOwned ? (
                                    <Crown className="w-3 h-3" />
                                  ) : (
                                    <Store className="w-3 h-3" />
                                  )}
                                  <span>{isAdminOwned ? 'Admin' : user.createdBy}</span>
                                </span>
                              </td>

                              <td className="py-4 px-3 min-w-[165px]">
                                <button
                                  onClick={() => openInspector(user)}
                                  className="w-full text-left group/dev space-y-1.5 p-2 -m-2 rounded-xl hover:bg-white/[0.05] transition"
                                  title="Click to inspect devices or adjust limit"
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
                                          ? 'bg-emerald-400/80'
                                          : 'bg-zinc-200'
                                      }`}
                                      style={{ width: `${Math.max(count > 0 ? 12 : 0, pct)}%` }}
                                    />
                                  </div>
                                </button>
                              </td>

                              <td className="py-4 px-3">
                                <div className="space-y-1 text-xs">
                                  {hasHwid && user.hwid ? (
                                    <div
                                      className="flex items-center gap-1.5 font-mono text-emerald-300/90"
                                      title={user.hwid}
                                    >
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
                                    {rem.isExpired
                                      ? 'Expired'
                                      : isFull
                                      ? 'Full'
                                      : rem.isExpiringSoon
                                      ? 'Expiring'
                                      : 'Active'}
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
                                  <p
                                    className={`text-[11px] mt-0.5 ${
                                      rem.isExpired
                                        ? 'text-rose-300/80'
                                        : rem.isExpiringSoon
                                        ? 'text-amber-300/85'
                                        : 'text-white/45'
                                    }`}
                                  >
                                    {rem.label}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4 pl-3 pr-6">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openInspector(user)}
                                    className="px-2.5 py-1.5 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-100 text-xs font-medium inline-flex items-center gap-1 transition"
                                    title="Recharge days or adjust custom device limit"
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
                                    onClick={() => requestDeleteUser(user)}
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
            </>
          )}

          {/* ===================== RESELLERS TAB ===================== */}
          {activeTab === 'resellers' && (
            <>
              <section className={`${glassCard} rounded-3xl p-5 md:p-7 relative overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-white/15 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${accentText}`}>Create Reseller Account</h2>
                    <p className="text-xs text-white/45">
                      Provision reseller logins with full access to their own license studio.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateReseller} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-cyan-300" />
                      Reseller Username
                    </label>
                    <input
                      type="text"
                      value={resellerUsername}
                      onChange={(e) => setResellerUsername(e.target.value)}
                      placeholder="reseller_01"
                      className={glassInput}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-300" />
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setResellerPassword(generateRandomPassword(12))}
                        className="text-[10px] text-indigo-300/80 hover:text-indigo-200 flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3" />
                        Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={resellerPassword}
                      onChange={(e) => setResellerPassword(e.target.value)}
                      placeholder="securepass123"
                      className={glassInput}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resellerSubmitting}
                    className={`${primaryGlassBtn} py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
                  >
                    {resellerSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Reseller
                      </>
                    )}
                  </button>
                </form>
              </section>

              <section className={`${glassCard} rounded-3xl overflow-hidden relative`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="p-5 md:p-6 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                      <Store className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h2 className={`text-base font-bold ${accentText}`}>Reseller Directory</h2>
                      <p className="text-[11px] text-white/45">{resellers.length} active reseller account(s)</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Reseller Cards */}
                <div className="md:hidden divide-y divide-white/[0.07]">
                  {resellers.length === 0 ? (
                    <div className="p-10 text-center text-white/45 text-sm">No resellers found.</div>
                  ) : (
                    resellers.map((reseller) => {
                      const rUsers = getUsersByReseller(reseller.username);
                      const rActive = rUsers.filter((u) => new Date(u.expiresAt) > new Date()).length;

                      return (
                        <div key={reseller._id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 border border-white/15 flex items-center justify-center font-bold">
                                {reseller.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{reseller.username}</p>
                                <p className="text-[11px] text-white/45">
                                  Joined {new Date(reseller.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
                              {rActive}/{rUsers.length} active
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('users');
                                setOwnerFilter(reseller.username);
                                showToast(`Filtered to ${reseller.username}'s licenses`, 'info');
                              }}
                              className="flex-1 py-2 rounded-xl bg-cyan-400/15 border border-cyan-400/25 text-cyan-100 text-xs font-medium"
                            >
                              View Licenses
                            </button>
                            <button
                              onClick={() => requestDeleteReseller(reseller)}
                              className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-400/25 text-rose-200 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Reseller Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-white/[0.03] text-white/45 text-[11px] uppercase tracking-wider border-b border-white/[0.08]">
                        <th className="py-3.5 pl-6 px-3 font-medium">Reseller</th>
                        <th className="py-3.5 px-3 font-medium">Created At</th>
                        <th className="py-3.5 px-3 font-medium">Total Licenses</th>
                        <th className="py-3.5 px-3 font-medium">Active Licenses</th>
                        <th className="py-3.5 px-3 font-medium">ID</th>
                        <th className="py-3.5 pl-3 pr-6 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {resellers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-white/45">
                            No resellers found.
                          </td>
                        </tr>
                      ) : (
                        resellers.map((reseller) => {
                          const rUsers = getUsersByReseller(reseller.username);
                          const rActive = rUsers.filter((u) => new Date(u.expiresAt) > new Date()).length;

                          return (
                            <tr key={reseller._id} className="hover:bg-white/[0.035] transition-colors">
                              <td className="py-4 pl-6 px-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 border border-white/15 flex items-center justify-center text-xs font-bold">
                                    {reseller.username.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-white">{reseller.username}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 text-xs text-white/60">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                                  {new Date(reseller.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-4 px-3">
                                <span className="px-2.5 py-1 rounded-full text-xs bg-cyan-400/12 border border-cyan-400/25 text-cyan-200">
                                  {rUsers.length}
                                </span>
                              </td>
                              <td className="py-4 px-3">
                                <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
                                  {rActive}
                                </span>
                              </td>
                              <td className="py-4 px-3 font-mono text-xs text-white/40">
                                <span className="inline-flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {reseller._id.slice(-6)}
                                </span>
                              </td>
                              <td className="py-4 pl-3 pr-6 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setActiveTab('users');
                                      setOwnerFilter(reseller.username);
                                      showToast(`Filtered to ${reseller.username}'s licenses`, 'info');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/25 text-cyan-100 text-xs font-medium inline-flex items-center gap-1.5 transition"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    View Licenses
                                  </button>
                                  <button
                                    onClick={() => requestDeleteReseller(reseller)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-200 text-xs font-medium inline-flex items-center gap-1.5 transition"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
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
              </section>
            </>
          )}

          {/* ===================== UPLOAD / VAULT TAB ===================== */}
          {activeTab === 'upload' && (
            <>
              <section className={`${glassCard} rounded-3xl p-5 md:p-7 relative overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-white/15 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${accentText}`}>Upload &amp; Update Payloads</h2>
                    <p className="text-xs text-white/45">
                      Permanent GridFS download links — replace files in place without breaking URLs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-3">
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                        selectedFiles.length > 0
                          ? 'border-cyan-400/50 bg-cyan-400/[0.06]'
                          : 'border-white/15 hover:border-cyan-400/35 bg-white/[0.025] hover:bg-white/[0.05]'
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 3) {
                          showToast('Maximum 3 files can be uploaded!', 'error');
                          return;
                        }
                        const validFiles = files.filter((f) => f.size <= 50 * 1024 * 1024);
                        if (validFiles.length !== files.length) {
                          showToast('Some files exceed 50MB!', 'error');
                        }
                        setSelectedFiles(validFiles);
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="*/*"
                      />

                      {selectedFiles.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-emerald-300">
                            <CheckCircle className="w-6 h-6" />
                            <span className="text-sm font-semibold">{selectedFiles.length} file(s) staged</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            {selectedFiles.map((file, idx) => (
                              <div
                                key={`${file.name}-${idx}`}
                                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs flex items-center gap-2"
                              >
                                <File className="w-3.5 h-3.5 text-cyan-300" />
                                <span className="text-white/85 truncate max-w-[160px]">{file.name}</span>
                                <span className="text-white/45">({formatFileSize(file.size)})</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFiles([]);
                              setReplaceFileId(null);
                            }}
                            className="text-xs text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Clear selection
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-400/12 border border-cyan-400/25 flex items-center justify-center">
                            <Upload className="w-7 h-7 text-cyan-200" />
                          </div>
                          <p className="text-sm font-medium text-white/85">
                            Drag &amp; drop files here or click to browse
                          </p>
                          <p className="text-xs text-white/45">Up to 3 files • Max 50MB per file</p>
                        </div>
                      )}
                    </div>

                    {uploadProgress > 0 && (
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {uploadedFiles.length > 0 && (
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.1] p-4 space-y-2">
                        <label className="text-[11px] font-semibold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 text-cyan-300" />
                          Replace Existing (Optional)
                        </label>
                        <select
                          value={replaceFileId || ''}
                          onChange={(e) => setReplaceFileId(e.target.value || null)}
                          className="w-full bg-black/35 border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="" className="bg-[#0b0d16]">Upload as new file</option>
                          {uploadedFiles.map((file) => (
                            <option key={file.fileId} value={file.fileId} className="bg-[#0b0d16]">
                              Replace: {file.filename} ({formatFileSize(file.size)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || uploadLoading}
                      className={`w-full ${primaryGlassBtn} py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          {replaceFileId ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          {replaceFileId ? 'Update Existing File' : 'Upload to Vault'}
                        </>
                      )}
                    </button>

                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-1.5 text-xs text-white/55">
                      <p className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-cyan-300" />
                        <span>{replaceFileId ? 'Keeps permanent URL unchanged' : 'Generates permanent link'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Stored securely in MongoDB GridFS</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${glassCard} rounded-3xl overflow-hidden relative`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="p-5 md:p-6 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12]">
                      <History className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h2 className={`text-base font-bold ${accentText}`}>Hosted Files</h2>
                      <p className="text-[11px] text-white/45">{uploadedFiles.length} file(s) in vault</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchUploadedFiles}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/75 flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>

                {uploadedFiles.length === 0 ? (
                  <div className="p-12 text-center text-white/45 space-y-2">
                    <FolderOpen className="w-10 h-10 mx-auto text-white/20" />
                    <p className="text-sm">No files uploaded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-white/[0.03] text-white/45 text-[11px] uppercase tracking-wider border-b border-white/[0.08]">
                          <th className="py-3.5 pl-6 px-3 font-medium">File Name</th>
                          <th className="py-3.5 px-3 font-medium">Size</th>
                          <th className="py-3.5 px-3 font-medium">Uploaded</th>
                          <th className="py-3.5 px-3 font-medium">Downloads</th>
                          <th className="py-3.5 pl-3 pr-6 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {uploadedFiles.map((file) => {
                          const downloadLink =
                            typeof window !== 'undefined'
                              ? `${window.location.origin}/api/download/${file.slug || file.permanentLinkId || file.fileId}`
                              : `/api/download/${file.slug || file.permanentLinkId || file.fileId}`;
                          const isCopied = copiedLink === file.fileId;

                          return (
                            <tr key={file._id + file.fileId} className="hover:bg-white/[0.035] transition-colors">
                              <td className="py-4 pl-6 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-xl bg-cyan-400/12 border border-cyan-400/20 text-cyan-200">
                                    <File className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium text-white truncate max-w-[240px]" title={file.filename}>
                                    {file.filename}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-3 text-xs text-white/60">{formatFileSize(file.size)}</td>
                              <td className="py-4 px-3 text-xs text-white/60">
                                {new Date(file.uploadDate).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-4 px-3 text-xs text-white/70">
                                <span className="inline-flex items-center gap-1">
                                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                                  {file.downloadCount || 0}
                                </span>
                              </td>
                              <td className="py-4 pl-3 pr-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <a
                                    href={downloadLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 text-emerald-200 text-xs font-medium inline-flex items-center gap-1 transition"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                  </a>
                                  <button
                                    onClick={() => copyFileLink(downloadLink, file.fileId)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border inline-flex items-center gap-1 transition ${
                                      isCopied
                                        ? 'bg-emerald-500/20 border-emerald-400/35 text-emerald-100'
                                        : 'bg-cyan-400/15 hover:bg-cyan-400/25 border-cyan-400/25 text-cyan-100'
                                    }`}
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {isCopied ? 'Copied' : 'Copy Link'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplaceFileId(file.fileId);
                                      setSelectedFiles([]);
                                      showToast(`Select a file to replace "${file.filename}"`, 'info');
                                    }}
                                    className="p-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/25 text-amber-200 transition"
                                    title="Replace file"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => requestDeleteFile(file)}
                                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-200 transition"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ===================== SETTINGS TAB ===================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Header banner */}
              <div className={`${glassCard} rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                    <Sliders className="w-5 h-5 text-zinc-100" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Control System &amp; Policies</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure server gates, licensing policies, telemetry, and automated maintenance actions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>DB Latency: <strong className="font-mono text-zinc-100">{diagnostics.pingMs}ms</strong></span>
                  </div>
                  <button
                    onClick={fetchServerSettings}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition"
                    title="Refresh diagnostic telemetry"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Server Operations & Maintenance */}
                <section className={`${glassCard} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Server className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Server Operations</h3>
                        <p className="text-[11px] text-zinc-400">API availability and maintenance broadcasting.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Operational Switch */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              serverStatus === 'online'
                                ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                                : 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                            }`}
                          />
                          <div>
                            <p className="text-xs font-semibold text-zinc-100">
                              {serverStatus === 'online' ? 'API Operational' : 'Maintenance Mode Active'}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              Direct client auth endpoints (/api/login &amp; /api/validate-license/)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateServerStatus(serverStatus === 'online' ? 'offline' : 'online')}
                          disabled={serverControlLoading}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                            serverStatus === 'online'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-400/25 text-rose-200'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/25 text-emerald-200'
                          }`}
                        >
                          {serverControlLoading
                            ? 'Updating...'
                            : serverStatus === 'online'
                            ? 'Enable Maintenance'
                            : 'Set Online'}
                        </button>
                      </div>

                      {/* Maintenance Message */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Broadcast Maintenance Notice
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={maintenanceMessage}
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            placeholder="Notice shown to clients during maintenance"
                            className={glassInput}
                          />
                          <button
                            onClick={() => saveSetting('maintenanceMessage', maintenanceMessage)}
                            disabled={savingSettingKey === 'maintenanceMessage'}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-200 whitespace-nowrap transition"
                          >
                            {savingSettingKey === 'maintenanceMessage' ? 'Saving...' : 'Save Notice'}
                          </button>
                        </div>
                      </div>

                      {/* App Version Gate */}
                      <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Enforced Client App Version
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newVersion}
                            onChange={(e) => setNewVersion(e.target.value)}
                            placeholder="1.0.0"
                            className={`${glassInput} font-mono`}
                          />
                          <button
                            onClick={updateVersion}
                            disabled={versionLoading}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-200 whitespace-nowrap transition"
                          >
                            {versionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Set Version'}
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Current requirement in DB: <span className="font-mono text-zinc-300">{requiredVersion}</span>
                        </p>
                      </div>

                      {/* Client Update URL */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Direct Client Download / Patch URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={updateDownloadUrl}
                            onChange={(e) => setUpdateDownloadUrl(e.target.value)}
                            placeholder="https://example.com/latest-launcher.zip"
                            className={glassInput}
                          />
                          <button
                            onClick={() => saveSetting('updateDownloadUrl', updateDownloadUrl)}
                            disabled={savingSettingKey === 'updateDownloadUrl'}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-200 whitespace-nowrap transition"
                          >
                            {savingSettingKey === 'updateDownloadUrl' ? 'Saving...' : 'Save URL'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Security & Policy Enforcement */}
                <section className={`${glassCard} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Shield className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Security &amp; Policy Rules</h3>
                        <p className="text-[11px] text-zinc-400">HWID lock behavior and reseller minting constraints.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* HWID Binding Strictness */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-zinc-100">Hardware ID Binding Mode</p>
                            <p className="text-[11px] text-zinc-400">Controls how client machines are pinned to keys</p>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 uppercase">
                            {hwidLockStrictness}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setHwidLockStrictness('strict');
                              saveSetting('hwidLockStrictness', 'strict');
                            }}
                            className={`p-2.5 rounded-lg border text-left text-xs transition ${
                              hwidLockStrictness === 'strict'
                                ? 'bg-white/[0.08] border-white/20 text-white font-semibold'
                                : 'bg-transparent border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span className="block font-medium">Strict Lock</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">Locks on first client launch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHwidLockStrictness('flexible');
                              saveSetting('hwidLockStrictness', 'flexible');
                            }}
                            className={`p-2.5 rounded-lg border text-left text-xs transition ${
                              hwidLockStrictness === 'flexible'
                                ? 'bg-white/[0.08] border-white/20 text-white font-semibold'
                                : 'bg-transparent border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span className="block font-medium">Flexible Pool</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">Allows dynamic device cycling</span>
                          </button>
                        </div>
                      </div>

                      {/* Reseller Permissions */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-zinc-100">Reseller Unlimited Device Privileges</p>
                            <p className="text-[11px] text-zinc-400">Allow partners to issue keys with unlimited device limits</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !allowResellerUnlimited;
                              setAllowResellerUnlimited(nextVal);
                              saveSetting('allowResellerUnlimited', nextVal);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              allowResellerUnlimited ? 'bg-emerald-500/80' : 'bg-white/10'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                allowResellerUnlimited ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
                          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                            Max Device Limit Per Reseller Key
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              max={10000}
                              value={resellerMaxDeviceLimit}
                              onChange={(e) => setResellerMaxDeviceLimit(Number(e.target.value) || 1)}
                              className={`${glassInput} font-mono`}
                            />
                            <button
                              onClick={() => saveSetting('resellerMaxDeviceLimit', resellerMaxDeviceLimit)}
                              disabled={savingSettingKey === 'resellerMaxDeviceLimit'}
                              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-200 whitespace-nowrap transition"
                            >
                              Save Limit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Maintenance & Database Utilities */}
                <section className={`${glassCard} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Database className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Database &amp; Storage Maintenance</h3>
                        <p className="text-[11px] text-zinc-400">Purge stale records and perform global hardware unbinds.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Prune Expired Licenses */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div>
                          <p className="text-xs font-semibold text-zinc-100">Prune Expired Licenses</p>
                          <p className="text-[11px] text-zinc-400">
                            Found <strong className="text-rose-300 font-mono">{diagnostics.expiredCount}</strong> expired licenses eligible for cleanup.
                          </p>
                        </div>
                        <button
                          onClick={handlePruneExpired}
                          disabled={pruneLoading || diagnostics.expiredCount === 0}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/25 text-rose-200 disabled:opacity-40 transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {pruneLoading ? 'Pruning...' : 'Prune Expired'}
                        </button>
                      </div>

                      {/* Mass HWID Flush */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div>
                          <p className="text-xs font-semibold text-zinc-100">Mass Device Unbind (HWID Flush)</p>
                          <p className="text-[11px] text-zinc-400">
                            Clear bound hardware on all licenses (<span className="font-mono text-zinc-300">{diagnostics.totalBoundDevices}</span> devices total).
                          </p>
                        </div>
                        <button
                          onClick={handleResetAllHwids}
                          disabled={flushHwidLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/25 text-amber-200 transition flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          {flushHwidLoading ? 'Flushing...' : 'Flush All HWIDs'}
                        </button>
                      </div>

                      {/* Live Diagnostic Telemetry Grid */}
                      <div className="pt-2 border-t border-white/[0.05]">
                        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2.5">
                          Storage Health Diagnostics
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Database Ping</p>
                            <p className="text-base font-semibold text-emerald-400 font-mono mt-0.5">{diagnostics.pingMs} ms</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Bound Machines</p>
                            <p className="text-base font-semibold text-zinc-100 font-mono mt-0.5">{diagnostics.totalBoundDevices}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Webhook Alerts & Telemetry */}
                <section className={`${glassCard} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Bell className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Webhook Notification Studio</h3>
                        <p className="text-[11px] text-zinc-400">Stream critical security events to Discord or Slack channels.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Notification Webhook URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className={glassInput}
                          />
                          <button
                            onClick={() => saveSetting('webhookUrl', webhookUrl)}
                            disabled={savingSettingKey === 'webhookUrl'}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-200 whitespace-nowrap transition"
                          >
                            Save Webhook
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                        <p className="text-xs font-semibold text-zinc-100">Dispatched Event Triggers</p>
                        <div className="space-y-2">
                          {[
                            { key: 'onLogin', label: 'Administrator & Reseller Sign-in Alerts' },
                            { key: 'onKeyCreated', label: 'New License Minted or Extended' },
                            { key: 'onHwidReset', label: 'HWID Reset and Device Unbind Events' },
                          ].map((evt) => {
                            const isChecked = Boolean(webhookAlerts[evt.key as keyof typeof webhookAlerts]);
                            return (
                              <label key={evt.key} className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = { ...webhookAlerts, [evt.key]: !isChecked };
                                    setWebhookAlerts(updated);
                                    saveSetting('webhookAlerts', updated);
                                  }}
                                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-zinc-100 focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-xs text-zinc-300">{evt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-400" />
                          Security Broadcast Relay
                        </span>
                        <span className="font-mono text-[11px] text-zinc-300">
                          {webhookUrl ? 'Configured' : 'Standby'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
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
                  <h3 className={`text-lg font-bold ${accentText}`}>Recharge &amp; Device Inspector</h3>
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
              {/* Custom Device Limit */}
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

              {/* Extend Validity */}
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

              {/* Bound HWIDs */}
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
