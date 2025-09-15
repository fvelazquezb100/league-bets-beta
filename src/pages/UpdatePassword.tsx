import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { APP_CONFIG } from '@/config/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [recoverySession, setRecoverySession] = useState<Session | null>(null);

  useEffect(() => {
    // SEO: title, description, canonical
    const title = "Jambol - Establecer Nueva Contraseña";
    const description = "Establece una nueva contraseña de forma segura.";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/update-password`);

    // Listen for Supabase PASSWORD_RECOVERY event and store session state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(!!session);
        setRecoverySession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!hasRecoverySession) {
      setError("Este enlace de recuperación es inválido o ha expirado. Abre el enlace desde tu correo.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
        // Redirect only after successful update
        setTimeout(() => {
          window.location.href = "/home";
        }, 1500);
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <main className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <img 
              src={APP_CONFIG.ASSETS.LOGO} 
              alt="Jambol Logo" 
              className="h-16 jambol-logo"
            />
            <h1 className="text-3xl font-bold jambol-dark">Jambol</h1>
          </div>
        </header>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Ingresa y confirma tu nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : (
              <>
                {!hasRecoverySession && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      Abre este enlace desde el correo de recuperación para continuar.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={!hasRecoverySession || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={!hasRecoverySession || isLoading}
                    />
                  </div>

                  <Button type="submit" className="jambol-button w-full" disabled={!hasRecoverySession || isLoading}>
                    {isLoading ? "Guardando..." : "Save New Password"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
