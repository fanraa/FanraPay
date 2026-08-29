import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('useFirebaseSync')) {
  content = content.replace(
    "import { useStorage } from './hooks/useStorage';",
    "import { useStorage } from './hooks/useStorage';\nimport { useFirebaseSync } from './hooks/useFirebaseSync';"
  );
  
  const injectTarget = "const [isLoading, setIsLoading] = useState(true);";
  content = content.replace(
    injectTarget,
    `useFirebaseSync(transactions, setTransactions, budget, setBudget, showHistory, setShowHistory, showNotifications, setShowNotifications, privateMode, setPrivateMode);\n  ` + injectTarget
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
