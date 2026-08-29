import React, { useState, useEffect } from 'react';
import { loginWithGoogle, logout } from '../lib/firebase';
import { User } from 'firebase/auth';
import { 
  Users, Shield, Lock, Smartphone, Fingerprint, ScanFace, 
  LogOut, CheckCircle2, Eye, Bell, KeyRound, Download, Check, 
  AlertCircle, Loader2, X, ChevronRight, Share2, Globe, Copy, 
  MessageSquare, Send, ExternalLink, Sparkles
} from 'lucide-react';
import { isBiometricSupported, registerBiometric } from '../utils/biometric';
import { promptPwaInstall, isAppInstalled } from '../utils/pwa';

interface FamilyProps {
  previewMode: boolean;
  setPreviewMode: (val: boolean) => void;
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (val: boolean) => void;
  privateMode: boolean;
  setPrivateMode: (val: boolean) => void;
  isPinEnabled: boolean;
  onTogglePin: (val: boolean) => void;
  faceId: string | null;
  setFaceId: (val: string | null) => void;
  fingerprintId: string | null;
  setFingerprintId: (val: string | null) => void;
  isAdmin?: boolean;
  currentUser?: User | null;
}

export default function Family({ 
  previewMode, setPreviewMode,
  showHistory, setShowHistory,
  showNotifications, setShowNotifications,
  privateMode, setPrivateMode,
  isPinEnabled, onTogglePin,
  faceId, setFaceId, fingerprintId, setFingerprintId,
  isAdmin = false,
  currentUser = null
}: FamilyProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        localStorage.getItem('fanra_pwa_installed_or_dismissed') === 'true';
      setIsStandaloneApp(standalone);

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIosDevice(isIos);
    }
  }, []);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleGoogleLogin = async () => {
    setFeedbackMessage(null);
    if (currentUser) {
      try {
        setIsLoggingIn(true);
        await logout();
        setFeedbackMessage({ type: 'info', text: 'Berhasil keluar dari akun.' });
      } catch (err) {
        setFeedbackMessage({ type: 'error', text: 'Gagal keluar. Silakan coba lagi.' });
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      setFeedbackMessage({ type: 'success', text: 'Berhasil terhubung dengan Akun Google!' });
    } catch (error: any) {
      console.warn("Login failed:", error);
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        setFeedbackMessage({ type: 'info', text: 'Proses login dibatalkan.' });
      } else {
        setFeedbackMessage({ 
          type: 'error', 
          text: 'Gagal menghubungkan akun Google. Pastikan jaringan stabil atau coba beberapa saat lagi.' 
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePwaAction = async () => {
    const res = await promptPwaInstall();
    if (res === 'unsupported') {
      setShowPwaGuideModal(true);
    } else if (res === 'accepted') {
      setIsStandaloneApp(true);
      setFeedbackMessage({ type: 'success', text: 'Aplikasi FanraPay berhasil ditambahkan ke layar utama!' });
    }
  };

  const handleToggleFaceId = async () => {
    if (!isAdmin) {
      setFeedbackMessage({ type: 'error', text: 'Pengaturan keamanan biometrik hanya tersedia untuk Admin.' });
      return;
    }
    if (!isBiometricSupported()) {
      setFeedbackMessage({ type: 'error', text: 'Perangkat atau browser Anda tidak mendukung fitur Face ID.' });
      return;
    }
    if (faceId) {
      setFaceId(null);
      setFeedbackMessage({ type: 'info', text: 'Face ID telah dinonaktifkan.' });
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFaceId(newId);
          setFeedbackMessage({ type: 'success', text: 'Face ID berhasil didaftarkan!' });
        } else {
          setFeedbackMessage({ type: 'error', text: 'Gagal mendaftarkan Face ID.' });
        }
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: 'Terjadi kendala saat mendaftarkan Face ID.' });
      }
    }
  };

  const handleToggleFingerprint = async () => {
    if (!isAdmin) {
      setFeedbackMessage({ type: 'error', text: 'Pengaturan keamanan biometrik hanya tersedia untuk Admin.' });
      return;
    }
    if (!isBiometricSupported()) {
      setFeedbackMessage({ type: 'error', text: 'Perangkat atau browser Anda tidak mendukung fitur Sidik Jari.' });
      return;
    }
    if (fingerprintId) {
      setFingerprintId(null);
      setFeedbackMessage({ type: 'info', text: 'Sidik Jari telah dinonaktifkan.' });
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFingerprintId(newId);
          setFeedbackMessage({ type: 'success', text: 'Sidik Jari berhasil didaftarkan!' });
        } else {
          setFeedbackMessage({ type: 'error', text: 'Gagal mendaftarkan Sidik Jari.' });
        }
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: 'Terjadi kendala saat mendaftarkan Sidik Jari.' });
      }
    }
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://fanrapay.vercel.app';
  };

  const shareTitle = 'FanraPay - Aplikasi Keuangan & Keluarga';
  const shareText = 'Kelola keuangan pribadi & keluarga secara real-time dan pantau kalender akademik ITERA di FanraPay!';

  const handleShareApp = async () => {
    const shareUrl = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedShareLink(true);
    setFeedbackMessage({ type: 'success', text: 'Tautan FanraPay berhasil disalin ke papan klip!' });
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${shareText}\n\n${getShareUrl()}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0 relative">
      
      {/* Toast Notification In-App */}
      {feedbackMessage && (
        <div className="lg:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs md:text-sm font-medium shadow-sm ${
            feedbackMessage.type === 'error'
              ? 'bg-[#E63946]/10 border-[#E63946]/20 text-[#E63946]'
              : feedbackMessage.type === 'success'
              ? 'bg-[#4A6741]/10 border-[#4A6741]/20 text-[#4A6741]'
              : 'bg-[#F0EFEC] border-[#E8E6E1] text-[#2D2D2A]'
          }`}>
            <div className="flex items-center gap-2.5">
              {feedbackMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="p-1 hover:bg-black/5 rounded-lg text-current transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Status Akun & Autentikasi Google */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img src="https://cdn-icons-png.flaticon.com/128/16133/16133885.png" alt="Akses Akun" className="w-6 h-6 object-contain" />
              <h2 className="font-bold text-xl text-[#2D2D2A]">Akses & Akun</h2>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Tombol Bagikan Tanpa Box (Clean & Minimalist) */}
              <button 
                onClick={handleShareApp}
                title="Bagikan Aplikasi FanraPay"
                aria-label="Bagikan Aplikasi FanraPay"
                className="p-2 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 active:scale-90 transition-all rounded-full cursor-pointer flex items-center justify-center group"
              >
                <Share2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              </button>

              {isAdmin && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4A6741]/10 text-[#4A6741] border border-[#4A6741]/20 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>

          {isAdmin ? (
            <div className="bg-[#4A6741]/10 border border-[#4A6741]/20 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-2 text-[#4A6741] font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" /> Admin Terverifikasi
              </div>
              <p className="text-xs text-[#2D2D2A] font-semibold">{currentUser?.email}</p>
              <p className="text-[11px] text-[#7A7A72] mt-1.5 leading-relaxed">
                Anda memiliki akses penuh untuk mengelola transaksi, keuangan, dan pengaturan keamanan di semua perangkat.
              </p>
            </div>
          ) : currentUser ? (
            <div className="bg-white/80 border border-[#E8E6E1] rounded-2xl p-4 mb-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#2D2D2A] font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#4A6741]" /> Akun Google Terhubung
              </div>
              <p className="text-xs text-[#2D2D2A] font-semibold">{currentUser.email}</p>
              <p className="text-[11px] text-[#7A7A72] mt-1.5 leading-relaxed">
                Akun Anda terhubung dengan aplikasi FanraPay untuk pemantauan data keuangan secara real-time.
              </p>
            </div>
          ) : (
            <div className="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold text-[#2D2D2A] mb-1">Masuk dengan Akun Google</p>
              <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                Hubungkan dengan akun Google Anda untuk mengakses dan menyinkronkan data keuangan keluarga secara instan.
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer active:scale-98 disabled:opacity-70 ${
            currentUser 
              ? 'bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#E63946] border border-[#E8E6E1]' 
              : 'bg-white hover:bg-[#F8F7F4] border border-[#E8E6E1] text-[#2D2D2A] shadow-sm'
          }`}
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#4A6741]" />
              <span>Menghubungkan...</span>
            </>
          ) : currentUser ? (
            <>
              <LogOut className="w-4 h-4" /> Keluar ({currentUser.email?.split('@')[0]})
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Login dengan Akun Google</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Pengaturan Notifikasi & Akses HP */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://cdn-icons-png.flaticon.com/128/9821/9821144.png" 
              alt="Notifikasi" 
              className="w-6 h-6 object-contain" 
            />
            <h3 className="font-bold text-xl text-[#2D2D2A]">
              {isAdmin ? 'Notifikasi & Akses' : 'Akses Aplikasi'}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Item 1: Pasang Aplikasi ke Layar Utama HP */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Aplikasi di Layar HP</p>
                <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                  Pasang FanraPay di layar utama HP Anda untuk akses cepat satu ketukan dan tampilan layar penuh.
                </p>
              </div>
              {isStandaloneApp ? (
                <div className="px-3 py-1.5 rounded-xl bg-[#4A6741]/10 border border-[#4A6741]/20 text-[#4A6741] text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terpasang</span>
                </div>
              ) : (
                <button 
                  onClick={handlePwaAction}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5635] text-white text-xs font-semibold shrink-0 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pasang</span>
                </button>
              )}
            </div>

            <div className="h-px bg-black/[0.06] my-1" />

            {/* Item 2: Notifikasi Transaksi */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Pemberitahuan Transaksi</p>
                <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                  Tampilkan notifikasi di atas layar HP saat ada transaksi baru tercatat.
                </p>
              </div>
              <button 
                onClick={async () => {
                  const nextVal = !showNotifications;
                  if (nextVal) {
                    sessionStorage.removeItem('fanra_notif_ignored_session');
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                      try {
                        if (Notification.permission !== 'granted') {
                          await Notification.requestPermission();
                        }
                      } catch (e) {}
                    }
                  }
                  setShowNotifications(nextVal);
                }}
                className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${showNotifications ? 'bg-[#4A6741]' : 'bg-[#E8E6E1]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${showNotifications ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
              </button>
            </div>

            {isAdmin && (
              <>
                <div className="h-px bg-black/[0.06] my-1" />

                {/* Item 3: Mode Privat (Admin Only) */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="pr-2">
                    <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Mode Privat Total</p>
                    <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                      Sembunyikan semua angka nominal (saldo & riwayat) menjadi tanda bintang (***).
                    </p>
                  </div>
                  <button 
                    onClick={() => setPrivateMode(!privateMode)}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${privateMode ? 'bg-[#E63946]' : 'bg-[#E8E6E1]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${privateMode ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
                  </button>
                </div>

                <div className="h-px bg-black/[0.06] my-1" />

                {/* Item 4: Uji Coba Tampilan (Admin Only) */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="pr-2">
                    <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Uji Coba Tampilan</p>
                    <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                      Simulasikan tampilan seperti anggota keluarga lain.
                    </p>
                  </div>
                  <button 
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${previewMode ? 'bg-[#4A6741]' : 'bg-[#E8E6E1]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${previewMode ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Pengaturan Keamanan Perangkat (Hanya Admin) */}
      {isAdmin && (
        <div className="bg-white/60 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <img src="https://cdn-icons-png.flaticon.com/128/4291/4291647.png" alt="Pengaturan Keamanan" className="w-5 h-5 object-contain" />
            <h3 className="font-bold text-lg text-[#2D2D2A]">Keamanan Perangkat</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-[24px] border border-white shadow-sm gap-4">
              <div className="flex items-start gap-3">
                <img src="https://cdn-icons-png.flaticon.com/128/9506/9506896.png" alt="Kunci PIN" className="w-6 h-6 mt-0.5 shrink-0 object-contain" />
                <div>
                  <p className="text-[13px] md:text-sm font-bold text-[#2D2D2A] mb-0.5">Kunci Aplikasi (PIN)</p>
                  <p className="text-[11px] md:text-xs text-[#7A7A72] leading-relaxed">Minta 6 angka PIN saat membuka aplikasi di perangkat ini.</p>
                </div>
              </div>
              <button 
                onClick={() => onTogglePin(!isPinEnabled)}
                className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${isPinEnabled ? 'bg-[#4A6741]' : 'bg-[#E8E6E1]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${isPinEnabled ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
              </button>
            </div>

            {isPinEnabled && (
              <>
                <div className="flex items-center justify-between bg-white/50 p-4 rounded-[24px] border border-white shadow-sm gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 bg-[#4A6741]/10 p-2 rounded-full">
                      <img src="https://cdn-icons-png.flaticon.com/128/8682/8682897.png" alt="Face ID" className="w-5 h-5 object-contain" style={{ filter: 'invert(37%) sepia(24%) saturate(836%) hue-rotate(68deg) brightness(94%) contrast(88%)' }} />
                    </div>
                    <div>
                      <p className="text-[13px] md:text-sm font-bold text-[#2D2D2A] mb-0.5">Face ID</p>
                      <p className="text-[11px] md:text-xs text-[#7A7A72] leading-relaxed">Buka kunci dengan Face ID perangkat.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleToggleFaceId}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${faceId ? 'bg-[#4A6741]' : 'bg-[#E8E6E1]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${faceId ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/50 p-4 rounded-[24px] border border-white shadow-sm gap-4 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 bg-[#4A6741]/10 p-2 rounded-full">
                      <img src="https://cdn-icons-png.flaticon.com/128/9436/9436154.png" alt="Sidik Jari" className="w-5 h-5 object-contain" style={{ filter: 'invert(37%) sepia(24%) saturate(836%) hue-rotate(68deg) brightness(94%) contrast(88%)' }} />
                    </div>
                    <div>
                      <p className="text-[13px] md:text-sm font-bold text-[#2D2D2A] mb-0.5">Sidik Jari</p>
                      <p className="text-[11px] md:text-xs text-[#7A7A72] leading-relaxed">Buka kunci dengan Sidik Jari perangkat.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleToggleFingerprint}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative shadow-inner shrink-0 transition-colors ${fingerprintId ? 'bg-[#4A6741]' : 'bg-[#E8E6E1]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${fingerprintId ? 'left-[26px] md:left-[30px]' : 'left-1'}`}></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mode Preview Banner when active */}
      {previewMode && (
        <div className="lg:col-span-2 bg-[#4A6741]/10 border border-[#4A6741]/20 p-5 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-[#4A6741]/20 p-2 rounded-full shrink-0">
                <Smartphone className="w-4 h-4 text-[#4A6741]" />
              </div>
              <div>
                <p className="text-[13px] md:text-sm font-bold text-[#2D2D2A] mb-0.5">Sedang Menguji Coba Tampilan</p>
                <p className="text-[11px] md:text-xs text-[#7A7A72] leading-relaxed">Matikan untuk kembali ke kontrol penuh Admin.</p>
              </div>
            </div>
            <button 
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-[#4A6741] text-white text-xs font-bold rounded-xl hover:bg-[#3D5635] transition-colors cursor-pointer"
            >
              Kembali ke Admin
            </button>
          </div>
        </div>
      )}

      {/* Light-Themed PWA Guide Modal (No Dark Mode, No Native Alert) */}
      {showPwaGuideModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D2D2A]/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowPwaGuideModal(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[32px] p-6 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] text-center animate-in zoom-in-95 duration-200 text-[#2D2D2A] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowPwaGuideModal(false)}
              className="absolute top-4 right-4 p-2 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#4A6741]/10 border border-[#4A6741]/20 mx-auto flex items-center justify-center mb-4">
              <Smartphone className="w-7 h-7 text-[#4A6741]" />
            </div>

            <h3 className="text-lg font-bold text-[#2D2D2A] mb-1">
              Pasang FanraPay di Layar HP
            </h3>
            <p className="text-xs text-[#7A7A72] mb-5">
              Ikuti langkah mudah berikut sesuai jenis HP Anda:
            </p>

            <div className="space-y-3 text-left mb-6 text-xs">
              <div className="bg-[#F8F7F4] border border-[#E8E6E1] p-3.5 rounded-2xl">
                <p className="font-bold text-[#4A6741] mb-1.5 flex items-center gap-1.5">
                  <span>Untuk Android (Chrome / Browser):</span>
                </p>
                <p className="text-[#4A4A45] leading-relaxed">
                  1. Tekan tombol <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser.<br />
                  2. Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.
                </p>
              </div>

              <div className="bg-[#F8F7F4] border border-[#E8E6E1] p-3.5 rounded-2xl">
                <p className="font-bold text-[#4A6741] mb-1.5 flex items-center gap-1.5">
                  <span>Untuk iPhone / iPad (Safari):</span>
                </p>
                <p className="text-[#4A4A45] leading-relaxed">
                  1. Tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah layar Safari.<br />
                  2. Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPwaGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-[#4A6741] hover:bg-[#3D5635] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Share Modal (WhatsApp, Telegram, X, Copy Link) */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[32px] p-6 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center animate-in zoom-in-95 duration-200 text-[#2D2D2A] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#4A6741]/10 border border-[#4A6741]/20 mx-auto flex items-center justify-center mb-3.5">
              <Share2 className="w-7 h-7 text-[#4A6741]" />
            </div>

            <h3 className="text-lg font-bold text-[#2D2D2A] mb-1">
              Bagikan FanraPay
            </h3>
            <p className="text-xs text-[#7A7A72] mb-5">
              Ajak keluarga dan teman menggunakan aplikasi pencatatan keuangan & kalender akademik FanraPay.
            </p>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <button 
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#2D2D2A]">WhatsApp</span>
              </button>

              <button 
                onClick={handleShareTelegram}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 text-[#0088cc] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-sm">
                  <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
                </div>
                <span className="text-[11px] font-bold text-[#2D2D2A]">Telegram</span>
              </button>

              <button 
                onClick={handleShareTwitter}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/10 text-[#2D2D2A] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#2D2D2A] text-white flex items-center justify-center shadow-sm font-bold text-xs">
                  X
                </div>
                <span className="text-[11px] font-bold text-[#2D2D2A]">Twitter</span>
              </button>
            </div>

            {/* Link Copy Box */}
            <div className="flex items-center gap-2 p-2 bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl mb-4 text-left">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl()} 
                className="flex-1 bg-transparent px-2 text-xs font-mono text-[#7A7A72] truncate outline-none"
              />
              <button 
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5635] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShareLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 rounded-2xl bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#2D2D2A] font-bold text-xs transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      
      <div className="lg:col-span-2 text-center mt-4">
        <p className="text-[10px] md:text-xs text-[#7A7A72]/50 font-medium uppercase tracking-widest">
          by Irfan Rizki Aditri
        </p>
      </div>
    </div>
  );
}
