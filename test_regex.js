const text = `
Transaksi Berhasil
Tanggal 18 Aug 2022 | 08:39:47 WIB
Nomor Referensi 465840126470
Sumber Dana HILMA ATIFA ANANDA
0286 **** **** 501
Jenis Transaksi Transfer Bank Lain
Bank Tujuan BANK BJB SYARIAH
Nomor Tujuan 8883482203500021
Nama Tujuan HARIRI IMANUL
MUSTAQIM
Catatan bayar UKT UIN
Lihat Lebih Sedikit
Nominal Rp2.988.000
Biaya Admin Rp6.500
`;

let maxAmount = 0;
const lines = text.split('\n').map(l => l.trim().toUpperCase());

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(TOTAL|CASH|TUNAI|BAYAR|NETTO|JUMLAH|HARGA|KEMBALI|NOMINAL)/.test(line)) {
        // match amounts like Rp2.988.000 or 2,988,000 or 10000
        const nums = line.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d{4,}/g);
        if (nums) {
            nums.forEach(n => {
                const clean = parseInt(n.replace(/[^\d]/g, ''), 10);
                if (clean > maxAmount && clean < 100000000) maxAmount = clean;
            });
        }
    }
}
if (maxAmount === 0) {
    const allNums = text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?/g);
    if (allNums) {
        allNums.forEach(n => {
            const clean = parseInt(n.replace(/[^\d]/g, ''), 10);
            if (clean > maxAmount && clean < 50000000) maxAmount = clean;
        });
    }
}
console.log("Max amount:", maxAmount);
