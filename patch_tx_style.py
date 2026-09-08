import re

with open('src/components/Transactions.tsx', 'r') as f:
    content = f.read()

old_block = """                  <div key={t.id} className="relative py-1 -mx-2 overflow-hidden mb-1 rounded-xl bg-[#E63946]">
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
                    >"""

new_block = """                  <div key={t.id} className="relative overflow-hidden -mx-2 rounded-xl group bg-transparent">
                    <div className={`absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-[#E63946] transition-opacity duration-300 rounded-xl ${swipedTxId === t.id ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}>
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
                      className={`py-2.5 flex justify-between items-center px-2 relative transition-transform duration-300 ease-out z-10 select-none group-hover:bg-[#F0EFEC]/40 rounded-xl ${swipedTxId === t.id ? '-translate-x-[72px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.05)]' : 'translate-x-0 bg-transparent'}`}
                      onTouchStart={(e) => handleTouchStart(e, t.id)}
                      onTouchMove={(e) => handleTouchMove(e, t.id)}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={(e) => handleTouchStart(e, t.id)}
                      onMouseMove={(e) => handleTouchMove(e, t.id)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >"""

content = content.replace(old_block, new_block)

with open('src/components/Transactions.tsx', 'w') as f:
    f.write(content)
