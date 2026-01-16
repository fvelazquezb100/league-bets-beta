import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { SEO } from "@/components/SEO";

export default function FAQ() {
  useEffect(() => {
    document.title = 'Jambol — Preguntas Frecuentes';

    // FAQPage Structured Data (JSON-LD)
    const faqStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Qué es Jambol ™?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Jambol ™ es un juego de simulación deportiva. No hay dinero real, no se realizan transacciones económicas ni se ofrecen premios monetarios. Los puntos, multiplicadores y resultados son ficticios y se usan solo con fines recreativos.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo participo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Debes registrarte e iniciar sesión. Cada usuario participa dentro de su liga, con un presupuesto de puntos semanal configurable por la liga. Puedes realizar selecciones en los partidos disponibles dentro de la sección "Partidos".',
          },
        },
        {
          '@type': 'Question',
          name: '¿De dónde salen los multiplicadores y resultados?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El sistema obtiene datos deportivos de terceros y mantiene una caché interna de multiplicadores y resultados (match_odds_cache y match_results). Periódicamente se actualizan mediante funciones seguras de backend (Edge Functions) y se muestran en la app.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Se usa dinero real?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Es un juego de simulación. No se aceptan pagos ni se gestionan cobros. En caso de activar servicios premium en el futuro, se informará claramente antes de cualquier cargo y se usará un proveedor seguro de pagos.',
          },
        },
      ],
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"][data-faq]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      scriptTag.setAttribute('data-faq', 'true');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(faqStructuredData);

    return () => {
      const tag = document.querySelector('script[type="application/ld+json"][data-faq]');
      if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO
        title="Preguntas Frecuentes - Jambol"
        description="Resuelve tus dudas sobre cómo funciona Jambol, las ligas, las apuestas y más."
      />
      <div className="flex items-center gap-3 mb-4">
        <img
          src={APP_CONFIG.ASSETS.LOGO}
          alt="Jambol Logo"
          className="h-10 jambol-logo"
        />
        <span className="text-2xl font-bold text-foreground">Jambol ™</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Preguntas Frecuentes (FAQ)</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Qué es Jambol ™?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Jambol ™ es un juego de simulación deportiva. No hay dinero real, no se realizan transacciones económicas ni se ofrecen premios monetarios. Los puntos, multiplicadores y resultados son ficticios y se usan solo con fines recreativos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Cómo participo?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Debes registrarte e iniciar sesión. Cada usuario participa dentro de su liga, con un presupuesto de puntos semanal configurable por la liga. Puedes realizar selecciones en los partidos disponibles dentro de la sección "Partidos".
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿De dónde salen los multiplicadores y resultados?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El sistema obtiene datos deportivos de terceros y mantiene una caché interna de multiplicadores y resultados (match_odds_cache y match_results). Periódicamente se actualizan mediante funciones seguras de backend (Edge Functions) y se muestran en la app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Qué significan los indicadores junto a algunos multiplicadores?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            En ligas premium, algunos multiplicadores muestran un indicador: flecha verde (sube), flecha roja (baja) o símbolo igual (sin cambios), comparando el snapshot actual frente al anterior. Esta función no se muestra en ligas gratuitas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Puedo ver mi evolución en la clasificación?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Sí. En “Clasificación” puedes abrir la evolución histórica por semanas. El gráfico permite ver la posición a lo largo de las jornadas, con opciones para mostrar nombres a la izquierda o derecha e incluye ajustes para móvil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Se usa dinero real?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            No. Es un juego de simulación. No se aceptan pagos ni se gestionan cobros. En caso de activar servicios premium en el futuro, se informará claramente antes de cualquier cargo y se usará un proveedor seguro de pagos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Qué ligas hay?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Cada usuario pertenece a una liga. Existen ligas principales y otras ligas (por ejemplo, selecciones), que pueden habilitarse por los administradores en el panel correspondiente. Algunas secciones muestran pestañas adicionales cuando están activadas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Cómo gestiono mis datos y cookies?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Puedes modificar tus preferencias de cookies desde el banner o en la página de <Link to="/politica-cookies" className="underline hover:text-[#FFC72C] transition-colors">Política de Cookies</Link>. Para datos personales y derechos de privacidad, escribe a <a href="mailto:contact@jambol.co" className="underline hover:text-[#FFC72C] transition-colors">contact@jambol.co</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Cómo se calculan las combinadas?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            En el historial de boletos se muestran las combinadas con el total de multiplicador calculado multiplicando las selecciones incluidas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Dónde encuentro más información legal?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Revisa los <Link to="/terminos" className="underline hover:text-[#FFC72C] transition-colors">Términos y Condiciones</Link> y la <Link to="/politica-cookies" className="underline hover:text-[#FFC72C] transition-colors">Política de Cookies</Link> para conocer el detalle del servicio y consentimiento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Qué son los bloqueos de partidos?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Los bloqueos de partidos son una funcionalidad exclusiva para ligas premium que te permite bloquear un partido específico a otro jugador de tu liga, impidiendo que haga selecciones en ese partido. Los puntos de bloqueo se reinician cada martes automáticamente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Cuáles son las reglas de bloqueo de partidos?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Las reglas son las siguientes:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Cada jugador solo puede bloquear 1 partido a otro jugador por jornada.</li>
            <li>Cada jugador solo puede bloquear un máximo de 2 partidos en total, es decir, puede bloquear 2 partidos a otros dos usuarios.</li>
            <li>Cada jugador solo puede tener bloqueado un máximo de 3 partidos en total por otros jugadores.</li>
            <li>Los puntos de bloqueos se reinician los martes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Qué pasa si me bloquean un partido?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Si otro jugador bloquea un partido para ti, no podrás interactuar con ese partido. Si ya tenías un boleto previo en ese partido, no podrás cancelarlo. Si es una combinada que incluye un partido bloqueado, tampoco podrás realizar ninguna acción sobre ese boleto.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">¿Cómo puedo bloquear un partido a otro jugador?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Para bloquear un partido: entra en la página de Clasificación, busca al jugador que quieras bloquear y haz clic en su nombre. En la ventana que se abre, selecciona la liga y busca el partido que deseas bloquear. No podrás bloquear el partido si ya lo tienes bloqueado o si a ese jugador le quedarían menos de 3 partidos disponibles para hacer selecciones.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link to="/" className="underline text-sm text-foreground hover:text-[#FFC72C] transition-colors">Volver al inicio</Link>
      </div>
    </div>
  );
}


