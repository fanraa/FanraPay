const fs = require('fs');
let content = fs.readFileSync('src/components/Family.tsx', 'utf8');

// Update Props interface
content = content.replace('biometricId: string | null;', 'faceId: string | null;\n  setFaceId: (val: string | null) => void;\n  fingerprintId: string | null;\n  setFingerprintId: (val: string | null) => void;');
content = content.replace('setBiometricId: (val: string | null) => void;', '');

// Update component args
content = content.replace('biometricId, setBiometricId', 'faceId, setFaceId, fingerprintId, setFingerprintId');

// Replace handleToggleBiometric with two handlers
const oldHandlerRegex = /const handleToggleBiometric = async \(\) => \{[\s\S]*?^  \};\n/m;
const newHandlers = `  const handleToggleFaceId = async () => {
    if (!isBiometricSupported()) {
      alert("Perangkat atau browser Anda tidak mendukung fitur Face ID.");
      return;
    }
    if (faceId) {
      setFaceId(null);
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFaceId(newId);
          alert("Face ID berhasil didaftarkan!");
        } else {
          alert("Gagal mendaftarkan Face ID. Buka aplikasi di Tab Baru (ikon ↗ di pojok atas).");
        }
      } catch (err: any) {
        if (err.message && err.message.includes('publickey-credentials-create')) {
          alert("Face ID tidak bisa diaktifkan di mode pratinjau. BUKA DI TAB BARU (klik ikon panah ↗ di pojok kanan atas).");
        } else {
          alert("Terjadi kesalahan saat mendaftarkan Face ID.");
        }
      }
    }
  };

  const handleToggleFingerprint = async () => {
    if (!isBiometricSupported()) {
      alert("Perangkat atau browser Anda tidak mendukung fitur Sidik Jari.");
      return;
    }
    if (fingerprintId) {
      setFingerprintId(null);
    } else {
      try {
        const newId = await registerBiometric();
        if (newId) {
          setFingerprintId(newId);
          alert("Sidik Jari berhasil didaftarkan!");
        } else {
          alert("Gagal mendaftarkan Sidik Jari. Buka aplikasi di Tab Baru (ikon ↗ di pojok atas).");
        }
      } catch (err: any) {
        if (err.message && err.message.includes('publickey-credentials-create')) {
          alert("Sidik Jari tidak bisa diaktifkan di mode pratinjau. BUKA DI TAB BARU (klik ikon panah ↗ di pojok kanan atas).");
        } else {
          alert("Terjadi kesalahan saat mendaftarkan Sidik Jari.");
        }
      }
    }
  };
`;

content = content.replace(oldHandlerRegex, newHandlers);
fs.writeFileSync('src/components/Family.tsx', content);
