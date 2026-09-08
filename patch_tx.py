import re

with open('src/components/Transactions.tsx', 'r') as f:
    content = f.read()

# Add ChevronLeft to lucide-react imports
if 'ChevronLeft' not in content:
    content = content.replace("ArrowUp, Eye }", "ArrowUp, Eye, ChevronLeft }")

# Add state and handlers
state_code = """  const [showScrollTop, setShowScrollTop] = useState(false);

  // Swipe to delete states
  const [swipedTxId, setSwipedTxId] = useState<string | null>(null);
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
      setSwipedTxId(id);
    } else if (diff < -40 && swipedTxId === id) {
      setSwipedTxId(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };
"""
content = content.replace("  const [showScrollTop, setShowScrollTop] = useState(false);", state_code)

# Replace transaction item mapping
old_mapping = """                  .map((t) => (
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
                ))}"""

new_mapping = """                  .map((t) => (
                  <div key={t.id} className="relative py-1 -mx-2 overflow-hidden mb-1 rounded-xl bg-[#E63946]">
                    <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setTxToDelete(t.id);
                          setSwipedTxId(null);
                        }} 
                        className="w-full h-full flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5 mb-0.5" />
                        <span className="text-[10px] font-bold">Hapus</span>
                      </button>
                    </div>
                    <div 
                      className={`py-2.5 flex justify-between items-center bg-white px-2 rounded-xl relative transition-transform duration-300 ease-out z-10 select-none ${swipedTxId === t.id ? '-translate-x-[72px]' : 'translate-x-0'}`}
                      onTouchStart={(e) => handleTouchStart(e, t.id)}
                      onTouchMove={(e) => handleTouchMove(e, t.id)}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={(e) => handleTouchStart(e, t.id)}
                      onMouseMove={(e) => handleTouchMove(e, t.id)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >
                      <div className="flex items-center gap-3 pointer-events-none">
                        <div className={`shrink-0 ${t.type === 'pemasukan' ? 'text-[#4A6741]' : 'text-[#E63946]'}`}>
                          {t.type === 'pemasukan' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <p className="font-medium text-[13px] text-[#2D2D2A]">{t.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-[13px] whitespace-nowrap pointer-events-none ${t.type === 'pemasukan' ? 'text-[#4A6741]' : 'text-[#E63946]'}`}>
                          {t.type === 'pemasukan' ? '+' : '-'} {(previewMode && privateMode) ? 'Rp ***' : `Rp ${t.amount.toLocaleString('id-ID')}`}
                        </p>
                        <button 
                          onClick={() => setSelectedTx(t)}
                          className="w-7 h-7 flex items-center justify-center text-[#7A7A72] transition-colors rounded-full hover:bg-black/5"
                          title="Detail Transaksi"
                        >
                          <Info className="w-3.5 h-3.5 pointer-events-none" />
                        </button>
                        {!previewMode && (
                          <button onClick={() => setSwipedTxId(swipedTxId === t.id ? null : t.id)} className="w-6 h-6 flex items-center justify-center opacity-40 hover:opacity-100 transition-all text-[#7A7A72] lg:hidden">
                            <ChevronLeft className={`w-4 h-4 transition-transform ${swipedTxId === t.id ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}"""

content = content.replace(old_mapping, new_mapping)

# Remove delete button from Modal Detail
old_modal_delete = """                {!previewMode && (
                  <button 
                    onClick={() => setTxToDelete(selectedTx.id)}
                    className="w-full py-2.5 rounded-2xl bg-[#E63946]/10 text-[#E63946] text-[13px] font-semibold hover:bg-[#E63946]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/5520/5520248.png" className="w-3.5 h-3.5 object-contain opacity-80" alt="Hapus" />
                    Hapus Transaksi
                  </button>
                )}"""
content = content.replace(old_modal_delete, "")

with open('src/components/Transactions.tsx', 'w') as f:
    f.write(content)
