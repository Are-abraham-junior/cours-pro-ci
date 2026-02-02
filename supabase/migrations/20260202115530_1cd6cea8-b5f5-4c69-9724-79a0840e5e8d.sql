-- Update handle_new_user function to read user_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _is_first_user boolean;
  _user_type text;
  _role public.app_role;
BEGIN
  -- Check if this is the first user
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO _is_first_user;
  
  -- Get user_type from metadata, default to 'client'
  _user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  
  -- Validate and cast to app_role
  IF _user_type NOT IN ('client', 'prestataire') THEN
    _user_type := 'client';
  END IF;
  
  _role := _user_type::public.app_role;
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Assign role: super_admin for first user, otherwise the selected type
  IF _is_first_user THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);
  END IF;
  
  RETURN NEW;
END;
$$;