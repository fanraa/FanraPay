import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { Plus, X, ArrowDownRight, ArrowUpRight, Save, Calendar, Tag, FileText, Inbox, Camera, Clock, Info, Trash2, Image as ImageIcon, Search, ArrowUp, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TransactionsProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  previewMode?: boolean;
  showHistory?: boolean;
  privateMode?: boolean;
  isReconnecting?: boolean;
}

export default function Transactions({ transactions, onAddTransaction, onDeleteTransaction, previewMode = false, showHistory = true, privateMode = false, isReconnecting = false }: TransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<TransactionType>('pengeluaran');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [photo, setPhoto] = useState<string | undefined>();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [selectedChartYear, setSelectedChartYear] = useState(new Date().getFullYear());
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Load more if near bottom
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        setVisibleCount(prev => prev + 15);
      }
      // Show/hide scroll to top button
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemovePhoto = () => {
    setPhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const predefinedCategories = type === 'pengeluaran' 
    ? ['Makanan & Minuman', 'Transportasi', 'Belanja Harian', 'Tagihan & Utilitas', 'Hiburan', 'Kesehatan', 'Edukasi', 'Rumah Tangga', 'Pakaian', 'Olahraga', 'Perawatan Diri', 'Cicilan', 'Donasi', 'Lainnya']
    : ['Gaji Bulanan', 'Bonus', 'Investasi', 'Hadiah', 'Bisnis', 'Pencairan Dana', 'Lainnya'];

  const filteredCategories = predefinedCategories.filter(c => c.toLowerCase().includes(category.toLowerCase()));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Hanya simpan angka
    if (val.length <= 15) { // Batas maksimal digit
      setAmount(val);
    }
  };

  const displayAmount = amount ? Number(amount).toLocaleString('id-ID') : '';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Kompres ukuran maksimum

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Simpan sebagai JPEG kualitas 60% agar ukuran file jadi sangat kecil
          setPhoto(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const currentBalance = transactions.reduce((acc, t) => {
    return t.type === 'pemasukan' ? acc + t.amount : acc - t.amount;
  }, 0);

  const numericAmount = Number(amount);
  const isInsufficientBalance = type === 'pengeluaran' && numericAmount > currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date || isInsufficientBalance) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: Number(amount),
      category,
      note,
      date,
      time
    };

    if (photo) {
      transaction.photo = photo;
    }

    onAddTransaction(transaction);

    setAmount('');
    setCategory('');
    setNote('');
    setPhoto(undefined);
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const formattedSearchQuery = searchQuery.toLowerCase();
  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
    const isYearMatch = new Date(t.date).getFullYear().toString() === formattedSearchQuery;
    return dateStr.includes(formattedSearchQuery) || 
           t.category.toLowerCase().includes(formattedSearchQuery) || 
           (t.note && t.note.toLowerCase().includes(formattedSearchQuery)) ||
           isYearMatch;
  });

  const sortedFilteredTx = [...filteredTransactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.time && b.time) return b.time.localeCompare(a.time);
    return Number(b.id) - Number(a.id);
  });

  const visibleTx = sortedFilteredTx.slice(0, visibleCount);

  const groupedTransactions = visibleTx.reduce((acc, t) => {
    const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartData = monthNames.map((name) => ({
    date: name,
    Pemasukan: 0,
    Pengeluaran: 0
  }));

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === selectedChartYear) {
      const m = d.getMonth();
      if (t.type === 'pemasukan') chartData[m].Pemasukan += t.amount;
      else chartData[m].Pengeluaran += t.amount;
    }
  });

  const availableYears = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear()))).sort((a, b) => b - a);
  if (!availableYears.includes(selectedChartYear)) {
    availableYears.push(selectedChartYear);
    availableYears.sort((a, b) => b - a);
  }

  return (
    <div className="pb-20 md:pb-0 relative">
      <div className="flex justify-between items-center px-1 mb-6 relative z-30">
        <h2 className="font-bold text-xl text-[#2D2D2A]">Manajemen Transaksi</h2>
        {!previewMode && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="lg:hidden bg-[#4A6741] hover:bg-[#3d5535] text-white px-4 py-2 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#4A674122] flex items-center gap-1.5"
          >
            {isAdding ? <><X className="w-4 h-4" /> Tutup</> : <><Plus className="w-4 h-4" /> Tambah</>}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 mb-6">
        {!previewMode && (
          <div className={`lg:col-span-5 ${isAdding ? 'block animate-in fade-in slide-in-from-top-4 duration-300' : 'hidden lg:block'}`}>
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-4 md:p-5 rounded-[24px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-3.5 transition-all h-full">
            <div className="flex gap-2 mb-1 p-1 bg-[#F0EFEC]/50 rounded-2xl">
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${type === 'pengeluaran' ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20' : 'text-[#7A7A72] hover:bg-white/50'}`}
                onClick={() => setType('pengeluaran')}
              >
                <ArrowDownRight className="w-3.5 h-3.5" /> Pengeluaran
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${type === 'pemasukan' ? 'bg-[#4A6741] text-white shadow-md shadow-[#4A6741]/20' : 'text-[#7A7A72] hover:bg-white/50'}`}
                onClick={() => setType('pemasukan')}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Pemasukan
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Nominal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold text-[#7A7A72] text-sm">
                    Rp
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required
                    value={displayAmount}
                    onChange={handleAmountChange}
                    className={`w-full bg-white border ${isInsufficientBalance ? 'border-[#E63946] focus:border-[#E63946] focus:ring-[#E63946]' : 'border-[#E8E6E1] focus:border-[#4A6741] focus:ring-[#4A6741]'} rounded-xl pl-8 pr-3 py-2 text-[#2D2D2A] text-sm font-semibold focus:outline-none focus:ring-1 transition-all shadow-sm`}
                    placeholder="0"
                  />
                </div>
                {isInsufficientBalance && (
                  <p className="text-[#E63946] text-[10px] font-bold mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Saldo tidak cukup (Sisa: Rp {currentBalance.toLocaleString('id-ID')})
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Kategori</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-3.5 h-3.5 text-[#7A7A72]" />
                  </div>
                  <input 
                    type="text" 
                    required
                    maxLength={40}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onFocus={() => setIsCategoryFocused(true)}
                    onBlur={() => setTimeout(() => setIsCategoryFocused(false), 200)}
                    className="w-full bg-white border border-[#E8E6E1] rounded-xl pl-8 pr-3 py-2 text-[#2D2D2A] text-sm font-medium focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] transition-all shadow-sm"
                    placeholder="Ketik atau pilih kategori"
                  />
                </div>
                {isCategoryFocused && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white/95 backdrop-blur-xl border border-[#E8E6E1] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] max-h-56 overflow-y-auto custom-scrollbar py-1.5">
                    {filteredCategories.map(c => (
                      <div 
                        key={c} 
                        className="px-4 py-2 text-sm text-[#2D2D2A] hover:bg-[#F0EFEC] cursor-pointer font-medium transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCategory(c);
                          setIsCategoryFocused(false);
                        }}
                      >
                        {c}
                      </div>
                    ))}
                    {filteredCategories.length === 0 && (
                       <div className="px-4 py-2 text-sm text-[#7A7A72] italic">Ketuk Simpan untuk kategori baru</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Catatan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-3.5 h-3.5 text-[#7A7A72]" />
                  </div>
                  <input 
                    type="text" 
                    maxLength={80}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white border border-[#E8E6E1] rounded-xl pl-8 pr-3 py-2 text-[#2D2D2A] text-sm font-medium focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] transition-all shadow-sm"
                    placeholder="Catatan opsional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Tanggal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-3.5 h-3.5 text-[#7A7A72]" />
                    </div>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-[#E8E6E1] rounded-xl pl-8 pr-3 py-2 text-[#2D2D2A] text-sm font-medium focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] transition-all shadow-sm appearance-none"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Waktu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="w-3.5 h-3.5 text-[#7A7A72]" />
                    </div>
                    <input 
                      type="time" 
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-white border border-[#E8E6E1] rounded-xl pl-8 pr-3 py-2 text-[#2D2D2A] text-sm font-medium focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] transition-all shadow-sm appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-[#7A7A72] uppercase tracking-wider mb-1">Foto Bukti (Opsional)</label>
                
                {!photo ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#E8E6E1] rounded-xl py-2 text-[#2D2D2A] text-xs font-semibold hover:bg-[#F0EFEC] transition-colors shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-[#7A7A72]" /> Kamera
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#E8E6E1] rounded-xl py-2 text-[#2D2D2A] text-xs font-semibold hover:bg-[#F0EFEC] transition-colors shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5 text-[#7A7A72]" /> Galeri
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 relative inline-block">
                    <img src={photo} alt="Preview" className="h-16 rounded-xl border border-[#E8E6E1] shadow-sm object-cover" />
                    <button type="button" onClick={handleRemovePhoto} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-[#E8E6E1] text-[#E63946] hover:bg-[#F0EFEC] transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isInsufficientBalance || isReconnecting}
              className={`w-full text-white text-xs font-bold py-2.5 rounded-xl mt-2 flex items-center justify-center gap-1.5 shadow-lg transition-colors ${isInsufficientBalance ? 'bg-[#E8E6E1] text-[#7A7A72] cursor-not-allowed shadow-none' : (isReconnecting ? 'bg-[#4A6741]/50 text-white cursor-wait shadow-none' : 'bg-[#4A6741] shadow-[#4A674122] hover:bg-[#3d5535]')}`}
            >
              {isReconnecting ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyinkronkan...</> : <><Save className="w-3.5 h-3.5" /> Simpan Transaksi</>}
            </button>
          </form>
        </div>
        )}

      {/* Bar Chart Section */}
      <div className={`${previewMode ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white/60 backdrop-blur-xl p-5 md:p-6 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col h-full`}>
        <div className="flex items-center justify-between mb-6 relative z-20">
          <h3 className="font-bold text-base text-[#2D2D2A]">Grafik Transaksi Tahunan</h3>
          <div className="relative">
            <button 
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center gap-1.5 text-[11px] bg-[#4A6741]/10 text-[#4A6741] font-bold rounded-full px-3 py-1.5 transition-colors hover:bg-[#4A6741]/20 outline-none"
            >
              Tahun {selectedChartYear}
              <svg className={`w-3 h-3 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {isYearDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsYearDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-28 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-2 max-h-56 overflow-y-auto z-40 custom-scrollbar">
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedChartYear(y);
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[11px] font-medium transition-colors outline-none ${selectedChartYear === y ? 'bg-[#4A6741]/10 text-[#4A6741] font-bold' : 'text-[#7A7A72] hover:bg-[#F0EFEC]'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        {chartData.some(d => d.Pemasukan > 0 || d.Pengeluaran > 0) ? (
          <div className="w-full -ml-2 outline-none select-none [&_*]:outline-none [&_*]:focus:outline-none" style={{ width: '100%', minWidth: 200, height: 224, minHeight: 224, WebkitTapHighlightColor: 'transparent' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} className="outline-none">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} className="outline-none">
                <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E8E6E1" />
                <XAxis 
                  dataKey="date" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#7A7A72' }} 
                  dy={10} 
                  minTickGap={10}
                />
                <YAxis 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#7A7A72' }}
                  tickFormatter={(value) => (previewMode && privateMode) ? '***' : (value >= 1000000 ? `${(value / 1000000).toFixed(1)}jt` : value >= 1000 ? `${value / 1000}k` : value)}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#F8F7F4' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '16px',
                    border: '1px solid #E8E6E1',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    padding: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                  formatter={(value: number) => [(previewMode && privateMode) ? '***' : `Rp ${value.toLocaleString('id-ID')}`, undefined]}
                />
                <Bar dataKey="Pemasukan" fill="#4A6741" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Pengeluaran" fill="#E63946" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-[#7A7A72]">
            <Inbox className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs font-medium">Tidak ada data untuk tahun {selectedChartYear}</p>
          </div>
        )}
      </div>
      </div>
      
      {(!previewMode || showHistory) ? (
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        <div className="px-5 md:px-6 py-4 border-b border-[#F0EFEC]/80 bg-white/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-[#2D2D2A] whitespace-nowrap">Riwayat Transaksi</h3>
          <div className="relative w-full md:max-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-[#7A7A72]" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Agustus, 29, Gaji..."
              className="w-full bg-white border border-[#E8E6E1] rounded-xl pl-8 pr-3 py-1.5 text-[#2D2D2A] text-xs font-medium focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="px-5 md:px-6 py-2">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
            <Inbox className="w-12 h-12 text-[#7A7A72] mb-3" />
            <p className="text-[#7A7A72] text-sm font-medium">{searchQuery ? 'Pencarian tidak ditemukan.' : 'Belum ada transaksi.'}</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="mb-6 last:mb-2">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-[#7A7A72] uppercase tracking-wider">{dateStr}</span>
                <div className="h-px bg-[#E8E6E1] flex-1"></div>
              </div>
              <div className="divide-y divide-[#F0EFEC]/80">
                {groupedTransactions[dateStr]
                  .sort((a, b) => {
                    if (a.time && b.time) return b.time.localeCompare(a.time);
                    return Number(b.id) - Number(a.id);
                  })
                  .map((t) => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center group hover:bg-[#F0EFEC]/40 px-2 -mx-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 ${t.type === 'pemasukan' ? 'text-[#4A6741]' : 'text-[#E63946]'}`}>
                        {t.type === 'pemasukan' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <p className="font-medium text-[13px] text-[#2D2D2A]">{t.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-[13px] whitespace-nowrap ${t.type === 'pemasukan' ? 'text-[#4A6741]' : 'text-[#E63946]'}`}>
                        {t.type === 'pemasukan' ? '+' : '-'} {(previewMode && privateMode) ? 'Rp ***' : `Rp ${t.amount.toLocaleString('id-ID')}`}
                      </p>
                      <button 
                        onClick={() => setSelectedTx(t)}
                        className="w-7 h-7 flex items-center justify-center text-[#7A7A72] transition-colors rounded-full hover:bg-black/5"
                        title="Detail Transaksi"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center justify-center text-center mt-6">
          <Eye className="w-12 h-12 text-[#7A7A72] mb-3 opacity-30" />
          <p className="text-sm font-bold text-[#2D2D2A]">Riwayat Disembunyikan</p>
          <p className="text-xs text-[#7A7A72] mt-1">Pemilik akun membatasi akses Anda ke data ini.</p>
        </div>
      )}
      
      {/* Modal Detail Transaksi */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setSelectedTx(null); setViewingPhoto(false); }}></div>
          <div className={`relative bg-white rounded-3xl w-full shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${viewingPhoto ? 'max-w-md' : 'max-w-xs'}`}>
            <button 
              onClick={() => { setSelectedTx(null); setViewingPhoto(false); }}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#F0EFEC] text-[#7A7A72] hover:bg-[#E8E6E1] transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            {viewingPhoto ? (
              <div className="flex flex-col">
                <button 
                  onClick={() => setViewingPhoto(false)} 
                  className="mb-4 text-[13px] font-bold text-[#7A7A72] flex items-center gap-1.5 w-fit hover:text-[#2D2D2A] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Kembali ke Detail
                </button>
                <img src={selectedTx.photo} alt="Bukti" className="w-full h-auto max-h-[60vh] rounded-xl object-contain bg-[#F8F7F4] border border-[#E8E6E1]" />
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-[#2D2D2A] mb-5 pr-8">Detail Transaksi</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-start border-b border-[#F0EFEC]/60 pb-2.5">
                    <span className="text-[11px] text-[#7A7A72]">Kategori</span>
                    <span className="text-[13px] font-medium text-[#2D2D2A]">{selectedTx.category}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F0EFEC]/60 pb-2.5">
                    <span className="text-[11px] text-[#7A7A72]">Nominal</span>
                    <span className={`text-[13px] font-bold ${selectedTx.type === 'pemasukan' ? 'text-[#4A6741]' : 'text-[#E63946]'}`}>
                      {selectedTx.type === 'pemasukan' ? '+' : '-'} {(previewMode && privateMode) ? 'Rp ***' : `Rp ${selectedTx.amount.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F0EFEC]/60 pb-2.5">
                    <span className="text-[11px] text-[#7A7A72]">Waktu</span>
                    <span className="text-[13px] text-[#2D2D2A] text-right">
                      {new Date(selectedTx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                      <span className="text-[11px] text-[#7A7A72]">{selectedTx.time || '00:00'}</span>
                    </span>
                  </div>
                  {selectedTx.note && (
                    <div className="flex flex-col gap-1 border-b border-[#F0EFEC]/60 pb-2.5">
                      <span className="text-[11px] text-[#7A7A72]">Catatan</span>
                      <span className="text-[13px] text-[#2D2D2A]">{selectedTx.note}</span>
                    </div>
                  )}
                  {selectedTx.photo && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-[11px] text-[#7A7A72]">Foto Bukti</span>
                      <button 
                        onClick={() => setViewingPhoto(true)}
                        className="w-full py-2 bg-[#F8F7F4] text-[#2D2D2A] text-[12px] font-semibold rounded-xl border border-[#E8E6E1] flex items-center justify-center gap-2 hover:bg-[#F0EFEC] transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 opacity-70" /> Lihat Foto Bukti
                      </button>
                    </div>
                  )}
                </div>
                
                {!previewMode && (
                  <button 
                    onClick={() => setTxToDelete(selectedTx.id)}
                    className="w-full py-2.5 rounded-2xl bg-[#E63946]/10 text-[#E63946] text-[13px] font-semibold hover:bg-[#E63946]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/5520/5520248.png" className="w-3.5 h-3.5 object-contain opacity-80" alt="Hapus" />
                    Hapus Transaksi
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Mini Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setTxToDelete(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-[240px] shadow-2xl p-5 text-center animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-[#2D2D2A] text-sm mb-1">Hapus Transaksi?</h4>
            <p className="text-xs text-[#7A7A72] mb-5">Data ini akan terhapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setTxToDelete(null)} className="flex-1 py-2 bg-[#F0EFEC] text-[#2D2D2A] text-xs font-bold rounded-xl hover:bg-[#E8E6E1] transition-colors">Batal</button>
              <button 
                onClick={() => {
                  onDeleteTransaction(txToDelete);
                  setTxToDelete(null);
                  setSelectedTx(null);
                  setViewingPhoto(false);
                }} 
                className="flex-1 py-2 bg-[#E63946] text-white text-xs font-bold rounded-xl hover:bg-[#C92A37] transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-5 lg:bottom-10 lg:right-10 w-11 h-11 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E8E6E1] text-[#2D2D2A] flex items-center justify-center z-40 hover:bg-[#F8F7F4] transition-all animate-in slide-in-from-bottom-8 fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
