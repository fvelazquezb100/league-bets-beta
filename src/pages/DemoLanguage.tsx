import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_CONFIG } from '@/config/app';

export const DemoLanguage = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en' | null>(null);

  const handleLanguageSelect = (language: 'es' | 'en') => {
    setSelectedLanguage(language);
    // Navegar a la demo con el idioma seleccionado
    navigate(`/home-demo?lang=${language}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img 
                src={APP_CONFIG.ASSETS.LOGO} 
                alt="Jambol Logo" 
                className="h-16 jambol-logo mx-auto mb-4"
              />
              <span className="text-3xl font-bold jambol-dark">
                Jambol
              </span>
            </div>
            
            <Card className="shadow-xl border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Idioma de la demo / Demo language</CardTitle>
                <CardDescription>
                  Selecciona tu idioma preferido para la demo / Select your preferred language for the demo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => handleLanguageSelect('es')}
                  className="w-full bg-white border-[#FFC72C] text-black hover:bg-[#FFC72C] hover:text-white"
                >
                  Quiero hacer la demo en español
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleLanguageSelect('en')}
                  className="w-full bg-white border-[#FFC72C] text-black hover:bg-[#FFC72C] hover:text-white"
                >
                  I like to do the demo in English
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Header Logo (Desktop only) */}
        <div className="hidden lg:flex lg:flex-1 lg:relative lg:bg-gradient-to-br lg:from-primary/10 lg:to-accent/10">
          <img 
            src={APP_CONFIG.ASSETS.HEADER_LOGO} 
            alt="Jambol Header" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};
