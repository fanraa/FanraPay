import fs from 'fs';
let content = fs.readFileSync('src/components/PinEntry.tsx', 'utf8');

// Update props
content = content.replace(
  'export default function PinEntry({ correctPin, onSuccess, biometricId }: { correctPin: string, onSuccess: () => void, biometricId?: string | null }) {',
  'export default function PinEntry({ correctPin, onSuccess, faceId, fingerprintId }: { correctPin: string, onSuccess: () => void, faceId?: string | null, fingerprintId?: string | null }) {'
);

// Update useEffect
content = content.replace(
  /if \(biometricId\) \{\s*handleBiometric\(\);\s*\}/,
  'if (faceId) { handleFaceId(); } else if (fingerprintId) { handleFingerprint(); }'
);

// Update handlers
const handleBiometricRegex = /const handleBiometric = async \(\) => \{[\s\S]*?^  \};\n/m;
const newHandlers = `  const handleFaceId = async () => {
    if (!faceId) return;
    try {
      const isValid = await verifyBiometric(faceId);
      if (isValid) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFingerprint = async () => {
    if (!fingerprintId) return;
    try {
      const isValid = await verifyBiometric(fingerprintId);
      if (isValid) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
      }
    } catch (e) {
      console.error(e);
    }
  };\n`;

content = content.replace(handleBiometricRegex, newHandlers);

// Update UI
const oldUIRegex = /\{biometricId \? \([\s\S]*?\) : \(\s*<div \/>\s*\)\}/m;

const newUI = `{faceId || fingerprintId ? (
          <button 
            onClick={faceId ? handleFaceId : handleFingerprint} 
            className="w-16 h-16 rounded-full flex flex-col -space-y-1 items-center justify-center text-[#2D2D2A] bg-white/40 hover:bg-white/80 active:bg-white/60 transition-colors shadow-sm opacity-80" 
            title={faceId && fingerprintId ? "Buka dengan Face ID / Sidik Jari" : faceId ? "Buka dengan Face ID" : "Buka dengan Sidik Jari"}
          >
            {faceId && <ScanFace className="w-6 h-6" />}
            {!faceId && fingerprintId && <Fingerprint className="w-6 h-6" />}
          </button>
        ) : (
          <div />
        )}`;

content = content.replace(oldUIRegex, newUI);
fs.writeFileSync('src/components/PinEntry.tsx', content);
