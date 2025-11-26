import { useState, useEffect } from 'react';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');

    if (stored) {
      try {
        if (stored === 'all') {
          const persistedConsent = { necessary: true, analytics: true, marketing: true };
          setConsent(persistedConsent);
          loadScriptsBasedOnConsent(persistedConsent);
        } else if (stored === 'necessary') {
          const persistedConsent = { necessary: true, analytics: false, marketing: false };
          setConsent(persistedConsent);
          loadScriptsBasedOnConsent(persistedConsent);
        } else {
          const parsed = JSON.parse(stored);
          const persistedConsent = {
            necessary: parsed.necessary ?? true,
            analytics: parsed.analytics ?? false,
            marketing: parsed.marketing ?? false
          };
          setConsent(persistedConsent);
          loadScriptsBasedOnConsent(persistedConsent);
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        const fallbackConsent = { necessary: true, analytics: false, marketing: false };
        setConsent(fallbackConsent);
        loadScriptsBasedOnConsent(fallbackConsent);
      }
    } else {
      setConsent(null); // No consent given yet
    }

    setIsLoading(false);
  }, []);

  const updateConsent = (newConsent: CookieConsent) => {
    setConsent(newConsent);
    localStorage.setItem('cookie_consent', JSON.stringify(newConsent));

    // Load/unload scripts based on new consent
    loadScriptsBasedOnConsent(newConsent);
  };

  const acceptAll = () => {
    const allConsent = { necessary: true, analytics: true, marketing: true };
    updateConsent(allConsent);
  };

  const rejectAll = () => {
    const necessaryOnly = { necessary: true, analytics: false, marketing: false };
    updateConsent(necessaryOnly);
  };

  return {
    consent,
    isLoading,
    updateConsent,
    acceptAll,
    rejectAll,
    hasConsent: consent !== null
  };
};

// Function to load/unload scripts based on consent
const loadScriptsBasedOnConsent = (consent: CookieConsent) => {
  // Marketing scripts (InMobi or others) can be added here
  if (consent.marketing) {
    console.log('Marketing consent granted');
  }
};
