'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TestRun } from '@/lib/schemas';
import TestSetupForm from './TestSetupForm';
import ThemeToggle from './ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { fetchProfile, updateProfile } from '@/lib/store/profileSlice';
import { 
  Play, 
  History, 
  LogOut, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Sparkles,
  Home,
  Lock,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface WorkspaceDashboardProps {
  initialRuns: TestRun[];
  userEmail: string | null;
  hasSupabaseKey: boolean;
  userId?: string;
}

export default function WorkspaceDashboard({
  initialRuns,
  userEmail,
  hasSupabaseKey,
  userId,
}: WorkspaceDashboardProps) {
  const router = useRouter();
  const [runs, setRuns] = useState<(TestRun & { isDeleting?: boolean })[]>(initialRuns);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const [mounted, setMounted] = useState(false);

  // Profile metadata settings state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'avatar'>('profile');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const reduxProfile = useAppSelector((state) => state.profile);

  // Fetch profile details from Redux on mount
  useEffect(() => {
    setMounted(true);
    if (userId) {
      dispatch(fetchProfile(userId));
    }
  }, [userId, dispatch]);

  // Synchronize form input states with loaded Redux profile
  useEffect(() => {
    if (reduxProfile.firstName || reduxProfile.lastName || reduxProfile.username || reduxProfile.avatarUrl) {
      setFirstName(reduxProfile.firstName);
      setLastName(reduxProfile.lastName);
      setUsername(reduxProfile.username);
      setAvatarUrl(reduxProfile.avatarUrl);
    }
  }, [reduxProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileError(null);
    setProfileSuccess(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) {
        setProfileError('File size is too large (max 2MB).');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const client = createClient();
      if (!client) throw new Error('Supabase client is not available');

      // Update password if specified
      if (password) {
        const { error: pwdErr } = await client.auth.updateUser({
          password: password
        });
        if (pwdErr) throw pwdErr;
      }

      let finalAvatarUrl = avatarUrl;

      // If a custom file was uploaded, save to Supabase Storage first
      if (avatarFile && userId) {
        const fileName = `avatars/${userId}-${Date.now()}.jpg`;
        const { error: uploadError } = await client.storage
          .from('evidence')
          .upload(fileName, avatarFile, {
            contentType: avatarFile.type,
            upsert: true
          });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = client.storage
          .from('evidence')
          .getPublicUrl(fileName);

        finalAvatarUrl = publicUrl;
      }

      // Update profile record in database and Redux store
      if (userId) {
        await dispatch(
          updateProfile({
            userId,
            firstName,
            lastName,
            username,
            avatarUrl: finalAvatarUrl,
          })
        ).unwrap();
      }

      setProfileSuccess('Profile updated successfully!');
      setPassword('');
      setAvatarFile(null);
      setTimeout(() => {
        setProfileSuccess(null);
        setProfileModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err.message || 'An unexpected error occurred.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    try {
      // Trigger slide-out animation in UI state first
      setRuns(prev => prev.map(r => r.id === runId ? { ...r, isDeleting: true } : r));

      // Wait 400ms for animation to play before executing backend deletion
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/runs/${runId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setRuns(prev => prev.filter(r => r.id !== runId));
          } else {
            // Revert state if deletion fails
            setRuns(prev => prev.map(r => r.id === runId ? { ...r, isDeleting: false } : r));
            const data = await res.json();
            alert(data.error?.message || 'Failed to delete test run.');
          }
        } catch (err) {
          // Revert state on error
          setRuns(prev => prev.map(r => r.id === runId ? { ...r, isDeleting: false } : r));
          console.error('Failed to delete run:', err);
          alert('An unexpected error occurred while deleting the test run.');
        }
      }, 400);
    } catch (err) {
      console.error('Failed to initiate delete:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(runs.length / ITEMS_PER_PAGE));
  const paginatedRuns = runs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSignOut = async () => {
    setLoading(true);
    const client = createClient();
    if (client) {
      await client.auth.signOut();
      router.push('/auth');
    }
    setLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-bg-app text-text-primary flex flex-col md:flex-row selection:bg-accent-primary/10 selection:text-accent-primary">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-80 bg-bg-card/45 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col justify-between flex-shrink-0 z-10">
        
        {/* Top sidebar wrapper */}
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Logo Brand Header */}
          <div className="px-6 py-5.5 border-b border-border-subtle flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="ShipCheck Logo" className="w-8 h-8 rounded-lg object-cover bg-accent-glow border border-border-subtle" />
              <span className="font-bold text-base tracking-tight font-serif-anthropic text-text-primary">ShipCheck</span>
            </Link>
          </div>

          {/* Test Runs History title */}
          <div className="px-6 py-4 flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-card/20 border-b border-border-subtle">
            <History size={12} className="text-accent-primary" />
            <span>Test History</span>
            <span className="text-[10px] bg-bg-app text-text-secondary border border-border-subtle px-2 py-0.5 rounded-full ml-auto font-mono">
              {runs.length}
            </span>
          </div>

          {/* Runs history scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[350px] md:max-h-none">
            {runs.length === 0 ? (
              <div className="px-6 py-8 text-center space-y-2">
                <Clock size={20} className="mx-auto text-text-secondary/50" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  No execution logs found. Create your first test plan to record history.
                </p>
              </div>
            ) : (
              paginatedRuns.map((run) => {
                let borderStatusColor = 'border-l-blue-500';
                let statusColor = 'bg-blue-500';
                if (run.status === 'passed') {
                  borderStatusColor = 'border-l-emerald-500';
                  statusColor = 'bg-emerald-500';
                } else if (run.status === 'failed') {
                  borderStatusColor = 'border-l-red-500';
                  statusColor = 'bg-red-500';
                } else if (run.status === 'timed_out' || run.status === 'error') {
                  borderStatusColor = 'border-l-amber-500';
                  statusColor = 'bg-amber-500';
                }

                return (
                  <Link
                    key={run.id}
                    href={`/dashboard/${run.id}`}
                    className={`w-full px-6 py-3.5 block bg-bg-card/5 hover:bg-bg-card/45 border border-border-subtle rounded-r-md mb-3 transition-all duration-200 group border-l-2 ${borderStatusColor} ${run.isDeleting ? 'animate-slide-out' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-text-secondary/60 font-mono">#{run.id.slice(-6)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-text-secondary/80 group-hover:text-accent-primary transition flex items-center gap-1 font-bold uppercase tracking-wider">
                          <span>Details</span>
                          <ExternalLink size={7} />
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRunToDelete(run.id);
                          }}
                          className="text-text-secondary/60 hover:text-red-500 transition p-0.5 rounded-sm hover:bg-red-500/10 cursor-pointer active:scale-90"
                          title="Delete History"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition truncate mt-1">
                      {run.task}
                    </p>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">
                      {run.url}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle/30">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                      <span className="text-[9px] uppercase font-bold text-text-secondary">
                        {run.status === 'created' ? 'queued' : run.status}
                      </span>
                      <span className="text-[9px] text-text-secondary/60 font-mono ml-auto">
                        {mounted
                          ? new Date(run.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* History Pagination Control */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-border-subtle flex items-center justify-between bg-bg-card/20 select-none">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-secondary transition text-[10px] font-bold uppercase active:scale-95 cursor-pointer disabled:active:scale-100 shadow-xs"
              >
                Prev
              </button>
              <span className="text-[10px] font-semibold text-text-secondary font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-secondary transition text-[10px] font-bold uppercase active:scale-95 cursor-pointer disabled:active:scale-100 shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-between relative overflow-hidden">
        
        {/* Top-Right Header Actions (ThemeToggle after Profile) */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
          {hasSupabaseKey && (
            <div 
              className="relative pb-3"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setProfileModalOpen(true);
                }}
                className="w-10 h-10 rounded-full bg-bg-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-accent-primary hover:text-accent-primary/80 transition shadow-sm cursor-pointer active:scale-95 overflow-hidden"
                title="Profile Settings"
              >
                {reduxProfile.avatarUrl ? (
                  <img src={reduxProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-0.5 w-64 bg-bg-card border border-border-subtle rounded-2xl p-4 shadow-md space-y-3.5 z-50 animate-fade-in-up">
                  <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                    <div className="w-8 h-8 rounded-full bg-bg-app flex items-center justify-center text-text-secondary border border-border-subtle overflow-hidden">
                      {reduxProfile.avatarUrl ? (
                        <img src={reduxProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {reduxProfile.username || userEmail || 'Active User'}
                      </p>
                      <p className="text-[10px] text-text-secondary truncate">
                        Authenticated Workspace
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-app/50 border border-transparent hover:border-border-subtle rounded-xl transition cursor-pointer"
                  >
                    <User size={12} className="text-accent-primary" />
                    <span>Update Profile</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-border-subtle hover:border-red-950/30 text-text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin text-text-secondary" />
                    ) : (
                      <>
                        <LogOut size={12} />
                        <span>Log out</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>

        {/* Decorative Grid and Glow Backgrounds */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_40%,#000_80%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0" />

        <div className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 z-10 space-y-8">
          <div className="space-y-4 text-center sm:text-left flex flex-col items-center sm:items-start animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border border-border-subtle bg-bg-card/75 text-accent-primary shadow-3xs">
              <Sparkles size={11} className="text-accent-primary animate-pulse" />
              <span>Autonomous Verification Engine</span>
            </div>
            <div className="space-y-2.5">
              <h1 className="text-3xl font-bold font-serif-anthropic tracking-tight sm:text-4xl text-text-primary">
                Launch <span className="text-accent-primary font-serif-anthropic italic font-normal">browser automation</span>
              </h1>
              <p className="text-sm text-text-secondary max-w-lg leading-relaxed">
                Describe a website target URL and the goal task you wish to verify. The AI assistant constructs step actions and runs them dynamically.
              </p>
            </div>
          </div>

          {/* Form wrapper */}
          <div className="bg-bg-card/70 border border-border-subtle backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden group hover:border-accent-primary/10 transition-all duration-300 animate-fade-in-up">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-primary/5 via-accent-primary/30 to-accent-primary/5" />
            <TestSetupForm />
          </div>
        </div>

        {/* Global Footer */}
        <footer className="text-center py-6 border-t border-border-subtle text-[10px] text-text-secondary/50 z-10 bg-bg-card/5">
          ShipCheck Workspace &middot; Built for the AI Hackathon
        </footer>
      </main>

      {/* Profile Settings Modal */}
      {profileModalOpen && (
        <div 
          className="fixed inset-0 bg-bg-app/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => {
            setProfileModalOpen(false);
            setPassword('');
          }}
        >
          <div 
            className="bg-bg-card border border-border-subtle rounded-3xl w-full max-w-2xl h-[520px] flex flex-col md:flex-row shadow-2xl relative overflow-hidden animate-fade-in-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-accent-primary/10 via-accent-primary/50 to-accent-primary/10" />
            
            {/* Modal Left Column: Navigation Sidebar */}
            <div className="w-full md:w-56 bg-bg-card/30 border-b md:border-b-0 md:border-r border-border-subtle p-5 flex flex-col justify-between flex-shrink-0">
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-serif-anthropic text-text-primary">Account Settings</h3>
                  <p className="text-[10px] text-text-secondary">Configure your workspace profile details.</p>
                </div>
                
                <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setProfileError(null);
                      setProfileSuccess(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl w-full text-left transition ${
                      activeTab === 'profile'
                        ? 'bg-accent-glow text-accent-primary border border-accent-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-app/40 border border-transparent'
                    }`}
                  >
                    <User size={13} />
                    <span>Profile Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('security');
                      setProfileError(null);
                      setProfileSuccess(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl w-full text-left transition ${
                      activeTab === 'security'
                        ? 'bg-accent-glow text-accent-primary border border-accent-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-app/40 border border-transparent'
                    }`}
                  >
                    <Lock size={13} />
                    <span>Security</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('avatar');
                      setProfileError(null);
                      setProfileSuccess(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl w-full text-left transition ${
                      activeTab === 'avatar'
                        ? 'bg-accent-glow text-accent-primary border border-accent-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-app/40 border border-transparent'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Avatar Image</span>
                  </button>
                </nav>
              </div>

              {/* Cancel Close button */}
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  setPassword('');
                }}
                className="hidden md:block w-full py-2 border border-border-subtle hover:border-border-subtle/80 text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer"
              >
                Close Settings
              </button>
            </div>

            {/* Modal Right Column: Tab Scrollable Forms panel */}
            <form onSubmit={handleUpdateProfile} className="flex-1 flex flex-col justify-between min-h-0 bg-bg-app/10">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                
                {/* Feedback notifications */}
                {profileError && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 flex items-center gap-2 animate-fade-in-up">
                    <AlertCircle size={14} />
                    <span>{profileError}</span>
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-500 flex items-center gap-2 animate-fade-in-up">
                    <CheckCircle2 size={14} />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {/* TAB 1: PROFILE INFO */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Email Address</label>
                      <input
                        type="text"
                        value={userEmail || ''}
                        disabled
                        className="w-full text-xs bg-bg-app border border-border-subtle rounded-xl p-3 text-text-secondary/55 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full text-xs bg-bg-app border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition text-text-primary placeholder:text-text-secondary/40 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="w-full text-xs bg-bg-app border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition text-text-primary placeholder:text-text-secondary/40 font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="w-full text-xs bg-bg-app border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition text-text-primary placeholder:text-text-secondary/40 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full text-xs bg-bg-app border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition text-text-primary placeholder:text-text-secondary/40 font-medium"
                      />
                      <p className="text-[10px] text-text-secondary leading-relaxed font-medium">Leave blank if you do not wish to change your account password.</p>
                    </div>
                  </div>
                )}

                {/* TAB 3: AVATAR IMAGE */}
                {activeTab === 'avatar' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-border-subtle bg-bg-app flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="avatar-upload"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border-subtle bg-bg-card hover:bg-border-subtle rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition"
                        >
                          Upload Photo
                        </label>
                        <p className="text-[10px] text-text-secondary leading-relaxed font-medium">PNG or JPG up to 500KB. Saved directly into database metadata.</p>
                      </div>
                    </div>

                    {/* Gradient presets */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Or Select Preset Style</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g1)"/></svg>')}
                          className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 border border-border-subtle active:scale-90 transition cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23be185d"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g2)"/></svg>')}
                          className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-pink-600 border border-border-subtle active:scale-90 transition cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g3)"/></svg>')}
                          className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 border border-border-subtle active:scale-90 transition cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g4)"/></svg>')}
                          className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 border border-border-subtle active:scale-90 transition cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Right Column Footer: Action Save button */}
              <div className="px-6 py-4 bg-bg-card/25 border-t border-border-subtle flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setPassword('');
                  }}
                  className="md:hidden px-4.5 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition active:scale-95"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-6 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-xs font-bold text-white transition active:scale-95 flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-40 ml-auto font-sans"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Deletion Modal */}
      {runToDelete && (
        <div 
          className="fixed inset-0 bg-bg-app/80 backdrop-blur-xs z-[999] flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setRunToDelete(null)}
        >
          <div 
            className="bg-bg-card border border-border-subtle rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-fade-in-up cursor-default space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-red-500/50" />
            
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
              <h3 className="text-sm font-bold font-serif-anthropic text-text-primary">Delete Test Run</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Are you sure you want to permanently delete this test run? This will clean up all steps, logs, and screenshots from the cloud. This action cannot be undone.
            </p>
            
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setRunToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-app border border-border-subtle hover:border-border-subtle/80 rounded-xl transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = runToDelete;
                  setRunToDelete(null);
                  await handleDeleteRun(id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/25 transition cursor-pointer active:scale-95"
              >
                Delete Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
