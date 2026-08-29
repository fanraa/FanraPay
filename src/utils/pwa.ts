// Utility to manage PWA install prompt globally

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent standard mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('fanra_pwa_ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    localStorage.getItem('fanra_pwa_installed_or_dismissed') === 'true'
  );
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
    return outcome;
  }
  
  // Fallback for browsers / devices where beforeinstallprompt is not supported (e.g. iOS Safari)
  localStorage.setItem('fanra_pwa_installed_or_dismissed', 'true');
  return 'unsupported';
}
