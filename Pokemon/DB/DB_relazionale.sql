-- Abilita l'estensione per generare UUID (opzionale ma consigliato per i giochi multiplayer)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- TABELLA UTENTI
-- =========================================
CREATE TABLE utenti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE,           -- ID univoco fornito da Google al momento del login
    email VARCHAR(255) UNIQUE NOT NULL,      -- Email dell'utente (utile per il login)
    password_hash VARCHAR(255) NOT NULL,     -- Password obbligatoria (salvata tramite hash, es. bcrypt)
    username VARCHAR(50) UNIQUE NOT NULL,    -- Nome visualizzato in gioco
    sprite_avatar VARCHAR(100) DEFAULT 'default_boy', -- Sprite scelto dal giocatore
    vittorie INTEGER DEFAULT 0,              -- Statistiche PvP (dal documento Neomon.md)
    sconfitte INTEGER DEFAULT 0,
    data_registrazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_accesso TIMESTAMP WITH TIME ZONE
);

-- Indice per velocizzare il login tramite Google
CREATE INDEX idx_utenti_google_id ON utenti(google_id);

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
