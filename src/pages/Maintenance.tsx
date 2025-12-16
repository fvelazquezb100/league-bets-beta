import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';

export const Maintenance: React.FC = () => {
    const handleReload = () => {
        window.location.href = '/home';
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-yellow-500/50 bg-zinc-900/50 backdrop-blur-sm">
                <CardContent className="pt-12 pb-12 px-6 text-center space-y-6">
                    <div className="flex justify-center">
                        <img
                            src={APP_CONFIG.ASSETS.LOGO}
                            alt="Jambol Logo"
                            className="h-24 w-auto animate-pulse"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Mantenimiento en curso
                        </h1>
                        <p className="text-gray-400">
                            Estamos actualizando los puntajes y clasificaciones de la jornada.
                            El sistema volverá a estar operativo en unos minutos.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleReload}
                            variant="outline"
                            className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 w-full"
                        >
                            Reintentar Conexión
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
