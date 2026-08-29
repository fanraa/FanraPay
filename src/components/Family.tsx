import React, { useState } from 'react';
import { loginWithGoogle, logout } from '../lib/firebase';
import { User } from 'firebase/auth';
import { Users, Shield, Lock, Smartphone, Fingerprint, ScanFace, LogOut, CheckCircle2, Eye, Bell, KeyRound, Download, Check } from 'lucide-react';
import { isBiometricSupported, registerBiometric } from '../utils/biometric';
import { promptPwaInstall } from '../utils/pwa';

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

  const handleGoogleLogin = async () => {
    try {
      if (currentUser) {
        await logout();
      } else {
        await loginWithGoogle();
      }
    } catch (error) {
      alert("Gagal melakukan login Google. Pastikan popup tidak diblokir oleh browser.");
    }
  };

  const handleToggleFaceId = async () => {
    if (!isAdmin) {
      alert("Pengaturan keamanan biometrik hanya tersedia untuk Admin.");
      return;
    }
    if (!isBiometricSupported()) {
      alert("Perangkat atau browser Anda tidak mendukung fitur Face ID.");
      return;
    }
    if (faceId) {
      setFaceId(null);
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFaceId(newId);
          alert("Face ID berhasil didaftarkan!");
        } else {
          alert("Gagal mendaftarkan Face ID. Buka aplikasi di Tab Baru (ikon ↗ di pojok atas).");
        }
      } catch (err: any) {
        if (err.message && err.message.includes('publickey-credentials-create')) {
          alert("Face ID tidak bisa diaktifkan di mode pratinjau iframe. BUKA DI TAB BARU (klik ikon panah ↗ di pojok kanan atas).");
        } else {
          alert("Terjadi kesalahan saat mendaftarkan Face ID.");
        }
      }
    }
  };

  const handleToggleFingerprint = async () => {
    if (!isAdmin) {
      alert("Pengaturan keamanan biometrik hanya tersedia untuk Admin.");
      return;
    }
    if (!isBiometricSupported()) {
      alert("Perangkat atau browser Anda tidak mendukung fitur Sidik Jari.");
      return;
    }
    if (fingerprintId) {
      setFingerprintId(null);
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFingerprintId(newId);
          alert("Sidik Jari berhasil didaftarkan!");
        } else {
          alert("Gagal mendaftarkan Sidik Jari. Buka aplikasi di Tab Baru (ikon ↗ di pojok atas).");
        }
      } catch (err: any) {
        if (err.message && err.message.includes('publickey-credentials-create')) {
          alert("Sidik Jari tidak bisa diaktifkan di mode pratinjau iframe. BUKA DI TAB BARU (klik ikon panah ↗ di pojok kanan atas).");
        } else {
          alert("Terjadi kesalahan saat mendaftarkan Sidik Jari.");
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0">
      
      {/* 1. Status Akun & Autentikasi Google */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img src="https://cdn-icons-png.flaticon.com/128/16133/16133885.png" alt="Akses Akun" className="w-6 h-6 object-contain" />
              <h2 className="font-bold text-xl text-[#2D2D2A]">Akses & Akun</h2>
            </div>
            {isAdmin && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#4A6741]/10 text-[#4A6741] border border-[#4A6741]/20">
                Admin
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="bg-[#4A6741]/10 border border-[#4A6741]/20 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-2 text-[#4A6741] font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" /> Admin Terverifikasi
              </div>
              <p className="text-xs text-[#2D2D2A] font-medium">{currentUser?.email}</p>
              <p className="text-[11px] text-[#7A7A72] mt-1.5 leading-relaxed">
                Anda memiliki akses penuh untuk mengelola transaksi, keuangan, dan pengaturan keamanan.
              </p>
            </div>
          ) : currentUser ? (
            <div className="bg-white/70 border border-[#E8E6E1] rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-2 text-[#2D2D2A] font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#4A6741]" /> Akun Google Terhubung
              </div>
              <p className="text-xs text-[#2D2D2A] font-medium">{currentUser.email}</p>
              <p className="text-[11px] text-[#7A7A72] mt-1.5 leading-relaxed">
                Akun Anda terhubung dengan aplikasi Fanra untuk pemantauan data keluarga secara real-time.
              </p>
            </div>
          ) : (
            <div className="bg-[#F0EFEC]/60 border border-[#E8E6E1] rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold text-[#2D2D2A] mb-1">Masuk dengan Akun Google</p>
              <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                Hubungkan dengan akun Google Anda untuk mengakses data keuangan keluarga secara langsung.
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={handleGoogleLogin}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-sm ${
            currentUser 
              ? 'bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#E63946] border border-[#E8E6E1]' 
              : 'bg-white hover:bg-[#F8F7F4] border border-[#E8E6E1] text-[#2D2D2A]'
          }`}
        >
          {currentUser ? (
            <>
              <LogOut className="w-4 h-4" /> Keluar ({currentUser.email?.split('@')[0]})
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login dengan Akun Google
            </>
          )}
        </button>
      </div>

      {/* 2. Pengaturan Notifikasi & Preferensi (1 Box Bersih, Tanpa Redundan Icon) */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://cdn-icons-png.flaticon.com/128/9821/9821144.png" 
              alt="Notifikasi" 
              className="w-6 h-6 object-contain" 
            />
            <h3 className="font-bold text-xl text-[#2D2D2A]">
              {isAdmin ? 'Notifikasi & Privasi' : 'Notifikasi HP'}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Item 1: Notifikasi Transaksi */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Pemberitahuan Transaksi</p>
                <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                  Tampilkan notifikasi di atas layar HP saat ada pencatatan pengeluaran atau pemasukan baru.
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

            {/* Item: Pasang Aplikasi ke Layar Utama HP */}
            <div className="h-px bg-black/[0.06] my-1" />
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Aplikasi di Layar HP</p>
                <p className="text-[11px] text-[#7A7A72] leading-relaxed">
                  Tambahkan Fanra ke layar utama HP untuk akses cepat satu ketukan.
                </p>
              </div>
              <button 
                onClick={async () => {
                  const res = await promptPwaInstall();
                  if (res === 'unsupported') {
                    alert("Untuk iPhone/iPad: Tekan ikon Bagikan (Share) di Safari lalu pilih 'Tambahkan ke Layar Utama'.\n\nUntuk Android: Buka menu Chrome (titik 3) lalu pilih 'Tambahkan ke Layar Utama' / 'Instal Aplikasi'.");
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5635] text-white text-xs font-semibold shrink-0 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Pasang
              </button>
            </div>

            {isAdmin && (
              <>
                <div className="h-px bg-black/[0.06] my-1" />

                {/* Item 2: Mode Privat (Admin Only) */}
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

                {/* Item 3: Uji Coba Tampilan (Admin Only) */}
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
        <div className="lg:col-span-2 bg-[#2D2D2A] p-4 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between p-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-white/10 p-2 rounded-full shrink-0">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] md:text-sm font-bold text-white mb-0.5">Sedang Menguji Coba Tampilan</p>
                <p className="text-[11px] md:text-xs text-white/70 leading-relaxed">Matikan untuk kembali ke kontrol penuh Admin.</p>
              </div>
            </div>
            <button 
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-[#4A6741] text-white text-xs font-bold rounded-xl hover:bg-[#3d5535] transition-colors"
            >
              Kembali ke Admin
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

