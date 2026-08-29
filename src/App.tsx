import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Family from './components/Family';
import PinSetup from './components/PinSetup';
import PinEntry from './components/PinEntry';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import PwaInstallModal from './components/PwaInstallModal';
import { useStorage } from './hooks/useStorage';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { Transaction, FamilyMember, Todo, AppEvent } from './types';

type Tab = 'dashboard' | 'transaksi' | 'keluarga';

const expressions = [
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Sleeping%20Face.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Tired%20Face.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Sneezing%20Face.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Exploding%20Head.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Enraged%20Face.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png',
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isDashboardSubView, setIsDashboardSubView] = useState(false);
  const [expressionIndex, setExpressionIndex] = useStorage('fanra_expression', 0);
  
  const [transactions, setTransactions] = useStorage<Transaction[]>('fanra_v2_transactions', []);
  const [budget, setBudget] = useStorage<number>('fanra_v2_budget', 5000000);
  const [accountNumber, setAccountNumber] = useStorage<string>('fanra_v2_account_number', '');
  const [todos, setTodos] = useStorage<Todo[]>('fanra_v2_todos', []);
  const [events, setEvents] = useStorage<AppEvent[]>('fanra_v2_events', []);
  
  // Pengaturan Privasi & Viewer
  const [showHistory, setShowHistory] = useStorage('fanra_setting_history', true);
  const [showNotifications, setShowNotifications] = useStorage('fanra_setting_notif', false);
  const [privateMode, setPrivateMode] = useStorage('fanra_setting_private', false);
  const [previewMode, setPreviewMode] = useStorage('fanra_preview_mode', false);
  const [pinCode, setPinCode] = useStorage<string | null>('fanra_pin_code', null);
  const [isPinEnabled, setIsPinEnabled] = useStorage<boolean>('fanra_pin_enabled', false);
  const [faceId, setFaceId] = useStorage<string | null>('fanra_face_id', null);
  const [fingerprintId, setFingerprintId] = useStorage<string | null>('fanra_fingerprint_id', null);
  
  // App Runtime State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSettingPin, setIsSettingPin] = useState<boolean>(false);

  // Loading & Firebase Sync State
  const { isSyncing, currentUser, isAdmin, forceRefresh } = useFirebaseSync(
    transactions, setTransactions, 
    budget, setBudget, 
    showHistory, setShowHistory, 
    showNotifications, setShowNotifications, 
    privateMode, setPrivateMode,
    accountNumber, setAccountNumber,
    todos, setTodos,
    events, setEvents
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
            { id: 'dashboard', label: 'Beranda', icon: 'https://cdn-icons-png.flaticon.com/128/4999/4999606.png' },
            { id: 'transaksi', label: 'Transaksi', icon: 'https://cdn-icons-png.flaticon.com/128/6145/6145523.png' },
            { id: 'keluarga', label: 'Keluarga', icon: 'https://cdn-icons-png.flaticon.com/128/16133/16133885.png' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
                activeTab === item.id 
                  ? 'bg-[#4A6741] text-white shadow-[0_4px_12px_rgba(74,103,65,0.2)]' 
                  : 'text-[#7A7A72] hover:bg-white/50 grayscale hover:grayscale-0'
              }`}
            >
              <img src={item.icon} className={`w-5 h-5 object-contain transition-all ${activeTab === item.id ? 'brightness-200' : 'opacity-70'}`} alt={item.label} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-white/80 bg-white/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <button 
                onClick={() => {
                  if (isAdmin && !previewMode) {
                    setExpressionIndex((prev) => (prev + 1) % expressions.length);
                  }
                }} 
                className={`w-10 h-10 rounded-full border-2 border-white bg-white/60 flex items-center justify-center shadow-sm overflow-hidden p-1.5 transition-all shrink-0 ${isAdmin && !previewMode ? 'hover:scale-105 cursor-pointer' : 'cursor-default opacity-80'}`}
                title={isAdmin && !previewMode ? "Ubah status ekspresi" : "Status"}
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
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Header Khusus HP */}
        <header className="md:hidden bg-white/50 backdrop-blur-xl border-b border-white/60 sticky top-0 z-10 px-6 py-3 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="FanraPay Logo" className="w-9 h-9 drop-shadow-sm" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#2D2D2A]">FanraPay</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (isAdmin && !previewMode) {
                  setExpressionIndex((prev) => (prev + 1) % expressions.length);
                }
              }} 
              className={`w-10 h-10 rounded-full border-2 border-white bg-white/60 flex items-center justify-center shadow-sm overflow-hidden p-1.5 transition-all ${isAdmin && !previewMode ? 'hover:scale-105 cursor-pointer' : 'cursor-default opacity-80'}`}
              title={isAdmin && !previewMode ? "Ubah status" : "Status"}
            >
              <img src={expressions[expressionIndex]} alt="expression" className="w-full h-full object-contain drop-shadow-sm" />
            </button>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 md:p-8 pb-28 md:pb-8">
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
              onRefresh={forceRefresh}
            />
          )}
          {activeTab === 'transaksi' && (
            <Transactions 
              transactions={transactions} 
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
        </main>

        {/* Navbar Khusus HP */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/60 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20 transition-transform duration-300 ${isDashboardSubView && activeTab === 'dashboard' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
          <div className="max-w-md mx-auto flex justify-around p-3 items-center">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1.5 p-2 w-20 transition-colors ${activeTab === 'dashboard' ? 'text-[#4A6741]' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
            >
              <img src="https://cdn-icons-png.flaticon.com/128/4999/4999606.png" className="w-6 h-6 object-contain" alt="Beranda" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-current">Beranda</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('transaksi')}
              className={`flex flex-col items-center gap-1.5 p-2 w-20 transition-colors ${activeTab === 'transaksi' ? 'text-[#4A6741]' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
            >
              <img src="https://cdn-icons-png.flaticon.com/128/6145/6145523.png" className="w-6 h-6 object-contain" alt="Transaksi" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-current">Transaksi</span>
            </button>

            <button 
              onClick={() => setActiveTab('keluarga')}
              className={`flex flex-col items-center gap-1.5 p-2 w-20 transition-colors ${activeTab === 'keluarga' ? 'text-[#4A6741]' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
            >
              <img src="https://cdn-icons-png.flaticon.com/128/16133/16133885.png" className="w-6 h-6 object-contain" alt="Keluarga" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-current">Keluarga</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
    </>
  );
}
