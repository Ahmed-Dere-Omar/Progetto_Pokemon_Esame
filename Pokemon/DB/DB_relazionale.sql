-- ==============================================================================
-- DATABASE NEOMON - SCHEMA DEFINITIVO (Integrato con Supabase Auth)
-- ==============================================================================

-- 1. ENTITÀ PROFILO (Collegata 1:1 direttamente ad auth.users di Supabase)
CREATE TABLE public.profilo (
    id_profilo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utente UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_sprite INT DEFAULT 1,
    partite_totali INT DEFAULT 0,
    vittorie_totali INT DEFAULT 0,
    coord_x DECIMAL(8, 2) DEFAULT 0.00,
    coord_y DECIMAL(8, 2) DEFAULT 0.00a_base'
);

-- 2. ENTITÀ PARTITA
CREATE TABLE public.partita (
    id_partita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PvP', 'PvE')),
    data_inizio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fine TIMESTAMP WITH TIME ZONE
);

-- 3. ENTITÀ POKEMON
CREATE TABLE public.pokemon (
    id_pokemon UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_specie VARCHAR(50) NOT NULL, -- Riferimento al JSON
    id_profilo_proprietario UUID NOT NULL REFERENCES public.profilo(id_profilo) ON DELETE CASCADE,
    in_squadra BOOLEAN DEFAULT FALSE,
    posizione_slot INT CHECK (posizione_slot BETWEEN 1 AND 6)
);

-- 4. RELAZIONE: GIOCA (Profilo N - M Partita)
CREATE TABLE public.gioca (
    id_profilo UUID REFERENCES public.profilo(id_profilo) ON DELETE CASCADE,
    id_partita UUID REFERENCES public.partita(id_partita) ON DELETE CASCADE,
    esito VARCHAR(20) CHECK (esito IN ('Vittoria', 'Sconfitta', 'Abbandono')),
    PRIMARY KEY (id_profilo, id_partita)
);

-- 5. RELAZIONE: PARTECIPA (Partita N - M Pokemon)
CREATE TABLE public.partecipa (
    id_partita UUID REFERENCES public.partita(id_partita) ON DELETE CASCADE,
    id_pokemon UUID REFERENCES public.pokemon(id_pokemon) ON DELETE CASCADE,
    PRIMARY KEY (id_partita, id_pokemon)
);

-- ==============================================================================
-- TRIGGER AUTOMATICI
-- ==============================================================================

-- 6. FUNZIONE: Crea un profilo base quando un utente si registra tramite Supabase Auth
CREATE OR REPLACE FUNCTION public.crea_profilo_automatico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profilo (id_utente, username, avatar_sprite)
  VALUES (
    NEW.id,
    -- Estrae il nome dalla mail e ci attacca un numero casuale (es. mario_421)
    SPLIT_PART(NEW.email, '@', 1) || '_' || floor(random() * 1000)::int,
    1 -- ID dello sprite di default
  );
  RETURN NEW;
END;
$$;

-- 7. TRIGGER: Esegue la funzione qui sopra ad ogni nuova iscrizione
DROP TRIGGER IF EXISTS al_nuovo_utente ON auth.users;
CREATE TRIGGER al_nuovo_utente
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crea_profilo_automatico();


CREATE OR REPLACE FUNCTION public.crea_profilo_automatico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profilo (id_utente, username, avatar_sprite)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || floor(random() * 1000)::int),
    1 
  );
  RETURN NEW;
END;
$$;

-- CARICAMENTO ASSOCIAZIONE POKEMON PROFILO
-- Abilitiamo la sicurezza
ALTER TABLE public.pokemon ENABLE ROW LEVEL SECURITY;

-- Policy: Un utente può gestire solo i Pokémon legati al proprio profilo
CREATE POLICY "Gli utenti gestiscono i propri pokemon" 
ON public.pokemon 
FOR ALL 
USING (
  id_profilo_proprietario IN (
    SELECT id_profilo FROM public.profilo WHERE id_utente = auth.uid()
  )
); 