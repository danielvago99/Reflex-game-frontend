import { useState } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

// 24 unique avatar options using DiceBear API with different styles and seeds
const AVATARS = [
  // Adventurer style (illustrated people)
  { id: 'adventurer-1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix', style: 'adventurer' },
  { id: 'adventurer-2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka', style: 'adventurer' },
  { id: 'adventurer-3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna', style: 'adventurer' },
  { id: 'adventurer-4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max', style: 'adventurer' },
  { id: 'adventurer-5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver', style: 'adventurer' },
  { id: 'adventurer-6', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie', style: 'adventurer' },
  
  // Avataaars style (cartoon people)
  { id: 'avataaars-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', style: 'avataaars' },
  { id: 'avataaars-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', style: 'avataaars' },
  { id: 'avataaars-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', style: 'avataaars' },
  { id: 'avataaars-4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe', style: 'avataaars' },
  { id: 'avataaars-5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', style: 'avataaars' },
  { id: 'avataaars-6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', style: 'avataaars' },
  
  // Lorelei style (realistic illustrations)
  { id: 'lorelei-1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Nova', style: 'lorelei' },
  { id: 'lorelei-2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Atlas', style: 'lorelei' },
  { id: 'lorelei-3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Stella', style: 'lorelei' },
  { id: 'lorelei-4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Orion', style: 'lorelei' },
  { id: 'lorelei-5', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aurora', style: 'lorelei' },
  { id: 'lorelei-6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Phoenix', style: 'lorelei' },
  
  // Personas style (illustrated people)
  { id: 'personas-1', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kai', style: 'personas' },
  { id: 'personas-2', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Aria', style: 'personas' },
  { id: 'personas-3', url: 'https://api.dicebear.com/7.x/personas/svg?seed=River', style: 'personas' },
  { id: 'personas-4', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sky', style: 'personas' },
  { id: 'personas-5', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Storm', style: 'personas' },
  { id: 'personas-6', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Echo', style: 'personas' },
];

export function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    onSelect(avatarId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Background glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-3xl"></div>
        
        {/* Main container */}
        <div className="relative bg-gradient-to-br from-[#0B0F1A] to-[#1a0f2e] border-2 border-white/20 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl text-white">Choose Your Avatar</h2>
                <p className="text-sm text-gray-400 mt-1">Select a profile picture that represents you</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Avatar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelect(avatar.id)}
                    className="relative group"
                  >
                    {/* Outer glow effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-lg ${isSelected ? 'opacity-100' : ''}`}></div>
                    
                    {/* Avatar circle */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center overflow-hidden transition-all duration-300 ${isSelected ? 'scale-110 shadow-xl border-[#00FFA3]' : 'group-hover:scale-105 group-hover:border-[#06B6D4]/50'}`}>
                        <img 
                          src={avatar.url} 
                          alt={`Avatar ${avatar.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00FFA3] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                          <CheckCircle2 className="w-4 h-4 text-[#0B0F1A]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info text */}
            <div className="mt-6 p-4 glass rounded-xl">
              <p className="text-sm text-gray-300 text-center">
                Your avatar will be displayed across the platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get avatar data by ID
export function getAvatarData(avatarId: string) {
  return AVATARS.find(avatar => avatar.id === avatarId) || AVATARS[0];
}

export function findAvatarIdByUrl(url?: string | null) {
  if (!url) return null;
  const match = AVATARS.find((avatar) => avatar.url === url);
  return match?.id ?? null;
}
