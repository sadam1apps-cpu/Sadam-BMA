import {useEffect, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const [reloading, setReloading] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        // Check for updates every 60 minutes while app is open
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    // Focus the update banner for accessibility
    const el = document.getElementById('pwa-update-banner');
    el?.focus();
  }, [needRefresh]);

  const handleUpdate = async () => {
    setReloading(true);
    try {
      await updateServiceWorker(true); // reloads automatically
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
        <p className="font-semibold text-sm">Update available</p>
        <p className="text-xs text-slate-300 mt-1">
          A new version of STech GLOBAL LDA is ready.
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