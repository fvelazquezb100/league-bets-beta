import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const HOW_IT_WORKS_STEPS = [
  'Crea tu cuenta y recibe tus primeros puntos virtuales.',
  'Haz tus pronósticos para los partidos de la jornada.',
  'Suma puntos por tus aciertos y multiplica tus puntos.',
  'Escala posiciones en la clasificación general o en tus ligas privadas.',
  'Repite cada jornada y demuestra quién sabe más de fútbol.',
] as const;

const UNIQUE_FEATURES = [
  {
    title: 'Estrategia real',
    description: 'Decide cuándo arriesgar y cuándo proteger tus puntos.',
  },
  {
    title: 'Competición social',
    description: 'Reta a tus amigos o crea ligas de empresa.',
  },
  {
    title: 'Clasificación en tiempo real',
    description: 'Sigue tu posición minuto a minuto.',
  },
  {
    title: 'Juego de habilidad',
    description: 'Gana quien piensa mejor, no quien tiene suerte.',
  },
  {
    title: 'Gratis y sin dinero real',
    description: 'Solo puntos virtuales y pura emoción.',
  },
] as const;

const COMMUNITY_QUOTES = [
  {
    quote: '“Jugar con mis colegas cada jornada se ha vuelto tradición.”',
    author: 'Zulo',
  },
  {
    quote: '“La mejor forma de demostrar que sabes más de fútbol que tus amigos.”',
    author: 'Mayestic',
  },
  {
    quote: '“Cada jornada es una nueva oportunidad para subir en la clasificación.”',
    author: 'Jerb',
  },
  {
    quote: '“Me encanta la estrategia que requiere cada selección. No es solo suerte.”',
    author: 'Ferro',
  },
  {
    quote: '“Crear ligas privadas con mi grupo de amigos ha sido lo mejor.”',
    author: 'Van',
  },
  {
    quote: '“Seguir la clasificación en tiempo real es adictivo.”',
    author: 'Vela',
  },
  {
    quote: '“Finalmente un juego donde la habilidad importa más que la suerte.”',
    author: 'Torri',
  },
  {
    quote: '“Las cuotas en vivo hacen que cada partido sea emocionante.”',
    author: 'Tole',
  },
  {
    quote: '“La competencia sana con mis compañeros de trabajo es genial.”',
    author: 'Pipinho',
  },
  {
    quote: '“Cada acierto se siente como una victoria personal.”',
    author: 'Juande',
  },
  {
    quote: '“La mejor app para los que realmente entendemos de fútbol.”',
    author: 'Jambo',
  },
  {
    quote: '“Jugar sin riesgo real pero con toda la emoción del fútbol.”',
    author: 'Morodo',
  },
  {
    quote: '“El panel de estadísticas es increíble para analizar mi rendimiento.”',
    author: 'Arturorv',
  },
] as const;

const SCREENSHOT_IMAGES = [
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/bloqueo.png',
    name: 'Bloqueo de Partidos',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/clasificacion.png',
    name: 'Clasificación',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/ests.png',
    name: 'Estadísticas',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/historial.png',
    name: 'Historial',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/liga.png',
    name: 'Administración de Liga',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/partidos.png',
    name: 'Partidos',
  },
  {
    url: 'https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/landingpage/perfil.png',
    name: 'Perfil',
  },
] as const;

import { useBettingSettings } from '@/hooks/useBettingSettings';

// ... existing imports ...

