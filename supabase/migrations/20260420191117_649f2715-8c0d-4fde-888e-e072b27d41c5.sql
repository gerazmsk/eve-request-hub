CREATE OR REPLACE FUNCTION public.unlock_provider_target(_unlock_type text, _target_id uuid, _cost integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _provider_id uuid := auth.uid();
  _balance integer;
  _row_count integer := 0;
BEGIN
  IF _provider_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF _unlock_type NOT IN ('thread', 'request') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_unlock_type');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.provider_unlocks
    WHERE provider_id = _provider_id
      AND unlock_type = _unlock_type
      AND target_id = _target_id
  ) THEN
    SELECT balance INTO _balance FROM public.provider_credits WHERE provider_id = _provider_id;
    RETURN jsonb_build_object('ok', true, 'already_unlocked', true, 'balance', COALESCE(_balance, 0));
  END IF;

  INSERT INTO public.provider_credits (provider_id, balance)
  VALUES (_provider_id, 10)
  ON CONFLICT DO NOTHING;

  SELECT balance INTO _balance
  FROM public.provider_credits
  WHERE provider_id = _provider_id
  FOR UPDATE;

  IF COALESCE(_balance, 0) < _cost THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits', 'balance', COALESCE(_balance, 0));
  END IF;

  INSERT INTO public.provider_unlocks (provider_id, unlock_type, target_id)
  VALUES (_provider_id, _unlock_type, _target_id)
  ON CONFLICT (provider_id, unlock_type, target_id) DO NOTHING;

  GET DIAGNOSTICS _row_count = ROW_COUNT;

  IF _row_count > 0 THEN
    UPDATE public.provider_credits
    SET balance = balance - _cost, updated_at = now()
    WHERE provider_id = _provider_id
    RETURNING balance INTO _balance;

    INSERT INTO public.credit_transactions (provider_id, amount, type, description)
    VALUES (_provider_id, -_cost, 'debit', 'Unlocked ' || _unlock_type);
  ELSE
    SELECT balance INTO _balance FROM public.provider_credits WHERE provider_id = _provider_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'already_unlocked', _row_count = 0, 'balance', COALESCE(_balance, 0));
END;
$$;