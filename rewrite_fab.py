import re

with open('src/components/FloatingActionButton.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport Tesseract from 'tesseract.js';\nimport { Loader2 } from 'lucide-react';")

# Change state
content = content.replace("const [defaultType, setDefaultType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');", "const [defaultType, setDefaultType] = useState<'pemasukan' | 'pengeluaran' | 'scan'>('pengeluaran');")

# Add Scan button in FAB
scan_btn = """
              <button
                onClick={() => { setActive(false); setDefaultType('scan'); setShowModal(true); }}
                className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-full shadow-md hover:bg-gray-50 border border-black/5 text-[#4A6741] font-bold text-[13px] whitespace-nowrap"
              >
                Scan Struk
                <div className="w-6 h-6 rounded-full bg-[#4A6741]/10 flex items-center justify-center">
                  <img src="https://cdn-icons-png.flaticon.com/128/16702/16702887.png" alt="Scan" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(16%) saturate(1661%) hue-rotate(63deg) brightness(97%) contrast(89%)' }} />
                </div>
              </button>"""
content = content.replace("              <button\n                onClick={() => { setActive(false); setDefaultType('pengeluaran');", scan_btn + "\n              <button\n                onClick={() => { setActive(false); setDefaultType('pengeluaran');")

# Change QuickAddModal signature
content = content.replace("function QuickAddModal({ defaultType, onClose, onAddTransaction }: { defaultType: 'pemasukan'|'pengeluaran', onClose: () => void, onAddTransaction: (t: Transaction) => void }) {", "function QuickAddModal({ defaultType, onClose, onAddTransaction }: { defaultType: 'pemasukan'|'pengeluaran'|'scan', onClose: () => void, onAddTransaction: (t: Transaction) => void }) {")

# Add states inside QuickAddModal
new_states = """
  const [type, setType] = useState<'pemasukan'|'pengeluaran'>(defaultType === 'scan' ? 'pengeluaran' : defaultType);
  const [isScanningMode, setIsScanningMode] = useState(defaultType === 'scan');
  const [ocrLoading, setOcrLoading] = useState(false);"""
content = content.replace("  const type = defaultType;", new_states)

# Add OCR logic
ocr_logic = """
  const performOCR = async (imageSrc: string) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'ind+eng');
      const allNumbers = text.match(/\\b\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{2})?\\b|\\b\\d{4,}\\b/g);
      let maxAmount = 0;
      if (allNumbers) {
         const parsed = allNumbers.map(n => parseInt(n.replace(/[^0-9]/g, ''), 10));
         maxAmount = Math.max(...parsed);
      }
      if (maxAmount > 0) {
        setAmount(maxAmount.toString());
        setDisplayAmount(maxAmount.toLocaleString('id-ID'));
      }
      setPhoto(imageSrc);
      setIsScanningMode(false);
    } catch (error) {
      console.error(error);
      setIsScanningMode(false);
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePhotoUploadForScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        performOCR(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
"""

content = content.replace("  const handleAmountChange", ocr_logic + "\n  const handleAmountChange")

# Update render logic
render_top = """
        <h2 className="text-[17px] font-bold text-[#2D2D2A] mb-5 flex items-center gap-2">
          {isScanningMode ? (
            <><img src="https://cdn-icons-png.flaticon.com/128/16702/16702887.png" alt="Scan" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(16%) saturate(1661%) hue-rotate(63deg) brightness(97%) contrast(89%)' }} /> Scan Struk / Foto</>
          ) : type === 'pemasukan' ? (
            <><ArrowDownRight className="w-5 h-5 text-[#4A6741]" /> Tambah Pemasukan</>
          ) : (
            <><ArrowUpRight className="w-5 h-5 text-[#E63946]" /> Tambah Pengeluaran</>
          )}
        </h2>
        {isScanningMode ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            {ocrLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#4A6741] animate-spin" />
                <p className="text-[12px] text-[#7A7A72] font-medium text-center">Membaca teks dari gambar...<br/>(Diproses secara lokal)</p>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-[#7A7A72] font-medium text-center mb-2">Pilih foto struk belanja untuk mengekstrak nominal secara otomatis.</p>
                <div className="flex gap-3 w-full">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F0EFEC]/50 hover:bg-[#F0EFEC] border border-[#E8E6E1] border-dashed rounded-2xl p-4 text-[#4A6741] transition-all">
                    <FileImage className="w-6 h-6" />
                    <span className="text-[11px] font-bold">Galeri</span>
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F0EFEC]/50 hover:bg-[#F0EFEC] border border-[#E8E6E1] border-dashed rounded-2xl p-4 text-[#4A6741] transition-all">
                    <Camera className="w-6 h-6" />
                    <span className="text-[11px] font-bold">Kamera</span>
                  </button>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUploadForScan} />
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handlePhotoUploadForScan} />
                
                <button type="button" onClick={() => setIsScanningMode(false)} className="mt-4 text-[11px] font-bold text-[#7A7A72] hover:text-[#2D2D2A]">
                  Isi Manual Saja
                </button>
              </>
            )}
          </div>
        ) : (
"""

content = content.replace("""        <h2 className="text-[17px] font-bold text-[#2D2D2A] mb-5 flex items-center gap-2">
          {type === 'pemasukan' ? (
            <><ArrowDownRight className="w-5 h-5 text-[#4A6741]" /> Tambah Pemasukan</>
          ) : (
            <><ArrowUpRight className="w-5 h-5 text-[#E63946]" /> Tambah Pengeluaran</>
          )}
        </h2>""", render_top)

# Add closing tag for isScanningMode ternary
content = content.replace("""        </form>
      </motion.div>""", """        </form>
        )}
      </motion.div>""")

with open('src/components/FloatingActionButton.tsx', 'w') as f:
    f.write(content)
