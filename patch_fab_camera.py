import re

with open('src/components/FloatingActionButton.tsx', 'r') as f:
    content = f.read()

live_scanner_old = """function LiveScanner({ onCapture, onGallery, onClose, loading }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(e => console.error(e));
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleFlash = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch !== undefined) {
        track.applyConstraints({
          advanced: [{ torch: !flashOn } as any]
        });
        setFlashOn(!flashOn);
      }
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#1E1E1E] flex flex-col"
    >
      <div className="flex items-center gap-4 p-5 text-white z-20">
        <button onClick={onClose} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-[17px] font-bold">Scan Struk</h2>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Target Box with huge box-shadow for dark overlay */}
        <div className="relative z-10 w-[280px] h-[280px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-sm">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF6B00] -translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF6B00] translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF6B00] -translate-x-[2px] translate-y-[2px]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF6B00] translate-x-[2px] translate-y-[2px]" />
        </div>
        
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1E1E1E]/80 backdrop-blur-sm text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#FF6B00]" />
          </div>
        )}
      </div>

      <div className="bg-[#1E1E1E] p-8 pb-12 flex items-center justify-between z-20">
        <button onClick={toggleFlash} className="flex flex-col items-center gap-2 text-white/80 hover:text-white w-16">
          <Zap className={`w-6 h-6 ${flashOn ? 'text-yellow-400 fill-yellow-400' : ''}`} />
          <span className="text-[11px] font-medium">Flash</span>
        </button>
        
        <button onClick={captureFrame} className="w-[72px] h-[72px] rounded-full border-[3px] border-white/80 flex items-center justify-center">
          <div className="w-[56px] h-[56px] bg-white rounded-full active:scale-90 transition-transform" />
        </button>
        
        <button onClick={onGallery} className="flex flex-col items-center gap-2 text-white/80 hover:text-white w-16">
          <ImageIcon className="w-6 h-6" />
          <span className="text-[11px] font-medium">Galeri</span>
        </button>
      </div>
    </motion.div>
  );
}"""

live_scanner_new = """function LiveScanner({ onCapture, onGallery, onClose, loading }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream;

    const initCamera = async () => {
      try {
        // Coba kamera belakang (HP) dulu
        let s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).catch(() => null);
        
        // Kalau gagal / tidak ada (misal di Laptop), fallback ke kamera mana saja yang ada
        if (!s) {
          s = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          // Pastikan video jalan sebelum bisa dicapture
          videoRef.current.play().catch(console.error);
        }

        const track = s.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities?.();
          if (capabilities && (capabilities as any).torch !== undefined) {
             setHasTorch(true);
          }
        }
      } catch (e) {
        console.error("Camera error: ", e);
        alert("Tidak dapat mengakses kamera. Pastikan memberikan izin atau gunakan tombol Galeri.");
      }
    };

    initCamera();
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleFlash = () => {
    if (stream && hasTorch) {
      const track = stream.getVideoTracks()[0];
      track.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      }).then(() => {
        setFlashOn(!flashOn);
      }).catch(console.error);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.8));
      }
    } else {
      alert("Kamera belum siap, tunggu sebentar lalu coba lagi.");
    }
  };

  // Efek cermin jika menggunakan kamera depan (laptop)
  const isFrontCamera = stream?.getVideoTracks()[0]?.getSettings()?.facingMode !== 'environment';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#1E1E1E] flex flex-col"
    >
      <div className="flex items-center gap-4 p-5 text-white z-20">
        <button onClick={onClose} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-[17px] font-bold">Scan Struk</h2>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`absolute inset-0 w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Target Box with huge box-shadow for dark overlay */}
        <div className="relative z-10 w-[280px] h-[280px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-sm pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF6B00] -translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF6B00] translate-x-[2px] -translate-y-[2px]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF6B00] -translate-x-[2px] translate-y-[2px]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF6B00] translate-x-[2px] translate-y-[2px]" />
        </div>
        
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1E1E1E]/80 backdrop-blur-sm text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#FF6B00]" />
            <span className="text-sm font-medium animate-pulse">Memproses struk...</span>
          </div>
        )}
      </div>

      <div className="bg-[#1E1E1E] p-8 pb-12 flex items-center justify-between z-20">
        <div className="w-16 flex justify-center">
          {hasTorch ? (
            <button onClick={toggleFlash} className="flex flex-col items-center gap-2 text-white/80 hover:text-white">
              <Zap className={`w-6 h-6 ${flashOn ? 'text-yellow-400 fill-yellow-400' : ''}`} />
              <span className="text-[11px] font-medium">Flash</span>
            </button>
          ) : (
             <div />
          )}
        </div>
        
        <button onClick={captureFrame} className="w-[72px] h-[72px] rounded-full border-[3px] border-white/80 flex items-center justify-center">
          <div className="w-[56px] h-[56px] bg-white rounded-full active:scale-90 transition-transform" />
        </button>
        
        <div className="w-16 flex justify-center">
          <button onClick={onGallery} className="flex flex-col items-center gap-2 text-white/80 hover:text-white">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[11px] font-medium">Galeri</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}"""

content = content.replace(live_scanner_old, live_scanner_new)

# Add admin check
content = content.replace("""  if (activeTab && activeTab !== 'dashboard') return null;""", """  if (previewMode) return null;
  if (activeTab && activeTab !== 'dashboard') return null;""")

with open('src/components/FloatingActionButton.tsx', 'w') as f:
    f.write(content)

