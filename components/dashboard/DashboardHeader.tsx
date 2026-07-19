import React from 'react';
import { User, LogOut, Loader2, Menu } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface DashboardHeaderProps {
  userEmail: string | null;
  hasSupabaseKey: boolean;
  reduxProfile: any;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  handleSignOut: () => void;
  loading: boolean;
  setShowMobileHistory: (show: boolean) => void;
}

export default function DashboardHeader({
  userEmail,
  hasSupabaseKey,
  reduxProfile,
  showProfileMenu,
  setShowProfileMenu,
  setProfileModalOpen,
  handleSignOut,
  loading,
  setShowMobileHistory,
}: DashboardHeaderProps) {
  return (
    <div className="absolute top-6 right-6 flex items-center justify-end z-40 gap-3">
      {/* Mobile history trigger */}
      <button 
        className="md:hidden w-10 h-10 rounded-xl bg-bg-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition shadow-sm active:scale-95"
        onClick={() => setShowMobileHistory(true)}
      >
        <Menu size={16} />
      </button>

      {hasSupabaseKey && (
        <div className="relative">
          {/* Profile Circle Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
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
  );
}
