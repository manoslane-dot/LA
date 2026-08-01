'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
    setIsMobileDevice(isMobile);

    if (!isMobile) {
      return;
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (!isMobileDevice) {
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      window.alert('Στο iPhone/iPad: Safari > Κοινοποίηση > Προσθήκη στην Αρχική Οθόνη');
      return;
    }

    if (/android/.test(ua)) {
      window.alert('Στο Android: Chrome > Μενού > Προσθήκη στην αρχική οθόνη');
      return;
    }

    window.alert('Αν δεν εμφανίζεται prompt, άνοιξε την εφαρμογή από Chrome ή Edge και δοκίμασε ξανά.');
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={!isMobileDevice}
      aria-disabled={!isMobileDevice}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        isMobileDevice
          ? 'bg-[#ffd47d] text-[#173b2a] hover:bg-[#ffe1a8]'
          : 'cursor-not-allowed bg-[#f0d9a6] text-[#173b2a]/60'
      }`}
    >
      Εγκατάσταση εφαρμογής
    </button>
  );
}
