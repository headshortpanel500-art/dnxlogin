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
  Rocket,
  Swords,
  Skull,
  Flame,
  Target,
  Crosshair,
  Trophy,
  Terminal,
  Code2,
  Bug,
  Ghost,
  Radar,
  Scan,
  Binary,
  Command,
  Palette,
  Rainbow,
  Gem,
  Upload,
  Download,
  File,
  FileArchive,
  Link,
  Copy,
  Check,
  History,
  FolderOpen,
  Info
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

interface IUploadedFile {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: string;
  downloadCount?: number;
  fileId: string;
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
  const [activeTab, setActiveTab] = useState<'users' | 'resellers' | 'settings' | 'upload'>('users');

  // Upload State
  const [uploadedFiles, setUploadedFiles] = useState<IUploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [replaceFileId, setReplaceFileId] = useState<string | null>(null);

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
          fetchUploadedFiles();
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
        fetchUploadedFiles();
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

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setUploadedFiles(data.data);
      }
    } catch {
      console.error('Failed to fetch uploaded files');
    }
  };

  // Upload Functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        showToast('সর্বোচ্চ ৩টি ফাইল সিলেক্ট করা যাবে!', 'error');
        return;
      }
      const validFiles = files.filter(f => f.size <= 15 * 1024 * 1024);
      if (validFiles.length !== files.length) {
        showToast('কিছু ফাইল ১৫MB এর বেশি!', 'error');
      }
      setSelectedFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast('কোন ফাইল সিলেক্ট করা হয়নি!', 'error');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    if (replaceFileId) {
      formData.append('replaceFileId', replaceFileId);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          replaceFileId 
            ? `${selectedFiles.length}টি ফাইল আপডেট সফল!` 
            : `${selectedFiles.length}টি ফাইল আপলোড সফল!`, 
          'success'
        );
        setSelectedFiles([]);
        setReplaceFileId(null);
        setUploadProgress(100);
        fetchUploadedFiles();
      } else {
        showToast(data.error || 'আপলোড ব্যর্থ!', 'error');
      }
    } catch (error) {
      showToast('আপলোড করতে সমস্যা হয়েছে!', 'error');
    } finally {
      setUploadLoading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('আপনি কি এই ফাইল ডিলিট করতে চান?')) return;

    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('ফাইল ডিলিট করা হয়েছে!', 'success');
        fetchUploadedFiles();
        if (replaceFileId === fileId) setReplaceFileId(null);
      } else {
        showToast(data.error || 'ডিলিট ব্যর্থ!', 'error');
      }
    } catch {
      showToast('ডিলিট করতে সমস্যা হয়েছে!', 'error');
    }
  };

  const copyToClipboard = (link: string, fileId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(fileId);
    showToast('লিংক কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const gradientText = "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent";
  const rainbowGradient = "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500";
  const cardBorder = "border border-white/10 hover:border-purple-500/50";

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNjgsODUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
        
        <div className="relative flex flex-col items-center gap-6 p-8 bg-[#0a0a1a]/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 animate-pulse shadow-[0_0_80px_rgba(168,85,247,0.3)] flex items-center justify-center">
              <Rainbow className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <div className={`text-3xl font-bold ${gradientText}`}>ADIAT X CHEAT</div>
            <div className="text-sm font-medium text-white/40 tracking-[0.3em]">[ SYSTEM INITIALIZING ]</div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/20 animate-pulse">
            <span className="text-purple-400">$</span> connecting to cheat server...
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
                    <Rainbow className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className={`text-3xl font-bold ${gradientText}`}>ADIAT X CHEAT</h1>
                <p className="text-white/40 text-sm mt-1 flex items-center justify-center gap-2">
                  <Terminal className="w-3 h-3" />
                  administrator access required
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center backdrop-blur-sm flex items-center justify-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
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
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
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
                        Access ADIAT X CHEAT
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
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-hidden selection:bg-purple-500/30 selection:text-white">
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
              <Rainbow className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-purple-500/20 rounded-xl blur-xl"></div>
          </div>
          <span className={`text-sm font-bold ${gradientText}`}>ADIAT X</span>
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
          <div className="flex flex-col items-center gap-4 py-8">
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-l-2 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.1)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Users [{users.length}]
            </button>
            <button
              onClick={() => { setActiveTab('resellers'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'resellers' 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border-l-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Store className="w-5 h-5" />
              Resellers [{resellers.length}]
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'upload' 
                  ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-white border-l-2 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.1)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload Files
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full max-w-xs flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <div className="w-full max-w-xs border-t border-white/10 pt-4 mt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                <span className="text-xs text-white/40">{serverStatus === 'online' ? 'SERVER ONLINE' : 'SERVER OFFLINE'}</span>
              </div>
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all mt-2 border border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-72 bg-[#0a0a1a]/95 backdrop-blur-2xl border-r border-white/10 flex-col items-center lg:items-start p-4 z-50 transition-all duration-500 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 mt-2 w-full">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.2)]">
              <Rainbow className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -inset-2 bg-purple-500/20 rounded-2xl blur-2xl animate-pulse"></div>
          </div>
          <span className={`hidden lg:block text-xl font-bold ${gradientText}`}>ADIAT X</span>
        </div>

        <nav className="w-full space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-l-2 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">USERS</span>
            <span className="hidden lg:inline ml-auto text-xs bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-2.5 py-0.5 rounded-full text-purple-300 border border-purple-500/20">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resellers')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'resellers'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border-l-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">RESELLERS</span>
            <span className="hidden lg:inline ml-auto text-xs bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2.5 py-0.5 rounded-full text-emerald-300 border border-emerald-500/20">
              {resellers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-white border-l-2 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.1)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Upload className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">UPLOAD</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border-l-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">SETTINGS</span>
          </button>
        </nav>

        <div className="mt-auto w-full pt-4 border-t border-white/10 space-y-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
            <span className="text-xs text-white/40">{serverStatus === 'online' ? 'SERVER ONLINE' : 'SERVER OFFLINE'}</span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-300 group border border-red-500/20"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:inline">LOGOUT</span>
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
                ADIAT X CHEAT
              </h1>
              <p className="text-white/30 text-xs md:text-sm mt-1 ml-1 tracking-wide flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-pink-400" />
                Manage users, files, resellers & server settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`}></div>
                <span className="text-xs text-white/40">{serverStatus === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full border border-white/10">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-white/40 font-medium">ADMIN</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
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
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-orange-900/5 hover:shadow-orange-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Resellers</p>
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Store className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-orange-400 mt-1 md:mt-2">{resellers.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-sky-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl shadow-cyan-900/5 hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-widest">Files</p>
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <File className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-cyan-400 mt-1 md:mt-2">{uploadedFiles.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
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
                        <Swords className="w-5 h-5 text-purple-400" />
                        Generate New License
                      </span>
                    )}
                  </h2>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-5">
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cheater_01"
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

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        device limit
                      </label>
                      <select
                        value={deviceLimit}
                        onChange={(e) => setDeviceLimit(Number(e.target.value))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30 cursor-pointer"
                      >
                        <option value="0">♾️ Unlimited</option>
                        <option value="1"> 📱 1 Device</option>
                        <option value="2"> 📱2 Devices</option>
                        <option value="3"> 📱 3 Devices</option>
                        <option value="4"> 📱 4 Devices</option>
                        <option value="5"> 📱 5 Devices</option>
                        <option value="10">📱 10 Devices</option>
                        <option value="20">📱 20 Devices</option>
                        <option value="50">📱 50 Devices</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <UserCog className="w-3 h-3" />
                        created by
                      </label>
                      <select
                        value={selectedReseller}
                        onChange={(e) => setSelectedReseller(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:border-purple-500/30 cursor-pointer"
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
                            setDeviceLimit(0);
                            setSelectedReseller('');
                          }}
                          className="bg-black/50 hover:bg-white/10 text-white/60 py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-white/10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
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
                      <span className="hidden xs:inline">Registered Credentials</span>
                      <span className="text-[10px] md:text-xs text-white/30 font-normal ml-1 bg-white/5 px-3 py-0.5 rounded-full border border-white/10">
                        {filteredUsers.length}
                      </span>
                    </h2>

                    <div className="relative w-full sm:w-72">
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
                        No credentials found.
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isExpired = new Date(user.expiresAt) < new Date();
                        const hasHwid = user.hwid && user.hwid !== 'null' && user.hwid !== '';
                        const deviceCount = user.registeredHwids ? user.registeredHwids.length : (hasHwid ? 1 : 0);
                        const deviceLimit = user.deviceLimit || 0;
                        const isDeviceLimitReached = deviceLimit > 0 && deviceCount >= deviceLimit;

                        return (
                          <div key={user._id} className="p-4 hover:bg-white/5 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 flex items-center justify-center text-base font-bold text-white border border-white/10">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -inset-1 bg-purple-500/10 rounded-full blur-xl"></div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                  <p className="text-xs text-white/30 truncate">{user.password || '••••••••'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                    isExpired
                                      ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                      : isDeviceLimitReached && deviceLimit > 0
                                      ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                    isExpired ? 'bg-red-400 shadow-red-400/50' : 
                                    isDeviceLimitReached && deviceLimit > 0 ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                                  }`}></span>
                                  {isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}
                                </span>
                                <button
                                  onClick={() => toggleDropdown(user._id)}
                                  className="p-2 rounded-xl hover:bg-white/5 transition border border-white/10"
                                >
                                  <MoreVertical className="w-4 h-4 text-white/40" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <div className="flex items-center gap-1.5 text-white/40">
                                <UserCog className="w-3.5 h-3.5 text-emerald-400" />
                                <span className={user.createdBy === 'admin' ? 'text-purple-300' : 'text-emerald-300'}>
                                  {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy || 'Unknown'}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Radar className="w-3.5 h-3.5 text-blue-400" />
                                <span>{deviceCount > 0 ? `📱 ${deviceCount}${deviceLimit > 0 ? `/${deviceLimit}` : ''}` : 'No devices'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                <span>{new Date(user.expiresAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                  isExpired ? 'bg-red-400 shadow-red-400/50' : 
                                  isDeviceLimitReached && deviceLimit > 0 ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                                }`}></div>
                                <span>{isExpired ? 'Expired' : isDeviceLimitReached ? 'Full' : 'Active'}</span>
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
                                      onClick={() => handleClearAllHwids(user.username)}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-medium transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Clear
                                    </button>
                                    <button
                                      onClick={() => handleResetHwid(user.username)}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-xs font-medium transition col-span-2"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Reset HWID
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(user._id)}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium transition ${!hasHwid ? 'col-span-2' : ''}`}
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
                          <th className="p-4 font-medium">Created By</th>
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
                            <td colSpan={9} className="p-12 text-center text-white/30">
                              <div className="flex items-center justify-center gap-3">
                                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                                Loading...
                              </div>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-12 text-center text-white/30">
                              No credentials found.
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
                              <tr key={user._id} className="hover:bg-white/5 transition duration-200 group">
                                <td className="p-4 pl-6 font-bold text-white">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                        {user.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="absolute -inset-1 bg-purple-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition"></div>
                                    </div>
                                    {user.username}
                                  </div>
                                </td>
                                <td className="p-4 text-white/30 font-mono text-xs">{user.password || '••••••••'}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    user.createdBy === 'admin' 
                                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}>
                                    {user.createdBy === 'admin' ? '👑 Admin' : `🏪 ${user.createdBy || 'Unknown'}`}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    deviceLimit === 0
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                  }`}>
                                    {deviceLimit === 0 ? '♾️ Unlimited' : `📱 ${deviceLimit}`}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    deviceCount > 0
                                      ? isDeviceLimitReached
                                        ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                      : 'bg-white/5 text-white/30 border-white/10'
                                  }`}>
                                    {deviceCount > 0 ? `📱 ${deviceCount}${deviceLimit > 0 ? `/${deviceLimit}` : ''}` : 'No devices'}
                                    {isDeviceLimitReached && deviceLimit > 0 && ' 🔒'}
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
                                    <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px] ${
                                      isExpired ? 'bg-red-400 shadow-red-400/50' : 
                                      isDeviceLimitReached && deviceLimit > 0 ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
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
                                  <div className="flex flex-wrap justify-end gap-1.5">
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
                                          onClick={() => handleClearAllHwids(user.username)}
                                          className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-1"
                                          title="Clear all registered devices"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Clear
                                        </button>
                                        <button
                                          onClick={() => handleResetHwid(user.username)}
                                          className="bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-1"
                                          title="Reset HWID"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          Reset
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
            </>
          )}

          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <>
              {/* Upload Form Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-orange-900/10 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
                  
                  <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-orange-400 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-500 via-yellow-500 to-amber-500 rounded-full shadow-[0_0_20px_rgba(251,146,60,0.3)]"></div>
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Upload className="w-5 h-5 text-orange-400" />
                      ফাইল আপলোড / আপডেট করুন
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* File Input Area */}
                    <div className="lg:col-span-2">
                      <div 
                        className={`relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all duration-300 cursor-pointer ${
                          selectedFiles.length > 0 
                            ? 'border-orange-500/50 bg-orange-500/5' 
                            : 'border-white/20 hover:border-orange-500/30 bg-white/5 hover:bg-white/10'
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 3) {
                            showToast('সর্বোচ্চ ৩টি ফাইল আপলোড করা যাবে!', 'error');
                            return;
                          }
                          const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
                          if (validFiles.length !== files.length) {
                            showToast('কিছু ফাইল ১৫MB এর বেশি!', 'error');
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
                            <div className="flex items-center justify-center gap-2 text-emerald-400">
                              <CheckCircle className="w-8 h-8" />
                              <span className="text-sm font-medium">{selectedFiles.length}টি ফাইল সিলেক্ট করা হয়েছে</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 text-xs flex items-center gap-2">
                                  <File className="w-3 h-3 text-orange-400" />
                                  <span className="text-white/80 truncate max-w-[150px]">{file.name}</span>
                                  <span className="text-white/30">({formatFileSize(file.size)})</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles([]);
                                  setReplaceFileId(null);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition"
                              >
                                <XCircle className="w-4 h-4 inline" /> সব ফাইল সরান
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-center">
                              <div className="p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl border border-orange-500/20">
                                <Upload className="w-12 h-12 text-orange-400" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white/60">ফাইল ড্র্যাগ করুন অথবা ক্লিক করুন</p>
                              <p className="text-xs text-white/30 mt-1">সর্বোচ্চ ৩টি ফাইল, প্রতি ফাইল ১৫MB পর্যন্ত</p>
                            </div>
                            <div className="flex justify-center gap-2 text-[10px] text-white/20">
                              <span>📁 সব ধরনের ফাইল</span>
                              <span>•</span>
                              <span>🔒 নিরাপদ</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-3 bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Upload Button & Info */}
                    <div className="space-y-4">
                      {/* রিপ্লেস ফাইল সিলেক্ট */}
                      {uploadedFiles.length > 0 && (
                        <div className="bg-black/30 rounded-2xl p-3 border border-white/10">
                          <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            রিপ্লেস ফাইল (ঐচ্ছিক)
                          </label>
                          <select
                            value={replaceFileId || ''}
                            onChange={(e) => setReplaceFileId(e.target.value || null)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          >
                            <option value="">নতুন ফাইল আপলোড</option>
                            {uploadedFiles.map((file) => (
                              <option key={file.fileId} value={file.fileId}>
                                🔄 {file.filename} ({formatFileSize(file.size)})
                              </option>
                            ))}
                          </select>
                          {replaceFileId && (
                            <p className="text-[10px] text-yellow-500/60 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              লিংক একই থাকবে, শুধু ফাইল আপডেট হবে
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploadLoading}
                        className="w-full bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 hover:from-orange-500 hover:via-yellow-500 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-2xl text-sm transition-all duration-300 shadow-[0_0_30px_rgba(251,146,60,0.2)] hover:shadow-[0_0_50px_rgba(251,146,60,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {uploadLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            আপলোড হচ্ছে...
                          </>
                        ) : (
                          <>
                            {replaceFileId ? <RefreshCw className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                            {replaceFileId ? 'ফাইল আপডেট করুন' : 'আপলোড করুন'}
                          </>
                        )}
                      </button>

                      <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Info className="w-4 h-4 text-orange-400" />
                          <span>{replaceFileId ? 'পুরানো ফাইল রিপ্লেস হবে' : 'নতুন ফাইল আপলোড হবে'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>লিংক এক্সপায়ার হয় না</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
                          <HardDrive className="w-3 h-3" />
                          <span>সর্বোচ্চ ১৫MB প্রতি ফাইল</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-white/20 justify-center">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>MongoDB তে সংরক্ষিত</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File History Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-amber-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-orange-900/10">
                  <div className="p-4 md:p-6 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h2 className="text-sm md:text-base font-bold text-orange-400 flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <History className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                      </div>
                      <span className="hidden xs:inline">আপলোড ইতিহাস</span>
                      <span className="text-[10px] md:text-xs text-white/30 font-normal ml-1 bg-white/5 px-3 py-0.5 rounded-full border border-white/10">
                        {uploadedFiles.length}টি ফাইল
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchUploadedFiles}
                        className="text-xs text-white/30 hover:text-white/60 transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        রিফ্রেশ
                      </button>
                    </div>
                  </div>

                  {uploadedFiles.length === 0 ? (
                    <div className="p-12 text-center text-white/30">
                      <div className="flex flex-col items-center gap-3">
                        <FolderOpen className="w-12 h-12 text-white/10" />
                        <p>কোন ফাইল আপলোড করা হয়নি</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-black/30 text-white/30 text-xs uppercase tracking-widest border-b border-white/10">
                            <th className="p-4 pl-6 font-medium">ফাইলের নাম</th>
                            <th className="p-4 font-medium">সাইজ</th>
                            <th className="p-4 font-medium">আপলোডের সময়</th>
                            <th className="p-4 font-medium">ডাউনলোড</th>
                            <th className="p-4 text-right pr-6 font-medium">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {uploadedFiles.map((file) => {
                            const downloadLink = `${window.location.origin}/api/download/${file.fileId}`;
                            const isCopied = copiedLink === file.fileId;
                            
                            return (
                              <tr key={file._id + file.fileId} className="hover:bg-white/5 transition duration-200 group">
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                      <File className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <span className="text-white/80 text-xs truncate max-w-[200px]" title={file.filename}>
                                      {file.filename}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-white/40 text-xs">{formatFileSize(file.size)}</td>
                                <td className="p-4 text-white/40 text-xs">
                                  {new Date(file.uploadDate).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="p-4">
                                  <span className="text-xs text-white/30 flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {file.downloadCount || 0}
                                  </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                  <div className="flex items-center justify-end gap-2">
                                    <a
                                      href={downloadLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      ডাউনলোড
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(downloadLink, file.fileId)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                                        isCopied
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                                          : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                      }`}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          কপি
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          লিংক কপি
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(file.fileId)}
                                      className="bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplaceFileId(file.fileId);
                                        setSelectedFiles([]);
                                        showToast(`"${file.filename}" রিপ্লেস করতে ফাইল সিলেক্ট করুন`, 'info');
                                      }}
                                      className="bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-1"
                                    >
                                      <RefreshCw className="w-3 h-3" />
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
                </div>
              </div>
            </>
          )}

          {/* Resellers Tab Content */}
          {activeTab === 'resellers' && (
            <>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-teal-900/10 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl"></div>
                  
                  <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-emerald-400 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <UserPlus className="w-5 h-5 text-emerald-400" />
                      {editingResellerId ? 'Edit Reseller' : 'Create Reseller'}
                    </span>
                  </h2>

                  <form onSubmit={handleCreateReseller} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        reseller username
                      </label>
                      <input
                        type="text"
                        value={resellerUsername}
                        onChange={(e) => setResellerUsername(e.target.value)}
                        placeholder="reseller_01"
                        className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 hover:border-emerald-500/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        password
                      </label>
                      <input
                        type="text"
                        value={resellerPassword}
                        onChange={(e) => setResellerPassword(e.target.value)}
                        placeholder="securepass123"
                        className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 hover:border-emerald-500/30"
                        required
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
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
                          className="bg-black/50 hover:bg-white/10 text-white/60 py-3 px-4 rounded-xl md:rounded-2xl text-xs md:text-sm transition backdrop-blur-sm border border-white/10"
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
                <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-teal-900/10">
                  <div className="p-4 md:p-6 border-b border-white/10">
                    <h2 className="text-sm md:text-base font-bold text-emerald-400 flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Store className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                      </div>
                      <span className="hidden xs:inline">Reseller Management</span>
                      <span className="text-[10px] md:text-xs text-white/30 font-normal ml-1 bg-white/5 px-3 py-0.5 rounded-full border border-white/10">
                        {resellers.length} total
                      </span>
                    </h2>
                  </div>

                  <div className="md:hidden divide-y divide-white/5">
                    {resellers.length === 0 ? (
                      <div className="p-12 text-center text-white/30">
                        No resellers found.
                      </div>
                    ) : (
                      resellers.map((reseller) => {
                        const userCount = getUsersByReseller(reseller.username);
                        const activeUserCount = userCount.filter(u => new Date(u.expiresAt) > new Date()).length;
                        
                        return (
                          <div key={reseller._id} className="p-4 hover:bg-white/5 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-base font-bold text-white border border-white/10">
                                    {reseller.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xl"></div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{reseller.username}</p>
                                  <p className="text-xs text-white/30 truncate">{reseller.password}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{new Date(reseller.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Users className="w-3.5 h-3.5 text-purple-400" />
                                <span>Users: {userCount.length}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Active: {activeUserCount}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40">
                                <Hash className="w-3.5 h-3.5 text-white/20" />
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
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium transition"
                              >
                                <Users className="w-3.5 h-3.5" />
                                View Users
                              </button>
                              <button
                                onClick={() => handleDeleteReseller(reseller._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium transition"
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
                        <tr className="bg-black/30 text-white/30 text-xs uppercase tracking-widest border-b border-white/10">
                          <th className="p-4 pl-6 font-medium">Reseller</th>
                          <th className="p-4 font-medium">Password</th>
                          <th className="p-4 font-medium">Created At</th>
                          <th className="p-4 font-medium">Total Users</th>
                          <th className="p-4 font-medium">Active Users</th>
                          <th className="p-4 text-right pr-6 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {resellers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-white/30">
                              No resellers found.
                            </td>
                          </tr>
                        ) : (
                          resellers.map((reseller) => {
                            const userCount = getUsersByReseller(reseller.username);
                            const activeUserCount = userCount.filter(u => new Date(u.expiresAt) > new Date()).length;
                            
                            return (
                              <tr key={reseller._id} className="hover:bg-white/5 transition duration-200 group">
                                <td className="p-4 pl-6 font-bold text-white">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                        {reseller.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition"></div>
                                    </div>
                                    {reseller.username}
                                  </div>
                                </td>
                                <td className="p-4 text-white/30 font-mono text-xs">{reseller.password}</td>
                                <td className="p-4 text-white/40 text-xs">
                                  {new Date(reseller.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    <Users className="w-3 h-3" />
                                    {userCount.length}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    activeUserCount > 0 
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                      : 'bg-white/5 text-white/30 border-white/10'
                                  }`}>
                                    <Crosshair className="w-3 h-3" />
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
                                      className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3" />
                                      View Users
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReseller(reseller._id)}
                                      className="bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center gap-1"
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
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/10">
                  <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-purple-400 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
                    <Server className="w-5 h-5 text-purple-400" />
                    Server Status
                  </h2>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/10 gap-3 sm:gap-0">
                      <div>
                        <p className="text-xs md:text-sm font-bold text-white/60">Current Status</p>
                        <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-semibold border ${
                          serverStatus === 'online' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]' 
                            : 'bg-red-500/20 text-red-300 border-red-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${serverStatus === 'online' ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse' : 'bg-red-400 shadow-red-400/50'}`}></span>
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
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]'
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
                    <p className="text-[10px] md:text-xs text-white/30 flex items-center gap-2">
                      {serverStatus === 'online' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Users can currently login and use the application.
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          Server is offline. No users can login.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/10">
                  <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-blue-400 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Version Management
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-black/30 rounded-2xl border border-white/10">
                      <p className="text-xs md:text-sm font-bold text-white/60 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Current Required Version
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <code className="px-4 py-2 bg-black/50 rounded-xl text-blue-300 font-mono text-xs md:text-sm border border-blue-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                          <HardDrive className="w-3 h-3" />
                          {requiredVersion}
                        </code>
                        <span className="text-[10px] md:text-xs text-white/20">Clients must match this version</span>
                      </div>
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/10">
                      <p className="text-xs md:text-sm font-bold text-white/60 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        Update Required Version
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <input
                          type="text"
                          value={newVersion}
                          onChange={(e) => setNewVersion(e.target.value)}
                          placeholder="1.0.0"
                          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-blue-500/30"
                        />
                        <button
                          onClick={updateVersion}
                          disabled={versionLoading || newVersion === requiredVersion}
                          className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs md:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {versionLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Update
                        </button>
                      </div>
                      <p className="text-[10px] md:text-xs text-yellow-500/60 mt-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Changing version will require all clients to update
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/10">
                  <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-purple-400 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
                    <Target className="w-5 h-5 text-purple-400" />
                    System Overview
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    {[
                      { icon: Users, label: 'Total Users', value: users.length, color: 'purple' },
                      { icon: Radar, label: 'Devices', value: totalDevices, color: 'blue' },
                      { icon: Crosshair, label: 'Active', value: activeUsers, color: 'emerald' },
                      { icon: Store, label: 'Resellers', value: resellers.length, color: 'orange' },
                      { icon: Server, label: 'Status', value: serverStatus === 'online' ? 'Online' : 'Offline', color: serverStatus === 'online' ? 'emerald' : 'red' },
                    ].map((stat, idx) => (
                      <div key={idx} className="relative group/stat">
                        <div className="absolute -inset-1 bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-2xl blur-xl opacity-0 group-hover/stat:opacity-100 transition duration-500"></div>
                        <div className="relative p-4 bg-black/30 rounded-2xl border border-white/10 text-center hover:border-${stat.color}-500/30 transition-all duration-300">
                          <div className={`p-2 bg-${stat.color}-500/10 rounded-xl border border-${stat.color}-500/20 w-fit mx-auto mb-2 group-hover/stat:scale-110 transition-transform shadow-[0_0_20px_rgba(${stat.color === 'purple' ? '168,85,247' : stat.color === 'blue' ? '59,130,246' : stat.color === 'emerald' ? '52,211,153' : stat.color === 'orange' ? '251,146,60' : '239,68,68'},0.2)]`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                          </div>
                          <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">{stat.label}</p>
                          <p className={`text-lg md:text-2xl font-bold text-${stat.color}-400 mt-0.5 md:mt-1`}>
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