import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertCircle } from 'lucide-react';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export const DeveloperModeControl: React.FC = () => {
    const {
        developerMode,
        isLoading,
        updateDeveloperMode,
        isUpdating,
        updateError
    } = useBettingSettings();
    const { toast } = useToast();

    const handleToggleDeveloperMode = async (enabled: boolean) => {
        try {
            const result = await updateDeveloperMode(enabled);

            if (result.success) {
                toast({
                    title: enabled ? "Modo Desarrollador Activo" : "Modo Desarrollador Inactivo",
                    description: enabled
                        ? "Se han eliminado las restricciones de tiempo para visualizar partidos."
                        : "Se han restaurado las restricciones normales de tiempo.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al actualizar el modo desarrollador",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Error al actualizar la configuración",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC72C] mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Cargando...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-yellow-500/50">
            <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-500" />
                    Modo Desarrollador
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">
                            Activar Modo
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Bypass de restricciones de tiempo y visibilidad.
                        </p>
                    </div>
                    <Switch
                        checked={developerMode}
                        onCheckedChange={handleToggleDeveloperMode}
                        disabled={isUpdating}
                    />
                </div>

                {developerMode && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>¡Cuidado!</strong> Los usuarios verán todos los partidos y mercados, incluso los futuros o bloqueados.
                        </span>
                    </div>
                )}

                {updateError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                            Error al actualizar: {updateError.message}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
