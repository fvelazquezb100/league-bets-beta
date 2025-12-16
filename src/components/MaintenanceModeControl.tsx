import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Hammer, AlertTriangle } from 'lucide-react';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export const MaintenanceModeControl: React.FC = () => {
    const {
        maintenanceMode,
        isLoading,
        updateMaintenanceMode,
        isUpdating,
        updateError
    } = useBettingSettings();
    const { toast } = useToast();

    const handleToggleMaintenanceMode = async (enabled: boolean) => {
        try {
            const result = await updateMaintenanceMode(enabled);

            if (result.success) {
                toast({
                    title: enabled ? "Modo Mantenimiento Activo" : "Modo Mantenimiento Inactivo",
                    description: enabled
                        ? "El sistema está ahora en mantenimiento. Los usuarios serán redirigidos."
                        : "El sistema ha vuelto a la normalidad.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al actualizar el modo mantenimiento",
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
        <Card className={`h-full ${maintenanceMode ? 'border-red-500/50 bg-red-50/10' : ''}`}>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Hammer className={`h-5 w-5 ${maintenanceMode ? 'text-red-500' : 'text-gray-500'}`} />
                    Modo Mantenimiento
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">
                            Activar Mantenimiento
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Redirige a los usuarios a la página de mantenimiento.
                        </p>
                    </div>
                    <Switch
                        checked={maintenanceMode}
                        onCheckedChange={handleToggleMaintenanceMode}
                        disabled={isUpdating}
                    />
                </div>

                {maintenanceMode && (
                    <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md text-sm text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>¡Atención!</strong> El sistema está bloqueado para usuarios normales. Solo SuperAdmins pueden navegar.
                        </span>
                    </div>
                )}

                {updateError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                            Error al actualizar: {updateError.message}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
