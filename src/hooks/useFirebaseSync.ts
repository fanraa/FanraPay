import { useEffect, useRef, useState } from 'react';
import { db, auth, checkRedirectLogin } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
  }

  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefined(value)])
    ) as T;
  }

  return obj;
}

function sendSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'fanrapay-sync-notification'
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    }).catch(() => {
      try {
        new Notification(title, options);
      } catch (e) {}
    });
  } else {
    try {
      new Notification(title, options);
    } catch (e) {}
  }
}

export function useFirebaseSync(
  transactions: any, setTransactions: any,
  budget: any, setBudget: any,
  showHistory: any, setShowHistory: any,
  showNotifications: any, setShowNotifications: any,
  privateMode: any, setPrivateMode: any,
  accountNumber?: any, setAccountNumber?: any,
  todos?: any, setTodos?: any,
  events?: any, setEvents?: any,
  expressionIndex?: any, setExpressionIndex?: any
) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const isOwner = useRef(false);
  const initialLoadDone = useRef(false);
  const prevTransactionsCount = useRef<number | null>(null);
  const lastDownloadedRef = useRef<string>('');

  useEffect(() => {
    checkRedirectLogin();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const isUserAdmin = Boolean(
        user && 
        (user.email === 'irfanrizkiaditri@gmail.com' || user.email === 'irfanrizkiaditri02@gmail.com')
      );
      setIsAdmin(isUserAdmin);
      isOwner.current = isUserAdmin;
    });

    const docRef = doc(db, 'fanra', 'irfan_family_data');
    
    // Listen to Firebase
    const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      setIsSyncing(false);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Simpan versi stringified dari data Firebase untuk perbandingan
        lastDownloadedRef.current = JSON.stringify({
          transactions: data.transactions || [],
          budget: data.budget !== undefined ? data.budget : 5000000,
          showHistory: data.showHistory !== undefined ? data.showHistory : true,
          showNotifications: data.showNotifications !== undefined ? data.showNotifications : false,
          privateMode: data.privateMode !== undefined ? data.privateMode : false,
          accountNumber: data.accountNumber || '',
          todos: data.todos || [],
          events: data.events || [],
          status: data.status !== undefined ? data.status : 0
        });

        if (data.transactions) {
          // Check if there are new transactions added
          if (initialLoadDone.current && prevTransactionsCount.current !== null && data.transactions.length > prevTransactionsCount.current) {
            const latestTx = data.transactions[data.transactions.length - 1];
            if (showNotifications && latestTx) {
              const amountStr = data.privateMode 
                ? 'Rp ••••••' 
                : `Rp ${Number(latestTx.amount || 0).toLocaleString('id-ID')}`;
              const typeStr = latestTx.type === 'expense' ? 'Pengeluaran Baru' : 'Pemasukan Baru';
              sendSystemNotification(
                `FanraPay - ${typeStr}`,
                `${latestTx.category || 'Transaksi'}: ${latestTx.description ? `${latestTx.description} (${amountStr})` : amountStr}`
              );
            }
          }

          setTransactions(data.transactions);
          prevTransactionsCount.current = data.transactions.length;
          initialLoadDone.current = true;
        }

        if (data.budget !== undefined) setBudget(data.budget);
        if (data.showHistory !== undefined) setShowHistory(data.showHistory);
        if (data.showNotifications !== undefined && setShowNotifications) setShowNotifications(data.showNotifications);
        if (data.privateMode !== undefined) setPrivateMode(data.privateMode);
        if (data.accountNumber !== undefined && setAccountNumber) setAccountNumber(data.accountNumber);
        if (data.todos !== undefined && setTodos) setTodos(data.todos);
        if (data.events !== undefined && setEvents) setEvents(data.events);
        if (data.status !== undefined && setExpressionIndex) setExpressionIndex(data.status);
      }
    }, (err) => {
      console.warn("Firestore snapshot listener notice:", err);
      setIsSyncing(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshTrigger]);

  // Upload changes to Firebase (only if owner)
  useEffect(() => {
    if (!isOwner.current) return;
    
    const currentDataString = JSON.stringify({
      transactions: transactions || [],
      budget: budget !== undefined ? budget : 5000000,
      showHistory: showHistory !== undefined ? showHistory : true,
      showNotifications: showNotifications !== undefined ? showNotifications : false,
      privateMode: privateMode !== undefined ? privateMode : false,
      accountNumber: accountNumber || '',
      todos: todos || [],
      events: events || [],
      status: expressionIndex !== undefined ? expressionIndex : 0
    });

    const hasChanges = currentDataString !== lastDownloadedRef.current;
    setHasUnsyncedChanges(!isOnline && hasChanges);

    // Jika data lokal sama dengan data yang terakhir diunduh/diupload, jangan upload ulang
    if (!hasChanges) {
      return;
    }
    if (!isOnline) {
      return;
    }

    const uploadData = async () => {
      try {
        const docRef = doc(db, 'fanra', 'irfan_family_data');
        const dataToUpload = removeUndefined({
          transactions: transactions || [],
          budget: budget !== undefined ? budget : 5000000,
          showHistory: showHistory !== undefined ? showHistory : true,
          showNotifications: showNotifications !== undefined ? showNotifications : false,
          privateMode: privateMode !== undefined ? privateMode : false,
          accountNumber: accountNumber || '',
          todos: todos || [],
          events: events || [],
          status: expressionIndex !== undefined ? expressionIndex : 0,
          updatedAt: new Date().toISOString()
        });

        await setDoc(docRef, dataToUpload);
        
        // Update referensi terakhir agar kita tahu data ini sudah tersinkronisasi
        lastDownloadedRef.current = JSON.stringify({
          transactions: dataToUpload.transactions,
          budget: dataToUpload.budget,
          showHistory: dataToUpload.showHistory,
          showNotifications: dataToUpload.showNotifications,
          privateMode: dataToUpload.privateMode,
          accountNumber: dataToUpload.accountNumber,
          todos: dataToUpload.todos,
          events: dataToUpload.events,
          status: dataToUpload.status
        });
      } catch (err) {
        console.error("Firebase sync error:", err);
      }
    };

    // Debounce slightly
    const timeout = setTimeout(uploadData, 300);
    return () => clearTimeout(timeout);
  }, [transactions, budget, showHistory, showNotifications, privateMode, accountNumber, todos, events, expressionIndex, isOnline]);

  const forceRefresh = () => {
    setIsSyncing(true);
    setRefreshTrigger(prev => prev + 1);
  };

  return { isSyncing, currentUser, isAdmin, forceRefresh, isOnline, hasUnsyncedChanges };
}
