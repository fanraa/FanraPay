import re

with open('src/components/FloatingActionButton.tsx', 'r') as f:
    content = f.read()

old_cats = """  const PENGELUARAN_CATEGORIES = ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Donasi', 'Lainnya'];
  const PEMASUKAN_CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Pemberian', 'Penjualan', 'Lainnya'];"""

new_cats = """  const PENGELUARAN_CATEGORIES = ['Makanan & Minuman', 'Transportasi', 'Belanja Bulanan', 'Belanja Online', 'Tagihan & Utilitas', 'Hiburan & Hobi', 'Kesehatan & Medis', 'Pendidikan', 'Keluarga & Anak', 'Cicilan & Hutang', 'Sedekah & Donasi', 'Asuransi & Pajak', 'Perawatan Diri', 'Lainnya'];
  const PEMASUKAN_CATEGORIES = ['Gaji', 'Bonus & Tunjangan', 'Hasil Usaha', 'Investasi', 'Pemberian / Hadiah', 'Penjualan', 'Pencairan Dana', 'Lainnya'];"""

content = content.replace(old_cats, new_cats)

# Fix date initialization
old_date = "const [date, setDate] = useState(new Date().toISOString().split('T')[0]);"
new_date = """const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });"""
content = content.replace(old_date, new_date)

old_time = "const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));"
new_time = """const [time, setTime] = useState(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  });"""
content = content.replace(old_time, new_time)

with open('src/components/FloatingActionButton.tsx', 'w') as f:
    f.write(content)
