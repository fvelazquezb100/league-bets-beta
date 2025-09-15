import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/app';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

const ERROR_MESSAGES = {
  // Authentication errors
  'Invalid login credentials': 'Credenciales incorrectas',
  'already registered': 'Este correo ya está registrado',
  'User not found': 'Usuario no encontrado',
  'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión',
  'Invalid email': 'Formato de email inválido',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  
  // Betting errors
  'insufficient_budget': 'Presupuesto insuficiente',
  'duplicate_fixture_in_combo': 'No se pueden combinar múltiples selecciones del mismo partido',
  'bet_closed': 'Las apuestas están cerradas para este partido',
  'invalid_odds': 'Cuotas inválidas',
  'selection_missing_odds': 'Faltan cuotas para la selección',
  
  // Database errors
  'duplicate key value': 'El valor ya existe',
  'foreign key constraint': 'Referencia inválida',
  'not_authenticated': 'Debes iniciar sesión',
  'insufficient privileges': 'Permisos insuficientes',
  
  // Network errors
  'Failed to fetch': 'Error de conexión. Verifica tu internet',
  'Network request failed': 'Error de red',
  'timeout': 'La operación tardó demasiado',
  
  // Generic errors
  'unknown': 'Ha ocurrido un error inesperado',
} as const;

export const useErrorHandler = () => {
  const { toast } = useToast();

  const getErrorMessage = (error: any): string => {
    if (!error) return ERROR_MESSAGES.unknown;
    
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';
    
    // Check for specific error messages
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase()) || 
          errorCode.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }
    
    // Check for Supabase specific errors
    if (errorMessage.includes('JWT')) {
      return 'Sesión expirada. Por favor, inicia sesión nuevamente';
    }
    
    if (errorMessage.includes('RLS')) {
      return 'No tienes permisos para realizar esta acción';
    }
    
    // Return generic message for unknown errors
    return ERROR_MESSAGES.unknown;
  };

  const logError = (error: any, context: ErrorContext = {}) => {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorInfo);
    }
    
    // In production, you would send this to a logging service
    // Example: sendToLoggingService(errorInfo);
  };

  const handleError = (
    error: any, 
    context: ErrorContext = {},
    showToast: boolean = true
  ) => {
    // Log the error
    logError(error, context);
    
    // Show user-friendly message
    if (showToast) {
      const message = getErrorMessage(error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
        duration: APP_CONFIG.UI.TOAST_DURATION,
      });
    }
  };

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext = {},
    showToast: boolean = true
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context, showToast);
      return null;
    }
  };

  return {
    handleError,
    handleAsyncError,
    getErrorMessage,
    logError,
  };
};
