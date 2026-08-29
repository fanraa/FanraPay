# Fanra Design Guidelines

## Gaya Visual Inti: Glassmorphism Alami (Natural Glassmorphism)
Aplikasi Fanra menggunakan konsep tata letak tembus pandang (kaca) yang lembut di atas latar belakang dengan tema warna alam (Natural Tones).

- **Latar Belakang Utama:** Gradien halus putih tulang ke hijau pucat (`bg-gradient-to-br from-[#E2E1DC] via-[#F8F7F4] to-[#D9E0D3]`).
- **Warna Teks Primer:** Abu-abu sangat gelap nyaris hitam (`#2D2D2A`).
- **Warna Teks Sekunder:** Abu-abu kecokelatan yang lembut (`#7A7A72`).
- **Aksen Utama (Pemasukan/Positif):** Hijau Sage tua (`#4A6741`).
- **Aksen Sekunder (Pengeluaran/Negatif):** Oranye karamel/kecokelatan (`#BC6C25`).

## Komponen Kartu (Cards)
Seluruh blok konten diwadahi dalam kartu bergaya *Glassmorphism*:
- **Background:** `bg-white/60` dipadukan dengan efek `backdrop-blur-2xl` atau `backdrop-blur-xl`.
- **Border (Garis Tepi):** Putih transparan (`border border-white/80`).
- **Sudut (Corner Radius):** Bulat besar dan membumi (`rounded-[32px]` atau `rounded-[28px]`).
- **Bayangan (Shadow):** Sangat tipis dan menyebar (`shadow-[0_8px_32px_rgba(0,0,0,0.04)]`).

## Ikonografi (Iconography)
1. **Pustaka Ikon:** Wajib menggunakan *Lucide React*. **TIDAK MENGGUNAKAN EMOJI** pada antarmuka, kecuali benar-benar diminta.
2. **Tanpa Kotak Pembungkus (No Box):** Ikon dekoratif tidak boleh diberi warna latar belakang yang membentuk kotak/lingkaran padat. Cukup beri warna langsung pada ikon menggunakan utilitas teks Tailwind (contoh: `text-[#4A6741]`).
3. **Ketebalan Ikon (Stroke Width):** Gunakan ketebalan baku dari Lucide, tetapi dapat dipertebal (strokeWidth=2.5) jika digunakan untuk penanda menu yang sedang aktif (Active State).

## Tipografi
- Tidak menggunakan *All-Caps* (huruf kapital semua) untuk judul.
- Gunakan ukuran teks yang jelas (16px / `text-base` sebagai standar).
- Judul saldo atau angka besar menggunakan `tracking-tight` (spasi huruf rapat) agar terlihat premium dan solid.
- Penanda atau lencana kecil (seperti persentase budget) dapat menggunakan huruf kecil tapi tebal (`text-[10px] font-bold uppercase tracking-wider`).

**Pedoman ini dibuat agar desain antarmuka Fanra tetap konsisten, bersih, membumi, dan tidak menggunakan pola AI generik yang kaku.**
