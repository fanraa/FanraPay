import React, { useState, useEffect } from 'react';
import { verifyBiometric } from '../utils/biometric';
import { Fingerprint, ScanFace } from 'lucide-react';

export default function PinEntry({ correctPin, onSuccess, faceId, fingerprintId }: { correctPin: string, onSuccess: () => void, faceId?: string | null, fingerprintId?: string | null }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Attempt biometric unlock on mount if enabled
    if (faceId) { handleFaceId(); } else if (fingerprintId) { handleFingerprint(); }
  }, []);

    const handleFaceId = async () => {
    if (!faceId) return;
    try {
      const isValid = await verifyBiometric(faceId);
      if (isValid) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFingerprint = async () => {
    if (!fingerprintId) return;
    try {
      const isValid = await verifyBiometric(fingerprintId);
      if (isValid) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        if (newPin === correctPin) {
          setSuccess(true);
          setTimeout(onSuccess, 400);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  return (
    <div className="fixed inset-0 z-[800] bg-gradient-to-br from-[#E2E1DC] via-[#F8F7F4] to-[#D9E0D3] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="https://cdn-icons-png.flaticon.com/128/10473/10473393.png" alt="Fanra Logo" className="w-14 h-14 drop-shadow-sm mb-2" />
        <h1 className="text-xl font-bold tracking-tight text-[#2D2D2A]">Fanra</h1>
      </div>
      
      <h2 className="text-2xl font-bold text-[#2D2D2A] mb-2">
        Masukkan PIN
      </h2>
      <p className="text-[#7A7A72] text-sm mb-8 text-center max-w-xs">
        Aplikasi terkunci. Silakan masukkan 6 angka PIN Anda.
      </p>

      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? (error ? 'bg-[#E63946] scale-110' : (success ? 'bg-[#4A6741] scale-125' : 'bg-[#4A6741] scale-110')) : 'bg-black/10 scale-100'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handlePress(num.toString())} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm">
            {num}
          </button>
        ))}
        {faceId || fingerprintId ? (
          <button 
            onClick={faceId ? handleFaceId : handleFingerprint} 
            className="w-16 h-16 rounded-full flex flex-col -space-y-1 items-center justify-center text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm opacity-80" 
            title={faceId && fingerprintId ? "Buka dengan Face ID / Sidik Jari" : faceId ? "Buka dengan Face ID" : "Buka dengan Sidik Jari"}
          >
            {faceId && <img src="https://cdn-icons-png.flaticon.com/128/8682/8682897.png" alt="Face ID" className="w-6 h-6 object-contain" style={{ filter: 'invert(37%) sepia(24%) saturate(836%) hue-rotate(68deg) brightness(94%) contrast(88%)' }} />}
            {!faceId && fingerprintId && <img src="https://cdn-icons-png.flaticon.com/128/9436/9436154.png" alt="Sidik Jari" className="w-6 h-6 object-contain" style={{ filter: 'invert(37%) sepia(24%) saturate(836%) hue-rotate(68deg) brightness(94%) contrast(88%)' }} />}
          </button>
        ) : (
          <div />
        )}
        <button onClick={() => handlePress('0')} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm">
          0
        </button>
        <button onClick={handleDelete} className="w-16 h-16 rounded-full flex items-center justify-center text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
        </button>
      </div>
    </div>
  );
}
