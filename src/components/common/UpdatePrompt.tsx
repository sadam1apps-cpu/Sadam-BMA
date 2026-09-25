import {useEffect, useRef, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const [reloading, setReloading] = useState(false);
  const reloadTimer = useRef<number | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      // Poll for updates every 5 minutes
      setInterval(() => r.update(), 5 * 60 * 1000);
      // And when the tab regains focus
      const onFocus = () => r.update();
      window.addEventListener('focus', onFocus);
      // And every 30 minutes
      setInterval(() => r.update(), 30 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const el = document.getElementById('pwa-update-banner');
    el?.focus();
  }, [needRefresh]);

  // Safety net: if reload stalls > 4s, force-reload anyway
  useEffect(() => {
    if (!reloading) return;
    reloadTimer.current = window.setTimeout(() => {
      window.location.reload();
    }, 4000);
    return () => {
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
  }, [reloading]);

  const handleUpdate = async () => {
    if (reloading) return;
    setReloading(true);
    try {
      // Activates the new SW and, when it takes control, reloads the page.
      await updateServiceWorker(true);
      // Fallback in case updateServiceWorker never resolves but SW is active:
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
      window.location.reload();
    } catch {
      // Even on error, force reload so user isn't stuck.
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <div
      id="pwa-update-banner"
      tabIndex={-1}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-md outline-none"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4">
        <p className="font-semibold text-sm">New version available</p>
        <p className="text-xs text-slate-300 mt-1">
          STech GLOBAL LDA <span className="text-sky-400">v{__APP_VERSION__}</span> is ready to install.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleUpdate}
            disabled={reloading}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 rounded-lg text-xs font-semibold"
          >
            {reloading ? 'Updating…' : 'Update now'}
          </button>
        </div>
        {reloading && (
          <p className="text-[11px] text-emerald-400 mt-2">
            ✓ Update installed — reloading…
          </p>
        )}
      </div>
    </div>
  );
}