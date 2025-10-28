# Google Analytics 4 Integration

Este proyecto utiliza Google Analytics 4 siguiendo exactamente las instrucciones oficiales de Google. El snippet recomendado por Google se inserta dinámicamente en cada página principal cuando el usuario acepta las cookies de análisis.

## 🚀 ¿Cómo funciona?

- El código oficial de GA4 se añade al `<head>` de la página en tiempo de ejecución.
- Solo se inyecta cuando el usuario acepta las cookies de análisis mediante el banner de consentimiento.
- Al abandonar la página o revocar el consentimiento, los scripts se eliminan del documento.

### Snippet que se inyecta
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-N8SYMCJED4');
</script>
```

## 🧩 Archivos que inyectan el snippet
El snippet se inserta en todas las páginas donde el usuario interactúa con la aplicación:

- `src/pages/Home.tsx`
- `src/pages/Bets.tsx`
- `src/pages/BetHistory.tsx`
- `src/pages/Settings.tsx`
- `src/pages/LeagueSetup.tsx`
- `src/pages/Clasificacion.tsx`
- `src/pages/AdminLiga.tsx`
- `src/pages/SuperAdmin.tsx`
- `src/pages/SuperAdminOtrasLigas.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`

Cada archivo utiliza `useCookieConsent` para verificar si el usuario ha aceptado las cookies de análisis antes de añadir el código.

## 🔒 Consentimiento de cookies
El componente `SiteFooter` contiene el banner de consentimiento. Cuando el usuario acepta las cookies de análisis:

1. `consent.analytics` pasa a `true`.
2. Cada página ve este valor y añade el snippet al `<head>`.
3. Si el usuario revoca el consentimiento, el snippet se elimina y las cookies de GA se limpian automáticamente.

## 🛠️ Variables de entorno
Asegúrate de definir el Measurement ID en los entornos correspondientes:

```bash
VITE_GA_MEASUREMENT_ID=G-N8SYMCJED4
```

- **Local**: en el archivo `.env`.
- **Producción / Vercel**: en *Project Settings → Environment Variables*.

## ✅ Resumen
- Snippet oficial copiado literalmente de la documentación de Google.
- Inyectado en todas las páginas principales tras aceptar cookies de análisis.
- Eliminado automáticamente al excluir las cookies.
- Sin hooks ni utilidades personalizadas; solo el snippet original.

Con esto, Google Analytics 4 debería detectar el tráfico correctamente siempre que el usuario haya otorgado consentimiento para las cookies de análisis.
