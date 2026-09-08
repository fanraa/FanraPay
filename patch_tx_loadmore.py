import re

with open('src/components/Transactions.tsx', 'r') as f:
    content = f.read()

# 1. Add "Load More" button at the bottom of the list
load_more_block = """        </div>
      </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center justify-center text-center mt-6">"""

new_load_more_block = """        </div>
        
        {visibleCount < sortedFilteredTx.length && (
          <div className="mt-8 flex justify-center pb-6">
            <button 
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-6 py-2.5 bg-white border border-[#E8E6E1] text-[#7A7A72] text-xs font-bold rounded-full shadow-sm hover:bg-[#F8F7F4] hover:text-[#4A6741] transition-all active:scale-95 flex items-center gap-2"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center justify-center text-center mt-6">"""

if load_more_block in content:
    content = content.replace(load_more_block, new_load_more_block)
else:
    print("Could not find load_more_block")


# 2. Add will-change-transform to make swiping smoother
old_swipe_block = """                    <div 
                      className={`py-2.5 flex justify-between items-center px-2 relative transition-transform duration-300 ease-out z-10 select-none group-hover:bg-[#F0EFEC]/40 rounded-xl ${swipedTxId === t.id ? '-translate-x-[72px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.05)]' : 'translate-x-0 bg-transparent'}`}
                      onTouchStart={(e) => handleTouchStart(e, t.id)}"""
new_swipe_block = """                    <div 
                      className={`py-2.5 flex justify-between items-center px-2 relative transition-transform duration-300 ease-out z-10 select-none group-hover:bg-[#F0EFEC]/40 rounded-xl will-change-transform ${swipedTxId === t.id ? '-translate-x-[72px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.05)]' : 'translate-x-0 bg-transparent'}`}
                      onTouchStart={(e) => handleTouchStart(e, t.id)}"""
content = content.replace(old_swipe_block, new_swipe_block)

with open('src/components/Transactions.tsx', 'w') as f:
    f.write(content)
