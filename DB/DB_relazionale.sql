/*NON ANCORA UTILIZZABILE VA ANCORA SISTEMATO*/

CREATE TABLE Utenti (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mappa_pve VARCHAR(50),
    coord_x INT,
    coord_y INT
);

CREATE TABLE Pokemon_Utente (
    id SERIAL PRIMARY KEY,
    utente_id INT REFERENCES Utenti(id) ON DELETE CASCADE,
    specie VARCHAR(50) NOT NULL,
    in_squadra BOOLEAN DEFAULT FALSE,
    slot_squadra INT CHECK (slot_squadra BETWEEN 1 AND 6)
);

CREATE TABLE Pokemon_Mosse (
    pokemon_id INT REFERENCES Pokemon_Utente(id) ON DELETE CASCADE,
    mossa VARCHAR(50) NOT NULL,
    slot INT CHECK (slot BETWEEN 1 AND 4),
    PRIMARY KEY (pokemon_id, slot)
);