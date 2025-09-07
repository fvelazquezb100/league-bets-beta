import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const Landing = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/jambollogo.png" 
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
      <section className="min-h-screen relative flex items-center justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background to-background">
          <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_30%,black,transparent)] bg-gradient-to-tr from-primary/30 to-accent/20" />
        </div>

        <article className="container mx-auto px-6 py-24 text-center relative z-10">
          {/* Jambol Logo */}
          <div className="mb-8 flex justify-center">
            <img 
              src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/jambollogo.png" 
              alt="Jambol Logo" 
              className="h-24 md:h-32 jambol-logo"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight jambol-dark mb-6">
            Jambol
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">
            Liga de Apuestas Simuladas
          </h2>
          <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Apostar nunca fue de ganar dinero, sino de demostrarle a los demás que sabes más de fútbol que ellos.
          </p>
          <div className="mt-12 flex items-center justify-center gap-6">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-4 jambol-primary">
                Empezar Ahora
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 jambol-secondary">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </article>
      </section>

      <section className="container mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
        <div className="rounded-xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Ligas Privadas</h2>
          <p className="text-muted-foreground leading-relaxed">
            Crea ligas privadas con tus amigos y demuestra quién sabe más de fútbol con apuestas simuladas.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Apuestas Justas</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sistema de puntos virtuales transparente donde solo cuenta tu conocimiento del juego.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Cuotas en Vivo</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sigue las cuotas actualizadas de los próximos partidos con datos en tiempo real.
          </p>
        </div>
      </section>
    </main>
  );
};