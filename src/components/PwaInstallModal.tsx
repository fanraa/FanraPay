import React, { useState, useEffect } from 'react';
import { promptPwaInstall, isAppInstalled } from '../utils/pwa';
import { Smartphone, CheckCircle2, Share, PlusSquare, MoreVertical, X } from 'lucide-react';

interface PwaInstallModalProps {
  isLoggedIn: boolean;
}

export default function PwaInstallModal({ isLoggedIn }: PwaInstallModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );
    const hasBeenPrompted = localStorage.getItem('fanra_pwa_installed_or_dismissed') === 'true';

    // Check device type
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    if (!isStandalone && !hasBeenPrompted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInstallClick = async () => {
    const res = await promptPwaInstall();
    if (res === 'unsupported') {
      setShowManualGuide(true);
    } else {
      localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D2D2A]/30 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[32px] p-6 md:p-7 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] text-center animate-in zoom-in-95 duration-300 relative text-[#2D2D2A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 text-[#7A7A72] hover:text-[#2D2D2A] hover:bg-black/5 rounded-full transition-all cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#4A6741]/10 border border-[#4A6741]/20 flex items-center justify-center shadow-sm">
            <img 
              src="/icons/icon-192.png" 
              alt="FanraPay App" 
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
          </div>
        </div>

        <h3 className="text-xl font-bold text-[#2D2D2A] mb-2 tracking-tight">
          Tambahkan ke Layar Utama
        </h3>

        {!showManualGuide ? (
          <>
            <p className="text-xs text-[#7A7A72] leading-relaxed mb-6 px-2">
              Pasang aplikasi FanraPay di layar beranda HP Anda untuk kemudahan akses satu ketukan dan tampilan layar penuh tanpa browser.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#4A6741] hover:bg-[#3D5635] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                Tambahkan Sekarang
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-[#E8E6E1] text-left text-xs text-[#2D2D2A] space-y-3 mb-6">
              <p className="font-bold text-[#4A6741] flex items-center gap-1.5 text-xs">
                {isIosDevice ? 'Petunjuk untuk iPhone / Safari:' : 'Petunjuk untuk Android / Chrome:'}
              </p>

              {isIosDevice ? (
                <div className="space-y-2 text-[#4A4A45]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E8E6E1] flex items-center justify-center font-bold text-[11px] shrink-0 text-[#4A6741]">1</span>
                    <p>Tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah Safari.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E8E6E1] flex items-center justify-center font-bold text-[11px] shrink-0 text-[#4A6741]">2</span>
                    <p>Pilih <strong>Tambahkan ke Layar Utama</strong>.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[#4A4A45]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E8E6E1] flex items-center justify-center font-bold text-[11px] shrink-0 text-[#4A6741]">1</span>
                    <p>Tekan menu <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E8E6E1] flex items-center justify-center font-bold text-[11px] shrink-0 text-[#4A6741]">2</span>
                    <p>Pilih <strong>Tambahkan ke Layar Utama</strong> atau <strong>Instal Aplikasi</strong>.</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#4A6741] hover:bg-[#3D5635] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Saya Mengerti
            </button>
          </>
        )}
      </div>
    </div>
  );
}
