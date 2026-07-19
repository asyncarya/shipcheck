'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TestRun } from '@/lib/schemas';
import TestSetupForm from './TestSetupForm';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { fetchProfile, updateProfile } from '@/lib/store/profileSlice';
import { AlertCircle, Sparkles } from 'lucide-react';

import DashboardSidebar from './dashboard/DashboardSidebar';
import DashboardProfileModal from './dashboard/DashboardProfileModal';
import DashboardHeader from './dashboard/DashboardHeader';

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
  const [showMobileHistory, setShowMobileHistory] = useState(false);
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
        const fileName = `${userId}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await client.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            contentType: avatarFile.type,
            upsert: true
          });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = client.storage
          .from('avatars')
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
    <div className="h-screen overflow-hidden bg-bg-app text-text-primary flex flex-col md:flex-row selection:bg-accent-primary/10 selection:text-accent-primary" onClick={() => setShowProfileMenu(false)}>
      
      <DashboardSidebar
        runs={runs}
        showMobileHistory={showMobileHistory}
        setShowMobileHistory={setShowMobileHistory}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        paginatedRuns={paginatedRuns}
        setRunToDelete={setRunToDelete}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-y-auto min-w-0" onClick={() => setShowProfileMenu(false)}>
        
        <DashboardHeader
          userEmail={userEmail}
          hasSupabaseKey={hasSupabaseKey}
          reduxProfile={reduxProfile}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          setProfileModalOpen={setProfileModalOpen}
          handleSignOut={handleSignOut}
          loading={loading}
          setShowMobileHistory={setShowMobileHistory}
        />

        {/* Decorative Grid and Glow Backgrounds */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_40%,#000_80%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0" />

        <div className="w-full max-w-3xl mx-auto px-6 pt-24 pb-12 md:py-20 z-10 space-y-8">
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
          <span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span> Workspace &middot; Built for the AI Hackathon
        </footer>
      </main>

      <DashboardProfileModal
        userEmail={userEmail}
        profileModalOpen={profileModalOpen}
        setProfileModalOpen={setProfileModalOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        username={username}
        setUsername={setUsername}
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
        password={password}
        setPassword={setPassword}
        updateLoading={updateLoading}
        profileError={profileError}
        setProfileError={setProfileError}
        profileSuccess={profileSuccess}
        setProfileSuccess={setProfileSuccess}
        handleAvatarChange={handleAvatarChange}
        handleUpdateProfile={handleUpdateProfile}
        handleSignOut={handleSignOut}
        loading={loading}
      />

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
