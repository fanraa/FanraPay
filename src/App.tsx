import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Family from './components/Family';
import NotificationView from './components/NotificationView';
import PinSetup from './components/PinSetup';
import PinEntry from './components/PinEntry';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import PwaInstallModal from './components/PwaInstallModal';
import { useStorage } from './hooks/useStorage';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { Transaction, FamilyMember, Todo, AppEvent } from './types';
import { AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'transaksi' | 'keluarga' | 'notifikasi';

import { Smile, Frown, Meh, Laugh, Annoyed, Heart } from 'lucide-react';

const expressions = [Smile, Frown, Meh, Laugh, Annoyed, Heart];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isDashboardSubView, setIsDashboardSubView] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [expressionIndex, setExpressionIndex] = useState<number>(0);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(5000000);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  
  // Pengaturan Privasi & Viewer
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [privateMode, setPrivateMode] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useStorage('fanra_preview_mode', false);
  const [pinCode, setPinCode] = useStorage<string | null>('fanra_pin_code', null);
  const [isPinEnabled, setIsPinEnabled] = useStorage<boolean>('fanra_pin_enabled', false);
  const [faceId, setFaceId] = useStorage<string | null>('fanra_face_id', null);
  const [fingerprintId, setFingerprintId] = useStorage<string | null>('fanra_fingerprint_id', null);
  
  // App Runtime State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSettingPin, setIsSettingPin] = useState<boolean>(false);

  // Loading & Firebase Sync State
  const { isSyncing, currentUser, isAdmin, forceRefresh, isOnline, hasUnsyncedChanges } = useFirebaseSync(
    transactions, setTransactions, 
    budget, setBudget, 
    showHistory, setShowHistory, 
    showNotifications, setShowNotifications, 
    privateMode, setPrivateMode,
    accountNumber, setAccountNumber,
    todos, setTodos,
    events, setEvents,
    expressionIndex, setExpressionIndex
  );
  
  // Viewer mode is active if user is NOT Admin, OR if Admin explicitly enabled Preview Mode
  const isViewer = !isAdmin || previewMode;

  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      // Tunggu sebentar untuk memastikan React selesai render & meload gambar dll
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 600); // durasi animasi fade out
      }, 1000); // durasi minimal loading screen tampil (1 detik)
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isOnlineRef = React.useRef(isOnline);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsyncedChanges) {
        e.preventDefault();
        e.returnValue = 'Anda memiliki data yang belum tersinkron. Jika Anda keluar sekarang, perubahan ini akan hilang.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsyncedChanges]);
  useEffect(() => {
    if (isOnline !== isOnlineRef.current) {
      if (!isOnline) {
        showToast("📡 Mode Offline Aktif", "info");
      } else {
        showToast("📡 Kembali Online", "success");
        setIsReconnecting(true);
        setTimeout(() => setIsReconnecting(false), 1500);
      }
      isOnlineRef.current = isOnline;
    }
  }, [isOnline]);

  const handleAddTransaction = (t: Transaction) => {
    if (isViewer) {
      showToast("Hanya Admin yang dapat menambah transaksi.", "error");
      return;
    }
    setTransactions([...transactions, t]);
    showToast("Transaksi berhasil dicatat!", "success");
  };

  const handleDeleteTransaction = (id: string) => {
    if (isViewer) {
      showToast("Hanya Admin yang dapat menghapus transaksi.", "error");
      return;
    }
    setTransactions(transactions.filter(t => t.id !== id));
    showToast("Transaksi berhasil dihapus.", "info");
  };

  const handleTogglePin = (enabled: boolean) => {
    if (isViewer) {
      showToast("Pengaturan keamanan hanya tersedia untuk Admin.", "error");
      return;
    }
    if (enabled) {
      setIsSettingPin(true);
    } else {
      setIsPinEnabled(false);
      setPinCode(null);
      showToast("Kunci PIN telah dinonaktifkan.", "info");
    }
  };

  return (
    <>
      {isLoading && (
        <div className={`fixed inset-0 z-[999] flex flex-col items-center justify-between bg-gradient-to-br from-[#E2E1DC] via-[#F8F7F4] to-[#D9E0D3] transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex-1 flex flex-col items-center justify-center pt-16">
            <img src="/icons/icon-192.png" alt="FanraPay Logo" className="w-16 h-16 drop-shadow-md animate-pulse mb-3" />
            <h1 className="text-2xl font-bold tracking-tight text-[#2D2D2A]">FanraPay</h1>
          </div>
          <div className="pb-8">
            <p className="text-[10px] md:text-xs text-[#7A7A72]/60 font-medium uppercase tracking-widest">
              by Irfan Rizki Aditri
            </p>
          </div>
        </div>
      )}

      {/* Security Overlays - Only prompt PIN for authenticated Owner on their device */}
      {!isLoading && isSettingPin && (
        <PinSetup 
          onComplete={(pin) => {
            setPinCode(pin);
            setIsPinEnabled(true);
            setIsSettingPin(false);
            setIsAuthenticated(true);
          }}
          onCancel={() => setIsSettingPin(false)}
        />
      )}
      
      {!isLoading && !isSettingPin && isPinEnabled && isAdmin && !previewMode && !isAuthenticated && (
        <PinEntry 
          correctPin={pinCode || ''}
          onSuccess={() => setIsAuthenticated(true)}
          faceId={faceId}
          fingerprintId={fingerprintId}
        />
      )}

      {/* Pop-up Izin Notifikasi jika belum diizinkan */}
      {!isLoading && (!isPinEnabled || !isAdmin || previewMode || isAuthenticated) && (
        <NotificationPermissionModal 
          showNotifications={showNotifications}
          onPermissionChange={(granted) => setShowNotifications(granted)}
        />
      )}

      {/* Pop-up Tambahkan ke Layar Utama (PWA) saat akun Google terhubung */}
      {!isLoading && (!isPinEnabled || !isAdmin || previewMode || isAuthenticated) && (
        <PwaInstallModal isLoggedIn={Boolean(currentUser)} />
      )}

      {/* Floating Global Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-center ${
            toast.type === 'error'
              ? 'bg-[#E63946]/90 text-white border-[#E63946]'
              : toast.type === 'success'
              ? 'bg-[#4A6741]/95 text-white border-[#4A6741]'
              : 'bg-white/95 text-[#2D2D2A] border-[#E8E6E1] shadow-md'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-gradient-to-br from-[#E2E1DC] via-[#F8F7F4] to-[#D9E0D3] text-[#2D2D2A] font-sans selection:bg-[#4A6741]/20 flex ${(!isAuthenticated && isPinEnabled && isAdmin && !previewMode && !isSettingPin) ? 'hidden' : ''}`}>
        
      {/* Sidebar untuk Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white/60 backdrop-blur-2xl border-r border-white/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
        <div className="p-6 border-b border-white/80 flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="FanraPay Logo" className="w-9 h-9 drop-shadow-sm" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#2D2D2A]">FanraPay</h1>
          </div>
        </div>
        
        <div className="flex-1 px-4 py-8 space-y-2">
          {[
            { id: 'dashboard', label: 'Beranda', icon: 'https://cdn-icons-png.flaticon.com/128/15665/15665454.png' },
            { id: 'transaksi', label: 'Transaksi', icon: 'https://cdn-icons-png.flaticon.com/128/483/483742.png' },
            { id: 'keluarga', label: 'Keluarga', icon: 'https://cdn-icons-png.flaticon.com/128/33/33728.png' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
                activeTab === item.id 
                  ? 'bg-black/[0.04] text-[#4A6741] shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)] translate-y-[1px]' 
                  : 'text-[#7A7A72] hover:bg-black/5'
              }`}
            >
              <div 
                className="w-5 h-5 bg-current"
                style={{
                  WebkitMaskImage: `url('${item.icon}')`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url('${item.icon}')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }}
              />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-white/80 bg-white/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <button 
                onClick={() => {
                  if (isAdmin && !previewMode && isOnline) {
                    setExpressionIndex((prev) => (prev + 1) % expressions.length);
                  }
                }} 
                className={`w-10 h-10 rounded-full border-2 border-white bg-white/60 flex items-center justify-center shadow-sm overflow-hidden p-1.5 transition-all shrink-0 ${isAdmin && !previewMode ? (isOnline ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale') : 'cursor-default opacity-80'}`}
                title={isAdmin && !previewMode ? (isOnline ? 'Ubah status ekspresi' : 'Offline - tidak dapat diubah') : 'Status'}
              >
                <img src={expressions[expressionIndex]} alt="expression" className="w-full h-full object-contain drop-shadow-sm" />
              </button>
              <div className="flex flex-col truncate">
                <span className="text-[12px] font-bold text-[#2D2D2A] truncate">
                  {isAdmin ? 'Irfan Rizki Aditri' : (currentUser ? currentUser.email?.split('@')[0] : 'FanraPay')}
                </span>
                <span className="text-[10px] text-[#7A7A72] font-medium truncate">
                  {currentUser ? currentUser.email : 'Aplikasi Keuangan'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative z-10 overflow-x-hidden">
        {/* Latar Belakang Foto Atas (Hanya untuk Dashboard Main View) */}
        {activeTab === 'dashboard' && !isDashboardSubView && (
          <div 
            className="absolute top-0 left-0 right-0 h-[340px] md:h-[380px] z-0 pointer-events-none"
            style={{
              WebkitMaskImage: 'radial-gradient(circle 20px at 0 100%, transparent 20px, black 21px), radial-gradient(circle 20px at 100% 100%, transparent 20px, black 21px), linear-gradient(black, black)',
              WebkitMaskPosition: 'bottom left, bottom right, top left',
              WebkitMaskSize: '50% 20px, 50% 20px, 100% calc(100% - 20px)',
              WebkitMaskRepeat: 'no-repeat, no-repeat, no-repeat',
              maskImage: 'radial-gradient(circle 20px at 0 100%, transparent 20px, black 21px), radial-gradient(circle 20px at 100% 100%, transparent 20px, black 21px), linear-gradient(black, black)',
              maskPosition: 'bottom left, bottom right, top left',
              maskSize: '50% 20px, 50% 20px, 100% calc(100% - 20px)',
              maskRepeat: 'no-repeat, no-repeat, no-repeat',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.15%22/%3E%3C/svg%3E"), linear-gradient(to bottom right, #3A5333, #23331E)'
            }}
          >
          </div>
        )}

        {/* Latar Belakang Overlay Atas (Nimpa Card Saldo) */}
        {activeTab === 'dashboard' && !isDashboardSubView && (
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1788017121/20260829_222451_0000_xdtcn4.png"
            alt="Top Overlay"
            className="absolute top-0 left-0 right-0 w-full h-[340px] md:h-[380px] object-cover object-top z-[15] pointer-events-none"
          />
        )}
        
        {/* Header Khusus HP */}
        <header className="md:hidden sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="FanraPay Logo" className="w-9 h-9 drop-shadow-sm" />
            <div>
              <h1 className={`text-xl font-bold tracking-tight transition-colors ${activeTab === 'dashboard' && !isDashboardSubView ? 'text-white drop-shadow-md' : 'text-[#2D2D2A] drop-shadow-none'}`}>FanraPay</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('notifikasi')}
              className="flex items-center justify-center hover:scale-105 transition-all"
            >
              <img 
                src="https://cdn-icons-png.flaticon.com/128/8338/8338801.png" 
                alt="Notification" 
                className="w-7 h-7 object-contain transition-all" 
                style={{ filter: activeTab === 'dashboard' && !isDashboardSubView ? 'brightness(0) invert(1)' : 'brightness(0) opacity(0.8)' }}
              />
            </button>
            <button 
              onClick={() => {
                if (isAdmin && !previewMode && isOnline) {
                  setExpressionIndex((prev) => (prev + 1) % expressions.length);
                }
              }} 
              className={`w-7 h-7 flex items-center justify-center overflow-hidden transition-all ${isAdmin && !previewMode ? (isOnline ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-50') : 'cursor-default opacity-90'}`}
              title={isAdmin && !previewMode ? (isOnline ? 'Ubah status' : 'Offline - tidak dapat diubah') : 'Status'}
            >
              {(() => {
                const ExpressionIcon = expressions[expressionIndex];
                return <ExpressionIcon className={`w-full h-full transition-colors ${activeTab === 'dashboard' && !isDashboardSubView ? 'text-white drop-shadow-md' : 'text-[#2D2D2A] drop-shadow-none'}`} strokeWidth={2.5} />;
              })()}
            </button>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 md:p-8 pb-28 md:pb-8 relative z-10">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              budget={budget} 
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              todos={todos}
              setTodos={setTodos}
              events={events}
              setEvents={setEvents}
              previewMode={isViewer} 
              privateMode={privateMode} 
              onViewChange={setIsDashboardSubView} 
              isSyncing={isSyncing}
              isOnline={isOnline}
              onRefresh={forceRefresh}
            />
          )}
          {activeTab === 'transaksi' && (
            <Transactions 
              transactions={transactions}
              isReconnecting={isReconnecting} 
              onAddTransaction={handleAddTransaction} 
              onDeleteTransaction={handleDeleteTransaction} 
              previewMode={isViewer} 
              showHistory={showHistory} 
              privateMode={privateMode} 
            />
          )}
          {activeTab === 'keluarga' && (
            <Family 
              previewMode={previewMode} 
              setPreviewMode={setPreviewMode} 
              showHistory={showHistory} 
              setShowHistory={setShowHistory} 
              showNotifications={showNotifications} 
              setShowNotifications={setShowNotifications} 
              privateMode={privateMode} 
              setPrivateMode={setPrivateMode} 
              isPinEnabled={isPinEnabled} 
              onTogglePin={handleTogglePin}
              faceId={faceId} 
              setFaceId={setFaceId}
              fingerprintId={fingerprintId} 
              setFingerprintId={setFingerprintId}
              isAdmin={isAdmin}
              currentUser={currentUser}
            />
          )}

          <AnimatePresence>
            {activeTab === 'notifikasi' && (
              <NotificationView 
                transactions={transactions}
                events={events}
                todos={todos}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Latar Belakang Foto Bawah (Beranda, Transaksi, Keluarga) - Absolute di dasar konten */}
        {['dashboard', 'transaksi', 'keluarga'].includes(activeTab) && !isDashboardSubView && (
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1788013698/20260829_212754_0000_iveyrl.png" 
            alt="Page Background Bottom" 
            className="absolute bottom-0 left-0 right-0 w-full object-cover object-bottom z-0 pointer-events-none opacity-80" 
            style={{ height: 'max(40vh, 300px)' }}
          />
        )}

        {/* Navbar Khusus HP */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/60 rounded-t-[24px] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20 transition-transform duration-300 ${activeTab === 'notifikasi' || (isDashboardSubView && activeTab === 'dashboard') ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
          <div className="max-w-md mx-auto flex justify-around px-3 py-1.5 items-center">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 p-1.5 w-[64px] rounded-[18px] transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-black/[0.04] shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)] text-[#4A6741] translate-y-[1px]' : 'text-[#7A7A72] hover:bg-black/5 hover:text-[#4A6741]'}`}
            >
              <div 
                className="w-[20px] h-[20px] bg-current"
                style={{
                  WebkitMaskImage: `url('https://cdn-icons-png.flaticon.com/128/15665/15665454.png')`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url('https://cdn-icons-png.flaticon.com/128/15665/15665454.png')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }}
              />
              <span className="text-[10px] tracking-wide text-current">Beranda</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('transaksi')}
              className={`flex flex-col items-center gap-1 p-1.5 w-[64px] rounded-[18px] transition-all duration-300 ${activeTab === 'transaksi' ? 'bg-black/[0.04] shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)] text-[#4A6741] translate-y-[1px]' : 'text-[#7A7A72] hover:bg-black/5 hover:text-[#4A6741]'}`}
            >
              <div 
                className="w-[20px] h-[20px] bg-current"
                style={{
                  WebkitMaskImage: `url('https://cdn-icons-png.flaticon.com/128/483/483742.png')`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url('https://cdn-icons-png.flaticon.com/128/483/483742.png')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }}
              />
              <span className="text-[10px] tracking-wide text-current">Transaksi</span>
            </button>

            <button 
              onClick={() => setActiveTab('keluarga')}
              className={`flex flex-col items-center gap-1 p-1.5 w-[64px] rounded-[18px] transition-all duration-300 ${activeTab === 'keluarga' ? 'bg-black/[0.04] shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)] text-[#4A6741] translate-y-[1px]' : 'text-[#7A7A72] hover:bg-black/5 hover:text-[#4A6741]'}`}
            >
              <div 
                className="w-[20px] h-[20px] bg-current"
                style={{
                  WebkitMaskImage: `url('https://cdn-icons-png.flaticon.com/128/33/33728.png')`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url('https://cdn-icons-png.flaticon.com/128/33/33728.png')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }}
              />
              <span className="text-[10px] tracking-wide text-current">Keluarga</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
    </>
  );
}
