import { useEffect, useState } from 'react';

// vite.config.ts is value ko build ke waqt daalta hai
declare const __APP_VERSION__: string;

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && data.version !== __APP_VERSION__) {
          setUpdateAvailable(true);
        }
      } catch {
        // version.json nahi mili (jaise dev mode me) ya internet nahi: kuch mat karo
      }
    }

    check();
    const timer = setInterval(check, 60000); // har 1 minute me check
    const onVisible = () => {
      if (document.visibilityState === 'visible') check(); // app wapas khulte hi check
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-blue-600 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <span className="font-semibold">Naya update aaya hai</span>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1 bg-white text-blue-700 font-bold rounded-lg"
      >
        Update now
      </button>
    </div>
  );
}