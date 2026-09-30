import {useEffect, useRef, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

const SEEN_VERSION_KEY = 'stech_seen_app_version';

export default function UpdatePrompt() {
  const [reloading, setReloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [latchedVisible, setLatchedVisible] = useState(false);
  const reloadTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      setInterval(() => r.update(), 5 * 60 * 1000);
      const onFocus = () => r.update();
      window.addEventListener('focus', onFocus);
    },
  });

  // Latch the banner: once it appears, keep it until user clicks Update
  useEffect(() => {
    if (needRefresh) {
      const seen = localStorage.getItem(SEEN_VERSION_KEY);
      if (seen === __APP_VERSION__) {
        // Already applied this version → don't show again
        setNeedRefresh(false);
        return;
      }
      setLatchedVisible(true);
    }
  }, [needRefresh, setNeedRefresh]);

  // Safety net if reload stalls
  useEffect(() => {
    if (!reloading) return;
    reloadTimer.current = window.setTimeout(() => {
      window.location.reload();
    }, 6000);
    return () => {
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
  }, [reloading]);

  const handleUpdate = async () => {
    if (reloading) return;
    setReloading(true);
    setProgress(0);
    localStorage.setItem(SEEN_VERSION_KEY, __APP_VERSION__);

    const DURATION = 3500;
    const INTERVAL = 50;
    const step = 100 / (DURATION / INTERVAL);
    let current = 0;
    progressTimer.current = window.setInterval(() => {
      current = Math.min(100, current + step);
      setProgress(Math.round(current));
      if (current >= 100 && progressTimer.current) {
        window.clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
    }, INTERVAL);

    try {
      await updateServiceWorker(false);

      await new Promise<void>((resolve) => {
        const check = () => {
          if (progress >= 100) resolve();
          else setTimeout(check, 50);
        };
        setTimeout(check, DURATION);
      });

      setLatchedVisible(false);
      setNeedRefresh(false);
      window.location.reload();
    } catch {
      if (progressTimer.current) window.clearInterval(progressTimer.current);
      window.location.reload();
    }
  };

  // Show while latched OR while needRefresh is true
  if (!latchedVisible && !needRefresh) return null;

  return (
    <div
      id="pwa-update-banner"
      tabIndex={-1}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-md outline-none"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4">
        {!reloading ? (
          <>
            <p className="font-semibold text-sm">New version available</p>
            <p className="text-xs text-slate-300 mt-1">
              STech GLOBAL LDA <span className="text-sky-400">v{__APP_VERSION__}</span> is ready to install.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 rounded-lg text-xs font-semibold"
              >
                Update now
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm">Updating…</p>
            <p className="text-xs text-slate-300 mt-1">
              Installing new version, please wait.
            </p>
            <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-100"
                style={{width: `${progress}%`}}
              />
            </div>
            <p className="text-[11px] text-sky-300 mt-1.5 font-semibold">
              {progress}% {progress >= 100 && '— reloading…'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}