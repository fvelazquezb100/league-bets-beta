import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

export default function PoliticaCookies() {
  useEffect(() => {
    document.title = 'Jambol — Política de Cookies';
  }, []);

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
      <h2 className="text-xl font-semibold mt-2 mb-3">2. ¿Cómo gestionamos el consentimiento?</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Jambol ™ utiliza la plataforma <span className="font-semibold">InMobi Choice CMP (Tag v3.0)</span> para recabar y administrar el consentimiento de acuerdo con el marco IAB TCF 2.2 y el Estándar Global de Privacidad (GPP). Al acceder a nuestro sitio, verás un banner que te permite aceptar o bloquear todas las finalidades y revisar a detalle cómo nosotros y nuestros <span className="font-semibold">824 socios</span> tratamos tus datos.
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-3">
        El texto presentado por la CMP explica que, con tu permiso, nosotros y nuestros socios podemos utilizar identificadores únicos, datos de localización aproximada y características del dispositivo para personalizar contenido y anuncios, medir su rendimiento, realizar estudios de audiencia y desarrollar servicios. También resalta que algunos tratamientos pueden basarse en interés legítimo y que tus preferencias se almacenen durante <span className="font-semibold">13 meses</span> en la cookie <code className="px-1 py-0.5 bg-muted rounded">IABGPP_HDR_GppString</code>.
      </p>

      <hr className="my-6 border-border" />

      {/* 3. ¿Cómo puedes gestionar o eliminar las cookies? */}
      <h2 className="text-xl font-semibold mt-2 mb-3">3. Finalidades y opciones disponibles</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Desde el banner puedes gestionar las siguientes categorías, que se muestran con su número de socios indicativo:
      </p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-2 mt-2">
        <li><span className="font-semibold">Objetivos (757 socios):</span> almacenar o acceder a información en el dispositivo, seleccionar anuncios básicos o personalizados, crear perfiles publicitarios o de contenido, medir el rendimiento de anuncios y contenidos, realizar estudios de mercado y mejorar productos.</li>
        <li><span className="font-semibold">Características especiales:</span> uso de datos de localización geográfica precisa (264 socios) y análisis activo de las características del dispositivo para su identificación (118 socios).</li>
        <li><span className="font-semibold">Propósitos especiales y características adicionales:</span> se detallan en el panel de la CMP, pudiendo aceptarse o rechazarse de forma granular.</li>
        <li><span className="font-semibold">Consentimiento específico a Google:</span> la CMP incluye una sección dedicada a Google y sus etiquetas de terceros para que decidas si autorizas sus tratamientos.</li>
      </ul>

      <hr className="my-6 border-border" />

      <h2 className="text-xl font-semibold mt-2 mb-3">4. Gestión de tus preferencias</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Puedes modificar tu decisión en cualquier momento volviendo a este sitio y haciendo clic en el botón <span className="font-semibold">«Privacidad»</span> que aparece en la parte inferior de la página. Desde ese botón se reabre la interfaz de InMobi Choice CMP para que cambies, retires o vuelvas a otorgar tu consentimiento.
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-2">
        Además, tienes la opción de gestionar cookies directamente desde tu navegador. Ten en cuenta que, si deshabilitas ciertas cookies imprescindibles, algunas funcionalidades de Jambol ™ podrían dejar de estar disponibles.
      </p>
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
      <h2 className="text-xl font-semibold mt-2 mb-3">5. Base legal y responsabilidades</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        La base legal para el uso de cookies de analítica, personalización y marketing es el consentimiento del usuario, conforme al Reglamento (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 (LOPDGDD) y la Ley 34/2002 (LSSI-CE).
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-2">
        Nuestros socios pueden apoyarse en consentimiento o interés legítimo para determinados tratamientos. Siempre podrás oponerte a los tratamientos basados en interés legítimo desde el panel de la CMP o contactando directamente con el socio correspondiente mediante la sección «Socios».
      </p>

      <hr className="my-6 border-border" />

      {/* 5. Actualización de esta Política */}
      <h2 className="text-xl font-semibold mt-2 mb-3">6. Actualización de esta Política</h2>
      <p className="text-sm md:text-base text-muted-foreground">Esta Política de Cookies podrá actualizarse periódicamente para reflejar cambios legales o técnicos.</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">Última actualización: noviembre de 2025.</p>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}


