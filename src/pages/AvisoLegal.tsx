import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { SEO } from "@/components/SEO";

export default function AvisoLegal() {
  useEffect(() => {
    // document.title = 'Jambol — Aviso Legal'; // SEO component handles this
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO
        title="Aviso Legal - Jambol"
        description="Información legal sobre Jambol y sus condiciones de uso."
      />
      <div className="flex items-center gap-3 mb-4">
        <img
          src={APP_CONFIG.ASSETS.LOGO}
          alt="Jambol Logo"
          className="h-10 jambol-logo"
        />
        <span className="text-2xl font-bold text-foreground">Jambol ™</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Aviso Legal</h1>

      <hr className="my-6 border-border" />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">1. Identidad del titular del sitio web</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El sitio web disponible en <a href="https://jambol.co" className="underline hover:text-[#FFC72C] transition-colors" target="_blank" rel="noopener noreferrer">https://jambol.co</a> (en adelante, el "Sitio") es gestionado por Jambol ™, marca en trámite ante la Oficina Española de Patentes y Marcas (OEPM).
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Correo de contacto: <a href="mailto:contact@jambol.co" className="underline hover:text-[#FFC72C] transition-colors">contact@jambol.co</a><br />
            Ubicación: Madrid, España
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            A efectos de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), Jambol ™ actúa como prestador de servicios de la sociedad de la información.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">2. Objeto del Sitio</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Jambol ™ ofrece un servicio de entretenimiento basado en simulación deportiva y ligas privadas entre usuarios.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            No se realizan selecciones con dinero real ni se otorgan premios económicos. Todos los puntos, resultados y clasificaciones tienen carácter lúdico.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">3. Condiciones de uso</h2>
          <p className="text-sm md:text-base text-muted-foreground">Al acceder y utilizar el Sitio, el usuario acepta:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>Utilizar el Sitio de forma lícita y respetuosa.</li>
            <li>No intentar dañar, interrumpir o explotar el funcionamiento técnico del servicio.</li>
            <li>No publicar contenidos ilegales, ofensivos, difamatorios o que vulneren derechos de terceros.</li>
          </ul>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Jambol ™ se reserva el derecho a suspender o bloquear el acceso de usuarios que incumplan estas normas o los Términos y Condiciones del servicio.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Para más detalle sobre el uso de la plataforma consulta nuestros <Link to="/terminos" className="underline hover:text-[#FFC72C] transition-colors">Términos y Condiciones</Link>.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">4. Propiedad intelectual e industrial</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El nombre comercial, la marca verbal y los elementos gráficos asociados a Jambol ™ son propiedad de sus titulares y se encuentran en trámite de registro ante la OEPM.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            El diseño, el código, la interfaz, los textos, logotipos, imágenes, clasificaciones, estadísticas y cualquier otro contenido mostrado en el Sitio son titularidad de Jambol ™ o se usan con autorización de sus legítimos propietarios.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Queda prohibida la copia, reproducción, distribución, comunicación pública o modificación de estos contenidos sin permiso expreso por escrito de Jambol ™, salvo en los casos permitidos por la ley.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">5. Responsabilidad y disponibilidad del servicio</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Jambol ™ trabaja para que el Sitio esté disponible y actualizado, pero no garantiza:
          </p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>la disponibilidad ininterrumpida del servicio,</li>
            <li>la ausencia de errores técnicos,</li>
            <li>ni la exactitud total de los datos mostrados (por ejemplo: resultados, valoraciones, clasificaciones o multiplicadores simulados).</li>
          </ul>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            El uso de la información publicada en el Sitio es responsabilidad exclusiva del usuario.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Jambol ™ podrá realizar paradas técnicas, cambios de funcionamiento o mejoras en cualquier momento.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">6. Enlaces a terceros y contenidos externos</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El Sitio puede incluir enlaces, banners o integraciones técnicas que dirigen a sitios web o servicios de terceros.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Jambol ™ no es responsable del contenido, políticas o prácticas de dichos terceros. El hecho de que aparezcan enlaces externos no implica relación comercial directa ni respaldo de Jambol ™ sobre esos contenidos.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">7. Publicidad y monetización</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El Sitio puede incluir espacios publicitarios y contenidos patrocinados gestionados directamente o a través de plataformas de terceros.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            La visualización de publicidad puede basarse en tu actividad de navegación y preferencias, de acuerdo con lo establecido en la <Link to="/politica-cookies" className="underline hover:text-[#FFC72C] transition-colors">Política de Cookies</Link> y sujeto al consentimiento que otorgues en el banner de cookies.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Jambol ™ no controla ni garantiza el contenido de los anuncios mostrados por terceros.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">8. Protección de datos personales</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El uso y tratamiento de los datos personales de los usuarios de Jambol ™ se rige por la <Link to="/politica-privacidad" className="underline hover:text-[#FFC72C] transition-colors">Política de Privacidad</Link>.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">En particular:</p>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mt-2">
            <li>qué datos recogemos,</li>
            <li>para qué los usamos,</li>
            <li>durante cuánto tiempo los conservamos,</li>
            <li>con quién los compartimos,</li>
            <li>y cómo ejercer tus derechos (acceso, rectificación, supresión, oposición, etc.).</li>
          </ul>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">9. Cookies</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Este Sitio utiliza cookies propias y de terceros (incluyendo cookies publicitarias y analíticas). Puedes configurar, rechazar o retirar tu consentimiento en cualquier momento mediante el banner de cookies o visitando la <Link to="/politica-cookies" className="underline hover:text-[#FFC72C] transition-colors">Política de Cookies</Link>.
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">10. Legislación aplicable y jurisdicción</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier conflicto relacionado con el acceso o uso del Sitio, las partes se someten (salvo norma imperativa en contrario) a los juzgados y tribunales de Madrid, España.
          </p>
        </div>

        <hr className="border-border" />

        <div className="text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            2025 Jambol ™. Todos los derechos reservados.
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link to="/" className="underline text-sm text-foreground hover:text-[#FFC72C] transition-colors">Volver al inicio</Link>
      </div>
    </div>
  );
}
