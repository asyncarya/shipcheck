import React from 'react';
import { User, Lock, Image as ImageIcon, LogOut, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProfileModalProps {
  userEmail: string | null;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  activeTab: 'profile' | 'security' | 'avatar';
  setActiveTab: (tab: 'profile' | 'security' | 'avatar') => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  username: string;
  setUsername: (name: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  password: string;
  setPassword: (pwd: string) => void;
  updateLoading: boolean;
  profileError: string | null;
  setProfileError: (err: string | null) => void;
  profileSuccess: string | null;
  setProfileSuccess: (msg: string | null) => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: (e: React.FormEvent) => void;
  handleSignOut: () => void;
  loading: boolean;
}

export default function DashboardProfileModal({
  userEmail,
  profileModalOpen,
  setProfileModalOpen,
  activeTab,
  setActiveTab,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  username,
  setUsername,
  avatarUrl,
  setAvatarUrl,
  password,
  setPassword,
  updateLoading,
  profileError,
  setProfileError,
  profileSuccess,
  setProfileSuccess,
  handleAvatarChange,
  handleUpdateProfile,
  handleSignOut,
  loading,
}: DashboardProfileModalProps) {
  if (!profileModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-bg-card border border-border-subtle rounded-3xl max-w-4xl w-full h-[80vh] sm:h-[600px] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
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

          <div className="space-y-2 mt-4 md:mt-0">
            {/* Logout button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-border-subtle hover:border-red-950/30 text-text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer disabled:opacity-40"
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
  );
}
