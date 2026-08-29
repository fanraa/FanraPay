const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  "onRefresh",
  "onRefresh,\n  isOnline = true"
);

// Update status text logic
code = code.replace(
  "{(isSyncing || isRefreshing) ? `menyinkronkan${dots}` : 'tersinkron'}",
  "{!isOnline ? (previewMode ? 'Offline - Mode Baca' : 'Offline - Tertunda') : ((isSyncing || isRefreshing) ? `menyinkronkan${dots}` : 'tersinkron')}"
);

// Prevent Edit Account Number if offline
code = code.replace(
  "onClick={() => { setIsEditingAccount(true); setTempAccountNumber(accountNumber); }}",
  "onClick={() => { if(isOnline) { setIsEditingAccount(true); setTempAccountNumber(accountNumber); } }}"
);
code = code.replace(
  "className=\"text-white/40 hover:text-white transition-all ml-1 p-0.5\"",
  "className={`transition-all ml-1 p-0.5 ${isOnline ? 'text-white/40 hover:text-white' : 'text-white/20 cursor-not-allowed'}`} title={isOnline ? 'Edit Rekening' : 'Edit dinonaktifkan (Offline)'}"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
