import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { sound } from '../../lib/sound';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    try {
      const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsStandalone(Boolean(checkStandalone));
    } catch (e) {
      // Safe fallback
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
      alert('To install Bangar Bhavan Chats POS as an app on your mobile device:\n\n1. Tap your browser menu (⋮ or share icon)\n2. Select "Add to Home screen" or "Install App".');
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-cream-50 border-2 border-deepred-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative overflow-hidden">
        {/* Decorative Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-deepred-800 text-softyellow-300 rounded-2xl shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-softyellow-200 text-deepred-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>PWA App Experience</span>
              </div>
              <h3 className="font-display font-extrabold text-base text-darkbrown-900 leading-tight">
                Install Bangar Bhavan POS
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-full hover:bg-cream-200 text-darkbrown-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-2 bg-white/80 p-3.5 rounded-2xl border border-cream-200 text-xs text-darkbrown-700 leading-relaxed font-medium">
          <p>
            Add Bangar Bhavan Chats to your mobile home screen for <strong>1-tap instant launching</strong>, full-screen billing, and <strong>fast offline processing</strong>!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-3 px-4 rounded-xl bg-deepred-800 hover:bg-deepred-900 active:scale-95 text-cream-50 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg border border-deepred-900 transition-all"
          >
            <Download className="w-4 h-4 text-softyellow-300" />
            <span>INSTALL APP NOW</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="py-3 px-4 rounded-xl bg-cream-200 hover:bg-cream-300 text-darkbrown-800 font-bold text-xs transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
