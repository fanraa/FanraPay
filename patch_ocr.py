import re

with open('src/components/FloatingActionButton.tsx', 'r') as f:
    content = f.read()

old_ocr_block = """  const performOCR = async (imageSrc: string) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'ind+eng');
      const lines = text.split('\\n').map(l => l.trim().toUpperCase());
      
      let maxAmount = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Pintar: Cari keyword indikasi harga total
        if (/(TOTAL|CASH|TUNAI|BAYAR|NETTO|JUMLAH|HARGA|KEMBALI)/.test(line)) {
          const nums = line.match(/\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
          if (nums) {
            nums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 100000000) maxAmount = clean;
            });
          }
          // Cek juga baris di bawahnya barangkali harganya di bawah kata TOTAL
          if (i + 1 < lines.length) {
            const nextNums = lines[i+1].match(/\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
            if (nextNums) {
              nextNums.forEach(n => {
                const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
                if (clean > maxAmount && clean < 100000000) maxAmount = clean;
              });
            }
          }
        }
      }

      let foundDate = date;
      // Pintar: Cari format dd/mm/yy atau dd-mm-yyyy atau yyyy/mm/dd
      const dateMatch = text.match(/\\b(\\d{1,4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,4})\\b/);
      if (dateMatch) {
        let d = dateMatch[1];
        let m = dateMatch[2];
        let y = dateMatch[3];
        if (d.length === 4) { y = d; d = dateMatch[3]; } // yyyy-mm-dd
        d = d.padStart(2, '0');
        m = m.padStart(2, '0');
        if (y.length === 2) y = '20' + y;
        foundDate = `${y}-${m}-${d}`;
      }

      let foundTime = time;
      const timeMatch = text.match(/\\b(\\d{1,2}):(\\d{2})(?::\\d{2})?\\b/);
      if (timeMatch) {
        let h = timeMatch[1].padStart(2, '0');
        foundTime = `${h}:${timeMatch[2]}`;
      }

      const lowerText = text.toLowerCase();
      let foundCategory = 'Lainnya';
      let foundNote = '';
      
      // Pintar: Kategorisasi otomatis berdasarkan keyword brand / barang
      if (/indomaret|alfamart|superindo|transmart|hypermart|yogya|midi|belanja|minimarket|toko|mart|hero|lotte/.test(lowerText)) {
        foundCategory = 'Belanja';
        if (lowerText.includes('indomaret')) foundNote = 'Indomaret';
        else if (lowerText.includes('alfamart')) foundNote = 'Alfamart';
        else foundNote = 'Minimarket';
      } else if (/kopi|cafe|nasi|ayam|restoran|makan|minum|warung|teh|food|drink|resto|kitchen|bakso|soto|mie|starbucks|kfc|mcd/.test(lowerText)) {
        foundCategory = 'Makanan & Minuman';
        foundNote = 'Makan/Minum';
      } else if (/gojek|grab|maxim|tol|parkir|bensin|spbu|pertamina|shell|tiket|kereta|kai|pesawat/.test(lowerText)) {
        foundCategory = 'Transportasi';
        if (lowerText.includes('gojek')) foundNote = 'Gojek';
        else if (lowerText.includes('grab')) foundNote = 'Grab';
        else if (lowerText.includes('spbu') || lowerText.includes('pertamina')) foundNote = 'Bensin';
        else foundNote = 'Transportasi';
      } else if (/apotek|kimia farma|k24|rumah sakit|klinik|obat/.test(lowerText)) {
        foundCategory = 'Kesehatan';
        foundNote = 'Kesehatan / Obat';
      } else if (/pln|pdam|telkomsel|indosat|xl|tagihan|internet|wifi/.test(lowerText)) {
        foundCategory = 'Tagihan';
        foundNote = 'Tagihan Bulanan';
      }

      // Pastikan kalau gagal nyari TOTAL spesifik, cari angka terbesar di seluruh struk yang wajar
      if (maxAmount === 0) {
        const allNums = text.match(/\\d{2,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?/g);
        if (allNums) {
           allNums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 5000000) maxAmount = clean;
           });
        }
      }"""

