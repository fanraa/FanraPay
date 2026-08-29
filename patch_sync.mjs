import fs from 'fs';
let content = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

if (!content.includes('const [isSyncing, setIsSyncing]')) {
  content = content.replace(/import \{ useEffect, useRef \} from 'react';/, "import { useEffect, useRef, useState } from 'react';");
  
  content = content.replace(/export function useFirebaseSync\([\s\S]*?\) \{/, (match) => {
    return match + "\n  const [isSyncing, setIsSyncing] = useState(true);\n";
  });

  content = content.replace(/const unsubscribeSnapshot = onSnapshot\(docRef, \(docSnap\) => \{/, `const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {\n      setIsSyncing(false);`);
  
  content = content.replace(/return \(\) => clearTimeout\(timeout\);\n  \}, \[.*?\]\);/, (match) => {
    return match + "\n\n  return { isSyncing };";
  });

  fs.writeFileSync('src/hooks/useFirebaseSync.ts', content);
}
