import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

export default function PoliticaPrivacidad() {
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

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm md:text-base text-muted-foreground mb-2">
        Última actualización: octubre de 2025.
      </p>

      <hr className="my-6 border-border" />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Responsable del tratamiento</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El responsable del tratamiento de los datos personales recogidos en este sitio web es Jambol ™, marca en trámite ante la Oficina Española de Patentes y Marcas (OEPM).
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Correo de contacto: <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a><br />
            Domicilio: Madrid, España.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Esta Política de Privacidad describe cómo Jambol ™ recopila, utiliza y protege la información personal de los usuarios que acceden a su sitio web y servicios asociados.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Datos personales que recopilamos</h2>
          <p className="text-sm md:text-base text-muted-foreground">En función de cómo interactúes con la plataforma, podemos recopilar:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Datos de registro: nombre de usuario, dirección de correo electrónico y contraseña cifrada.</li>
            <li>Datos técnicos y de navegación: dirección IP, tipo de navegador, dispositivo, sistema operativo y páginas visitadas.</li>
            <li>Datos derivados del uso: actividad dentro de la plataforma, como participación en ligas o clasificación.</li>
            <li>Datos de cookies: preferencias, comportamiento de navegación y anuncios mostrados o clicados.</li>
            <li>Datos de terceros: información proporcionada por proveedores como Google LLC (Analytics y AdSense), Supabase (autenticación y base de datos) y Vercel (alojamiento web).</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Finalidad del tratamiento</h2>
          <p className="text-sm md:text-base text-muted-foreground">Tratamos los datos personales para:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Permitir el acceso y uso de las funciones de la plataforma.</li>
            <li>Gestionar cuentas de usuario y preferencias.</li>
            <li>Analizar el tráfico y el rendimiento del sitio web.</li>
            <li>Mostrar publicidad personalizada mediante Google AdSense.</li>
            <li>Prevenir usos indebidos o fraudulentos del servicio.</li>
            <li>Atender consultas enviadas al correo de contacto.</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Base legal del tratamiento</h2>
          <p className="text-sm md:text-base text-muted-foreground">La base legal depende del contexto:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Consentimiento expreso otorgado al registrarte o aceptar el banner de cookies.</li>
            <li>Ejecución de una relación contractual para usuarios registrados.</li>
            <li>Interés legítimo de Jambol ™ en mejorar la calidad, seguridad y experiencia del servicio.</li>
            <li>Cumplimiento de obligaciones legales cuando resulte aplicable.</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Conservación de los datos</h2>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
            <li>Los datos de registro se conservan mientras la cuenta permanezca activa.</li>
            <li>Los datos analíticos y de cookies se conservan durante un máximo de 26 meses.</li>
            <li>Tras solicitar la eliminación de la cuenta, los datos se eliminarán o anonimizarán en un plazo máximo de 30 días.</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Comunicación de datos a terceros</h2>
          <p className="text-sm md:text-base text-muted-foreground">Podemos compartir datos personales con:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Google LLC (Analytics y AdSense), con sede en Estados Unidos, bajo cláusulas contractuales tipo aprobadas por la Comisión Europea.</li>
            <li>Supabase Inc., como proveedor de base de datos y autenticación.</li>
            <li>Vercel Inc., responsable del alojamiento y despliegue web.</li>
            <li>Autoridades públicas o judiciales, cuando exista obligación legal.</li>
          </ul>
          <p className="text-sm md:text-base text-muted-foreground mt-2">En ningún caso vendemos tus datos personales a terceros.</p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Transferencias internacionales</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Algunos proveedores se encuentran fuera del Espacio Económico Europeo. En esos casos, Jambol ™ garantiza que las transferencias se realizan con mecanismos legales adecuados, como cláusulas contractuales tipo de la Unión Europea o la adhesión al Marco de Privacidad de Datos UE-EE. UU.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Derechos del usuario</h2>
          <p className="text-sm md:text-base text-muted-foreground">Puedes ejercer en cualquier momento tus derechos de:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Acceso.</li>
            <li>Rectificación.</li>
            <li>Supresión (derecho al olvido).</li>
            <li>Limitación del tratamiento.</li>
            <li>Portabilidad.</li>
            <li>Oposición.</li>
          </ul>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Para ejercerlos, escribe a <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a> indicando “Derechos RGPD” en el asunto. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) si consideras que no hemos atendido correctamente tu solicitud.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Seguridad de los datos</h2>
          <p className="text-sm md:text-base text-muted-foreground">Jambol ™ aplica medidas técnicas y organizativas para proteger la información personal, entre ellas:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Cifrado SSL en las comunicaciones.</li>
            <li>Contraseñas encriptadas.</li>
            <li>Acceso restringido a bases de datos y sistemas internos.</li>
            <li>Supervisión y actualización periódica de la infraestructura.</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">10. Uso de cookies</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Utilizamos cookies propias y de terceros (Google Analytics y Google AdSense) para analizar el tráfico, personalizar la experiencia y mostrar anuncios relevantes. Puedes gestionar o revocar tu consentimiento en cualquier momento desde el banner de cookies o visitando nuestra <Link to="/politica-cookies" className="underline">Política de Cookies</Link>.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">11. Enlaces a sitios de terceros</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            La web puede incluir enlaces a sitios externos. Jambol ™ no se responsabiliza del contenido ni de las políticas de privacidad de esas páginas. Te recomendamos revisar sus condiciones antes de facilitar datos personales.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">12. Modificaciones de esta política</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Jambol ™ puede modificar esta Política de Privacidad para adaptarla a cambios legales, técnicos o operativos. Publicaremos la nueva versión en esta misma página indicando la fecha de la última revisión.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2">Contacto</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Si tienes dudas sobre esta política o sobre el uso de tus datos personales, puedes escribirnos a <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a>.
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}
