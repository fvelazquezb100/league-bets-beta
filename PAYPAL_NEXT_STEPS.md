# Próximos Pasos para Implementar Pagos de PayPal

## ✅ Lo que ya está implementado

1. ✅ Tabla `payments` creada en la base de datos
2. ✅ Edge Function `paypal-ipn-handler` creada
3. ✅ Edge Function `upgrade-league-to-premium` implementada
4. ✅ Botón de donación con parámetros personalizados
5. ✅ Sistema de actualización a premium (gratis por ahora)
6. ✅ Registro de pagos en la tabla `payments`

## 🎯 Pasos siguientes

### 1. Desplegar la Edge Function de PayPal IPN

Ejecuta este comando desde la raíz del proyecto:

```bash
npx supabase functions deploy paypal-ipn-handler
```

O si prefieres desplegar todas las funciones:

```bash
npx supabase functions deploy
```

**Nota**: Asegúrate de estar autenticado con Supabase CLI (`npx supabase login`).

### 2. Obtener la URL de la Edge Function

Después del deploy, la URL será:

```
https://[TU-PROYECTO-ID].supabase.co/functions/v1/paypal-ipn-handler
```

Reemplaza `[TU-PROYECTO-ID]` con tu ID de proyecto de Supabase.

Puedes encontrar tu proyecto ID en:
- Supabase Dashboard → Settings → API → Project URL

### 3. Configurar PayPal IPN

#### Para Producción:

1. Inicia sesión en [PayPal Business](https://www.paypal.com/businessmanage/account/settings)
2. Ve a **Account Settings** → **Website preferences**
3. En la sección **Instant Payment Notifications (IPN)**, haz clic en **Update**
4. En "Notification URL", pega la URL de tu Edge Function:
   ```
   https://[TU-PROYECTO-ID].supabase.co/functions/v1/paypal-ipn-handler
   ```
5. Selecciona **Receive IPN messages (Enabled)**
6. Guarda los cambios

#### Para Sandbox (Pruebas):

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Selecciona tu aplicación o crea una nueva
3. Ve a **Sandbox** → **Accounts** y selecciona tu cuenta de negocio
4. Ve a **Account Settings** → **Website preferences**
5. Configura la URL de IPN igual que en producción, pero usando la URL de tu proyecto

### 4. Aplicar la migración de la base de datos

Si aún no lo has hecho, aplica la migración que crea la tabla `payments`:

```bash
npx supabase db push
```

O específicamente la migración:

```bash
npx supabase migration up
```

### 5. Probar el sistema completo

#### Prueba 1: Donación

1. Ve a Settings en tu aplicación
2. Haz clic en "Apoyar con PayPal"
3. Completa un pago de prueba (usa PayPal Sandbox para pruebas)
4. Verifica en la tabla `payments` que se registró:
   ```sql
   SELECT * FROM payments WHERE payment_type = 'donation' ORDER BY created_at DESC LIMIT 1;
   ```
5. Verifica que el usuario vea el mensaje de agradecimiento en Settings

#### Prueba 2: Premium Upgrade (con pago real en el futuro)

**Actual (gratis):**
- El botón "Actualizar a Premium" funciona directamente
- Se registra en `payments` con `amount = 0`
- La liga se actualiza a `premium` inmediatamente

**Futuro (con pago):**
Cuando implementes pagos reales para premium:

1. Modifica el botón para que redirija a PayPal en lugar de actualizar directamente
2. Crea un enlace de pago PayPal con `payment_type: 'premium'` y `league_id`
3. PayPal enviará la notificación IPN
4. La Edge Function actualizará automáticamente la liga a premium

### 6. Actualizar el flujo de Premium para pagos reales

Cuando estés listo para cobrar por premium, necesitarás modificar:

#### En `PremiumUpgradeModal.tsx`:

```typescript
const handleUpgrade = async () => {
  // En lugar de llamar directamente a upgrade-league-to-premium
  // Redirige a PayPal con los parámetros correctos
  
  const customData = {
    user_id: user.id,
    payment_type: 'premium',
    league_id: leagueId,
  };
  
  const customParam = encodeURIComponent(JSON.stringify(customData));
  const paypalUrl = `https://www.paypal.com/ncp/payment/[TU-CODIGO-PREMIUM]?custom=${customParam}&amount=[PRECIO]`;
  
  window.open(paypalUrl, '_blank', 'noopener,noreferrer');
};
```

#### La Edge Function `paypal-ipn-handler` ya está preparada:

- Ya detecta pagos tipo `premium`
- Ya actualiza automáticamente la liga a premium (línea 222-230)
- Solo necesitas crear el botón de pago en PayPal

### 7. Crear botones de pago en PayPal

Para cada tipo de pago, crea un botón en PayPal:

1. Ve a [PayPal Button Manager](https://www.paypal.com/button-manager/)
2. Crea un botón para cada tipo:
   - **Donación**: Ya existe (código: WVF5SKN3B8PCN)
   - **Premium**: Crea uno nuevo con el precio deseado
   - **PRO**: Crea uno nuevo (futuro)
3. Para cada botón, asegúrate de habilitar "Custom information" y pasa el parámetro `custom`

### 8. Monitoreo y Logs

Para verificar que todo funciona:

1. **Logs de Edge Functions**:
   ```bash
   npx supabase functions logs paypal-ipn-handler
   ```

2. **Verificar pagos en la base de datos**:
   ```sql
   SELECT * FROM payments 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Verificar upgrades a premium**:
   ```sql
   SELECT p.*, l.name as league_name 
   FROM payments p
   LEFT JOIN leagues l ON p.league_id = l.id
   WHERE p.payment_type = 'premium'
   ORDER BY p.created_at DESC;
   ```

