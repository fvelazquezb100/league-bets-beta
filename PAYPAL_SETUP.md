# Configuración de PayPal IPN para Pagos

Este documento explica cómo configurar PayPal IPN (Instant Payment Notification) para rastrear donaciones, suscripciones PRO y planes Premium de liga.

## Estructura de Pagos

El sistema soporta tres tipos de pagos:

1. **Donación** (`donation`): Pago opcional del usuario
2. **PRO** (`pro`): Suscripción de usuario PRO
3. **Premium** (`premium`): Suscripción premium de liga

## Tabla de Pagos

La tabla `payments` almacena todas las transacciones con los siguientes campos:

- `user_id`: ID del usuario que realiza el pago
- `league_id`: ID de la liga (solo para pagos premium)
- `payment_type`: Tipo de pago (`donation`, `pro`, `premium`)
- `amount`: Cantidad del pago
- `currency`: Moneda (por defecto EUR)
- `transaction_id`: ID único de transacción de PayPal
- `status`: Estado del pago (`pending`, `completed`, `failed`, `refunded`, `cancelled`)
- `ipn_data`: Datos completos de la notificación IPN (JSON)

## Configuración de PayPal IPN

### 1. Obtener la URL de tu Edge Function

Después de desplegar la función, obtén la URL:
```
https://tu-proyecto.supabase.co/functions/v1/paypal-ipn-handler
```

### 2. Configurar en PayPal

1. Inicia sesión en tu cuenta de PayPal
2. Ve a **Configuración** → **Notificaciones de pago** (Payment Notifications)
3. En "URL de notificación" (Notification URL), pega la URL de tu Edge Function
4. Guarda los cambios

### 3. URL de notificación

**Producción:**
```
https://ipnpb.paypal.com/cgi-bin/webscr
```

**Sandbox (para pruebas):**
```
https://ipnpb.sandbox.paypal.com/cgi-bin/webscr
```

La Edge Function detecta automáticamente si está en modo sandbox usando el campo `test_ipn`.

## Formato de Parámetros Personalizados

Cuando se genera un enlace de pago, se incluye un parámetro `custom` con la siguiente estructura JSON:

```json
{
  "user_id": "uuid-del-usuario",
  "payment_type": "donation|pro|premium",
  "league_id": 123  // Solo para pagos premium
}
```

Este JSON se codifica como URL-encoded y se pasa en el parámetro `custom` de PayPal.

## Ejemplo de Uso

### Donación (Settings.tsx)

```typescript
const customData = {
  user_id: user.id,
  payment_type: 'donation',
  league_id: profile.league_id || null,
};
const customParam = encodeURIComponent(JSON.stringify(customData));
const paypalUrl = `https://www.paypal.com/ncp/payment/WVF5SKN3B8PCN?custom=${customParam}`;
```

### Pago PRO (futuro)

```typescript
const customData = {
  user_id: user.id,
  payment_type: 'pro',
  league_id: null,
};
```

### Pago Premium (futuro)

```typescript
const customData = {
  user_id: user.id,
  payment_type: 'premium',
  league_id: leagueId,
};
```

## Funciones SQL Disponibles

- `get_user_total_donations(user_uuid)`: Obtiene el total de donaciones de un usuario
- `user_has_pro_subscription(user_uuid)`: Verifica si un usuario tiene suscripción PRO activa
- `league_has_premium_subscription(league_id)`: Verifica si una liga tiene suscripción premium activa
- `get_payment_statistics()`: Obtiene estadísticas generales de pagos (solo superadmins)

## Procesamiento Automático

Cuando se recibe una notificación IPN de PayPal:

1. Se verifica que la notificación es válida (viene de PayPal)
2. Se guarda el pago en la tabla `payments`
3. Si el pago es **PRO**: Se actualiza el perfil del usuario (pendiente implementar)
4. Si el pago es **Premium**: Se actualiza la liga a tipo `premium`

## Seguridad

- Las notificaciones IPN se verifican siempre con PayPal antes de procesarse
- Solo se procesan pagos con estado `Completed` o `Processed`
- Las transacciones duplicadas se detectan usando `transaction_id`
- Los permisos están controlados por RLS policies

## Testing

Para probar en modo sandbox:

1. Configura una cuenta de PayPal Sandbox
2. Asegúrate de que la URL de notificación apunte a tu Edge Function
3. Realiza un pago de prueba
4. Verifica en la tabla `payments` que se guardó correctamente
5. Revisa los logs de la Edge Function para debugging

## Troubleshooting

### La notificación IPN no se recibe

1. Verifica que la URL de notificación esté correctamente configurada en PayPal
2. Verifica que la Edge Function esté desplegada y accesible
3. Revisa los logs de Supabase Functions
4. Verifica que no haya problemas de firewall o CORS

### El pago se procesa pero no se guarda

1. Revisa los logs de la Edge Function
2. Verifica que los campos requeridos estén presentes en `custom`
3. Verifica que el formato JSON del campo `custom` sea válido
4. Revisa las RLS policies de la tabla `payments`

### Error de verificación IPN

- Asegúrate de que la Edge Function esté enviando correctamente la solicitud de verificación
- Verifica que estés usando la URL correcta (producción vs sandbox)
- Revisa que el User-Agent esté configurado correctamente

