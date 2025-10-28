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
          setConsent({ necessary: true, analytics: true, marketing: true });
        } else if (stored === 'necessary') {
          setConsent({ necessary: true, analytics: false, marketing: false });
        } else {
          const parsed = JSON.parse(stored);
          setConsent({
            necessary: parsed.necessary ?? true,
            analytics: parsed.analytics ?? false,
            marketing: parsed.marketing ?? false
          });
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        setConsent({ necessary: true, analytics: false, marketing: false });
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
  // Google Analytics
  if (consent.analytics) {
    loadGoogleAnalytics();
  } else {
    unloadGoogleAnalytics();
  }

  // Google AdSense
  if (consent.marketing) {
    loadGoogleAdSense();
  } else {
    unloadGoogleAdSense();
  }
};

// Google Analytics functions
const loadGoogleAnalytics = () => {
  // Check if already loaded
  if (window.gtag) return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', 'G-N8SYMCJED4', {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });

  console.log('Google Analytics loaded with consent');
};

const unloadGoogleAnalytics = () => {
  // Remove Google Analytics cookies
  const cookies = ['_ga', '_ga_*', '_gid', '_gat'];
  cookies.forEach(cookie => {
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  // Clear dataLayer
  if (window.dataLayer) {
    window.dataLayer = [];
  }
  
  console.log('Google Analytics unloaded');
};

// Google AdSense functions
const loadGoogleAdSense = () => {
  // Check if already loaded
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;

  // Load Google AdSense script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  script.setAttribute('data-ad-client', import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXX');
  document.head.appendChild(script);

  console.log('Google AdSense loaded with consent');
};

const unloadGoogleAdSense = () => {
  // Remove AdSense cookies
  const cookies = ['_gcl_au', 'gclid'];
  cookies.forEach(cookie => {
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  // Remove AdSense script
  const adsenseScript = document.querySelector('script[src*="adsbygoogle.js"]');
  if (adsenseScript) {
    adsenseScript.remove();
  }
  
  console.log('Google AdSense unloaded');
};

// TypeScript declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
