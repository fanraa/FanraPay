import re

with open('src/components/Family.tsx', 'r') as f:
    content = f.read()

# 1. Add Profile Avatar section at the very top of the grid
grid_start = '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0 relative">'
profile_html = """<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0 relative">
      {/* Profile Header */}
      <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl py-8 px-6 rounded-[32px] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center justify-center text-center mt-2">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#F0EFEC] mb-4 flex items-center justify-center">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">🧑‍💻</span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#2D2D2A]">{currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Tamu')}</h2>
        <p className="text-xs md:text-sm text-[#7A7A72] mt-1 font-medium">{currentUser ? 'Pengguna Terdaftar' : 'Belum Login'}</p>
      </div>"""

if grid_start in content:
    content = content.replace(grid_start, profile_html)
else:
    print("Could not find grid_start")

# 2. Hide Notification section
notif_block = """            <div className="h-px bg-black/[0.06] my-1" />

            {/* Item 2: Notifikasi Transaksi */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Pemberitahuan Transaksi</p>"""

new_notif_block = """            <div className="hidden h-px bg-black/[0.06] my-1" />

            {/* Item 2: Notifikasi Transaksi */}
            <div className="hidden items-center justify-between gap-4 py-1">
              <div className="pr-2">
                <p className="text-sm font-bold text-[#2D2D2A] mb-0.5">Pemberitahuan Transaksi</p>"""

if notif_block in content:
    content = content.replace(notif_block, new_notif_block)
else:
    print("Could not find notif_block")

with open('src/components/Family.tsx', 'w') as f:
    f.write(content)
