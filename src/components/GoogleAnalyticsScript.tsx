import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const GoogleAnalyticsScript = () => {
  const { consent } = useCookieConsent();

  useEffect(() => {
    // Solo cargar si el usuario ha aceptado cookies de análisis
    if (consent?.analytics) {
      // Cargar el script de Google Analytics
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
      document.head.appendChild(script1);

      // Cargar el script de configuración
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-N8SYMCJED4');
      `;
      document.head.appendChild(script2);

      console.log('Google Analytics loaded with consent');
    }
  }, [consent?.analytics]);

  return null; // Este componente no renderiza nada
};
