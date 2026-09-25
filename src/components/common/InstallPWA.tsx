import {useEffect, useState} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

const DISMISS_KEY = 'stech_pwa_dismissed_at';
const DISMISS_DAYS = 7;

function isMobileDevice(): boolean {
  const ua = window.navigator.userAgent;
  // Check UA for mobile/tablet indicators
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  // Also check coarse pointer (touch) + no hover as a strong mobile signal
  const touchOnly =
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(any-pointer: fine)').matches;
  return uaMobile || touchOnly;
}

export default function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1) Only on mobile devices
    if (!isMobileDevice()) return;

    // 2) Respect previous dismissal
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    // 3) Skip if already installed (standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    // 4) iOS Safari — no beforeinstallprompt, show instructions
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (iOS) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    // 5) Android / Chrome — use native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 flex items-start gap-3">
        <img src="/android-icon-96x96.png" alt="App" className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install STech GLOBAL LDA</p>
          <p className="text-xs text-slate-300 mt-1">
            {isIOS
              ? 'Tap Share, then "Add to Home Screen" for the full app experience.'
              : 'Add the app to your home screen for fast access and offline use.'}
          </p>
          <div className="flex gap-2 mt-3">
            {!isIOS && (
              <button
                onClick={install}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 rounded-lg text-xs font-semibold"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}