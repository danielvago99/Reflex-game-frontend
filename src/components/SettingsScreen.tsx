import { ArrowLeft, User, LogOut, Shield, AlertTriangle, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { AvatarSelector, findAvatarIdByUrl, getAvatarData } from './AvatarSelector';
import { FuturisticBackground } from './FuturisticBackground';
import { LoadingOverlay } from './ui/LoadingOverlay';

interface SettingsScreenProps {
  currentName: string;
  avatarUrl?: string;
  onNavigate: (screen: string) => void;
  onUpdateName: (newName: string) => void;
  onUpdateAvatar: (avatarUrl: string) => void;
  onLogout: () => void;
}

export function SettingsScreen({ currentName, avatarUrl, onNavigate, onUpdateName, onUpdateAvatar, onLogout }: SettingsScreenProps) {
  const [newName, setNewName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading');
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return findAvatarIdByUrl(avatarUrl) || localStorage.getItem('userAvatar') || 'gradient-1';
  });

  const avatarData = avatarUrl ? { id: 'custom-avatar', url: avatarUrl, style: 'custom' } : getAvatarData(selectedAvatar);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  useEffect(() => {
    const matchedAvatar = findAvatarIdByUrl(avatarUrl);
    if (matchedAvatar) {
      setSelectedAvatar(matchedAvatar);
      localStorage.setItem('userAvatar', matchedAvatar);
    }
  }, [avatarUrl]);

  const handleSaveName = () => {
    if (newName.trim() && newName !== currentName) {
      setLoadingMessage('Saving Changes');
      setIsLoading(true);
      onUpdateName(newName.trim());
      setIsEditing(false);
      setTimeout(() => {
        setIsLoading(false);
      }, 1200);
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    setLoadingMessage('Updating Avatar');
    setIsLoading(true);
    setSelectedAvatar(avatarId);
    localStorage.setItem('userAvatar', avatarId);
    const avatar = getAvatarData(avatarId);
    onUpdateAvatar(avatar.url);
    setShowAvatarSelector(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-[#00FFA3]/50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl text-white mb-1">Settings</h1>
            <p className="text-sm text-gray-400">Manage your account & security</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Profile Settings */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}></div>
            
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}>
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
              <div className="absolute top-0 left-0 w-px h-4 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-4 h-px bg-gradient-to-l from-[#06B6D4] to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-px h-4 bg-gradient-to-t from-[#06B6D4] to-transparent"></div>
              
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-[#00FFA3]/20 rounded-lg border border-[#00FFA3]/30">
                    <User className="w-5 h-5 text-[#00FFA3]" />
                  </div>
                  <div>
                    <h2 className="text-white">Profile Settings</h2>
                    <p className="text-xs text-gray-400">Customize your identity</p>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div className="space-y-3 mb-5">
                  <label className="text-xs text-gray-400 uppercase tracking-wider block">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Current Avatar Display */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-lg opacity-40"></div>
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#00FFA3] flex items-center justify-center overflow-hidden shadow-xl">
                        <img 
                          src={avatarData.url} 
                          alt="User avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Change Avatar Button */}
                    <button
                      onClick={() => setShowAvatarSelector(true)}
                      className="relative flex-1 group"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/50 to-[#06B6D4]/50 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                      <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 hover:border-[#00FFA3]/50 text-white p-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4 text-[#00FFA3]" />
                        <span className="text-sm">Change Avatar</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name Section */}
                {!isEditing ? (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 uppercase tracking-wider block">
                      Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur opacity-50 rounded-lg"></div>
                      <div className="relative bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <p className="text-white">{currentName}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsEditing(true)}
                      className="relative w-full group"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/50 to-[#06B6D4]/50 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                      <div className="relative bg-white/10 hover:bg-white/20 border border-[#00FFA3]/30 hover:border-[#00FFA3]/60 text-white px-4 py-3 rounded-lg transition-all">
                        <span className="text-sm">Change Name</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 uppercase tracking-wider block">
                      New Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur opacity-50 rounded-lg"></div>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name"
                        className="relative w-full bg-black/40 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFA3]/50 transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleSaveName}
                        disabled={!newName.trim() || newName === currentName}
                        className={`relative group ${!newName.trim() || newName === currentName ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA3]/50 to-[#06B6D4]/50 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                        <div className={`relative bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] text-[#0B0F1A] px-4 py-3 rounded-lg transition-all ${!newName.trim() || newName === currentName ? '' : 'hover:shadow-[0_0_20px_rgba(0,255,163,0.4)]'}`}>
                          <span className="text-sm">Save</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setNewName(currentName);
                          setIsEditing(false);
                        }}
                        className="relative group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                        <div className="relative bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-lg transition-all">
                          <span className="text-sm">Cancel</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logout Info */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm rounded-xl"></div>
            <div className="relative bg-[#00FFA3]/10 backdrop-blur-sm border border-[#00FFA3]/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#00FFA3]/20 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#00FFA3]" />
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Your Data is Safe</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">
                    All your game progress is <strong className="text-[#00FFA3]">tied to your wallet address</strong>. When you reconnect with the same wallet, everything is automatically restored:
                  </p>
                  <ul className="text-xs text-gray-400 leading-relaxed space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#00FFA3] rounded-full"></div>
                      <span>Reflex Points & Free Stakes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#06B6D4] rounded-full"></div>
                      <span>Match History & Statistics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#7C3AED] rounded-full"></div>
                      <span>Daily Challenges & Ambassador Status</span>
                    </li>
                  </ul>
                  <p className="text-xs text-[#00FFA3] mt-2">
                    💡 Logging out only ends your session - no data is lost!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-red-600/30 blur-sm opacity-75 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                <div className="relative bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm border-2 border-red-500/30 hover:border-red-500/50 text-red-400 p-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="text-lg">Log Out</span>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gradient-to-br from-[#0B0F1A] to-[#1a0f2e] border-2 border-red-500/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  Confirm Logout
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-gray-300 space-y-3 pt-2">
                    <p className="text-sm">End your session and return to the Welcome screen.</p>
                    <div className="bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-[#00FFA3] leading-relaxed flex items-start gap-2">
                        <span>🔒</span>
                        <span><strong>All Data Preserved:</strong> Your {localStorage.getItem('reflexPoints') || '0'} Reflex Points, free stakes, match history, daily challenges, and ambassador stats are safely tied to your wallet address.</span>
                      </p>
                      <p className="text-xs text-[#06B6D4] leading-relaxed flex items-start gap-2">
                        <span>↺</span>
                        <span><strong>Automatic Restore:</strong> Reconnect with the same wallet to instantly restore all your progress and continue where you left off.</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      You can reconnect anytime using: Unlock Wallet (password), Import Wallet (seed phrase), or Connect Wallet (Phantom, Solflare, etc.)
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
                >
                  Log Out & Clear Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* App Info */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-white/5 to-white/5 blur-sm" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}></div>
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden" style={{ clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
              {/* Corner indicators */}
              <div className="absolute top-0 left-1 w-1 h-1 border-t border-l border-white/20"></div>
              <div className="absolute bottom-0 right-1 w-1 h-1 border-b border-r border-white/20"></div>
              
              <div className="p-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Reflexmatch.io</p>
                  <p className="text-xs text-gray-500">Version 1.0.0 • Web3 Gaming</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full"></div>
                    <span className="text-xs text-gray-400">Powered by Community</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={selectedAvatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </div>
  );
}
