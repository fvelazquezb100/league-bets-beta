import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { SEO } from "@/components/SEO";

export default function TerminosCondiciones() {
  useEffect(() => {
    // document.title = 'Jambol — Términos y Condiciones'; // SEO component handles this
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO
        title="Términos y Condiciones - Jambol"
        description="Lee los términos y condiciones de uso de la plataforma Jambol."
      />
      <div className="flex items-center gap-3 mb-4">
        <img
          src={APP_CONFIG.ASSETS.LOGO}
          alt="Jambol Logo"
          className="h-10 jambol-logo"
        />
        <span className="text-2xl font-bold jambol-dark">Jambol ™</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Términos y Condiciones</h1>
      <p className="text-sm md:text-base text-muted-foreground mb-6">
        Bienvenido a Jambol ™. Al acceder y utilizar este sitio, aceptas los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices el servicio.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Naturaleza del servicio</h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Jambol ™ es un juego de simulación deportiva sin dinero real. No se realizan selecciones, transacciones económicas ni se otorgan premios monetarios. Todos los puntos, multiplicadores y resultados son ficticios y se utilizan exclusivamente con fines recreativos y de entretenimiento entre los usuarios registrados.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Registro y cuenta de usuario</h2>
      <p className="text-sm md:text-base text-muted-foreground">Para participar en la plataforma, deberás registrarte con información veraz y mantener tus credenciales de forma segura. Eres responsable de todas las acciones realizadas con tu cuenta. Podremos suspender, restringir o eliminar cuentas que incumplan estos términos, la normativa vigente o las normas de convivencia de la comunidad.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Reglas de juego y funcionamiento</h2>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li>Los puntos no tienen valor económico ni pueden canjearse.</li>
        <li>Los multiplicadores, resultados y clasificaciones son simulaciones generadas a partir de datos deportivos públicos o de terceros.</li>
        <li>Jambol ™ puede modificar o corregir errores evidentes en datos o cálculos sin previo aviso.</li>
        <li>El objetivo del servicio es el entretenimiento y la competencia amistosa.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Conducta y uso del servicio</h2>
      <p className="text-sm md:text-base text-muted-foreground">El usuario se compromete a:</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li>No publicar contenido ofensivo, ilegal o que vulnere derechos de terceros.</li>
        <li>No intentar acceder sin autorización a sistemas, bases de datos o información de otros usuarios.</li>
        <li>No utilizar bots, automatismos o scripts que alteren el funcionamiento normal del juego.</li>
      </ul>
      <p className="text-sm md:text-base text-muted-foreground mt-2">El incumplimiento podrá implicar la suspensión inmediata de la cuenta.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Disponibilidad y mantenimiento</h2>
      <p className="text-sm md:text-base text-muted-foreground">Jambol ™ trabajará para ofrecer un servicio estable, pero no garantiza disponibilidad ininterrumpida. Podemos realizar mantenimientos, actualizaciones o cambios técnicos sin previo aviso.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Privacidad y tratamiento de datos</h2>
      <p className="text-sm md:text-base text-muted-foreground">La gestión de datos personales se realiza conforme a nuestra Política de Privacidad. Los usuarios pueden ejercer sus derechos de acceso, rectificación, cancelación, oposición, portabilidad y limitación del tratamiento contactando a <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a>. Consulta también nuestra <Link to="/politica-cookies" className="underline">Política de Cookies</Link> para conocer cómo gestionamos el consentimiento de cookies y tecnologías similares.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Publicidad y monetización</h2>
      <p className="text-sm md:text-base text-muted-foreground">Jambol ™ puede mostrar anuncios de terceros, como Google AdSense, para financiar el servicio. Estos anuncios se mostrarán conforme al consentimiento otorgado por el usuario en el banner de cookies. No tenemos control sobre el contenido de los anuncios mostrados por terceros.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Propiedad intelectual</h2>
      <p className="text-sm md:text-base text-muted-foreground">El diseño, código, logotipo, textos y demás elementos del sitio web son propiedad de Jambol ™ o de sus legítimos titulares, y están protegidos por la legislación sobre derechos de autor y propiedad industrial. No se concede ninguna licencia de uso o reproducción salvo las permitidas por la ley. La marca “Jambol” se encuentra registrada o en proceso de registro ante la OEPM (España).</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Limitación de responsabilidad</h2>
      <p className="text-sm md:text-base text-muted-foreground">Jambol ™ no garantiza la exactitud ni la actualidad de los datos mostrados y no se hace responsable de decisiones tomadas a partir de la información del sitio ni de daños o perjuicios derivados del uso o imposibilidad de uso del servicio, dentro de los límites permitidos por la ley.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Uso de servicios de terceros</h2>
      <p className="text-sm md:text-base text-muted-foreground">El sitio puede integrar datos o contenidos procedentes de fuentes externas (por ejemplo, API-Sports o proveedores similares). Estos datos se ofrecen con fines informativos y bajo las condiciones de uso de dichos proveedores.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">11. Modificaciones de los términos</h2>
      <p className="text-sm md:text-base text-muted-foreground">Podemos actualizar o modificar estos Términos y Condiciones en cualquier momento para reflejar cambios técnicos, legales o de funcionamiento. La nueva versión se publicará en esta misma página con la fecha de actualización correspondiente.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">12. Legislación y jurisdicción aplicable</h2>
      <p className="text-sm md:text-base text-muted-foreground">Estos Términos se rigen por la legislación española. Cualquier controversia relacionada con el servicio se someterá a los juzgados y tribunales de Madrid (España), salvo disposición imperativa en contrario.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">13. Servicios premium y suscripciones futuras</h2>
      <p className="text-sm md:text-base text-muted-foreground">Actualmente, Jambol ™ ofrece todas sus funcionalidades de forma gratuita. En el futuro, podrán incorporarse planes de suscripción o servicios premium que otorguen acceso a características adicionales, como ligas privadas, ventajas exclusivas o funcionalidades avanzadas.</p>
      <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
        <li>Se informará claramente al usuario de sus condiciones, precios y forma de pago antes de cualquier cargo.</li>
        <li>Los pagos se procesarán mediante plataformas seguras de terceros (por ejemplo, Stripe o PayPal).</li>
        <li>Se aplicará una política de reembolsos conforme a la legislación española y europea en materia de consumidores.</li>
      </ul>
      <p className="text-sm md:text-base text-muted-foreground mt-2">Hasta ese momento, Jambol ™ no solicita ni gestiona ningún pago por parte de los usuarios.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">14. Aceptación</h2>
      <p className="text-sm md:text-base text-muted-foreground">Al registrarte o utilizar Jambol ™, confirmas que has leído y aceptas estos Términos y Condiciones.</p>

      <p className="text-sm md:text-base text-muted-foreground mt-6">Fecha de última actualización: octubre de 2025.</p>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}
