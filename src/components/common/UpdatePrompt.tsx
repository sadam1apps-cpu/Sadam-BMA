import {useEffect, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const [reloading, setReloading] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      // Check for updates every 5 minutes while app is open
      setInterval(() => r.update(), 5 * 60 * 1000);
      // And when tab regains focus
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

  const handleUpdate = async () => {
    setReloading(true);
    try {
      await updateServiceWorker(true); // waits + reloads
    } catch {
      setReloading(false);
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