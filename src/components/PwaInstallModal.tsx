import React, { useState, useEffect } from 'react';
import { promptPwaInstall } from '../utils/pwa';

interface PwaInstallModalProps {
  isLoggedIn: boolean;
}

export default function PwaInstallModal({ isLoggedIn }: PwaInstallModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Only show if user is logged in with Google
    if (!isLoggedIn) return;

    // Check if already standalone or already shown
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );
    const hasBeenPrompted = localStorage.getItem('fanra_pwa_installed_or_dismissed') === 'true';

    if (!isStandalone && !hasBeenPrompted) {
      // Delay slightly for smooth transition
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Lock background scroll and interaction when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleInstallClick = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const res = await promptPwaInstall();

    if (res === 'unsupported' && isIos) {
      setShowIosGuide(true);
    } else {
      localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
      setIsOpen(false);
    }
  };

  const handleFinishIosGuide = () => {
    localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-md animate-in fade-in duration-300 touch-none select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[32px] p-6 md:p-7 border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-center animate-in zoom-in-95 duration-300 relative select-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-center">
          <img 
            src="https://cdn-icons-png.flaticon.com/128/10473/10473393.png" 
            alt="Fanra App" 
            className="w-14 h-14 object-contain drop-shadow-md"
          />
        </div>

        <h3 className="text-xl font-bold text-[#2D2D2A] mb-2 tracking-tight">
          Tambahkan ke Layar Utama
        </h3>

        {!showIosGuide ? (
          <>
            <p className="text-xs text-[#7A7A72] leading-relaxed mb-6 px-2">
              Pasang aplikasi Fanra di layar utama HP Anda untuk akses cepat satu ketukan dan tampilan layar penuh tanpa browser.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#4A6741] hover:bg-[#3D5635] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              Tambahkan ke Layar Utama
            </button>
          </>
        ) : (
          <>
            <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-black/5 text-left text-xs text-[#2D2D2A] space-y-2 mb-6">
              <p className="font-semibold text-[#4A6741]">Petunjuk di iPhone/iPad:</p>
              <p>1. Tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah Safari.</p>
              <p>2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama</strong>.</p>
            </div>

            <button
              onClick={handleFinishIosGuide}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#4A6741] hover:bg-[#3D5635] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              Saya Mengerti
            </button>
          </>
        )}
      </div>
    </div>
  );
}
