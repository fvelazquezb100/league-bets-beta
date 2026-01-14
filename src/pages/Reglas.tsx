import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { SEO } from "@/components/SEO";

export default function Reglas() {
  useEffect(() => {
    // document.title = 'Jambol — Reglas del Juego'; // SEO component handles this
  }, []);
  const sections = [
    { id: 'introduccion', title: 'Introducción' },
    { id: 'tipos-ligas', title: 'Tipos de ligas' },
    { id: 'calendario', title: 'Calendario y reinicios' },
    { id: 'disponibilidad', title: 'Disponibilidad y cierre de selecciones' },
    { id: 'presupuesto', title: 'Presupuesto y límites' },
    { id: 'mercados', title: 'Mercados disponibles' },
    { id: 'puntuacion', title: 'Cómo se puntúa' },
    { id: 'resultados', title: 'Resultados y posibles retrasos' },
    { id: 'clasificacion', title: 'Clasificación y desempates' },
    { id: 'juego-limpio', title: 'Juego limpio' },
    { id: 'funcionalidades-premium', title: 'Funcionalidades liga premium' },
    { id: 'cambios', title: 'Cambios en estas reglas' },
    { id: 'ayuda', title: 'Ayuda' },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO
        title="Reglas del Juego - Jambol"
        description="Conoce las reglas de Jambol: cómo puntuar, cómo funcionan las ligas y los premios."
      />
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
          Jambol ™ es un juego de simulación: no hay dinero real ni premios económicos. Los puntos, multiplicadores y resultados son ficticios y se utilizan exclusivamente con fines recreativos.
        </p>
      </section>

      <hr className="my-6 border-border" />

      {/* 2. Tipos de ligas */}
      <section id="tipos-ligas" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">2. Tipos de ligas</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Ligas Semanales (Weekly): la "semana de juego" avanza cada martes.</li>
          <li>Ligas Diarias (Daily – Premium): el presupuesto se resetea cada día.</li>
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

      {/* 4. Disponibilidad y cierre de selecciones */}
      <section id="disponibilidad" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">4. Disponibilidad y cierre de selecciones</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>No podrás hacer selecciones cuando falten pocos minutos para que empiece el partido.</li>
          <li>En ocasiones un administrador puede congelar temporalmente la disponibilidad de partidos.</li>
        </ul>
      </section>

      <hr className="my-6 border-border" />

      {/* 5. Presupuesto y límites */}
      <section id="presupuesto" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">5. Presupuesto y límites</h2>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1">
          <li>Tienes un presupuesto de puntos para hacer selecciones; se recupera al iniciar cada semana (Weekly) o cada jornada (Daily).</li>
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
          <li>Boleto simple: puntos ganados = puntos en boleto × multiplicador.</li>
          <li>Combinadas: se multiplican los multiplicadores de las selecciones acertadas.</li>
          <li>Cuándo recibes los puntos para el presupuesto: Weekly los martes; Daily (Premium) cada día tras cerrar la jornada.</li>
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
          Se ordena por puntos de mayor a menor. Si hay empate, cuentan más aciertos; si persiste, el multiplicador más alto acertado; después, la fecha del primer acierto.
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

      {/* 11. Funcionalidades liga premium */}
      <section id="funcionalidades-premium" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">11. Funcionalidades liga premium</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4">
          Las ligas premium ofrecen funcionalidades avanzadas que permiten una experiencia de juego más completa y personalizada. Estas funcionalidades están disponibles exclusivamente para ligas que han sido actualizadas a premium mediante el pago correspondiente.
        </p>

        {/* Tabla comparativa de funcionalidades */}
        <div className="overflow-x-auto my-6 flex justify-center">
          <table className="border-collapse border border-gray-300 text-sm table-auto">
            <thead>
              <tr className="bg-[#FFC72C]/20">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-black">Funcionalidad</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-black">Usuario Free</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-black">Usuario Liga Premium</th>
              </tr>
            </thead>
            <tbody>
              {/* Funcionalidades Free */}
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Realizar apuestas simples</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Realizar apuestas combinadas</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Acceder a diferentes ligas deportivas</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Reseteo automático de presupuesto semanal</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Reseteo automático de presupuesto diario</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Ver clasificación</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Ver historial de apuestas</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Ver estadísticas básicas de usuario</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Participar en ligas semanales</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Cancelar apuestas (con restricciones)</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Ver resultados de partidos</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Acceso a diferentes mercados de apuestas</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              {/* Funcionalidades Premium */}
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">SuperBoleto</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Control de Días de Partidos</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Reseteo Manual de Semana</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Evolución de Multiplicadores</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-4 py-2 font-medium">Estadísticas Avanzadas de Liga</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Configuración Avanzada</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-gray-400">-</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-[#FFC72C]">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm md:text-base text-muted-foreground mb-6 italic">
          <strong>Nota:</strong> Las funcionalidades marcadas con "✓" solo están disponibles si la liga es premium. Los administradores pueden configurar y gestionar estas funcionalidades, mientras que los usuarios de ligas premium pueden utilizarlas según se indica en la tabla.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.1. SuperBoleto</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          El SuperBoleto es una funcionalidad que permite aumentar los multiplicadores de tus apuestas mediante un boost configurable. Esta opción está disponible solo para ligas premium.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Multiplicadores disponibles:</strong> Puedes configurar el multiplicador del SuperBoleto en 1.25x, 1.5x o 2.0x, según las preferencias de tu liga.</li>
          <li><strong>Límite de apuesta:</strong> Cada liga premium puede establecer un límite máximo de puntos que se pueden apostar en un SuperBoleto. Este límite es configurable por el administrador de la liga.</li>
          <li><strong>Funcionamiento:</strong> Al activar el SuperBoleto en una apuesta, se añade un multiplicador adicional al cálculo de las odds combinadas. El multiplicador del boost (1.25x, 1.5x o 2.0x) se aplica una vez al total de las odds multiplicadas de todas tus selecciones, aumentando potencialmente tus ganancias. Por ejemplo, si tienes dos selecciones con odds 2.0 y 3.0, y un boost de 1.5x, las odds finales serían: 2.0 × 3.0 × 1.5 = 9.0.</li>
          <li><strong>Disponibilidad:</strong> El SuperBoleto solo está disponible en ligas premium. En ligas gratuitas, esta funcionalidad no está disponible.</li>
          <li><strong>Límites semanales:</strong> Cada jugador tiene un número limitado de SuperBoletos disponibles por semana, que se reinician cada martes.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.2. Control de Días de Partidos</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Esta funcionalidad permite a los administradores de ligas premium gestionar qué días de la semana están disponibles los partidos en vivo para realizar apuestas.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Control granular:</strong> Los administradores pueden activar o desactivar la disponibilidad de partidos en vivo para cada día de la semana de forma independiente.</li>
          <li><strong>Estrategia de liga:</strong> Esta funcionalidad permite adaptar la disponibilidad de apuestas a las preferencias y estrategias de cada liga, ofreciendo mayor flexibilidad en la gestión del juego.</li>
          <li><strong>Partidos en directo:</strong> El control afecta específicamente a los partidos que se juegan en directo, permitiendo gestionar cuándo los jugadores pueden realizar apuestas en tiempo real.</li>
          <li><strong>Configuración dinámica:</strong> Los administradores pueden modificar la configuración en cualquier momento, permitiendo adaptarse a cambios en el calendario deportivo o en las preferencias de la liga.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.3. Reseteo Manual de Semana</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Las ligas premium pueden resetear manualmente la jornada de juego sin tener que esperar al martes, cuando normalmente se realiza el reinicio automático.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Control del administrador:</strong> Solo los administradores de la liga pueden realizar el reseteo manual de la semana.</li>
          <li><strong>Flexibilidad temporal:</strong> Esta funcionalidad permite adaptar el calendario de juego a las necesidades específicas de cada liga, sin depender del calendario estándar de reinicios automáticos.</li>
          <li><strong>Efectos del reseteo:</strong> Al resetear manualmente, se reinician los presupuestos semanales, se actualiza la semana de juego, y se reinician los contadores de bloqueos y SuperBoletos disponibles.</li>
          <li><strong>Actualización de temporada:</strong> El reseteo manual también puede incrementar el número de temporada de la liga, permitiendo llevar un registro histórico de las temporadas jugadas.</li>
          <li><strong>Campeón y último:</strong> Al resetear, el sistema registra automáticamente el jugador con más puntos como campeón de la temporada anterior y el jugador con menos puntos como último clasificado.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.4. Evolución de Multiplicadores</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Las ligas premium tienen acceso a visualizaciones avanzadas que muestran la evolución histórica de los multiplicadores de los partidos a lo largo del tiempo.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Análisis histórico:</strong> Esta funcionalidad permite ver cómo han cambiado los multiplicadores de los partidos a lo largo de diferentes jornadas y temporadas.</li>
          <li><strong>Visualización gráfica:</strong> Los datos se presentan de forma visual mediante gráficos que facilitan la comprensión de las tendencias y patrones en los multiplicadores.</li>
          <li><strong>Estrategia mejorada:</strong> Con esta información, los jugadores pueden tomar decisiones más informadas basándose en la evolución histórica de los multiplicadores.</li>
          <li><strong>Datos acumulativos:</strong> La visualización incluye datos de todas las jornadas jugadas, permitiendo un análisis completo de la evolución de los multiplicadores.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.5. Estadísticas Avanzadas de Liga</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Las ligas premium tienen acceso a un conjunto completo de estadísticas detalladas que proporcionan análisis avanzados sobre el rendimiento de la liga y de los jugadores.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Estadísticas por jornada:</strong> Información detallada de cada jornada jugada, incluyendo el total ganado por todos los jugadores y el porcentaje de aciertos de la liga.</li>
          <li><strong>Rendimiento de mercados:</strong> Análisis del rendimiento de cada tipo de mercado (Ganador, Doble oportunidad, Resultado exacto, etc.), mostrando cuáles son los más populares y cuáles tienen mayor tasa de acierto.</li>
          <li><strong>Estadísticas de jugadores:</strong> Análisis individual del rendimiento de cada jugador, incluyendo su tasa de aciertos, mercados más utilizados, y evolución a lo largo del tiempo.</li>
          <li><strong>Clasificación histórica:</strong> Visualización de la evolución de la clasificación a lo largo de las diferentes jornadas, permitiendo ver cómo han cambiado las posiciones de los jugadores.</li>
          <li><strong>Datos agregados:</strong> Estadísticas consolidadas que incluyen totales, promedios, y porcentajes que facilitan la comprensión del rendimiento general de la liga.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">11.6. Configuración Avanzada</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          Las ligas premium ofrecen opciones de configuración avanzadas que permiten personalizar en detalle el funcionamiento de la liga según las preferencias de los administradores.
        </p>
        <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground space-y-1 mb-4">
          <li><strong>Nombre de la liga:</strong> Los administradores pueden modificar el nombre de la liga en cualquier momento.</li>
          <li><strong>Presupuesto semanal:</strong> Configuración del presupuesto de puntos que cada jugador recibe al inicio de cada semana.</li>
          <li><strong>Límites de apuestas:</strong> Establecimiento de límites mínimos y máximos de puntos que se pueden apostar en cada boleto.</li>
          <li><strong>Configuración de SuperBoleto:</strong> Ajuste del multiplicador del SuperBoleto (1.25x, 1.5x o 2.0x) y del límite máximo de puntos que se pueden apostar en un SuperBoleto.</li>
          <li><strong>Ligas disponibles:</strong> Control sobre qué ligas deportivas están disponibles para que los jugadores realicen apuestas (La Liga, Champions League, Europa League, etc.).</li>
          <li><strong>Personalización completa:</strong> Todas estas configuraciones pueden modificarse en cualquier momento por el administrador, permitiendo adaptar la liga a las necesidades y preferencias del grupo.</li>
        </ul>

        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="text-sm md:text-base text-yellow-900 font-semibold mb-2">
            Nota importante sobre ligas premium
          </p>
          <p className="text-sm md:text-base text-yellow-800">
            Para acceder a estas funcionalidades, tu liga debe estar actualizada a premium. El coste de actualización se calcula dinámicamente en función del número de miembros y los meses restantes hasta el final de la temporada. Puedes consultar más información sobre el proceso de actualización a premium en la sección de administración de tu liga.
          </p>
        </div>
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


