import { useEffect, useRef, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

function sendSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: 'https://cdn-icons-png.flaticon.com/128/10473/10473393.png',
    badge: 'https://cdn-icons-png.flaticon.com/128/10473/10473393.png',
    tag: 'fanra-sync-notification'
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
  events?: any, setEvents?: any
) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isOwner = useRef(false);
  const skipNextUpload = useRef(false);
  const initialLoadDone = useRef(false);
  const prevTransactionsCount = useRef<number | null>(null);

  useEffect(() => {
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
        skipNextUpload.current = true; // Prevent re-uploading what we just downloaded

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
                `Fanra - ${typeStr}`,
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
        if (data.privateMode !== undefined) setPrivateMode(data.privateMode);
        if (data.accountNumber !== undefined && setAccountNumber) setAccountNumber(data.accountNumber);
        if (data.todos !== undefined && setTodos) setTodos(data.todos);
        if (data.events !== undefined && setEvents) setEvents(data.events);
      }
    }, (err) => {
      console.warn("Firestore snapshot listener notice:", err);
      setIsSyncing(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // Upload changes to Firebase (only if owner)
  useEffect(() => {
    if (!isOwner.current) return;
    if (skipNextUpload.current) {
      skipNextUpload.current = false;
      return;
    }
    
    const uploadData = async () => {
      try {
        const docRef = doc(db, 'fanra', 'irfan_family_data');
        await setDoc(docRef, {
          transactions,
          budget,
          showHistory,
          showNotifications,
          privateMode,
          accountNumber: accountNumber || '',
          todos: todos || [],
          events: events || [],
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firebase sync error:", err);
      }
    };

    // Debounce slightly
    const timeout = setTimeout(uploadData, 1000);
    return () => clearTimeout(timeout);
  }, [transactions, budget, showHistory, showNotifications, privateMode, accountNumber, todos, events]);

  return { isSyncing, currentUser, isAdmin };
}