### 9. Configurar webhook de PayPal (Opcional pero recomendado)

PayPal también soporta Webhooks (más moderno que IPN). Considera migrar en el futuro:

1. Ve a PayPal Developer Dashboard
2. Crea un webhook apuntando a tu Edge Function
3. Esto es más confiable que IPN y permite mejor manejo de eventos

### 10. Testing completo

#### Checklist de testing:

- [ ] Donación se registra correctamente
- [ ] Usuario ve mensaje de agradecimiento después de donar
- [ ] Estrella ⭐ aparece en clasificación para usuarios que han donado
- [ ] Upgrade a premium (gratis) funciona
- [ ] Se registra en `payments` con amount = 0
- [ ] Liga se actualiza a `premium` correctamente
- [ ] Funcionalidades premium se desbloquean
- [ ] IPN se recibe correctamente (revisar logs)
- [ ] Transacciones duplicadas no se procesan dos veces

## 🚨 Importante: Seguridad

1. **Nunca confíes en el cliente**: Siempre verifica pagos en el servidor (ya implementado)
2. **Verifica IPN**: La Edge Function ya verifica que las notificaciones vengan de PayPal
3. **RLS Policies**: Ya están configuradas para que solo usuarios autorizados vean sus pagos
4. **Service Role**: Solo las Edge Functions pueden insertar pagos

## 📝 Notas adicionales

- El sistema actual permite upgrades gratis hasta final de temporada
- Cuando implementes pagos reales, simplemente cambia el flujo del botón
- La Edge Function ya maneja tanto pagos gratuitos (0€) como pagos reales
- Todos los pagos se registran en `payments` para auditoría

## 🐛 Troubleshooting

Si algo no funciona:

1. Revisa los logs de la Edge Function
2. Verifica que la URL de IPN esté correcta en PayPal
3. Asegúrate de que la tabla `payments` existe y tiene las columnas correctas
4. Verifica que las RLS policies permitan insertar con service_role
5. Revisa que el parámetro `custom` se esté enviando correctamente desde el frontend

