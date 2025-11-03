import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

export default function Reglas() {
  const sections = [
    { id: 'introduccion', title: 'Introducción' },
    { id: 'tipos-ligas', title: 'Tipos de ligas' },
    { id: 'calendario', title: 'Calendario y reinicios' },
    { id: 'disponibilidad', title: 'Disponibilidad y cierre de apuestas' },
    { id: 'presupuesto', title: 'Presupuesto y límites' },
    { id: 'mercados', title: 'Mercados disponibles' },
    { id: 'puntuacion', title: 'Cómo se puntúa' },
    { id: 'resultados', title: 'Resultados y posibles retrasos' },
    { id: 'clasificacion', title: 'Clasificación y desempates' },
    { id: 'juego-limpio', title: 'Juego limpio' },
    { id: 'bloqueos', title: 'Bloqueos de partidos' },
    { id: 'cambios', title: 'Cambios en estas reglas' },
    { id: 'ayuda', title: 'Ayuda' },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={APP_CONFIG.ASSETS.LOGO}
          alt="Jambol Logo"
          className="h-10 jambol-logo"
        />
        <span className="text-2xl font-bold jambol-dark">Jambol ™</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Reglas del Juego</h1>

      {/* Índice */}
      <nav className="mb-6">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {sections.map(s => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 1. Introducción */}
      <section id="introduccion" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">1. Introducción</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Jambol ™ es un juego de simulación: no hay dinero real ni premios económicos. Los puntos, cuotas y resultados son ficticios y se utilizan exclusivamente con fines recreativos.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 2. Tipos de ligas */}
      <section id="tipos-ligas" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">2. Tipos de ligas</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Ligas Semanales (Weekly): la “semana de juego” avanza cada martes.</li>
          <li>Ligas Diarias (Daily – Premium): se puntúa cada día.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 3. Calendario y reinicios */}
      <section id="calendario" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">3. Calendario y reinicios</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Cada martes: se renueva la disponibilidad de partidos y comienza una nueva semana de juego.</li>
          <li>Los partidos aparecen según su fecha y hora local del torneo.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 4. Disponibilidad y cierre de apuestas */}
      <section id="disponibilidad" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">4. Disponibilidad y cierre de apuestas</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>No podrás apostar cuando falten pocos minutos para que empiece el partido.</li>
          <li>En ocasiones un administrador puede congelar temporalmente la disponibilidad de partidos.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 5. Presupuesto y límites */}
      <section id="presupuesto" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">5. Presupuesto y límites</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Tienes un presupuesto de puntos para apostar; se recupera al iniciar cada semana (Weekly) o cada jornada (Daily).</li>
          <li>Las combinadas suman selecciones; si falla una, falla la combinada.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 6. Mercados disponibles */}
      <section id="mercados" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">6. Mercados disponibles</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Ganador del partido, Doble oportunidad, Resultado exacto, Más/Menos de goles, Descanso/Final, Resultado + Total goles, Ambos marcan.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 7. Cómo se puntúa */}
      <section id="puntuacion" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">7. Cómo se puntúa</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Apuesta simple: puntos ganados = puntos apostados × cuota.</li>
          <li>Combinadas: se multiplican las cuotas de las selecciones acertadas.</li>
          <li>Cuándo recibes los puntos: Weekly los martes; Daily (Premium) cada día tras cerrar la jornada.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 8. Resultados y posibles retrasos */}
      <section id="resultados" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">8. Resultados y posibles retrasos</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Los resultados se registran cuando finaliza el partido. Si hay prórroga o penaltis, la validación puede tardar un poco más.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 9. Clasificación y desempates */}
      <section id="clasificacion" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">9. Clasificación y desempates</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Se ordena por puntos de mayor a menor. Si hay empate, cuentan más aciertos; si persiste, la cuota más alta acertada; después, la fecha del primer acierto.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 10. Juego limpio */}
      <section id="juego-limpio" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">10. Juego limpio</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          No se permite contenido ofensivo ni conductas abusivas o automatizadas. El incumplimiento puede suponer suspensión.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 11. Bloqueos de partidos */}
      <section id="bloqueos" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">11. Bloqueos de partidos</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Los bloqueos de partidos son una funcionalidad exclusiva para ligas premium que permite a los jugadores bloquear partidos específicos a otros jugadores de su liga.
        </p>
        <h3 className="text-lg font-semibold mt-4 mb-2">Reglas de bloqueo:</h3>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Cada jugador solo puede bloquear 1 partido a otro jugador por jornada.</li>
          <li>Cada jugador solo puede bloquear un máximo de 2 partidos en total, es decir, puede bloquear 2 partidos a otros dos usuarios.</li>
          <li>Cada jugador solo puede tener bloqueado un máximo de 3 partidos en total por otros jugadores.</li>
          <li>Los puntos de bloqueos se reinician los martes automáticamente.</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4 mb-2">Interacción con partidos bloqueados:</h3>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Si otro jugador bloquea un partido para ti, no podrás interactuar con ese partido.</li>
          <li>Si ya tenías una apuesta previa en ese partido, no podrás cancelarla.</li>
          <li>Si es una combinada que incluye un partido bloqueado, tampoco podrás realizar ninguna acción sobre esa apuesta.</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4 mb-2">Cómo bloquear un partido:</h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Entra en la página de Clasificación, busca al jugador que quieras bloquear y haz clic en su nombre. En la ventana que se abre, selecciona la liga y busca el partido que deseas bloquear. No podrás bloquear el partido si ya lo tienes bloqueado o si a ese jugador le quedarían menos de 3 partidos disponibles para apostar.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 12. Cambios en estas reglas */}
      <section id="cambios" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">12. Cambios en estas reglas</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Podemos actualizar las reglas. Avisaremos de la fecha de actualización.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 13. Ayuda */}
      <section id="ayuda" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">13. Ayuda</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          ¿Dudas? Escríbenos a <a href="mailto:contact@jambol.co" className="underline">contact@jambol.co</a>.
        </p>
      </section>

      <div className="mt-8">
        <Link to="/" className="underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}


