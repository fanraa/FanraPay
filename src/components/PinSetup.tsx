import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PinSetup({ onComplete, onCancel }: { onComplete: (pin: string) => void, onCancel: () => void }) {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePress = (num: string) => {
    if (step === 1) {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep(2), 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          if (newConfirm === pin) {
            setSuccess(true);
            setTimeout(() => onComplete(pin), 400);
          } else {
            setError(true);
            setTimeout(() => {
              setConfirmPin('');
              setError(false);
            }, 600);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 1) setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
  };

  const dots = step === 1 ? pin : confirmPin;

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
      <button onClick={onCancel} className="absolute top-6 left-6 p-3 bg-white/60 rounded-full hover:bg-white transition-colors">
        <ArrowLeft className="w-6 h-6 text-[#2D2D2A]" />
      </button>
      
      <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-sm mb-6 border border-white/60 p-2">
        <div className="w-12 h-12 bg-[#4A6741]/10 rounded-full flex items-center justify-center">
          <img src="https://cdn-icons-png.flaticon.com/128/9506/9506896.png" alt="PIN Lock" className="w-6 h-6 object-contain" style={{ filter: 'invert(37%) sepia(24%) saturate(836%) hue-rotate(68deg) brightness(94%) contrast(88%)' }} />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-[#2D2D2A] mb-2">
        {step === 1 ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
      </h2>
      <p className="text-[#7A7A72] text-sm mb-8 text-center max-w-xs">
        {step === 1 ? 'Masukkan 6 angka PIN untuk mengamankan aplikasi di perangkat ini.' : 'Masukkan kembali 6 angka PIN yang baru saja Anda buat.'}
      </p>

      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < dots.length ? (error ? 'bg-[#E63946] scale-110' : (success && step === 2 ? 'bg-[#4A6741] scale-125' : 'bg-[#4A6741] scale-110')) : 'bg-black/10 scale-100'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handlePress(num.toString())} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm">
            {num}
          </button>
        ))}
        <div />
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
