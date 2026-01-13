-- ============================================================================
-- Create function to increment discount usage counter
-- ============================================================================
-- This function increments the numero_veces_usados counter for a discount code

CREATE OR REPLACE FUNCTION public.increment_discount_usage(discount_code_param text)
RETURNS void AS $$
BEGIN
  UPDATE public.discounts
  SET numero_veces_usados = numero_veces_usados + 1
  WHERE UPPER(codigo) = UPPER(discount_code_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_discount_usage IS 'Increments the usage counter for a discount code. Used when a payment with a discount code is completed.';
