import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Todo, AppEvent } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Wallet, CheckSquare, Calendar, Sparkles, Clock, X, Check, MapPin, ChevronDown, ChevronLeft, ChevronRight, Info, Bell, PieChart as PieChartIcon, Copy, Edit2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Sector } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { motion, AnimatePresence } from 'motion/react';

const getBankInfo = (acc: string) => {
  if (!acc) return null;
  const clean = acc.replace(/\D/g, '');
  // Jangan tampilkan logo bank jika rekening kosong, hanya angka 0 (default/placeholder), atau belum diisi
  if (!clean || /^0+$/.test(clean) || clean.length < 8) return null;
  
  if (clean.length === 10) {
    if (clean.startsWith('0') || clean.startsWith('1')) return { name: 'BNI', logo: 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg' };
    if (clean.startsWith('7')) return { name: 'BSI', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg' };
    return { name: 'BCA', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' };
  }
  if (clean.length === 12) {
    if (clean.startsWith('10') || clean.startsWith('50')) return { name: 'Bank Jago', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Bank_Jago_2026.svg' };
    return { name: 'SeaBank', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/SeaBank.svg' };
  }
  if (clean.length === 13) return { name: 'Mandiri', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' };
  if (clean.length === 15) return { name: 'BRI', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/BRI_2025_%28with_full_name%29.svg' };
  
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  accountNumber?: string;
  setAccountNumber?: (val: string) => void;
  todos?: Todo[];
  setTodos?: (todos: Todo[]) => void;
  events?: AppEvent[];
  setEvents?: (events: AppEvent[]) => void;
  previewMode?: boolean;
  privateMode?: boolean;
  onViewChange?: (isSubView: boolean) => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  onRefresh?: () => void;
}

const allSchedules: Record<number, {day: string, classes: {time: string, name: string, room: string, lecturer: string}[]}[]> = {
  3: [
    {
      day: 'Senin',
      classes: [
        { time: '10.15–11.55', name: 'Fisika Matematika 1', room: 'F201', lecturer: 'Dr. Azrul Sulaiman K. P. / Yolanda Rati, M.Si.' },
        { time: '13.00–15.30', name: 'Mekanika 2', room: 'F201', lecturer: 'Dr. Melany Febrina / Dr. Harlina Ardiyanti' },
      ]
    },
    {
      day: 'Selasa',
      classes: [
        { time: '10.20–12.00', name: 'Bahasa Inggris — R10', room: 'GK1.106', lecturer: 'Anjar Nur Cholifah, M.Pd.' },
        { time: '13.00–15.30', name: 'Elektronika Dasar 1', room: 'F201', lecturer: 'Dr. Eko Satria / Dr. Mahardika Yoga D.' },
      ]
    },
    {
      day: 'Rabu',
      classes: [
        { time: '10.15–11.55', name: 'Fisika Matematika 1', room: 'F205', lecturer: 'Dr. Azrul Sulaiman K. P. / Yolanda Rati, M.Si.' },
        { time: '13.00–14.45', name: 'Pancasila — R14', room: 'GK2-410', lecturer: 'Nia Sastra Permata, M.Sc.' },
      ]
    },
    {
      day: 'Kamis',
      classes: [
        { time: '07.30–10.00', name: 'Listrik Magnet', room: 'F201', lecturer: 'Yusron Darojat / Dr. Mohamad Samsul A.' },
        { time: '10.15–11.55', name: 'Statistika Dasar', room: 'F202', lecturer: 'Dr. Ikah Ning P. P. / Weni Ayu Puja K.' },
      ]
    },
    {
      day: 'Jumat',
      classes: [
        { time: '08.00–10.00', name: 'Praktikum Elektronika 1', room: 'Lab. Eldas', lecturer: 'Dr. Mahardika Yoga Darmawan, S.T., M.Sc.' },
      ]
    }
  ]
};

export default function Dashboard({ 
  transactions, 
  budget, 
  accountNumber: propAccountNumber,
  setAccountNumber: propSetAccountNumber,
  todos: propTodos,
  setTodos: propSetTodos,
  events: propEvents,
  setEvents: propSetEvents,
  previewMode = false, 
  privateMode = false, 
  onViewChange,
  isSyncing = false,
  onRefresh,
  isOnline = true
}: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [chartFilter, setChartFilter] = useState<'semua' | '15' | '7' | '3'>('semua');
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  
  const [localAccountNumber, setLocalAccountNumber] = useState('');
  const accountNumber = propAccountNumber !== undefined ? propAccountNumber : localAccountNumber;
  const setAccountNumber = propSetAccountNumber || setLocalAccountNumber;

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [tempAccountNumber, setTempAccountNumber] = useState(accountNumber);
  const [isCopied, setIsCopied] = useState(false);

  // Modals/View state
  const [activeView, setActiveView] = useState<'main' | 'kebutuhan' | 'jadwal' | 'acara'>('main');
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  useEffect(() => {
    if (onViewChange) {
      onViewChange(activeView !== 'main');
    }
  }, [activeView, onViewChange]);

  // Pull to refresh states
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Reset pull states when switching subviews so no indicator flashes
  useEffect(() => {
    setIsPulling(false);
    setIsRefreshing(false);
    setPullMoveY(0);
    setPullStartY(0);
  }, [activeView]);

  const handlePullStart = (e: React.TouchEvent) => {
    if (activeView !== 'main') return;
    if (window.scrollY <= 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handlePullMove = (e: React.TouchEvent) => {
    if (!isPulling || activeView !== 'main') return;
    const y = e.touches[0].clientY;
    const deltaY = y - pullStartY;
    if (deltaY > 0 && window.scrollY <= 0) {
      setPullMoveY(deltaY);
    } else {
      setPullMoveY(0);
    }
  };

  const handlePullEnd = () => {
    if (!isPulling || activeView !== 'main') return;
    setIsPulling(false);
    if (pullMoveY > 75) {
      setIsRefreshing(true);
      if (onRefresh) onRefresh();
      
      setTimeout(() => {
        setIsRefreshing(false);
        setPullMoveY(0);
      }, 1000);
    } else {
      setPullMoveY(0);
    }
  };
  
  // Logarithmic smooth resistance curve
  const pullDistance = isPulling 
    ? Math.min(65, Math.pow(Math.max(0, pullMoveY), 0.8) * 1.5) 
    : (isRefreshing ? 44 : 0);

  const [dots, setDots] = useState('');
  useEffect(() => {
    if (isSyncing || isRefreshing) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '.' : prev + '.');
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isSyncing, isRefreshing]);

  useEffect(() => {
    setTempAccountNumber(accountNumber);
  }, [accountNumber]);

  const handleCopyAccount = async () => {
    const textToCopy = (accountNumber || '').trim();
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy account number:', err);
    }
  };
  
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountNumber(tempAccountNumber.trim());
    setIsEditingAccount(false);
  };
  
  const [currentSemester, setCurrentSemester] = useState(3);
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const todos = propTodos || localTodos;
  const setTodos = propSetTodos || setLocalTodos;

  const [newTodo, setNewTodo] = useState('');
  const [showTodoDropdown, setShowTodoDropdown] = useState(false);
  
  const commonTodos = [
    'Belanja Bulanan', 'Bayar Listrik & Air', 'Gas & Air Galon', 
    'Keperluan Mandi', 'Obat-obatan', 'Servis Kendaraan', 
    'Beli Pakaian/Sepatu', 'Dana Darurat'
  ];

  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const rawIteraEvents = [
    { title: 'Masa Pendaftaran Semester Antara TA 2025/2026', start: '2026-06-22', end: '2026-06-30' },
    { title: 'Kuliah Semester Antara TA 2025/2026', start: '2026-07-06', end: '2026-08-28' },
    { title: 'Masa Pembayaran Semester Antara TA 2025/2026', start: '2026-07-20', end: '2026-07-24' },
    { title: 'Wisuda Periode Ke-25 ITERA', start: '2026-07-25' },
    { title: 'Pengajuan Keringanan UKT Semester 9', start: '2026-07-27', end: '2026-08-05' },
    { title: 'Sidang Penerimaan Mahasiswa Baru', start: '2026-08-10' },
    { title: 'Program Pengenalan Lingkungan Kampus (PPLK)', start: '2026-08-10', end: '2026-08-14' },
    { title: 'Pembayaran UKT Semester Gasal', start: '2026-08-10', end: '2026-08-26' },
    { title: 'Perwalian & Pengisian KRS (Lama)', start: '2026-08-11', end: '2026-08-28' },
    { title: 'Perwalian Mahasiswa Baru', start: '2026-08-24', end: '2026-08-28' },
    { title: 'Batas Akhir Cuti Semester Gasal', start: '2026-08-26' },
    { title: 'Awal Kuliah Semester Gasal', start: '2026-08-31' },
    { title: 'Batas Pemasukan Nilai Sem Antara', start: '2026-09-03' },
    { title: 'Penggantian Rencana Studi Gasal', start: '2026-09-07', end: '2026-10-11' },
    { title: 'Batas Pendaftaran Wisuda Ke-26', start: '2026-09-30' },
    { title: 'Batas Yudisium Wisuda Ke-26', start: '2026-09-30' },
    { title: 'Sidang Terbuka Dies Natalis Ke-12', start: '2026-10-06' },
    { title: 'Ujian Tengah Semester (UTS) Gasal', start: '2026-10-19', end: '2026-10-23' },
    { title: 'SP 2 (Tidak Mendaftar 2 Semester)', start: '2026-10-28' },
    { title: 'Wisuda Periode Ke-26 ITERA', start: '2026-11-07' },
    { title: 'Akhir Kuliah Semester Gasal', start: '2026-12-11' },
    { title: 'Ujian Akhir Semester (UAS) Gasal', start: '2026-12-14', end: '2026-12-29' },
    { title: 'Pengajuan Keringanan UKT Semester 10', start: '2027-01-04', end: '2027-01-12' },
    { title: 'Batas Pemasukan Nilai Semester Gasal', start: '2027-01-08' },
    { title: 'Rapat Evaluasi Studi Fakultas', start: '2027-01-11' },
    { title: 'SP 1/3 (Tidak Mendaftar 2 Semester)', start: '2027-01-12' },
    { title: 'Penyerahan Hasil Evaluasi Studi', start: '2027-01-13' },
    { title: 'Penerbitan SK Evaluasi Studi', start: '2027-01-15' },
    { title: 'Pembayaran UKT Semester Genap', start: '2027-01-18', end: '2027-01-28' },
    { title: 'Perwalian & Pengisian KRS Genap', start: '2027-01-19', end: '2027-01-29' },
    { title: 'Batas Akhir Pemilihan Mapres', start: '2027-01-26' },
    { title: 'Batas Akhir Cuti Semester Genap', start: '2027-01-27' },
    { title: 'Awal Kuliah Semester Genap', start: '2027-02-01' },
    { title: 'Penggantian Rencana Studi Genap', start: '2027-02-08', end: '2027-02-12' },
    { title: 'Ujian Tengah Semester (UTS) Genap', start: '2027-03-29', end: '2027-04-02' },
    { title: 'Batas Yudisium Wisuda Ke-27', start: '2027-03-30' },
    { title: 'Batas Pendaftaran Wisuda Ke-27', start: '2027-03-30' },
    { title: 'Pendaftaran Penyesuaian UKT', start: '2027-04-05', end: '2027-04-23' },
    { title: 'SP 2 (Tidak Mendaftar 2 Semester)', start: '2027-04-05' },
    { title: 'Wisuda Periode Ke-27 ITERA', start: '2027-04-24' },
    { title: 'Akhir Kuliah Semester Genap', start: '2027-05-21' },
    { title: 'Ujian Akhir Semester (UAS) Genap', start: '2027-05-24', end: '2027-06-04' },
    { title: 'Batas Yudisium Wisuda Ke-28', start: '2027-06-17' },
    { title: 'Batas Pendaftaran Wisuda Ke-28', start: '2027-06-17' },
    { title: 'Batas Pemasukan Nilai Semester Genap', start: '2027-06-18' },
    { title: 'Rapat Evaluasi Studi Fakultas', start: '2027-06-21' },
    { title: 'Pendaftaran & Pembayaran Sem Antara', start: '2027-06-21', end: '2027-06-25' },
    { title: 'SP 1/3 (Tidak Mendaftar 2 Semester)', start: '2027-06-22' },
    { title: 'Penyerahan Hasil & SK Evaluasi Studi', start: '2027-06-25' },
    { title: 'Kuliah Semester Antara', start: '2027-06-28', end: '2027-08-20' },
    { title: 'Pembayaran Semester Antara', start: '2027-07-12', end: '2027-07-16' },
    { title: 'Wisuda Periode Ke-28 ITERA', start: '2027-07-17' },
    { title: 'Batas Nilai Semester Antara', start: '2027-08-25' }
  ];

  const generateIteraEvents = () => {
    const eventsList: { id: string, title: string, date: string, endDate?: string, location: string }[] = [];
    let idCounter = 1;
    
    rawIteraEvents.forEach(evt => {
      eventsList.push({
        id: `itera-${idCounter++}`,
        title: evt.title,
        date: evt.start,
        endDate: evt.end,
        location: 'ITERA'
      });
    });
    return eventsList;
  };

  const calToday = new Date();
  const [currentCalMonth, setCurrentCalMonth] = useState(calToday.getMonth());
  const [currentCalYear, setCurrentCalYear] = useState(calToday.getFullYear());
  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD(calToday));

  const calDaysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentCalYear, currentCalMonth, 1).getDay();
  const calendarDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevCalMonth = () => {
    if (currentCalMonth === 0) {
      setCurrentCalMonth(11);
      setCurrentCalYear(currentCalYear - 1);
    } else {
      setCurrentCalMonth(currentCalMonth - 1);
    }
  };

  const nextCalMonth = () => {
    if (currentCalMonth === 11) {
      setCurrentCalMonth(0);
      setCurrentCalYear(currentCalYear + 1);
    } else {
      setCurrentCalMonth(currentCalMonth + 1);
    }
  };

  // State Acara
  const [localEvents, setLocalEvents] = useState<AppEvent[]>([]);
  const events = propEvents || localEvents;
  const setEvents = propSetEvents || setLocalEvents;
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');

  // Gabungkan Agenda ITERA dengan Acara Kustom Pengguna
  const iteraEventsList = useMemo(() => generateIteraEvents(), []);
  const allEvents = useMemo(() => {
    const userEvents = events || [];
    const userEventIds = new Set(userEvents.map(e => e.id));
    const filteredItera = iteraEventsList.filter(e => !userEventIds.has(e.id));
    return [...filteredItera, ...userEvents];
  }, [events, iteraEventsList]);

  // Banner Info Acara Hari Ini
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const localToday = getLocalYYYYMMDD(new Date());
  
  const todaysEvents = allEvents.filter(e => {
    if (e.endDate) {
      return localToday >= e.date && localToday <= e.endDate;
    }
    return e.date === localToday;
  });

  useEffect(() => {
    if (todaysEvents.length > 1) {
      const interval = setInterval(() => {
        setCurrentEventIndex(prev => (prev + 1) % todaysEvents.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [todaysEvents.length]);

  // Swipe to delete Kebutuhan
  const [swipedTodoId, setSwipedTodoId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, id: string) => {
    if (previewMode) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent, id: string) => {
    if (touchStartX === null || previewMode) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = touchStartX - clientX;

    if (diff > 40) {
      setSwipedTodoId(id);
    } else if (diff < -40 && swipedTodoId === id) {
      setSwipedTodoId(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  const handleToggleTodo = (id: string) => {
    if (previewMode) return;
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || previewMode) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo.trim(), done: false, createdAt: new Date().toISOString() }]);
    setNewTodo('');
  };

  const handleDeleteTodo = (id: string) => {
    if (previewMode) return;
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedDate || previewMode) return;
    const newEvent: AppEvent = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      date: selectedDate,
      location: newEventLocation.trim()
    };

    if (newEventEndDate) {
      newEvent.endDate = newEventEndDate;
    }

    setEvents([...events, newEvent]);
    setNewEventTitle('');
    setNewEventLocation('');
    setNewEventEndDate('');
  };

  const handleDeleteEvent = (id: string) => {
    if (previewMode) return;
    setEvents(events.filter(e => e.id !== id));
  };
  const selectedYear = new Date().getFullYear();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const today = new Date().toLocaleDateString('en-CA'); // format: YYYY-MM-DD
  const yearMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  let saldo = 0;
  let pemasukanBulan = 0;
  let pengeluaranBulan = 0;
  let pemasukanHari = 0;
  let pengeluaranHari = 0;

  transactions.forEach((t) => {
    const amount = t.amount;
    if (t.type === 'pemasukan') {
      saldo += amount;
      if (t.date.startsWith(yearMonthStr)) pemasukanBulan += amount;
      if (t.date === today) pemasukanHari += amount;
    } else {
      saldo -= amount;
      if (t.date.startsWith(yearMonthStr)) pengeluaranBulan += amount;
      if (t.date === today) pengeluaranHari += amount;
    }
  });

  const isHidden = previewMode && privateMode;

  const latestTx = transactions.length > 0 
    ? [...transactions].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())[0] 
    : null;

  const persentaseBudget = budget > 0 ? (pengeluaranBulan / budget) * 100 : 0;

  // Generate selected month data
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  const chartData = useMemo(() => {
    // Memetakan semua transaksi (tanpa filter bulan) agar filter rentang hari bisa melintasi bulan
    const dailyDataMap = transactions.reduce((acc, t) => {
      const dateStr = t.date.split('T')[0]; // Format: YYYY-MM-DD
      if (!acc[dateStr]) acc[dateStr] = { Pemasukan: 0, Pengeluaran: 0 };
      acc[dateStr][t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'] += t.amount;
      return acc;
    }, {} as Record<string, { Pemasukan: number; Pengeluaran: number }>);

    let data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonthStr}-${String(day).padStart(2, '0')}`;
      const dayData = dailyDataMap[dateStr] || { Pemasukan: 0, Pengeluaran: 0 };
      const dateLabel = new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      data.push({
        date: dateLabel,
        Pemasukan: dayData.Pemasukan,
        Pengeluaran: dayData.Pengeluaran,
      });
    }
    return data;
  }, [transactions, daysInMonth, yearMonthStr]);

  let chartWidthPercent = 100;
  if (chartFilter !== 'semua') {
    const viewDays = parseInt(chartFilter, 10);
    chartWidthPercent = (daysInMonth / viewDays) * 100;
  }

  // Auto-scroll ke transaksi terakhir
  useEffect(() => {
    if (chartFilter !== 'semua' && chartScrollRef.current) {
      // Cari index hari terakhir yang memiliki transaksi di bulan tersebut
      let lastIndex = chartData.length - 1;
      for (let i = chartData.length - 1; i >= 0; i--) {
        if (chartData[i].Pemasukan > 0 || chartData[i].Pengeluaran > 0) {
          lastIndex = i;
          break;
        }
      }

      // Beri sedikit waktu agar Recharts SVG ter-render (width % nya teraplikasikan)
      const timeoutId = setTimeout(() => {
        if (!chartScrollRef.current) return;
        const container = chartScrollRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        if (scrollWidth > clientWidth) {
          const itemWidth = scrollWidth / chartData.length;
          // Target scroll agar item terakhir terlihat di bagian ujung kanan
          let targetScroll = ((lastIndex + 1) * itemWidth) - clientWidth + (itemWidth / 2);
          if (targetScroll < 0) targetScroll = 0;
          
          container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [chartFilter, chartData, selectedMonth, selectedYear]);

  // Data untuk Pie Chart (Kategori Pengeluaran Bulan Ini)
  const PIE_COLORS = ['#4A6741', '#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#264653', '#8AB17D', '#E29578'];
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(yearMonthStr));
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, yearMonthStr]);

  const yearlyCategoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(`${selectedYear}-`));
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear]);

  const allTimeCategoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'pengeluaran');
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const [categoryView, setCategoryView] = useState<'bulan' | 'tahun' | 'semua'>('bulan');
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [isPieAnimating, setIsPieAnimating] = useState(true);

  useEffect(() => {
    // Reset animation state when category view changes
    setIsPieAnimating(true);
    const timer = setTimeout(() => {
      setIsPieAnimating(false);
    }, 1500); // Wait for recharts animation to finish
    return () => clearTimeout(timer);
  }, [categoryView]);

  if (activeView === 'kebutuhan') {
    // Sort todos: done items at top, then by original order
    const sortedTodos = [...todos].sort((a, b) => {
      if (a.done && !b.done) return -1;
      if (!a.done && b.done) return 1;
      return 0;
    });

    return (
      <div className="flex flex-col h-full min-h-[60vh]">
        <div className="flex items-center gap-3 px-2 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 text-[#2D2D2A] hover:bg-black/5 rounded-full transition-colors drop-shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h3 className="font-bold text-lg text-[#2D2D2A]">Kebutuhan & Checklist</h3>
        </div>
        <div 
          className="bg-gradient-to-br from-[#4A6741] to-[#2D2D2A] p-6 rounded-[32px] border border-white/10 shadow-lg relative overflow-hidden flex-1 flex flex-col"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E"), linear-gradient(to bottom right, #4A6741, #2D2D2A)' }}
        >
          <div className="mb-5">
            <p className="text-white/80 text-[13px] leading-relaxed">Kelola daftar kebutuhan harian atau rencana belanja Anda agar tidak ada yang terlewat.</p>
          </div>
          
          <div className="flex-1 mb-6 overflow-y-auto custom-scrollbar pr-1">
          {sortedTodos.map(todo => (
            <div key={todo.id} className="relative mb-3 rounded-[20px] overflow-hidden bg-[#E63946] shadow-sm">
              <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center">
                <button 
                  onClick={() => {
                    handleDeleteTodo(todo.id);
                    setSwipedTodoId(null);
                  }} 
                  className="w-full h-full flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Hapus</span>
                </button>
              </div>

              <div 
                className={`flex items-center gap-3 p-3 bg-white rounded-[20px] relative transition-transform duration-300 ease-out z-10 select-none ${swipedTodoId === todo.id ? '-translate-x-[72px]' : 'translate-x-0'}`}
                onTouchStart={(e) => handleTouchStart(e, todo.id)}
                onTouchMove={(e) => handleTouchMove(e, todo.id)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleTouchStart(e, todo.id)}
                onMouseMove={(e) => handleTouchMove(e, todo.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <button 
                  onClick={() => handleToggleTodo(todo.id)}
                  disabled={previewMode}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${todo.done ? 'bg-[#4A6741] border-[#4A6741]' : 'border-[#D4A373] bg-transparent'}`}
                >
                  {todo.done && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <div className="flex-1 flex flex-col justify-center">
                  <span className={`text-sm font-medium ${todo.done ? 'line-through text-[#7A7A72]' : 'text-[#2D2D2A]'}`}>{todo.text}</span>
                  {activeInfoId === todo.id && todo.createdAt && (
                    <span className="text-[10px] text-[#7A7A72] mt-1 bg-[#F0EFEC] px-2 py-1 rounded-md self-start">
                      Dibuat: {new Date(todo.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setActiveInfoId(activeInfoId === todo.id ? null : todo.id)}
                  className="p-1.5 opacity-60 hover:opacity-100 transition-opacity text-[#7A7A72]"
                >
                  <Info className="w-4 h-4" />
                </button>
                {!previewMode && (
                  <button onClick={() => setSwipedTodoId(swipedTodoId === todo.id ? null : todo.id)} className="p-2 opacity-50 hover:opacity-100 rounded-lg transition-all absolute right-2 bg-white hidden group-hover:block text-[#7A7A72]">
                    <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${swipedTodoId === todo.id ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {todos.length === 0 && (
            <p className="text-center text-white/80 text-xs py-4">Belum ada daftar kebutuhan.</p>
          )}
        </div>

        {!previewMode ? (
          <div className="bg-white p-3 rounded-[24px] shadow-sm">
            <form onSubmit={handleAddTodo} className="flex gap-2 relative">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={newTodo}
                  onChange={(e) => {
                    setNewTodo(e.target.value);
                    setShowTodoDropdown(true);
                  }}
                  onFocus={() => setShowTodoDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTodoDropdown(false), 200)}
                  placeholder="Pilih atau ketik kebutuhan..." 
                  className="w-full bg-[#F0EFEC] border border-transparent focus:border-[#4A6741]/30 focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
                />
                <button type="button" onClick={() => setShowTodoDropdown(!showTodoDropdown)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7A7A72]">
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showTodoDropdown && (
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden z-20 max-h-48 overflow-y-auto custom-scrollbar">
                    {commonTodos.filter(t => t.toLowerCase().includes(newTodo.toLowerCase())).map((todo, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        onClick={() => {
                          setNewTodo(todo);
                          setShowTodoDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-[#2D2D2A] hover:bg-[#F0EFEC] transition-colors border-b border-black/5 last:border-0"
                      >
                        {todo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="bg-[#2D2D2A] text-white px-5 rounded-xl text-sm font-bold shadow-lg shadow-[#2D2D2A]/20 hover:bg-[#1a1a19] transition-colors">
                Tambah
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
    );
  }

  if (activeView === 'jadwal') {
    const currentSchedule = allSchedules[currentSemester] || [];
    return (
      <div className="flex flex-col h-full min-h-[60vh]">
        <div className="flex items-center gap-3 px-2 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 text-[#2D2D2A] hover:bg-black/5 rounded-full transition-colors drop-shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h3 className="font-bold text-lg text-[#2D2D2A] leading-tight">Jadwal Kuliah</h3>
            <p className="text-[11px] text-[#7A7A72]">Tahun Ajaran 2026/2027</p>
          </div>
        </div>
        <div 
          className="bg-gradient-to-br from-[#4A6741] to-[#2D2D2A] p-6 rounded-[32px] border border-white/10 shadow-lg relative overflow-hidden flex-1 flex flex-col"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E"), linear-gradient(to bottom right, #4A6741, #2D2D2A)' }}
        >
          <div className="mb-4">
            <p className="text-white/80 text-[13px] leading-relaxed mb-4">Berikut adalah jadwal perkuliahan rutin Anda. Tetap semangat dan jangan sampai telat, ya!</p>
            
            <div className="flex items-center justify-between bg-white/10 p-2 rounded-2xl">
              <button onClick={() => setCurrentSemester(Math.max(1, currentSemester - 1))} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div className="text-center">
                <h4 className="font-bold text-white text-[14px]">Semester {currentSemester}</h4>
                <p className="text-white/70 text-[10px]">{currentSemester % 2 !== 0 ? 'Ganjil' : 'Genap'}</p>
              </div>
              <button onClick={() => setCurrentSemester(Math.min(8, currentSemester + 1))} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 mb-2 overflow-y-auto custom-scrollbar pr-1">
          {currentSchedule.length > 0 ? (
            currentSchedule.map(schedule => (
              <div key={schedule.day} className="flex flex-col">
                <div className="flex items-center gap-4 mb-3">
                  <h4 className="font-bold text-white text-[13px] uppercase tracking-wider">{schedule.day}</h4>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>
                <div className="flex flex-col gap-3">
                  {schedule.classes.map((cls, idx) => (
                    <div key={idx} className="flex flex-row items-center gap-4 p-4 bg-white rounded-[20px] shadow-sm">
                      <div className="w-[85px] shrink-0 text-center">
                        <span className="text-[11px] font-bold text-[#7A7A72] block">{cls.time}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#2D2D2A] mb-1 leading-tight">{cls.name}</p>
                        <p className="text-[11px] text-[#4A6741] font-bold mb-0.5">Ruang {cls.room}</p>
                        <p className="text-[11px] text-[#7A7A72] leading-relaxed">{cls.lecturer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center opacity-70">
              <Calendar className="w-10 h-10 text-white/40 mb-3" />
              <p className="text-white/80 text-[13px] font-medium">Jadwal Kosong</p>
              <p className="text-white/60 text-[11px] mt-1">Belum ada jadwal untuk semester ini.</p>
            </div>
          )}
          {currentSchedule.length > 0 && (
            <div className="text-center py-4 text-[11px] text-white/70 font-medium tracking-wider uppercase">
              Sabtu & Minggu — Libur
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }

  if (activeView === 'acara') {
    const currentMonthStr = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}`;
    const currentMonthEvents = allEvents.filter(e => {
      if (e.endDate) {
        return (e.date.startsWith(currentMonthStr) || e.endDate.startsWith(currentMonthStr) || (e.date < currentMonthStr + '-01' && e.endDate >= currentMonthStr + '-31'));
      }
      return e.date.startsWith(currentMonthStr);
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return (
      <div className="flex flex-col h-full min-h-[60vh]">
        <div className="flex items-center gap-3 px-2 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 text-[#2D2D2A] hover:bg-black/5 rounded-full transition-colors drop-shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h3 className="font-bold text-lg text-[#2D2D2A]">Agenda & Jadwal</h3>
        </div>

        <div 
          className="bg-gradient-to-br from-[#4A6741] to-[#2D2D2A] p-6 rounded-[32px] border border-white/10 shadow-lg relative overflow-hidden flex-1 flex flex-col"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E"), linear-gradient(to bottom right, #4A6741, #2D2D2A)' }}
        >
          <div className="mb-5">
            <p className="text-white/80 text-[13px] leading-relaxed">Kalender akademik ITERA dan agenda penting Anda dalam satu tampilan.</p>
          </div>
          {/* Kalender */}
        <div className="bg-white border border-[#F0EFEC] rounded-[24px] p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevCalMonth} className="p-1.5 hover:bg-[#F0EFEC] rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#2D2D2A]" />
            </button>
            <h4 className="font-bold text-[#2D2D2A] text-[15px]">
              {months[currentCalMonth]} {currentCalYear}
            </h4>
            <button onClick={nextCalMonth} className="p-1.5 hover:bg-[#F0EFEC] rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-[#2D2D2A]" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {calendarDays.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-[#7A7A72] uppercase">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9"></div>
            ))}
            {Array.from({ length: calDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasEvent = allEvents.some(e => {
                if (e.endDate) {
                  return dateStr >= e.date && dateStr <= e.endDate;
                }
                return e.date === dateStr;
              });
              const isSelected = selectedDate === dateStr;
              
              return (
                <button 
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-9 rounded-xl text-[13px] font-bold relative flex flex-col items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-[#2D2D2A] text-white shadow-md' 
                      : 'text-[#2D2D2A] hover:bg-[#F0EFEC]'
                    }
                  `}
                >
                  <span className="leading-none">{day}</span>
                  {hasEvent && (
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-[#4A6741]'}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-white/20 flex-1"></div>
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            Agenda Bulan Ini
          </p>
          <div className="h-px bg-white/20 flex-1"></div>
        </div>

        <div className="flex-1 mb-4 overflow-y-auto custom-scrollbar pr-2">
          {currentMonthEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-white/80 text-[11px]">Tidak ada agenda bulan ini.</p>
            </div>
          ) : (
            <div className="space-y-4 px-1">
              {currentMonthEvents.map((event) => {
                const startDay = parseInt(event.date.split('-')[2], 10);
                const endDay = event.endDate ? parseInt(event.endDate.split('-')[2], 10) : null;
                const dateDisplay = endDay ? `${startDay} - ${endDay}` : `${startDay}`;

                const isPast = event.endDate ? event.endDate < localToday : event.date < localToday;
                const pastStyles = isPast ? "line-through opacity-60" : "";

                return (
                  <div key={event.id} className={`relative group ${isPast ? 'grayscale opacity-70' : ''}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[11px] font-bold text-white/90 whitespace-nowrap w-10 text-right">{dateDisplay}</span>
                      <div className="h-px bg-white/20 flex-1"></div>
                    </div>
                    
                    <div className="pl-[3.25rem]">
                      <h4 className={`font-bold text-white text-[13px] leading-tight mb-0.5 pr-8 ${pastStyles}`}>{event.title}</h4>
                      {event.location && (
                        <div className={`flex items-center gap-1.5 text-[10px] text-white/60 ${pastStyles}`}>
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {!previewMode && !event.id.startsWith('itera-') && (
                      <button 
                        onClick={() => handleDeleteEvent(event.id)} 
                        className="absolute right-0 top-1 p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-white/60 hover:text-[#E63946] transition-all rounded-lg hover:bg-white/10"
                        title="Hapus Acara"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!previewMode && (
          <form onSubmit={handleAddEvent} className="bg-white border border-[#F0EFEC] p-3 rounded-[20px] shadow-sm flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <input 
                type="text" 
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Nama Agenda..." 
                className="w-full bg-[#F0EFEC] border border-transparent focus:border-[#4A6741]/30 focus:bg-white rounded-xl px-3 py-2 text-xs outline-none transition-all"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#7A7A72] font-bold whitespace-nowrap pl-1">Tgl Akhir:</span>
                <input 
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  min={selectedDate}
                  className="flex-1 bg-[#F0EFEC] border border-transparent focus:border-[#4A6741]/30 focus:bg-white rounded-xl px-2 py-1.5 text-[11px] outline-none transition-all text-[#7A7A72]"
                />
              </div>
              <input 
                type="text" 
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                placeholder="Lokasi (Opsional)" 
                className="w-full bg-[#F0EFEC] border border-transparent focus:border-[#4A6741]/30 focus:bg-white rounded-xl px-3 py-2 text-xs outline-none transition-all"
              />
            </div>
            <button type="submit" className="h-[96px] px-4 bg-[#2D2D2A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#2D2D2A]/20 hover:bg-[#1a1a19] transition-colors flex items-center justify-center">
              Tambah
            </button>
          </form>
        )}
      </div>
    </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-5 lg:gap-6 relative"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {/* Floating Pull-to-Refresh Indicator - Exactly Centered */}
      {((isPulling && pullDistance > 12) || isRefreshing) && (
        <div 
          className="fixed top-3 inset-x-0 mx-auto w-fit z-50 pointer-events-none transition-all duration-200 flex items-center justify-center"
          style={{ 
            transform: `translateY(${pullDistance}px)`,
            opacity: isRefreshing ? 1 : Math.min(1, Math.max(0, (pullDistance - 10) / 25))
          }}
        >
          <div className="bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E8E6E1] rounded-full px-4 py-2 flex items-center gap-2.5">
            <Loader2 
              className={`w-4 h-4 text-[#4A6741] ${isRefreshing ? 'animate-spin' : ''}`} 
              style={{ transform: !isRefreshing ? `rotate(${Math.min(360, pullDistance * 7)}deg)` : undefined }} 
            />
            <span className="text-xs font-bold text-[#2D2D2A]">
              {isRefreshing ? 'Menyinkronkan...' : (pullDistance >= 45 ? 'Lepas untuk perbarui' : 'Tarik untuk perbarui')}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="space-y-5">
        <div 
          className="bg-[#2D2D2A] p-6 lg:p-7 rounded-[32px] border border-white/10 shadow-lg relative overflow-hidden"
        >
          {/* Background Foto */}
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1788012838/20260829_211122_0000_v2e1uo.png"
            alt="Card Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-90"
          />
          {/* Overlay gelap agar teks putih tetap terbaca */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none z-0"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/20 rounded-full blur-2xl pointer-events-none z-0"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-2">
            {isEditingAccount ? (
              <form onSubmit={handleSaveAccount} className="flex items-center gap-2">
                <img src="https://cdn-icons-png.flaticon.com/128/4943/4943065.png" alt="User" className="w-5 h-5 object-contain drop-shadow-sm" />
                <input 
                  type="text" 
                  value={tempAccountNumber}
                  onChange={e => setTempAccountNumber(e.target.value)}
                  placeholder="Nomor rekening..."
                  className="bg-white/20 border border-white/30 text-white text-xs px-2 py-1 rounded outline-none focus:border-white/50 w-36 placeholder:text-white/50"
                  autoFocus
                  onBlur={handleSaveAccount}
                />
              </form>
            ) : (
              <div className="flex items-center gap-2 group">
                <img src="https://cdn-icons-png.flaticon.com/128/4943/4943065.png" alt="User" className="w-5 h-5 object-contain drop-shadow-sm" />
                
                {(() => {
                  const hasAcc = Boolean(accountNumber && accountNumber.trim());
                  const bank = hasAcc ? getBankInfo(accountNumber.trim()) : null;
                  return bank ? (
                    <div className="bg-white/90 px-1.5 py-0.5 rounded shadow-sm flex items-center justify-center animate-in zoom-in duration-300">
                      <img src={bank.logo} alt={bank.name} className="h-3 md:h-3.5 object-contain" title={bank.name} referrerPolicy="no-referrer" />
                    </div>
                  ) : null;
                })()}

                <span className="text-[11px] lg:text-xs font-medium text-white/90 tracking-wider">
                  {accountNumber && accountNumber.trim() ? accountNumber.trim() : '-'}
                </span>
                
                {Boolean(accountNumber && accountNumber.trim()) && (
                  <button 
                    onClick={handleCopyAccount} 
                    className="text-white/70 hover:text-white transition-colors p-0.5" 
                    title="Salin Nomor Rekening"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-[#a3d995] animate-in zoom-in duration-200" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 animate-in zoom-in duration-200" />
                    )}
                  </button>
                )}

                {!previewMode && (
                  <button 
                    onClick={() => { if(isOnline) { setIsEditingAccount(true); setTempAccountNumber(accountNumber); } }} 
                    className={`transition-all ml-1 p-0.5 ${isOnline ? 'text-white/40 hover:text-white' : 'text-white/20 cursor-not-allowed'}`} title={isOnline ? 'Edit Rekening' : 'Edit dinonaktifkan (Offline)'} 
                    
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            
            <div className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-wide">
              {!isOnline ? (previewMode ? 'Offline - Mode Baca' : 'Offline - Tertunda') : ((isSyncing || isRefreshing) ? `menyinkronkan${dots}` : 'tersinkron')}
            </div>
          </div>

          <div className="relative z-10 text-center mb-6">
            <p className="text-[11px] lg:text-xs font-medium text-white/70 mb-1.5">
              Saldo Rekening Irfan Rizki Aditri
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white truncate px-2">{isHidden ? 'Rp ***' : `Rp ${saldo.toLocaleString('id-ID')}`}</h2>
          </div>
          
          <div className="relative z-10 flex flex-col gap-2.5 pt-5 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md p-3.5 lg:p-4 rounded-2xl border border-white/10 flex justify-between items-center">
              <div className="flex flex-col text-left mr-3">
                <span className="text-xs lg:text-sm font-medium text-white mb-0.5">{months[selectedMonth]}</span>
                <span className="text-[10px] text-white/60">Arus kas bulanan</span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs lg:text-[13px] font-semibold text-[#a3d995]">{isHidden ? '+Rp ***' : `+Rp ${pemasukanBulan.toLocaleString('id-ID')}`}</span>
                <span className="text-xs lg:text-[13px] font-semibold text-[#ffb4b4]">{isHidden ? '-Rp ***' : `-Rp ${pengeluaranBulan.toLocaleString('id-ID')}`}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 lg:p-4 rounded-2xl border border-white/10 flex justify-between items-center">
              <div className="flex flex-col text-left mr-3">
                <span className="text-xs lg:text-sm font-medium text-white mb-0.5">Hari ini</span>
                <span className="text-[10px] text-white/60">Total arus kas harian</span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs lg:text-[13px] font-semibold text-[#a3d995]">{isHidden ? '+Rp ***' : `+Rp ${pemasukanHari.toLocaleString('id-ID')}`}</span>
                <span className="text-xs lg:text-[13px] font-semibold text-[#ffb4b4]">{isHidden ? '-Rp ***' : `-Rp ${pengeluaranHari.toLocaleString('id-ID')}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 flex flex-col">
        
        {/* Action Buttons Grid */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2.5 mt-1 relative z-20">
            {([
              { id: 'kebutuhan', title: 'Kebutuhan', icon: 'https://cdn-icons-png.flaticon.com/128/2099/2099125.png', filter: false, onClick: () => setActiveView('kebutuhan') },
              { id: 'jadwal', title: 'Jadwal', icon: 'https://cdn-icons-png.flaticon.com/128/3597/3597050.png', filter: false, onClick: () => setActiveView('jadwal') },
              { id: 'agenda', title: 'Agenda', icon: 'https://cdn-icons-png.flaticon.com/128/11989/11989775.png', filter: false, onClick: () => setActiveView('acara') },
              { id: 'laporan', title: 'Laporan', icon: 'https://cdn-icons-png.flaticon.com/128/3212/3212683.png', filter: true, onClick: () => { document.getElementById('chart-section')?.scrollIntoView({ behavior: 'smooth' }) } },
              { id: 'keluarga', title: 'Keluarga', icon: 'https://cdn-icons-png.flaticon.com/128/3126/3126647.png', filter: true, onClick: () => { alert('Fitur Keluarga akan segera hadir!'); } },
              { id: 'tagihan', title: 'Tagihan', icon: 'https://cdn-icons-png.flaticon.com/128/3258/3258451.png', filter: true, onClick: () => { alert('Fitur Tagihan akan segera hadir!'); } },
              { id: 'tabungan', title: 'Tabungan', icon: 'https://cdn-icons-png.flaticon.com/128/2489/2489756.png', filter: true, onClick: () => { alert('Fitur Tabungan akan segera hadir!'); } },
            ].slice(0, showAllMenu ? 7 : 3)).map((item) => (
              <button 
                key={item.id}
                onClick={item.onClick}
                className="transition-all duration-300 p-1 active:translate-y-[1px] flex flex-col items-center justify-start gap-1.5 group"
              >
                <img src={item.icon} alt={item.title} className="w-[24px] h-[24px] object-contain opacity-80 group-hover:opacity-100 transition-opacity" style={item.filter ? { filter: 'brightness(0) saturate(100%) invert(35%) sepia(16%) saturate(1661%) hue-rotate(63deg) brightness(97%) contrast(89%)' } : {}} />
                <span className="text-[10px] tracking-wide text-[#2D2D2A] font-bold">{item.title}</span>
              </button>
            ))}
            <button 
              onClick={() => setShowAllMenu(!showAllMenu)}
              className="transition-all duration-300 p-1 active:translate-y-[1px] flex flex-col items-center justify-start gap-1.5 group"
            >
              <img src="https://cdn-icons-png.flaticon.com/128/12890/12890802.png" alt={showAllMenu ? "Tutup" : "Lainnya"} className="w-[24px] h-[24px] object-contain opacity-80 group-hover:opacity-100 transition-opacity" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(16%) saturate(1661%) hue-rotate(63deg) brightness(97%) contrast(89%)' }} />
              <span className="text-[10px] tracking-wide text-[#2D2D2A] font-bold">{showAllMenu ? "Tutup" : "Lainnya"}</span>
            </button>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex-1 min-h-[250px] flex flex-col mb-4">
        <div className="flex items-center justify-between mb-3 relative z-20">
          <h3 className="font-bold text-base text-[#2D2D2A]">Grafik Transaksi</h3>
          <div className="relative">
            <button 
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="flex items-center gap-1 text-[10px] bg-[#4A6741]/10 text-[#4A6741] font-bold rounded-lg px-2.5 py-1 transition-colors hover:bg-[#4A6741]/20 outline-none"
            >
              {months[selectedMonth]} {selectedYear}
              <svg className={`w-3 h-3 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {isMonthDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsMonthDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-1.5 w-32 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-1.5 max-h-56 overflow-y-auto z-40 custom-scrollbar">
                  {months.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedMonth(i);
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-colors outline-none ${selectedMonth === i ? 'bg-[#4A6741]/10 text-[#4A6741] font-bold' : 'text-[#7A7A72] hover:bg-[#F0EFEC]'}`}
                    >
                      {m} {selectedYear}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setChartFilter('semua')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${chartFilter === 'semua' ? 'bg-[#2D2D2A] text-white' : 'bg-white/60 text-[#7A7A72] hover:bg-white/80 border border-[#F0EFEC]'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setChartFilter('15')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${chartFilter === '15' ? 'bg-[#2D2D2A] text-white' : 'bg-white/60 text-[#7A7A72] hover:bg-white/80 border border-[#F0EFEC]'}`}
          >
            15 Hari
          </button>
          <button 
            onClick={() => setChartFilter('7')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${chartFilter === '7' ? 'bg-[#2D2D2A] text-white' : 'bg-white/60 text-[#7A7A72] hover:bg-white/80 border border-[#F0EFEC]'}`}
          >
            7 Hari
          </button>
          <button 
            onClick={() => setChartFilter('3')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${chartFilter === '3' ? 'bg-[#2D2D2A] text-white' : 'bg-white/60 text-[#7A7A72] hover:bg-white/80 border border-[#F0EFEC]'}`}
          >
            3 Hari
          </button>
        </div>
        
        {chartData.length > 0 ? (
          <div 
            ref={chartScrollRef}
            className={`w-full no-scrollbar ${chartFilter === 'semua' ? 'overflow-x-hidden' : 'overflow-x-auto'}`} 
            style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
          >
            <div className="outline-none select-none [&_*]:outline-none [&_*]:focus:outline-none" style={{ width: chartFilter === 'semua' ? '100%' : `${chartWidthPercent}%`, minWidth: '100%', height: 160, minHeight: 160, WebkitTapHighlightColor: 'transparent' }}>
              <ResponsiveContainer key={chartFilter} width="100%" height="100%" minWidth={1} minHeight={1} className="outline-none">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} className="outline-none">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E8E6E1" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#7A7A72' }} 
                    dy={5} 
                    minTickGap={20}
                  />
                  <YAxis 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => isHidden ? '***' : (val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val)} 
                    tick={{ fill: '#7A7A72' }} 
                    width={35} 
                  />
                  <Tooltip 
                    cursor={{fill: '#F0EFEC', opacity: 0.6}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '10px', padding: '6px', fontWeight: 'bold' }} 
                    formatter={(value: number) => [isHidden ? 'Rp ***' : `Rp ${value.toLocaleString('id-ID')}`, undefined]}
                    labelStyle={{ color: '#7A7A72', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Pemasukan" fill="#4A6741" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Bar dataKey="Pengeluaran" fill="#E63946" radius={[3, 3, 0, 0]} maxBarSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-[11px] font-medium text-[#7A7A72]">Belum ada data grafik</p>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-4">
        <div className="flex flex-col gap-3 mb-4">
          <h3 className="font-bold text-base text-[#2D2D2A]">Kategori Pengeluaran</h3>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCategoryView('semua')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${categoryView === 'semua' ? 'bg-[#4A6741] text-white' : 'bg-black/5 text-[#7A7A72]'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => setCategoryView('tahun')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${categoryView === 'tahun' ? 'bg-[#4A6741] text-white' : 'bg-black/5 text-[#7A7A72]'}`}
            >
              Tahun Ini
            </button>
            <button 
              onClick={() => setCategoryView('bulan')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${categoryView === 'bulan' ? 'bg-[#4A6741] text-white' : 'bg-black/5 text-[#7A7A72]'}`}
            >
              Bulan Ini
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={categoryView}
            initial={{ opacity: 0, x: categoryView === 'semua' ? -20 : categoryView === 'tahun' ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: categoryView === 'semua' ? 20 : categoryView === 'tahun' ? 0 : -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset }) => {
              const swipe = offset.x;
              if (swipe < -30) {
                if (categoryView === 'semua') setCategoryView('tahun');
                else if (categoryView === 'tahun') setCategoryView('bulan');
              } else if (swipe > 30) {
                if (categoryView === 'bulan') setCategoryView('tahun');
                else if (categoryView === 'tahun') setCategoryView('semua');
              }
            }}
          >
            {(() => {
              const baseCategoryData = categoryView === 'bulan' ? categoryData : categoryView === 'tahun' ? yearlyCategoryData : allTimeCategoryData;
              let displayCategoryData = baseCategoryData;
              
              if (baseCategoryData.length > 4) {
                const top3 = baseCategoryData.slice(0, 3);
                const restValue = baseCategoryData.slice(3).reduce((acc, curr) => acc + curr.value, 0);
                displayCategoryData = [...top3, { name: 'Lain-lain', value: restValue }];
              }

              const totalViewPengeluaran = baseCategoryData.reduce((acc, curr) => acc + curr.value, 0);
              const viewBudget = categoryView === 'bulan' ? budget : categoryView === 'tahun' ? budget * 12 : null;
              const viewPersentase = viewBudget && viewBudget > 0 ? (totalViewPengeluaran / viewBudget) * 100 : 0;

              return displayCategoryData.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {/* Bagian Atas: Chart & Top 4 (2x2 Grid) */}
                  <div className="flex flex-col gap-6 items-center">
                    <div className={`relative shrink-0 ${isPieAnimating ? "pointer-events-none" : ""}`} style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={activePieIndex}
                            activeShape={renderActiveShape}
                            data={displayCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            onMouseEnter={(_, index) => setActivePieIndex(index)}
                            onMouseLeave={() => setActivePieIndex(undefined)}
                            onClick={(_, index) => setActivePieIndex(activePieIndex === index ? undefined : index)}
                          >
                            {displayCategoryData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={activePieIndex !== undefined && activePieIndex !== index ? '#E5E5E5' : PIE_COLORS[index % PIE_COLORS.length]} 
                                className="transition-all duration-300"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '9px', padding: '4px 8px', fontWeight: 'bold' }}
                            formatter={(value: number, name: string) => [isHidden ? "Rp ***" : `Rp ${(value/1000).toFixed(0)}k`, name]}
                            itemStyle={{ color: '#2D2D2A', padding: 0 }}
                            labelStyle={{ display: 'none' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-x-4 gap-y-4">
                      {displayCategoryData.map((entry, index) => (
                        <div 
                          key={index} 
                          className={`flex items-stretch gap-2.5 transition-all duration-300 cursor-pointer ${activePieIndex !== undefined && activePieIndex !== index ? 'opacity-50 grayscale' : 'opacity-100'} ${isPieAnimating ? 'pointer-events-none' : ''}`}
                          onMouseEnter={() => !isPieAnimating && setActivePieIndex(index)}
                          onMouseLeave={() => !isPieAnimating && setActivePieIndex(undefined)}
                          onClick={() => !isPieAnimating && setActivePieIndex(activePieIndex === index ? undefined : index)}
                        >
                          <div className="w-1.5 rounded-full shrink-0 transition-transform" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length], transform: activePieIndex === index ? 'scaleY(1.2)' : 'scaleY(1)' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[#2D2D2A] truncate">{entry.name}</p>
                            <p className="text-[10px] text-[#7A7A72] font-semibold mt-0.5">{isHidden ? 'Rp ***' : `Rp ${(entry.value / 1000).toFixed(0)}k`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bagian Bawah: Budget Progress Bar */}
                  <div className="pt-3 border-t border-black/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] text-[#7A7A72] font-medium">Total Terpakai {categoryView === 'bulan' ? 'Bulan Ini' : categoryView === 'tahun' ? 'Tahun Ini' : ''}</span>
                      <span className="font-bold text-xs text-[#2D2D2A]">
                        {isHidden ? 'Rp ***' : `Rp ${totalViewPengeluaran.toLocaleString('id-ID')}`}
                        {viewBudget && !isHidden && <span className="text-[9px] text-[#7A7A72] font-normal"> / {viewBudget.toLocaleString('id-ID')}</span>}
                        {viewBudget && isHidden && <span className="text-[9px] text-[#7A7A72] font-normal"> / ***</span>}
                      </span>
                    </div>
                    {viewBudget ? (
                      <div className="h-1.5 w-full bg-[#F0EFEC] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${viewPersentase > 90 ? 'bg-[#E63946]' : viewPersentase > 75 ? 'bg-[#D4A373]' : 'bg-[#4A6741]'}`} 
                          style={{ width: `${Math.min(viewPersentase, 100)}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="h-1.5 w-full bg-[#4A6741]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4A6741] rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    )}
                    {viewBudget && viewPersentase > 90 && (
                      <p className="text-[9px] text-[#E63946] font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" /> Mendekati Batas
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-center">
                  <p className="text-[11px] text-[#7A7A72] font-medium">Belum ada pengeluaran {categoryView === 'bulan' ? 'bulan ini' : categoryView === 'tahun' ? 'tahun ini' : 'sama sekali'}</p>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </div>
    </div>
  );
}
