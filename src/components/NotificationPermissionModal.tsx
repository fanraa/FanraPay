import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface NotificationPermissionModalProps {
  showNotifications: boolean;
  onPermissionChange: (granted: boolean) => void;
}

export default function NotificationPermissionModal({ 
  showNotifications, 
  onPermissionChange 
}: NotificationPermissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isIgnoredThisSession = sessionStorage.getItem('fanra_notif_ignored_session') === 'true';

    // Show popup if notifications are not enabled and hasn't been ignored in current session
    if (!showNotifications && !isIgnoredThisSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [showNotifications]);

  // Lock background scrolling and interaction when modal is open
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

  const handleRequestPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }

    sessionStorage.removeItem('fanra_notif_ignored_session');
    onPermissionChange(true);
    setIsOpen(false);
  };

  const handleIgnore = () => {
    sessionStorage.setItem('fanra_notif_ignored_session', 'true');
    onPermissionChange(false);
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
            src="https://cdn-icons-png.flaticon.com/128/9821/9821144.png" 
            alt="Notifikasi" 
            className="w-12 h-12 object-contain drop-shadow-sm"
          />
        </div>

        <h3 className="text-lg font-bold text-[#2D2D2A] mb-1.5">
          Aktifkan Notifikasi
        </h3>

        <p className="text-xs text-[#7A7A72] leading-relaxed mb-6 px-2">
          Dapatkan pemberitahuan langsung di layar atas HP saat ada transaksi atau pengeluaran baru yang dicatat.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleRequestPermission}
            className="w-full bg-[#4A6741] hover:bg-[#3d5535] text-white py-3 rounded-2xl text-xs md:text-sm font-bold shadow-md shadow-[#4A6741]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Izinkan Notifikasi
          </button>

          <button
            onClick={handleIgnore}
            className="w-full bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#7A7A72] hover:text-[#2D2D2A] py-2.5 rounded-2xl text-xs font-semibold transition-colors"
          >
            Abaikan
          </button>
        </div>
      </div>
    </div>
  );
}

