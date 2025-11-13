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
    quote: '“Me encanta la estrategia que requiere cada apuesta. No es solo suerte.”',
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
  'https://lflxrkkzudsecvdfdxwl.supabase.co/storage/v1/object/public/media/screenshot%20landing%20page/Admin%20Liga.png',
  'https://lflxrkkzudsecvdfdxwl.supabase.co/storage/v1/object/public/media/screenshot%20landing%20page/Estadisticas.png',
  'https://lflxrkkzudsecvdfdxwl.supabase.co/storage/v1/object/public/media/screenshot%20landing%20page/Historial.png',
  'https://lflxrkkzudsecvdfdxwl.supabase.co/storage/v1/object/public/media/screenshot%20landing%20page/Partidos.png',
  'https://lflxrkkzudsecvdfdxwl.supabase.co/storage/v1/object/public/media/screenshot%20landing%20page/Perfil.png',
] as const;

export const Landing = () => {
  const { user, loading } = useAuth();
  const { consent } = useCookieConsent();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);

  useEffect(() => {
    const pageTitle = 'Jambol — Liga de Apuestas Simuladas';
    const description =
      'Jambol es tu fantasy estratégico: pronostica partidos, crea ligas privadas y escala la clasificación con puntos virtuales.';
    const keywords =
      'jambol, apuestas simuladas, fantasy fútbol, ligas privadas, pronósticos deportivos, puntos virtuales, clasificaciones en vivo';
    const image = APP_CONFIG.ASSETS.LOGO;
    const currentUrl = window.location.origin + window.location.pathname;

    document.title = pageTitle;

    const metaDefinitions = [
      {
        selector: 'meta[name="description"]',
        attributes: { name: 'description' },
        content: description,
      },
      {
        selector: 'meta[name="keywords"]',
        attributes: { name: 'keywords' },
        content: keywords,
      },
      {
        selector: 'meta[property="og:title"]',
        attributes: { property: 'og:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[property="og:description"]',
        attributes: { property: 'og:description' },
        content: description,
      },
      {
        selector: 'meta[property="og:image"]',
        attributes: { property: 'og:image' },
        content: image,
      },
      {
        selector: 'meta[property="og:url"]',
        attributes: { property: 'og:url' },
        content: currentUrl,
      },
      {
        selector: 'meta[property="og:type"]',
        attributes: { property: 'og:type' },
        content: 'website',
      },
      {
        selector: 'meta[name="twitter:title"]',
        attributes: { name: 'twitter:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[name="twitter:description"]',
        attributes: { name: 'twitter:description' },
        content: description,
      },
      {
        selector: 'meta[name="twitter:image"]',
        attributes: { name: 'twitter:image' },
        content: image,
      },
      {
        selector: 'meta[name="twitter:card"]',
        attributes: { name: 'twitter:card' },
        content: 'summary_large_image',
      },
    ];

    const managedMeta = metaDefinitions.map(({ selector, attributes, content }) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      let created = false;

      if (!element) {
        element = document.createElement('meta');
        Object.entries(attributes).forEach(([attribute, value]) => {
          element?.setAttribute(attribute, value);
        });
        document.head.appendChild(element);
        created = true;
      }

      const previousContent = element.getAttribute('content') ?? undefined;
      element.setAttribute('content', content);

      return { element, previousContent, created };
    });

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonicalLink?.getAttribute('href') ?? undefined;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Structured Data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Jambol',
      description:
        'Jambol es tu fantasy estratégico: pronostica partidos, crea ligas privadas y escala la clasificación con puntos virtuales.',
      url: window.location.origin,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        ratingCount: '120',
      },
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    const previousScriptContent = scriptTag?.textContent ?? undefined;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      managedMeta.forEach(({ element, previousContent, created }) => {
        if (created && element.parentNode) {
          element.parentNode.removeChild(element);
        } else if (!created && typeof previousContent === 'string') {
          element.setAttribute('content', previousContent);
        }
      });

      // Restore canonical URL
      if (canonicalLink) {
        if (previousCanonical) {
          canonicalLink.setAttribute('href', previousCanonical);
        } else if (canonicalLink.parentNode) {
          canonicalLink.parentNode.removeChild(canonicalLink);
        }
      }

      // Restore structured data
      if (scriptTag) {
        if (previousScriptContent) {
          scriptTag.textContent = previousScriptContent;
        } else if (scriptTag.parentNode) {
          scriptTag.parentNode.removeChild(scriptTag);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!consent?.analytics) {
      return;
    }

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-N8SYMCJED4');
    `;
    document.head.appendChild(script2);

    return () => {
      if (script1.parentNode) {
        script1.parentNode.removeChild(script1);
      }
      if (script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
  }, [consent?.analytics]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % COMMUNITY_QUOTES.length);
        setIsTransitioning(false);
      }, 300); // Duración de la transición
    }, 4000); // Cambia cada 4 segundos

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsImageTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % SCREENSHOT_IMAGES.length);
        setIsImageTransitioning(false);
      }, 500); // Duración de la transición fade
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  if (loading) {
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

  if (user) {
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
              puntos virtuales y escala las clasificaciones públicas o privadas sin apostar dinero real.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                  Empezar ahora
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
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
              <h3 className="mt-4 text-3xl font-semibold leading-snug">
                Diseña jugadas, comparte picks y celebra cada acierto en comunidad.
              </h3>
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

            {/* Right side: Image carousel */}
            <div className="relative lg:sticky lg:top-24 h-[600px] lg:h-[700px]">
              <img
                src={SCREENSHOT_IMAGES[currentImageIndex]}
                alt={`Screenshot ${currentImageIndex + 1}`}
                className={`w-full h-full object-contain transition-opacity duration-500 ${
                  isImageTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              />
            </div>
          </div>

          <p className="mt-10 text-center text-lg text-muted-foreground">
            Un sistema <span className="text-[#FFC72C] font-semibold">sencillo</span>, <span className="text-[#FFC72C] font-semibold">dinámico</span> y 100 % basado en <span className="text-[#FFC72C] font-semibold">habilidad</span>.
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
            Lo importante no es apostar más, sino pensar mejor. Diseñamos Jambol para que cada jornada sea
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

            <div className="mt-10 rounded-2xl border-2 border-[#2D2D2D] bg-gradient-to-br from-[#FFC72C]/20 to-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-[#FFC72C]">✨</span>
                <h3 className="text-2xl font-bold text-foreground">Ligas Premium</h3>
              </div>
              <p className="mb-6 text-muted-foreground">
                Potencia tu liga con funcionalidades avanzadas para una experiencia de juego más dinámica y estratégica.
              </p>
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-[#FFC72C] font-bold mt-1">•</span>
                  <span>
                    <strong className="text-foreground">Modifica los puntos</strong> en tiempo real para ajustar la dificultad y estrategia.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FFC72C] font-bold mt-1">•</span>
                  <span>
                    <strong className="text-foreground">Estadísticas avanzadas</strong> personales y de liga para analizar el rendimiento detallado.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FFC72C] font-bold mt-1">•</span>
                  <span>
                    <strong className="text-foreground">Bloquea partidos</strong> para el resto de usuarios y añade capas extra de estrategia y dinamismo.
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex items-start justify-center lg:justify-start">
            <div className="rounded-xl border-2 border-[#2D2D2D] bg-white/80 p-4 shadow-xl relative overflow-hidden max-w-sm w-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFC72C]"></div>
              <p
                className={`text-sm italic text-foreground transition-opacity duration-300 leading-relaxed ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {COMMUNITY_QUOTES[currentQuoteIndex].quote}
              </p>
              <p
                className={`mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC72C] transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                — {COMMUNITY_QUOTES[currentQuoteIndex].author}
              </p>
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
                className="rounded-3xl border-2 border-[#2D2D2D] bg-white/5 p-6 shadow-lg backdrop-blur relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFC72C] opacity-20 rounded-bl-full"></div>
                <p className="text-lg text-white/90 relative z-10">{item}</p>
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
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="jambol-button w-full text-lg px-10 py-4">
                Empezar ahora
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
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