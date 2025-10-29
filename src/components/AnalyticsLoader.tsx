import { useEffect, useRef, useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-S6ZT37VDX1';
const GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

type ScriptRefs = {
  remote?: HTMLScriptElement;
  inline?: HTMLScriptElement;
};

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const AnalyticsLoader = () => {
  const { consent, isLoading } = useCookieConsent();
  const scriptRefs = useRef<ScriptRefs>({});
  const scriptsAttached = useRef(false);
  const [bypassConsent, setBypassConsent] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.hostname;
    const mode = import.meta.env.MODE;
    const configuredEnv = (import.meta.env.VITE_ENVIRONMENT || '').toLowerCase();

    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isStagingHost = host === 'staging.jambol.co' || host.endsWith('.staging.jambol.co');
    const isStagingEnv = configuredEnv === 'staging';
    const isDevMode = mode === 'development';

    setBypassConsent(isLocalhost || isStagingHost || isStagingEnv || isDevMode);
  }, []);

  const shouldLoad = (() => {
    if (typeof window === 'undefined') return false;
    if (bypassConsent === null) return false;
    if (bypassConsent) return true;
    if (isLoading) return false;
    return Boolean(consent?.analytics);
  })();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (bypassConsent === null) return;

    if (!shouldLoad) {
      cleanupScripts();
      return;
    }

    if (!scriptsAttached.current) {
      attachScripts();
    }

    return () => {
      cleanupScripts();
    };
  }, [shouldLoad, bypassConsent]);

  const attachScripts = () => {
    const head = document.head || document.body;
    if (!head) return;

    if (!document.querySelector('script[data-analytics-loader="ga4-remote"]')) {
      const remoteScript = document.createElement('script');
      remoteScript.async = true;
      remoteScript.src = GA_SRC;
      remoteScript.dataset.analyticsLoader = 'ga4-remote';
      remoteScript.dataset.gaMeasurementId = GA_ID;
      head.appendChild(remoteScript);
      scriptRefs.current.remote = remoteScript;
    } else {
      scriptRefs.current.remote = document.querySelector('script[data-analytics-loader="ga4-remote"]') as HTMLScriptElement;
    }

    if (!document.querySelector('script[data-analytics-loader="ga4-inline"]')) {
      const inlineScript = document.createElement('script');
      inlineScript.dataset.analyticsLoader = 'ga4-inline';
      inlineScript.dataset.gaMeasurementId = GA_ID;
      inlineScript.text = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${GA_ID}', { anonymize_ip: true });`;
      head.appendChild(inlineScript);
      scriptRefs.current.inline = inlineScript;
    } else {
      scriptRefs.current.inline = document.querySelector('script[data-analytics-loader="ga4-inline"]') as HTMLScriptElement;
    }

    scriptsAttached.current = true;
  };

  const cleanupScripts = () => {
    ['ga4-inline', 'ga4-remote'].forEach((identifier) => {
      const existing = document.querySelector(`script[data-analytics-loader="${identifier}"]`);
      if (existing) {
        existing.remove();
      }
    });

    if (scriptRefs.current.remote) {
      scriptRefs.current.remote = undefined;
    }
    if (scriptRefs.current.inline) {
      scriptRefs.current.inline = undefined;
    }

    if (typeof window !== 'undefined') {
      delete (window as any).gtag;
      delete (window as any).dataLayer;
    }

    scriptsAttached.current = false;
  };

  return null;
};

export default AnalyticsLoader;


