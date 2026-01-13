-- ============================================================================
-- Create function to verify discount codes
-- ============================================================================
-- This function checks if a discount code is valid (exists, not expired, etc.)
-- Returns the discount information if valid, or null if invalid

CREATE OR REPLACE FUNCTION public.verify_discount_code(discount_code text)
RETURNS jsonb AS $$
DECLARE
  v_discount RECORD;
  v_result jsonb;
BEGIN
  -- Find the discount code
  SELECT 
    id,
    codigo,
    tipo_descuento,
    cantidad,
    caducidad,
    numero_veces_usados
  INTO v_discount
  FROM public.discounts
  WHERE UPPER(codigo) = UPPER(discount_code)
  LIMIT 1;

  -- If discount code not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Código de descuento no encontrado'
    );
  END IF;

  -- Check if discount has expired
  IF v_discount.caducidad IS NOT NULL AND v_discount.caducidad < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'El código de descuento ha expirado'
    );
  END IF;

  -- Discount is valid
  RETURN jsonb_build_object(
    'valid', true,
    'codigo', v_discount.codigo,
    'tipo_descuento', v_discount.tipo_descuento,
    'cantidad', v_discount.cantidad,
    'caducidad', v_discount.caducidad,
    'numero_veces_usados', v_discount.numero_veces_usados
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.verify_discount_code IS 'Verifies if a discount code is valid. Returns discount information if valid, or error message if invalid.';
