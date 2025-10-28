# Google Analytics 4 Integration

Este proyecto incluye una integración completa de Google Analytics 4 con bloqueo real de cookies para cumplimiento total con RGPD y políticas de AdSense.

## 🚀 Características

- **Bloqueo real de cookies**: Los scripts de GA4 solo se cargan cuando el usuario acepta cookies de análisis
- **Tracking automático de páginas**: Cada cambio de ruta se registra automáticamente
- **Eventos personalizados**: Sistema completo para tracking de acciones específicas
- **Cumplimiento RGPD**: Eliminación automática de cookies al revocar consentimiento

## 📊 Eventos Trackeados

### Eventos Automáticos
- **Page Views**: Cada cambio de página se registra automáticamente
- **User Registration**: Registro de nuevos usuarios
- **User Login**: Inicio de sesión de usuarios

### Eventos de Apuestas
- **Bet Placed**: Cuando un usuario realiza una apuesta
  - `bet_type`: Tipo de apuesta (single, combinada, etc.)
  - `stake`: Cantidad apostada
  - `odds`: Cuotas totales
  - `currency`: EUR

### Eventos de Ligas
- **League Joined**: Cuando un usuario se une a una liga
  - `league_id`: ID de la liga
  - `league_type`: Tipo de liga (premium, free, etc.)

## 🛠️ Uso del Hook

```typescript
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const MyComponent = () => {
  const { 
    trackEvent, 
    trackPageView, 
    trackUserAction,
    trackBetPlaced,
    trackBetWon,
    trackLeagueJoined,
    isAnalyticsEnabled 
  } = useGoogleAnalytics();

  // Track custom event
  const handleCustomAction = () => {
    trackEvent('custom_action', {
      action_type: 'button_click',
      page: 'home'
    });
  };

  // Track user action
  const handleUserAction = () => {
    trackUserAction('click', 'button', 'header_menu');
  };

  // Track bet placement
  const handleBetPlaced = () => {
    trackBetPlaced('single', 50, 2.5);
  };

  return (
    <div>
      {isAnalyticsEnabled && <p>Analytics activo</p>}
      <button onClick={handleCustomAction}>Track Action</button>
    </div>
  );
};
```

## 🔧 Configuración

### Variables de Entorno
```bash
# Google Analytics 4 Measurement ID
VITE_GA_MEASUREMENT_ID=G-N8SYMCJED4

# Google AdSense Client ID (opcional)
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
```

### Consentimiento de Cookies
El sistema utiliza el hook `useCookieConsent` para gestionar el consentimiento:

```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';

const { consent, acceptAll, rejectAll, updateConsent } = useCookieConsent();

// consent.analytics = true/false
// consent.marketing = true/false
// consent.necessary = true (siempre true)
```

## 📈 Eventos Disponibles

### Eventos Básicos
- `trackEvent(eventName, parameters)` - Evento personalizado
- `trackPageView(pagePath, pageTitle)` - Vista de página
- `trackUserAction(action, category, label?, value?)` - Acción de usuario

### Eventos Específicos
- `trackBetPlaced(betType, stake, odds)` - Apuesta realizada
- `trackBetWon(betType, payout)` - Apuesta ganada
- `trackLeagueJoined(leagueId, leagueType)` - Unirse a liga

## 🔒 Privacidad y Cumplimiento

### Bloqueo Real de Cookies
- Los scripts de GA4 **NO se cargan** hasta que el usuario acepte cookies de análisis
- Eliminación automática de cookies al revocar consentimiento
- Configuración con `anonymize_ip: true` para mayor privacidad

### Cookies Eliminadas al Revocar
- `_ga` - ID de cliente principal
- `_ga_*` - IDs de cliente específicos
- `_gid` - ID de cliente anónimo
- `_gat` - Cookie de throttling

## 🚨 Consideraciones Importantes

1. **Consentimiento Requerido**: GA4 solo funciona con consentimiento explícito
2. **No Tracking Sin Consentimiento**: Sin consentimiento, no se envía ningún dato
3. **Eliminación Completa**: Al revocar consentimiento, se eliminan todas las cookies
4. **Cumplimiento RGPD**: Sistema diseñado para cumplir con regulaciones europeas

## 📝 Logs de Debug

El sistema incluye logs de debug para desarrollo:

```javascript
// En consola del navegador
console.log('Google Analytics loaded with consent');
console.log('GA Event tracked:', eventName, parameters);
console.log('GA Page view tracked:', pagePath, pageTitle);
```

## 🔄 Actualizaciones Futuras

Para añadir nuevos eventos de tracking:

1. Añadir función al hook `useGoogleAnalytics`
2. Implementar en el componente correspondiente
3. Documentar el evento en este archivo
4. Probar con consentimiento activado/desactivado
