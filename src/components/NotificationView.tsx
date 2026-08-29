import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, AppEvent, Todo } from '../types';

const filterOptions = ['semua', 'transaksi', 'kebutuhan', 'agenda', 'sistem', 'info', 'promo', 'lainnya'] as const;
type FilterType = typeof filterOptions[number];

interface NotificationViewProps {
  transactions: Transaction[];
  events: AppEvent[];
  todos: Todo[];
  onBack: () => void;
}

export default function NotificationView({ transactions, events, todos, onBack }: NotificationViewProps) {
  // Generate unified notifications list based on data
  // For a simple view, we just construct mock or derived items
  
  const [filter, setFilter] = useState<FilterType>('semua');

  const notifs = [
    ...transactions.slice(0, 5).map(t => ({
      id: `tx-${t.id}`,
      type: 'transaksi',
      title: `Transaksi ${t.type === 'pemasukan' ? 'Masuk' : 'Keluar'}: Rp ${t.amount.toLocaleString('id-ID')}`,
      desc: t.description,
      time: `${t.date} ${t.time}`
    })),
    ...events.slice(0, 5).map(e => ({
      id: `ev-${e.id}`,
      type: 'agenda',
      title: `Agenda: ${e.title}`,
      desc: e.location || 'Tidak ada lokasi',
      time: e.startDate
    })),
    ...todos.slice(0, 5).map(t => ({
      id: `td-${t.id}`,
      type: 'kebutuhan',
      title: `Kebutuhan: ${t.text}`,
      desc: t.completed ? 'Selesai' : 'Belum Selesai',
      time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : ''
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const filteredNotifs = notifs.filter(n => filter === 'semua' || n.type === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col min-h-screen bg-white"
    >
      <div 
        className="relative flex items-center justify-center pt-12 px-6 pb-4 shadow-sm"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.15%22/%3E%3C/svg%3E"), linear-gradient(to bottom right, #3A5333, #23331E)'
        }}
      >
        <button onClick={onBack} className="absolute left-6 hover:opacity-80 transition-opacity">
          <img src="https://cdn-icons-png.flaticon.com/128/8345/8345329.png" alt="Kembali" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        <h1 className="text-lg font-bold text-white drop-shadow-sm">Notifikasi</h1>
      </div>
      
      {/* Filter Scrollable - White Background */}
      <div className="px-6 flex gap-5 overflow-x-auto no-scrollbar border-b border-black/5 flex-shrink-0 bg-white">
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-3 text-[13px] font-semibold whitespace-nowrap transition-all border-b-2 ${filter === f ? 'border-[#3A5333] text-[#3A5333]' : 'border-transparent text-[#7A7A72] hover:text-[#2D2D2A]'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8 flex flex-col gap-1">
        {filteredNotifs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
            <img src="https://cdn-icons-png.flaticon.com/128/15814/15814895.png" alt="Kosong" className="w-24 h-24 mb-4 object-contain opacity-80" />
            <p className="text-sm font-medium text-[#7A7A72]">Belum ada notifikasi.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredNotifs.map(n => (
              <div key={n.id} className="flex flex-col py-4 border-b border-black/5 last:border-0">
                <span className="text-[13px] font-semibold text-[#2D2D2A] leading-snug">{n.title}</span>
                <span className="text-[10px] font-medium text-[#7A7A72] mt-0.5">{n.time}</span>
                <span className="text-[11px] text-[#52524D] mt-1.5 leading-relaxed">{n.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