export const Landing = () => {
  const { user, loading } = useAuth();
  const { maintenanceMode, isLoading: settingsLoading } = useBettingSettings();
  // ... existing hooks ...

  // ... existing code ...

  if (loading || (user && settingsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src={APP_CONFIG.ASSETS.LOGO}
            alt="Jambol Logo"
            className="h-20 jambol-logo-loading"
          />
          <span className="text-lg font-semibold jambol-dark">Cargando...</span>
        </div>
      </div>
    );
  }

  if (user && !maintenanceMode) {
    return <Navigate to="/home" replace />;
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background to-background"
        >
          <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(55%_55%_at_50%_30%,black,transparent)] bg-gradient-to-tr from-primary/40 via-accent/20 to-background" />
        </div>

        <article className="container relative z-10 mx-auto grid gap-12 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#FFC72C] shadow-lg backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#FFC72C] animate-pulse" />
              Temporada beta abierta · Sin coste
            </div>

            <div className="my-10 flex justify-center lg:justify-start">
              <img
                src={APP_CONFIG.ASSETS.LOGO}
                alt="Jambol Logo"
                className="h-24 md:h-32 jambol-logo"
              />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight jambol-dark">
              Predice, compite y domina cada jornada de fútbol.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
              Jambol es la experiencia fantasy para gente que piensa: pronostica partidos, optimiza tus
              puntos virtuales y escala las clasificaciones públicas o privadas sin usar dinero real.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link to="/signup" className="w-full sm:w-auto" aria-label="Crear cuenta en Jambol y empezar a jugar">
                <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                  Empezar ahora
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto" aria-label="Iniciar sesión en tu cuenta de Jambol">
                <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>

            <dl className="mt-12 grid gap-6 text-left sm:grid-cols-3">
              <div className="rounded-xl border-2 border-[#2D2D2D] bg-white p-4 shadow-md">
                <dt className="text-sm uppercase tracking-widest text-muted-foreground">Ligas creadas</dt>
                <dd className="text-3xl font-bold jambol-dark">120+</dd>
              </div>
              <div className="rounded-xl border-2 border-[#2D2D2D] bg-white p-4 shadow-md">
                <dt className="text-sm uppercase tracking-widest text-muted-foreground">Pronósticos jugados</dt>
                <dd className="text-3xl font-bold jambol-dark">15K+</dd>
              </div>
              <div className="rounded-xl border-2 border-[#2D2D2D] bg-white p-4 shadow-md">
                <dt className="text-sm uppercase tracking-widest text-muted-foreground">Riesgo real</dt>
                <dd className="text-3xl font-bold text-[#FFC72C]">0%</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border-2 border-[#2D2D2D] bg-white/80 p-8 shadow-2xl backdrop-blur lg:self-center">
            <div className="rounded-2xl border-2 border-[#2D2D2D] bg-gradient-to-br from-[#FFC72C] via-[#E6B328] to-[#CC9F24] p-6 text-white shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                Tu estrategia, tu liga
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-snug">
                Diseña jugadas, comparte picks y celebra cada acierto en comunidad.
              </h2>
              <p className="mt-4 text-white/90">
                Configura ligas cerradas, ajusta puntos iniciales y vive cada jornada como si fueras el
                director deportivo de tu grupo.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-white/90">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Cuotas actualizadas en vivo
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Panel de rendimiento por jornada
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Ranking general y privado
                </li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section
        id="como-funciona"
        className="relative overflow-hidden bg-white py-24"
      >
        <div className="container relative mx-auto px-6">
          <h2 className="text-4xl font-bold text-foreground">
            Así se juega en <span className="text-[#FFC72C]">Jambol</span>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Un onboarding claro y cinco pasos para engancharte desde la primera jornada.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Left side: Steps list */}
            <div className="space-y-6">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl border-2 border-[#2D2D2D] bg-white p-6 shadow-md transition hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-black text-[#FFC72C]">{index + 1}</span>
                    <p className="text-lg leading-relaxed text-foreground">
                      <em>{step}</em>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: Image carousel with browser frame */}
            <div className="relative lg:sticky lg:top-24 h-[600px] lg:h-[700px] flex flex-col gap-4">
              <div
                className="browser-frame rounded-xl border-2 border-[#2D2D2D] bg-white shadow-2xl overflow-hidden cursor-zoom-in transition-transform hover:scale-[1.02]"
                onClick={() => setIsLightboxOpen(true)}
              >
                {/* Browser header */}
                <div className="browser-header bg-[#2D2D2D] px-4 py-2 flex items-center">
                  {/* Browser controls */}
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                  </div>
                </div>
                {/* Browser content */}
                <div className="browser-content bg-white h-full">
                  <img
                    src={currentScreenshot.url}
                    alt={`Captura de pantalla de Jambol mostrando ${currentScreenshot.name}`}
                    className={`w-full h-full object-contain transition-opacity duration-500 ${isImageTransitioning ? 'opacity-0' : 'opacity-100'
                      }`}
                    style={{ maxHeight: 'calc(100% - 48px)' }}
                  />
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex flex-wrap justify-center gap-2 px-4">
                {SCREENSHOT_IMAGES.map((img, index) => (
                  <button
                    key={img.name}
                    onClick={() => handleImageSelect(index)}
                    className={`group relative flex items-center justify-center rounded-full transition-all duration-300 ${currentImageIndex === index
                      ? 'w-8 h-2 bg-[#FFC72C]'
                      : 'w-2 h-2 bg-gray-300 hover:bg-[#FFC72C]/50'
                      }`}
                    aria-label={`Ver captura de ${img.name}`}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2D2D2D] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {img.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsLightboxOpen(false)}
              >
                <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center">
                  <button
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute -top-12 right-0 text-white hover:text-[#FFC72C] transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <img
                    src={currentScreenshot.url}
                    alt={`Captura de pantalla de Jambol mostrando ${currentScreenshot.name}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <p className="mt-4 text-white text-lg font-medium">
                    {currentScreenshot.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-lg text-muted-foreground">
            Un sistema <span className="text-[#FFC72C] font-semibold">sencillo</span>, <span className="text-[#FFC72C] font-semibold">dinámico</span> y basado en <span className="text-[#FFC72C] font-semibold">habilidad</span>.
          </p>
        </div>
      </section>

      <section
        id="lo-que-hace-unico"
        className="bg-gradient-to-b from-[#FFC72C]/10 via-white to-white py-20"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-foreground">
            Más que un fantasy. Una prueba de inteligencia deportiva.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-muted-foreground">
            Lo importante no es hacer más selecciones, sino pensar mejor. Diseñamos Jambol para que cada jornada sea
            una oportunidad estratégica y social.
          </p>

          <div className="mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {UNIQUE_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border-2 border-[#2D2D2D] bg-white p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl hover:border-[#FFC72C]"
              >
                <h3 className="text-xl font-semibold italic text-foreground border-l-4 border-[#FFC72C] pl-3">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="vive-la-emocion" className="bg-gradient-to-br from-[#FFC72C] via-[#E6B328] to-[#CC9F24] py-24 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">
            Cada partido cuenta. Cada pronóstico puede cambiar la tabla.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/90">
            Jambol transforma cómo vives el fútbol: no solo lo ves, lo <em>juegas con cabeza</em>. Compite
            con tu grupo, sigue las rachas y presume de tus aciertos con una experiencia social y
            estratégica.
          </p>
        </div>
      </section>

      <section id="ligas-privadas" className="bg-gradient-to-b from-[#FFC72C]/10 via-white to-white py-20">
        <div className="container mx-auto px-6 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Crea tu propia liga</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Forma una liga con tus amigos, compañeros o peña futbolera. Define tus reglas, invita a quien
              quieras y <em>corónate campeón del grupo</em>.
            </p>
            <ul className="mt-8 space-y-4 text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#FFC72C]" />
                Configura puntos iniciales, duración y reglas especiales.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#FFC72C]" />
                Comparte rankings semanales con tu comunidad.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#FFC72C]" />
                Integración con notificaciones para no perder ninguna jornada.
              </li>
            </ul>

          </div>
          <div className="flex items-start justify-center lg:justify-start">
            <div className="rounded-xl border-2 border-[#2D2D2D] bg-white/80 p-4 shadow-xl relative overflow-hidden max-w-sm w-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFC72C]"></div>
              <p
                className={`text-sm italic text-foreground transition-opacity duration-300 leading-relaxed ${isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
              >
                {COMMUNITY_QUOTES[currentQuoteIndex].quote}
              </p>
              <p
                className={`mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC72C] transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
              >
                — {COMMUNITY_QUOTES[currentQuoteIndex].author}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidad-premium" className="bg-[#2D2D2D] py-24">
        <div className="container mx-auto px-6">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFC72C] to-[#E6B328] px-4 py-2 text-sm font-semibold text-[#2D2D2D] border-2 border-[#2D2D2D] shadow-lg">
              <span className="h-2 w-2 rounded-full bg-[#2D2D2D]" />
              Funcionalidad Premium
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Lleva tu liga al siguiente nivel
          </h2>
          <p className="text-lg text-center text-white/80 max-w-3xl mx-auto mb-12">
            Desbloquea herramientas avanzadas que transforman tu liga en una experiencia competitiva única. Control total, análisis profundo y estrategias que marcan la diferencia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Actualizar puntos */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#FFC72C]/80 cursor-pointer group">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC72C]/20 group-hover:bg-[#FFC72C]/30 transition-colors">
                <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Actualizar puntos</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Ajusta los puntos de los jugadores en cualquier momento. Corrige errores, aplica bonificaciones especiales o adapta el sistema a tus reglas personalizadas. Control total sobre la clasificación.
              </p>
            </div>

            {/* Evolución de multiplicadores */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#FFC72C]/80 cursor-pointer group">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC72C]/20 group-hover:bg-[#FFC72C]/30 transition-colors">
                <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Evolución de multiplicadores</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Visualiza cómo cambian los multiplicadores en tiempo real. Flechas que indican subidas y bajadas te ayudan a tomar decisiones estratégicas en el momento perfecto. Información que marca la diferencia.
              </p>
            </div>

            {/* Bloqueos de partidos */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#FFC72C]/80 cursor-pointer group">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC72C]/20 group-hover:bg-[#FFC72C]/30 transition-colors">
                <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bloqueos de partidos</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                La herramienta definitiva de estrategia. Bloquea partidos específicos a tus rivales para limitar sus opciones y ganar ventaja competitiva. Cada bloqueo cuenta, cada movimiento importa.
              </p>
            </div>

            {/* Más estadísticas */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#FFC72C]/80 cursor-pointer group">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC72C]/20 group-hover:bg-[#FFC72C]/30 transition-colors">
                <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Más estadísticas</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Análisis profundo del rendimiento de cada jugador. Gráficos detallados, tendencias históricas y métricas avanzadas que te ayudan a entender quién realmente domina la liga. Datos que revelan la verdad.
              </p>
            </div>

            {/* Selecciones de otras ligas */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#FFC72C]/80 cursor-pointer group">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC72C]/20 group-hover:bg-[#FFC72C]/30 transition-colors">
                <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Selecciones de otras ligas</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Espía las estrategias de otras ligas premium. Descubre qué partidos eligen los mejores jugadores y aprende de sus decisiones. La información es poder, y aquí la tienes toda.
              </p>
            </div>

            {/* Liga Premium - Card destacada */}
            <div className="rounded-2xl border-2 border-[#FFC72C] bg-gradient-to-br from-[#2D2D2D] via-[#3a3a2a] to-[#4a4a3a] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 cursor-pointer group relative overflow-hidden">
              {/* Degradado de fondo jambol gold a jambol grey */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFC72C]/20 via-[#FFC72C]/10 to-[#2D2D2D] opacity-60 rounded-2xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icono cuadrado con fondo dorado */}
                <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-xl bg-[#FFC72C] shadow-lg">
                  <svg className="w-10 h-10 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    {/* Estrella principal de 4 puntas */}
                    <path d="M12 2 L14 9 L21 9 L15 14 L17 21 L12 17 L7 21 L9 14 L3 9 L10 9 Z" />
                    {/* Destellos pequeños */}
                    <circle cx="8" cy="6" r="1" fill="currentColor" />
                    <circle cx="16" cy="6" r="1" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Liga Premium</h3>
                <p className="text-white/90 mb-6 text-base">
                  Todo lo que necesitas para dominar la competición
                </p>
                <ul className="space-y-3 text-white text-sm w-full text-left">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Control total de puntos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Análisis avanzado</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Herramientas estratégicas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="seguridad"
        className="bg-gradient-to-br from-[#FFC72C] via-[#E6B328] to-[#CC9F24] py-24 text-white"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Juego responsable, sin dinero real
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-white/90">
            Jambol utiliza puntos virtuales sin valor económico. No se realizan pagos ni se ofrecen
            premios monetarios. Nuestro sistema está diseñado para fomentar la estrategia, la sana
            competencia y la diversión.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              'Puntos virtuales, sin dinero real.',
              'Registros auditables y estadísticas públicas.',
              'Moderación activa contra comportamientos tóxicos.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border-2 border-[#FFC72C] bg-[#2D2D2D] p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 hover:border-[#FFC72C]/90 cursor-pointer group"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFC72C] opacity-20 rounded-bl-full transition-opacity duration-300 group-hover:opacity-30"></div>
                <p className="text-lg text-white/90 relative z-10 transition-colors duration-300 group-hover:text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta-final" className="bg-gradient-to-b from-[#FFC72C]/10 to-white py-24 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-foreground">
            Demuestra que sabes más que el resto
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Regístrate gratis, crea tu liga y empieza a jugar hoy mismo. Cada jornada es una nueva
            oportunidad para dominar la clasificación.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/signup" className="w-full sm:w-auto" aria-label="Crear cuenta en Jambol y empezar a jugar">
              <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                Empezar ahora
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto" aria-label="Iniciar sesión en tu cuenta de Jambol">
              <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
};