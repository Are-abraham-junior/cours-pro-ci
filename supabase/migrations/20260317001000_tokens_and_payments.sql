-- 1. Add tokens column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tokens INTEGER NOT NULL DEFAULT 2;

-- 2. Create payment status enum
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    tokens_count INTEGER NOT NULL,
    status public.payment_status NOT NULL DEFAULT 'pending',
    genius_pay_reference TEXT UNIQUE,
    checkout_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for payments
CREATE POLICY "Users can view own payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Function to deduct token on contract creation (when application is accepted)
-- Note: create_contract_on_acceptance already exists, we will modify it or add a new one.
-- Ref: 20260205140313_4f4f36c3-0be2-47a2-932c-77ae211b65c3.sql

CREATE OR REPLACE FUNCTION public.handle_token_consumption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only for repetiteurs
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.repetiteur_id AND role = 'prestataire') THEN
        UPDATE public.profiles
        SET tokens = tokens - 1
        WHERE id = NEW.repetiteur_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to consume token when a contract is created
CREATE OR REPLACE TRIGGER on_contract_created_consume_token
    AFTER INSERT ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_token_consumption();
