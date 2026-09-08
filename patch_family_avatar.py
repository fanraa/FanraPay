import re

with open('src/components/Family.tsx', 'r') as f:
    content = f.read()

# 1. Imports
import_auth = "import { User } from 'firebase/auth';"
new_import_auth = "import { User, updateProfile } from 'firebase/auth';"
content = content.replace(import_auth, new_import_auth)

# Add Avatar import after CheckCircle2
import_check = "import { isBiometricSupported, registerBiometric } from '../utils/biometric';"
new_import_avatar = "import { isBiometricSupported, registerBiometric } from '../utils/biometric';\nimport Avatar from 'boring-avatars';"
content = content.replace(import_check, new_import_avatar)

# 2. Add state for Edit Profile Modal
state_target = "const [isStandaloneApp, setIsStandaloneApp] = useState(false);"
state_replacement = """const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempVariant, setTempVariant] = useState<'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'>('beam');
  const [tempSeed, setTempSeed] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const AVATAR_COLORS = ['#4A6741', '#E63946', '#F4A261', '#E9C46A', '#2A9D8F'];
  const AVATAR_VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus'] as const;

  // Parsing avatar data from photoURL
  const getAvatarData = () => {
    const defaultName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Tamu';
    if (currentUser?.photoURL?.startsWith('boring-avatar|')) {
      const parts = currentUser.photoURL.split('|');
      return { variant: parts[1] as any, seed: parts[2] || defaultName };
    }
    return { variant: 'beam' as const, seed: defaultName };
  };

  const handleEditProfileClick = () => {
    const { variant, seed } = getAvatarData();
    setTempName(currentUser?.displayName || currentUser?.email?.split('@')[0] || '');
    setTempVariant(variant);
    setTempSeed(seed);
    setShowEditProfile(true);
  };

  const handleRandomizeAvatar = () => {
    const randomVariant = AVATAR_VARIANTS[Math.floor(Math.random() * AVATAR_VARIANTS.length)];
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setTempVariant(randomVariant);
    setTempSeed(randomSeed);
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(currentUser, {
        displayName: tempName,
        photoURL: `boring-avatar|${tempVariant}|${tempSeed}`
      });
      setFeedbackMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setShowEditProfile(false);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Gagal menyimpan profil.' });
    } finally {
      setIsSavingProfile(false);
    }
  };
"""
content = content.replace(state_target, state_replacement)

# 3. Update the Profile Header layout
old_profile_header = """      {/* Profile Header */}
      <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl py-8 px-6 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center justify-center text-center mt-2">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#F0EFEC] mb-4 flex items-center justify-center">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">🧑‍💻</span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#2D2D2A]">{currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Tamu')}</h2>
        <p className="text-xs md:text-sm text-[#7A7A72] mt-1 font-medium">{currentUser ? 'Pengguna Terdaftar' : 'Belum Login'}</p>
      </div>"""

new_profile_header = """      {/* Profile Header */}
      <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl py-6 px-6 md:px-8 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-5 mt-2 relative">
        {currentUser && (
          <button 
            onClick={handleEditProfileClick} 
            className="absolute top-4 right-4 p-2.5 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 rounded-full transition-all cursor-pointer"
            title="Edit Profil"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-sm overflow-hidden bg-[#F0EFEC] flex items-center justify-center shrink-0">
          <Avatar 
            size={80} 
            name={getAvatarData().seed} 
            variant={getAvatarData().variant} 
            colors={AVATAR_COLORS} 
          />
        </div>
        
        <div className="flex flex-col min-w-0 pr-8">
          <h2 className="text-lg md:text-xl font-bold text-[#2D2D2A] truncate">
            {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Tamu')}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2.5 py-1 bg-[#4A6741]/10 border border-[#4A6741]/20 text-[#4A6741] text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
              {isAdmin ? 'Keluarga (Admin)' : (currentUser ? 'Keluarga' : 'Tamu')}
            </span>
            <span className="text-[11px] text-[#7A7A72] font-semibold shrink-0">
              {currentUser ? '• Aktif' : '• Belum Login'}
            </span>
          </div>
        </div>
      </div>"""

content = content.replace(old_profile_header, new_profile_header)

# 4. Add the Edit Profile Modal at the end of the return statement
modal_code = """      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D2D2A]/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowEditProfile(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[32px] p-6 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] animate-in zoom-in-95 duration-200 text-[#2D2D2A] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 right-4 p-2 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold mb-6 text-center">Edit Profil</h3>
            
            {/* Avatar Preview & Randomizer */}
            <div className="flex flex-col items-center justify-center mb-6 relative">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-md">
                  <Avatar size={96} name={tempSeed} variant={tempVariant} colors={AVATAR_COLORS} />
                </div>
                <button 
                  onClick={handleRandomizeAvatar}
                  className="absolute bottom-0 -right-2 bg-white p-2 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-[#4A6741] hover:bg-[#F8F7F4] border border-[#E8E6E1] transition-transform active:scale-95"
                  title="Acak Avatar"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-[#7A7A72] mt-3 font-semibold uppercase tracking-wider">Ketuk Bintang untuk Mengacak</p>
            </div>

            {/* Name Input */}
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-2">Nama Tampilan</label>
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full px-4 py-3 bg-[#F8F7F4] border border-[#E8E6E1] rounded-xl text-sm font-semibold text-[#2D2D2A] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 transition-all"
              />
            </div>

            <button 
              onClick={saveProfile}
              disabled={isSavingProfile || !tempName.trim()}
              className="w-full bg-[#4A6741] text-white font-bold py-3.5 rounded-xl hover:bg-[#3D5635] transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </div>
      )}

      <div className="lg:col-span-2 text-center mt-4">"""

content = content.replace('<div className="lg:col-span-2 text-center mt-4">', modal_code)

with open('src/components/Family.tsx', 'w') as f:
    f.write(content)
