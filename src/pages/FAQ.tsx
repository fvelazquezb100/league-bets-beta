import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

export default function FAQ() {
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
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Preguntas Frecuentes (FAQ)</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold">¿Qué es Jambol ™?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Jambol ™ es un juego de simulación deportiva. No hay dinero real, no se realizan transacciones económicas ni se ofrecen premios monetarios. Los puntos, cuotas y resultados son ficticios y se usan solo con fines recreativos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Cómo participo?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Debes registrarte e iniciar sesión. Cada usuario participa dentro de su liga, con un presupuesto de puntos semanal configurable por la liga. Puedes realizar selecciones en los partidos disponibles dentro de la sección “Apostar”.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿De dónde salen las cuotas y resultados?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            El sistema obtiene datos deportivos de terceros y mantiene una caché interna de cuotas y resultados (match_odds_cache y match_results). Periódicamente se actualizan mediante funciones seguras de backend (Edge Functions) y se muestran en la app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Qué significan los indicadores junto a algunas cuotas?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            En ligas premium, algunas cuotas muestran un indicador: flecha verde (sube), flecha roja (baja) o símbolo igual (sin cambios), comparando el snapshot actual frente al anterior. Esta función no se muestra en ligas gratuitas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Puedo ver mi evolución en la clasificación?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Sí. En “Clasificación” puedes abrir la evolución histórica por semanas. El gráfico permite ver la posición a lo largo de las jornadas, con opciones para mostrar nombres a la izquierda o derecha e incluye ajustes para móvil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Se usa dinero real?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            No. Es un juego de simulación. No se aceptan pagos ni se gestionan cobros. En caso de activar servicios premium en el futuro, se informará claramente antes de cualquier cargo y se usará un proveedor seguro de pagos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Qué ligas hay?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Cada usuario pertenece a una liga. Existen ligas principales y otras ligas (por ejemplo, selecciones), que pueden habilitarse por los administradores en el panel correspondiente. Algunas secciones muestran pestañas adicionales cuando están activadas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Cómo gestiono mis datos y cookies?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Puedes modificar tus preferencias de cookies desde el banner o en la página de <Link to="/politica-cookies" className="underline">Política de Cookies</Link>. Para datos personales y derechos de privacidad, escribe a <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Cómo se calculan las combinadas?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            En el historial de apuestas se muestran las combinadas con el total de cuota calculado multiplicando las selecciones incluidas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">¿Dónde encuentro más información legal?</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Revisa los <Link to="/terminos" className="underline">Términos y Condiciones</Link> y la <Link to="/politica-cookies" className="underline">Política de Cookies</Link> para conocer el detalle del servicio y consentimiento.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}


