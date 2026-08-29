import { useState, useEffect } from 'react';

export function useStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage (likely QuotaExceededError):', error);
      alert('Penyimpanan penuh! Gagal menyimpan data (mungkin karena ukuran foto terlalu besar). Coba hapus beberapa transaksi atau gunakan foto berukuran kecil.');
    }
  }, [key, value]);

  return [value, setValue] as const;
}
