-- 1. ENTITÀ UTENTE
CREATE TABLE utente (
    id_utente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    data_registrazione TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENTITÀ PROFILO
CREATE TABLE profilo (
    id_profilo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utente UUID UNIQUE NOT NULL REFERENCES utente(id_utente) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_sprite INT DEFAULT 1,
    partite_totali INT DEFAULT 0,
    vittorie_totali INT DEFAULT 0,
    coord_x DECIMAL(8, 2) DEFAULT 0.00,
    coord_y DECIMAL(8, 2) DEFAULT 0.00
);

-- 3. ENTITÀ PARTITA
CREATE TABLE partita (
    id_partita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PvP', 'PvE')),
    data_inizio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fine TIMESTAMP WITH TIME ZONE
);

-- 4. ENTITÀ POKEMON
CREATE TABLE pokemon (
    id_pokemon UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_specie VARCHAR(50) NOT NULL, -- Questo si collegherà all'ID del tuo file JSON
    id_profilo_proprietario UUID NOT NULL REFERENCES profilo(id_profilo) ON DELETE CASCADE,
    in_squadra BOOLEAN DEFAULT FALSE,
    posizione_slot INT CHECK (posizione_slot BETWEEN 1 AND 6)
);

-- 5. RELAZIONE: GIOCA (Profilo N - M Partita)
CREATE TABLE gioca (
    id_profilo UUID REFERENCES profilo(id_profilo) ON DELETE CASCADE,
    id_partita UUID REFERENCES partita(id_partita) ON DELETE CASCADE,
    esito VARCHAR(20) CHECK (esito IN ('Vittoria', 'Sconfitta', 'Abbandono')),
    PRIMARY KEY (id_profilo, id_partita)
);

-- 6. RELAZIONE: PARTECIPA (Partita N - M Pokemon)
CREATE TABLE partecipa (
    id_partita UUID REFERENCES partita(id_partita) ON DELETE CASCADE,
    id_pokemon UUID REFERENCES pokemon(id_pokemon) ON DELETE CASCADE,
    PRIMARY KEY (id_partita, id_pokemon)
);

/*
-- =========================================
-- TABELLA POKEMON CATTURATI (ISTANZE)
-- =========================================
CREATE TABLE pokemon_catturati (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utente_id UUID REFERENCES utenti(id) ON DELETE CASCADE,
    
    -- Referenza al file JSON: deve combaciare con la chiave "nome" del tuo DB_pokemon.json
    specie_nome VARCHAR(100) NOT NULL, 
    
    nickname VARCHAR(50),                    -- Eventuale soprannome
    livello INTEGER DEFAULT 1 CHECK (livello BETWEEN 1 AND 100),
    punti_esperienza INTEGER DEFAULT 0,
    ps_attuali INTEGER NOT NULL,             -- Punti Salute rimanenti (da salvare a fine battaglia)
    
    -- Le mosse scelte. PostgreSQL permette gli Array nativi, perfetto per un limite di 4 mosse
    -- I valori qui dentro combaceranno con la chiave "Nome" nel tuo DB_mosse.json
    mosse_equipaggiate TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(mosse_equipaggiate, 1) <= 4),
    
    -- Dati opzionali per IV ed EV (se decidi di implementarli per statistiche uniche)
    -- Usiamo JSONB per mantenere la flessibilità
    
    data_cattura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indice univoco per assicurare che un utente possa avere un solo Pokémon per specie (nessun doppione)
CREATE UNIQUE INDEX idx_utente_specie_univoca ON pokemon_catturati(utente_id, specie_nome);
*/
