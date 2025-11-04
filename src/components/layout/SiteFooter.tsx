import * as React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const SiteFooter: React.FC = () => {
  const { consent, isLoading, acceptAll, rejectAll, updateConsent, hasConsent } = useCookieConsent();
  const [showBanner, setShowBanner] = React.useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [cookiesNecessary, setCookiesNecessary] = React.useState(true);
  const [cookiesAnalytics, setCookiesAnalytics] = React.useState(false);
  const [cookiesMarketing, setCookiesMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !hasConsent) {
      setShowBanner(true);
    }
  }, [isLoading, hasConsent]);

  React.useEffect(() => {
    if (consent) {
      setCookiesNecessary(consent.necessary);
      setCookiesAnalytics(consent.analytics);
      setCookiesMarketing(consent.marketing);
    }
  }, [consent]);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowBanner(false);
  };

  const saveCustomPreferences = () => {
    const preferences = {
      necessary: cookiesNecessary,
      analytics: cookiesAnalytics,
      marketing: cookiesMarketing
    };
    updateConsent(preferences);
    setShowBanner(false);
  };

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-8">
        <table className="w-full border-none">
          <tbody>
            {/* Primera fila - tres columnas */}
            <tr>
              {/* Columna 1: Logo, nombre y copyright */}
              <td className="align-top text-center w-1/3">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={APP_CONFIG.ASSETS.LOGO}
                      alt="Jambol Logo"
                      className="h-8 jambol-logo"
                    />
                    <span className="text-xl font-bold text-foreground">Jambol</span>
                  </div>
                    <div className="text-sm text-foreground">
                      2025 Jambol ™. Todos los derechos reservados.
                    </div>
                </div>
              </td>
              
              {/* Columna 2: Vacía */}
              <td className="align-top text-center w-1/3">
              </td>
              
              {/* Columna 3: Enlaces legales */}
              <td className="align-top text-center w-1/3">
                <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                  <Link to="/politica-cookies" className="text-foreground hover:text-[#FFC72C] transition-colors">Política de Cookies</Link>
                  <Link to="/terminos" className="text-foreground hover:text-[#FFC72C] transition-colors">Términos y Condiciones</Link>
                  <Link to="/politica-privacidad" className="text-foreground hover:text-[#FFC72C] transition-colors">Política de Privacidad</Link>
                  <Link to="/aviso-legal" className="text-foreground hover:text-[#FFC72C] transition-colors">Aviso Legal</Link>
                  <Link to="/reglas" className="text-foreground hover:text-[#FFC72C] transition-colors">Reglas</Link>
                  <Link to="/faq" className="text-foreground hover:text-[#FFC72C] transition-colors">FAQ</Link>
                </div>
              </td>
            </tr>
            
            {/* Segunda fila - una columna con el disclaimer */}
            <tr>
              <td colSpan={3} className="text-center">
                <p className="mt-6 text-xs text-foreground">
                  Jambol ™ es un juego de simulación. No se realizan apuestas con dinero real ni se ofrecen premios económicos. Todos los puntos y resultados son ficticios y se utilizan solo con fines recreativos.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="container mx-auto px-6 pb-6">
            <div className="rounded-lg border bg-background shadow-md p-4 md:p-5">
              <p className="text-sm text-foreground">
                Usamos cookies para mejorar tu experiencia. Algunas son necesarias y otras son de analítica/marketing.
              </p>
              
              {showAdvancedSettings ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="necessary"
                      checked={cookiesNecessary}
                      disabled
                      className="rounded"
                    />
                    <label htmlFor="necessary" className="text-sm">
                      <span className="font-medium">Cookies necesarias</span> (siempre activas)
                      <span className="block text-xs text-muted-foreground">Sesión, preferencias de idioma</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={cookiesAnalytics}
                      onChange={(e) => setCookiesAnalytics(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="analytics" className="text-sm">
                      <span className="font-medium">Cookies de análisis</span>
                      <span className="block text-xs text-muted-foreground">Google Analytics (_ga, _gid)</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={cookiesMarketing}
                      onChange={(e) => setCookiesMarketing(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="marketing" className="text-sm">
                      <span className="font-medium">Cookies de marketing</span>
                      <span className="block text-xs text-muted-foreground">Google Ads (gclid, _gcl_au)</span>
                    </label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                    <button onClick={() => setShowAdvancedSettings(false)} className="border rounded px-4 py-2 text-sm">
                      Volver
                    </button>
                    <button onClick={saveCustomPreferences} className="jambol-button rounded px-4 py-2 text-sm">
                      Guardar preferencias
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">Lista de cookies (ejemplo):</p>
                    <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Necesarias: sesión, preferencias de idioma</li>
                      <li>Analítica: Google Analytics (_ga, _gid)</li>
                      <li>Marketing: Google Ads (gclid, _gcl_au)</li>
                    </ul>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button onClick={handleRejectAll} className="border rounded px-4 py-2 text-sm">
                      Rechazar
                    </button>
                    <button onClick={handleAcceptAll} className="jambol-button rounded px-4 py-2 text-sm">
                      Aceptar todas
                    </button>
                    <button onClick={() => setShowAdvancedSettings(true)} className="border rounded px-4 py-2 text-sm">
                      Configurar
                    </button>
                    <Link to="/politica-cookies" className="text-sm sm:ml-auto text-foreground hover:text-[#FFC72C] transition-colors">
                      Más información
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default SiteFooter;