new_ocr_block = """  const performOCR = async (imageSrc: string) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'ind+eng');
      const lines = text.split('\\n').map(l => l.trim().toUpperCase());
      
      let maxAmount = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(TOTAL|CASH|TUNAI|BAYAR|NETTO|JUMLAH|HARGA|KEMBALI|NOMINAL)/.test(line)) {
          const nums = line.match(/\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d{4,}/g);
          if (nums) {
            nums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 100000000) maxAmount = clean;
            });
          }
          if (i + 1 < lines.length) {
            const nextNums = lines[i+1].match(/\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d{4,}/g);
            if (nextNums) {
              nextNums.forEach(n => {
                const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
                if (clean > maxAmount && clean < 100000000) maxAmount = clean;
              });
            }
          }
        }
      }

      let foundDate = date;
      const dateMatch1 = text.match(/\\b(\\d{1,4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,4})\\b/);
      const dateMatch2 = text.match(/\\b(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Agt|Sep|Oct|Okt|Nov|Dec|Des)[a-z]*\\s+(\\d{4})\\b/i);

      if (dateMatch1) {
        let d = dateMatch1[1];
        let m = dateMatch1[2];
        let y = dateMatch1[3];
        if (d.length === 4) { y = d; d = dateMatch1[3]; }
        d = d.padStart(2, '0');
        m = m.padStart(2, '0');
        if (y.length === 2) y = '20' + y;
        foundDate = `${y}-${m}-${d}`;
      } else if (dateMatch2) {
        let d = dateMatch2[1].padStart(2, '0');
        let y = dateMatch2[3];
        const monthStr = dateMatch2[2].toLowerCase();
        const months: Record<string, string> = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',mei:'05',jun:'06',jul:'07',aug:'08',agt:'08',sep:'09',oct:'10',okt:'10',nov:'11',dec:'12',des:'12'};
        let m = months[monthStr] || '01';
        foundDate = `${y}-${m}-${d}`;
      }

      let foundTime = time;
      const timeMatch = text.match(/\\b(\\d{1,2}):(\\d{2})(?::\\d{2})?\\b/);
      if (timeMatch) {
        let h = timeMatch[1].padStart(2, '0');
        foundTime = `${h}:${timeMatch[2]}`;
      }

      const lowerText = text.toLowerCase();
      let foundCategory = 'Lainnya';
      let foundNote = '';
      
      const noteMatch = text.match(/Catatan\\s+(.+)/i);
      if (noteMatch) {
          foundNote = noteMatch[1].trim();
      }

      if (/ukt|spp|sekolah|kampus|kuliah|pendidikan|sks/.test(lowerText)) {
        foundCategory = 'Pendidikan';
        if (!foundNote) foundNote = 'Pendidikan';
      } else if (/indomaret|alfamart|superindo|transmart|hypermart|yogya|midi|belanja|minimarket|toko|mart|hero|lotte/.test(lowerText)) {
        foundCategory = 'Belanja';
        if (!foundNote) {
            if (lowerText.includes('indomaret')) foundNote = 'Indomaret';
            else if (lowerText.includes('alfamart')) foundNote = 'Alfamart';
            else foundNote = 'Minimarket';
        }
      } else if (/kopi|cafe|nasi|ayam|restoran|makan|minum|warung|teh|food|drink|resto|kitchen|bakso|soto|mie|starbucks|kfc|mcd/.test(lowerText)) {
        foundCategory = 'Makanan & Minuman';
        if (!foundNote) foundNote = 'Makan/Minum';
      } else if (/gojek|grab|maxim|tol|parkir|bensin|spbu|pertamina|shell|tiket|kereta|kai|pesawat/.test(lowerText)) {
        foundCategory = 'Transportasi';
        if (!foundNote) {
            if (lowerText.includes('gojek')) foundNote = 'Gojek';
            else if (lowerText.includes('grab')) foundNote = 'Grab';
            else if (lowerText.includes('spbu') || lowerText.includes('pertamina')) foundNote = 'Bensin';
            else foundNote = 'Transportasi';
        }
      } else if (/apotek|kimia farma|k24|rumah sakit|klinik|obat/.test(lowerText)) {
        foundCategory = 'Kesehatan';
        if (!foundNote) foundNote = 'Kesehatan / Obat';
      } else if (/pln|pdam|telkomsel|indosat|xl|tagihan|internet|wifi/.test(lowerText)) {
        foundCategory = 'Tagihan';
        if (!foundNote) foundNote = 'Tagihan Bulanan';
      }

      if (maxAmount === 0) {
        const allNums = text.match(/\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d{4,}/g);
        if (allNums) {
           allNums.forEach(n => {
              const clean = parseInt(n.replace(/[^\\d]/g, ''), 10);
              if (clean > maxAmount && clean < 50000000) maxAmount = clean;
           });
        }
      }"""

if old_ocr_block in content:
    new_content = content.replace(old_ocr_block, new_ocr_block)
    with open('src/components/FloatingActionButton.tsx', 'w') as f:
        f.write(new_content)
    print("Patch applied successfully")
else:
    print("Old block not found!")
