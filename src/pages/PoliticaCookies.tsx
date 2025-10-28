import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';

export default function PoliticaCookies() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    setHasConsent(!!stored);
  }, []);

  const openCookieBanner = () => {
    localStorage.removeItem('cookie_consent');
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={APP_CONFIG.ASSETS.LOGO}
          alt="Jambol Logo"
          className="h-10 jambol-logo"
        />
        <span className="text-2xl font-bold jambol-dark">Jambol ™</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Política de Cookies</h1>

      {/* 1. ¿Qué son las cookies? */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. ¿Qué son las cookies?</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Las cookies son pequeños archivos de texto que los sitios web instalan en el dispositivo del usuario (ordenador, móvil o tablet) cuando navega por ellos. Su objetivo es recordar información sobre la visita, como preferencias, inicio de sesión o configuración, y mejorar la experiencia de uso. Algunas cookies son necesarias para el funcionamiento del sitio, y otras se utilizan con fines analíticos o publicitarios.
      </p>

      <hr className="my-6 border-border" />

      {/* 2. ¿Qué tipos de cookies utiliza Jambol ™? */}
      <h2 className="text-xl font-semibold mt-2 mb-3">2. ¿Qué tipos de cookies utiliza Jambol ™?</h2>
      <p className="text-sm md:text-base text-muted-foreground mb-3">En Jambol ™ utilizamos cookies propias y de terceros para distintos fines:</p>

      <h3 className="text-base md:text-lg font-medium mt-4 mb-1">a) Cookies técnicas o necesarias</h3>
      <p className="text-sm md:text-base text-muted-foreground">Permiten que el sitio funcione correctamente y que el usuario pueda navegar por él, iniciar sesión o acceder a funciones seguras.</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">Ejemplos:</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li><code className="px-1 py-0.5 bg-muted rounded">session_id</code>: mantiene la sesión activa.</li>
        <li><code className="px-1 py-0.5 bg-muted rounded">lang_pref</code>: guarda el idioma seleccionado.</li>
      </ul>

      <h3 className="text-base md:text-lg font-medium mt-5 mb-1">b) Cookies de análisis o rendimiento</h3>
      <p className="text-sm md:text-base text-muted-foreground">Nos ayudan a entender cómo interactúan los usuarios con el sitio y a mejorar su funcionamiento. Utilizamos Google Analytics (propiedad de Google LLC).</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">Ejemplos:</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li><code className="px-1 py-0.5 bg-muted rounded">_ga</code>, <code className="px-1 py-0.5 bg-muted rounded">_gid</code>, <code className="px-1 py-0.5 bg-muted rounded">_gat</code> → identifican de forma anónima visitas, duración y páginas más vistas.</li>
      </ul>

      <h3 className="text-base md:text-lg font-medium mt-5 mb-1">c) Cookies publicitarias o de marketing</h3>
      <p className="text-sm md:text-base text-muted-foreground">Sirven para mostrar anuncios relevantes basados en tus intereses o interacciones previas. Utilizamos Google Ads / AdSense para mostrar publicidad contextual.</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">Ejemplos:</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li><code className="px-1 py-0.5 bg-muted rounded">_gcl_au</code>, <code className="px-1 py-0.5 bg-muted rounded">gclid</code> → permiten medir la efectividad de campañas publicitarias.</li>
      </ul>
      <p className="mt-2 text-sm md:text-base text-muted-foreground"><span className="font-semibold">⚠️ Aviso:</span> En Jambol ™ no se realizan apuestas reales ni transacciones económicas. Estas cookies publicitarias se usan únicamente para mostrar anuncios personalizados.</p>

      <hr className="my-6 border-border" />

      {/* 3. ¿Cómo puedes gestionar o eliminar las cookies? */}
      <h2 className="text-xl font-semibold mt-2 mb-3">3. ¿Cómo puedes gestionar o eliminar las cookies?</h2>
      <p className="text-sm md:text-base text-muted-foreground">El usuario puede aceptar, rechazar o configurar sus preferencias a través del banner de consentimiento de cookies al acceder a la web.</p>
      
      {hasConsent && (
        <div className="mt-4">
          <button 
            onClick={openCookieBanner}
            className="bg-white border-2 border-[#FFC72C] rounded px-4 py-2 text-sm transition-colors hover:bg-[#FFC72C]"
          >
            Modificar mis preferencias de cookies
          </button>
        </div>
      )}
      <p className="text-sm md:text-base text-muted-foreground mt-2">También puede, en cualquier momento, modificar o revocar el consentimiento desde su navegador:</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li>
          <a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer" className="underline">
            Google Chrome: eliminar, permitir y gestionar cookies
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer" className="underline">
            Mozilla Firefox: habilitar y deshabilitar cookies
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="underline">
            Safari (macOS): gestionar cookies en Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="underline">
            Microsoft Edge: eliminar cookies
          </a>
        </li>
      </ul>

      <hr className="my-6 border-border" />

      {/* 4. Consentimiento */}
      <h2 className="text-xl font-semibold mt-2 mb-3">4. Consentimiento</h2>
      <p className="text-sm md:text-base text-muted-foreground">Cuando el usuario acepta las cookies, autoriza la instalación de las mencionadas, salvo que haya modificado la configuración de su navegador o el panel de preferencias.</p>
      <p className="text-sm md:text-base text-muted-foreground mt-2">La base legal para el uso de cookies analíticas y publicitarias es el consentimiento del usuario, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley 34/2002 (LSSI-CE).</p>

      <hr className="my-6 border-border" />

      {/* 5. Actualización de esta Política */}
      <h2 className="text-xl font-semibold mt-2 mb-3">5. Actualización de esta Política</h2>
      <p className="text-sm md:text-base text-muted-foreground">Esta Política de Cookies podrá actualizarse periódicamente para reflejar cambios legales o técnicos.</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">Última actualización: octubre de 2025.</p>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}


