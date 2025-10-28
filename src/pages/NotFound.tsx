import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { APP_CONFIG } from '@/config/app';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <img 
            src={APP_CONFIG.ASSETS.LOGO} 
            alt="Jambol Logo" 
            className="h-24 jambol-logo"
          />
        </div>
        <h1 className="text-6xl font-bold jambol-dark mb-4">404</h1>
        <h2 className="text-2xl font-semibold jambol-dark mb-2">¡Ups! Página no encontrada</h2>
        <p className="text-lg text-muted-foreground mb-8">La página que buscas no existe en Jambol</p>
        <Link to="/">
          <Button className="jambol-primary">
            Volver al Inicio
          </Button>
        </Link>
        <div className="mt-4">
          <Link to="/politica-cookies" className="underline text-xs text-muted-foreground">
            Política de Cookies
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground max-w-2xl mx-auto">
          Jambol ™ es un juego de simulación. No se realizan apuestas con dinero real ni se ofrecen premios económicos. Todos los puntos y resultados son ficticios y se utilizan solo con fines recreativos.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
