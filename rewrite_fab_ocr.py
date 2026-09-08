import os

content = """
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowDownRight, ArrowUpRight, X, Camera, FileImage, ChevronLeft, Zap, Image as ImageIcon, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Transaction } from '../types';

interface FloatingActionButtonProps {
  onAddTransaction: (t: Transaction) => void;
  previewMode: boolean;
  activeTab?: string;
}

function LiveScanner({ onCapture, onGallery, onClose, loading }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(e => console.error(e));
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleFlash = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch !== undefined) {
        track.applyConstraints({
          advanced: [{ torch: !flashOn } as any]
        });
        setFlashOn(!flashOn);
      }
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#1E1E1E] flex flex-col"
    >
      <div className="flex items-center gap-4 p-5 text-white z-20">
        <button onClick={onClose} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-[17px] font-bold">Scan Struk</h2>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Target Box with huge box-shadow for dark overlay */}
        <div className="relative z-10 w-[280px] h-[280px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-sm">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF6B00] -translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF6B00] translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF6B00] -translate-x-[2px] translate-y-[2px]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF6B00] translate-x-[2px] translate-y-[2px]" />
        </div>
        
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1E1E1E]/80 backdrop-blur-sm text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#FF6B00]" />
          </div>
        )}
      </div>

      <div className="bg-[#1E1E1E] p-8 pb-12 flex items-center justify-between z-20">
        <button onClick={toggleFlash} className="flex flex-col items-center gap-2 text-white/80 hover:text-white w-16">
          <Zap className={`w-6 h-6 ${flashOn ? 'text-yellow-400 fill-yellow-400' : ''}`} />
          <span className="text-[11px] font-medium">Flash</span>
        </button>
        
        <button onClick={captureFrame} className="w-[72px] h-[72px] rounded-full border-[3px] border-white/80 flex items-center justify-center">
          <div className="w-[56px] h-[56px] bg-white rounded-full active:scale-90 transition-transform" />
        </button>
        
        <button onClick={onGallery} className="flex flex-col items-center gap-2 text-white/80 hover:text-white w-16">
          <ImageIcon className="w-6 h-6" />
          <span className="text-[11px] font-medium">Galeri</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function FloatingActionButton({ onAddTransaction, previewMode, activeTab }: FloatingActionButtonProps) {
  const [active, setActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState<'pemasukan' | 'pengeluaran' | 'scan'>('pengeluaran');

  if (activeTab && activeTab !== 'dashboard') return null;

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[50]"
            onClick={() => setActive(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex flex-col items-end gap-2.5 pointer-events-auto origin-bottom mb-1"
            >
              <button
                onClick={() => { setActive(false); setDefaultType('scan'); setShowModal(true); }}
                className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-full shadow-md hover:bg-gray-50 border border-black/5 text-[#4A6741] font-bold text-[13px] whitespace-nowrap"
              >
                Scan Struk
                <div className="w-6 h-6 rounded-full bg-[#4A6741]/10 flex items-center justify-center">
                  <img src="https://cdn-icons-png.flaticon.com/128/16702/16702887.png" alt="Scan" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(16%) saturate(1661%) hue-rotate(63deg) brightness(97%) contrast(89%)' }} />
                </div>
              </button>
              <button
                onClick={() => { setActive(false); setDefaultType('pengeluaran'); setShowModal(true); }}
                className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-full shadow-md hover:bg-gray-50 border border-black/5 text-[#E63946] font-bold text-[13px] whitespace-nowrap"
              >
                Pengeluaran
                <div className="w-6 h-6 rounded-full bg-[#E63946]/10 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} /> 
                </div>
              </button>
              <button
                onClick={() => { setActive(false); setDefaultType('pemasukan'); setShowModal(true); }}
                className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-full shadow-md hover:bg-gray-50 border border-black/5 text-[#4A6741] font-bold text-[13px] whitespace-nowrap"
              >
                Pemasukan
                <div className="w-6 h-6 rounded-full bg-[#4A6741]/10 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} /> 
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-[#4A6741] hover:bg-[#3A5333] transition-colors shadow-lg shadow-[#4A6741]/30 z-10 text-white flex-shrink-0 pointer-events-auto"
          onClick={() => setActive(!active)}
          animate={{ rotate: active ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <QuickAddModal 
            defaultType={defaultType} 
            onClose={() => setShowModal(false)} 
            onAddTransaction={onAddTransaction} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function QuickAddModal({ defaultType, onClose, onAddTransaction }: { defaultType: 'pemasukan'|'pengeluaran'|'scan', onClose: () => void, onAddTransaction: (t: Transaction) => void }) {
  const [type, setType] = useState<'pemasukan'|'pengeluaran'>(defaultType === 'scan' ? 'pengeluaran' : defaultType);
  const [isScanningMode, setIsScanningMode] = useState(defaultType === 'scan');
  const [ocrLoading, setOcrLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
  const [photo, setPhoto] = useState<string>();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const PENGELUARAN_CATEGORIES = ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Donasi', 'Lainnya'];
  const PEMASUKAN_CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Pemberian', 'Penjualan', 'Lainnya'];

  const performOCR = async (imageSrc: string) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'ind+eng');
      const lines = text.split('\\n').map(l => l.trim().toUpperCase());
      
      let maxAmount = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Pintar: Cari keyword indikasi harga total
        if (/(TOTAL|CASH|TUNAI|BAYAR|NETTO|JUMLAH|HARGA|KEMBALI)/.test(line)) {
          const nums = line.match(/\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
          if (nums) {
            nums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 100000000) maxAmount = clean;
            });
          }
          // Cek juga baris di bawahnya barangkali harganya di bawah kata TOTAL
          if (i + 1 < lines.length) {
            const nextNums = lines[i+1].match(/\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
            if (nextNums) {
              nextNums.forEach(n => {
                const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
                if (clean > maxAmount && clean < 100000000) maxAmount = clean;
              });
            }
          }
        }
      }

      let foundDate = date;
      // Pintar: Cari format dd/mm/yy atau dd-mm-yyyy atau yyyy/mm/dd
      const dateMatch = text.match(/\\b(\\d{1,4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,4})\\b/);
      if (dateMatch) {
        let d = dateMatch[1];
        let m = dateMatch[2];
        let y = dateMatch[3];
        if (d.length === 4) { y = d; d = dateMatch[3]; } // yyyy-mm-dd
        d = d.padStart(2, '0');
        m = m.padStart(2, '0');
        if (y.length === 2) y = '20' + y;
        foundDate = `${y}-${m}-${d}`;
      }

      let foundTime = time;
      const timeMatch = text.match(/\\b(\\d{1,2}):(\\d{2})(?::\\d{2})?\\b/);
      if (timeMatch) {
        let h = timeMatch[1].padStart(2, '0');
        foundTime = `${h}:${timeMatch[2]}`;
      }

      const lowerText = text.toLowerCase();
      let foundCategory = 'Lainnya';
      let foundNote = '';
      
      // Pintar: Kategorisasi otomatis berdasarkan keyword brand / barang
      if (/indomaret|alfamart|superindo|transmart|hypermart|yogya|midi|belanja|minimarket|toko|mart|hero|lotte/.test(lowerText)) {
        foundCategory = 'Belanja';
        if (lowerText.includes('indomaret')) foundNote = 'Indomaret';
        else if (lowerText.includes('alfamart')) foundNote = 'Alfamart';
        else foundNote = 'Minimarket';
      } else if (/kopi|cafe|nasi|ayam|restoran|makan|minum|warung|teh|food|drink|resto|kitchen|bakso|soto|mie|starbucks|kfc|mcd/.test(lowerText)) {
        foundCategory = 'Makanan & Minuman';
        foundNote = 'Makan/Minum';
      } else if (/gojek|grab|maxim|tol|parkir|bensin|spbu|pertamina|shell|tiket|kereta|kai|pesawat/.test(lowerText)) {
        foundCategory = 'Transportasi';
        if (lowerText.includes('gojek')) foundNote = 'Gojek';
        else if (lowerText.includes('grab')) foundNote = 'Grab';
        else if (lowerText.includes('spbu') || lowerText.includes('pertamina')) foundNote = 'Bensin';
        else foundNote = 'Transportasi';
      } else if (/apotek|kimia farma|k24|rumah sakit|klinik|obat/.test(lowerText)) {
        foundCategory = 'Kesehatan';
        foundNote = 'Kesehatan / Obat';
      } else if (/pln|pdam|telkomsel|indosat|xl|tagihan|internet|wifi/.test(lowerText)) {
        foundCategory = 'Tagihan';
        foundNote = 'Tagihan Bulanan';
      }

      // Pastikan kalau gagal nyari TOTAL spesifik, cari angka terbesar di seluruh struk yang wajar
      if (maxAmount === 0) {
        const allNums = text.match(/\\d{2,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
        if (allNums) {
           allNums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 5000000) maxAmount = clean;
           });
        }
      }

      if (maxAmount > 0) {
        setAmount(maxAmount.toString());
        setDisplayAmount(maxAmount.toLocaleString('id-ID'));
      }
      if (!isNaN(Date.parse(foundDate))) setDate(foundDate);
      setTime(foundTime);
      setCategory(foundCategory);
      if (foundNote) setNote(foundNote);
      
      setPhoto(imageSrc);
      setIsScanningMode(false);
    } catch (error) {
      console.error(error);
      setIsScanningMode(false);
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isScanningMode) {
          performOCR(reader.result as string);
        } else {
          setPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val) {
      setAmount(val);
      setDisplayAmount(Number(val).toLocaleString('id-ID'));
    } else {
      setAmount('');
      setDisplayAmount('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    const transaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: Number(amount),
      category,
      note,
      date,
      time
    };
    if (photo) transaction.photo = photo;
    onAddTransaction(transaction);
    onClose();
  };

  if (isScanningMode) {
    return (
      <>
        <LiveScanner 
          loading={ocrLoading}
          onClose={() => setIsScanningMode(false)}
          onCapture={(dataUrl: string) => performOCR(dataUrl)}
          onGallery={() => fileInputRef.current?.click()}
        />
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
      </>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-[24px] w-full max-w-[360px] p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-[#7A7A72] hover:bg-black/5 p-1 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-[17px] font-bold text-[#2D2D2A] mb-5 flex items-center gap-2">
          {type === 'pemasukan' ? (
            <><ArrowDownRight className="w-5 h-5 text-[#4A6741]" /> Tambah Pemasukan</>
          ) : (
            <><ArrowUpRight className="w-5 h-5 text-[#E63946]" /> Tambah Pengeluaran</>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Nominal</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold text-[#7A7A72]">
                Rp
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                required
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full bg-white border border-[#E8E6E1] focus:border-[#4A6741] focus:ring-[#4A6741] rounded-xl pl-9 pr-3 py-2.5 text-[#2D2D2A] font-bold text-base focus:outline-none focus:ring-1 transition-all shadow-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {(type === 'pemasukan' ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${category === cat ? (type === 'pemasukan' ? 'bg-[#4A6741] text-white border-[#4A6741] shadow-sm' : 'bg-[#E63946] text-white border-[#E63946] shadow-sm') : 'bg-white border-[#E8E6E1] text-[#7A7A72] hover:bg-black/5 hover:border-black/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Tanggal</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-[#E8E6E1] focus:border-[#4A6741] focus:ring-[#4A6741] rounded-xl px-3 py-2 text-[#2D2D2A] font-medium text-xs focus:outline-none focus:ring-1 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Waktu</label>
              <input 
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-white border border-[#E8E6E1] focus:border-[#4A6741] focus:ring-[#4A6741] rounded-xl px-3 py-2 text-[#2D2D2A] font-medium text-xs focus:outline-none focus:ring-1 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Catatan</label>
            <input 
              type="text" 
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-white border border-[#E8E6E1] focus:border-[#4A6741] focus:ring-[#4A6741] rounded-xl px-3 py-2.5 text-[#2D2D2A] font-medium text-xs focus:outline-none focus:ring-1 transition-all shadow-sm mb-2"
              placeholder="Opsional"
            />
            
            {!photo ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 bg-[#F0EFEC]/50 hover:bg-[#F0EFEC] border border-[#E8E6E1] border-dashed rounded-xl py-2 text-[#7A7A72] text-[11px] font-semibold transition-all">
                  <FileImage className="w-3.5 h-3.5" /> Foto
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 bg-[#F0EFEC]/50 hover:bg-[#F0EFEC] border border-[#E8E6E1] border-dashed rounded-xl py-2 text-[#7A7A72] text-[11px] font-semibold transition-all">
                  <Camera className="w-3.5 h-3.5" /> Kamera
                </button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
            ) : (
              <div className="relative inline-block mt-2">
                <img src={photo} alt="Bukti" className="h-16 w-16 object-cover rounded-xl border border-black/10" />
                <button type="button" onClick={() => setPhoto(undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={!amount || !category || !date}
              className={`w-full py-3 rounded-xl text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-md ${!amount || !category || !date ? 'bg-[#7A7A72]/50 cursor-not-allowed shadow-none' : (type === 'pemasukan' ? 'bg-[#4A6741] hover:bg-[#3d5535] shadow-[#4A6741]/30' : 'bg-[#E63946] hover:bg-[#c92a37] shadow-[#E63946]/30')}`}
            >
              Simpan {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
"""
with open('src/components/FloatingActionButton.tsx', 'w') as f:
    f.write(content)
