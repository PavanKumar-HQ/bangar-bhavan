import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { sound } from '../../lib/sound';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    try {
      const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsStandalone(Boolean(checkStandalone));

      const checkMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(checkMobile);
    } catch (e) {
      // Safe fallback
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInstallClick = async () => {
    sound.playSuccess();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsDismissed(true);
        }
      } catch (e) {}
      setDeferredPrompt(null);
    } else {
      alert('To install Bangar Bhavan Chats POS as an app on Android:\n1. Tap your browser menu (⋮)\n2. Select "Add to Home screen" or "Install App".');
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <div className="bg-softyellow-200 border-b-2 border-warmorange-500 px-3 py-2 text-darkbrown-900 shadow-md flex items-center justify-between gap-2 z-40">
      <div className="flex items-center gap-2 text-xs font-bold min-w-0">
        <div className="p-1.5 bg-deepred-800 text-cream-50 rounded-lg shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="truncate">
          <span className="font-extrabold text-deepred-800">
            {isMobile ? 'Mobile POS Ready!' : 'PWA Install Ready!'}
          </span>
          <span className="hidden sm:inline ml-1.5 text-darkbrown-700">
            Install Bangar Bhavan Chats app on your home screen for fast 1-tap offline billing.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="py-1.5 px-3 rounded-lg bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 border border-deepred-900"
        >
          <Download className="w-3.5 h-3.5 text-softyellow-300" />
          <span>INSTALL APP</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded hover:bg-softyellow-300 text-darkbrown-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
