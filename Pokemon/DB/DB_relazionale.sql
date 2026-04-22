drop table if exists "Pokemon_Base" CASCADE;

drop table if exists "Mosse" CASCADE;

create table "Mosse" (
  "Nome" TEXT primary key,
  "Tipo" TEXT,
  "Categoria" TEXT,
  "Potenza" INTEGER,
  "Precisione" INTEGER,
  "PP" INTEGER,
  "Bersaglio" TEXT,
  "Priorità" INTEGER,
  "CodiceFunzione" JSONB,
  "Flags" JSONB,
  "Descrizione" TEXT
);

create index idx_mosse_flags on "Mosse" using GIN ("Flags");

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Azione',
    'Normale',
    'Fisico',
    40,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacca il bersaglio con tutto il corpo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Crescita',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Aumenta l''Attacco e l''Attacco Speciale di chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fiortempesta',
    'Erba',
    'Fisico',
    90,
    100,
    15,
    'TuttiAltriVicini',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Una tempesta di fiori colpisce tutti i Pokémon in campo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Frustata',
    'Erba',
    'Fisico',
    45,
    100,
    25,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce il bersaglio con liane sottili come fruste.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Petalodanza',
    'Erba',
    'Speciale',
    120,
    100,
    10,
    'NemicoVicinoCasuale',
    0,
    '[{"NomeFunzione": "BloccaPerTurni", "Parametri": {"TurniMin": 2, "TurniMax": 3}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Utente", "Condizione": "AlTermine"}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Danza"]',
    'Attacca per 2-3 turni e poi confonde chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ruggito',
    'Normale',
    'Stato',
    0,
    100,
    40,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Suono", "Copiabile"]',
    'Ruggito carino che riduce l''Attacco dei nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Parassiseme',
    'Erba',
    'Stato',
    0,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStatoUnico", "Parametri": {"Tipo": "Parassiseme", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Proteggibile"]',
    'Pianta un seme che assorbe PS dal nemico ogni turno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Foglielama',
    'Erba',
    'Fisico',
    55,
    95,
    25,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Foglie affilate che hanno un''alta probabilità di infliggere brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sonnifero',
    'Erba',
    'Stato',
    0,
    75,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Bersaglio": "Bersaglio"}}]',
    '["Polvere", "Copiabile", "Proteggibile"]',
    'Polvere soporifera che addormenta il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenpolvere',
    'Veleno',
    'Stato',
    0,
    75,
    35,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio"}}]',
    '["Polvere", "Copiabile", "Proteggibile"]',
    'Polvere tossica che avvelena il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Semebomba',
    'Erba',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Colpisce il bersaglio con una raffica di semi duri.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Riduttore',
    'Normale',
    'Fisico',
    90,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 25, "Su": "DannoInflitto"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica potente che infligge danni anche a chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Profumino',
    'Normale',
    'Stato',
    0,
    100,
    20,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Elusione", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile"]',
    'Profumo dolce che riduce l''Elusione dei nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sintesi',
    'Erba',
    'Stato',
    0,
    0,
    5,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Tipo": "DipendenteDaMeteo"}}]',
    '["Copiabile"]',
    'Restituisce PS. La quantità varia col meteo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sdoppiatore',
    'Normale',
    'Fisico',
    120,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 33.3, "Su": "DannoInflitto"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica rischiosa che danneggia anche chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Solarraggio',
    'Erba',
    'Speciale',
    120,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CaricaAttacco", "Parametri": {"TurniDiCarica": 1, "Messaggio": "Assorbe luce!"}}]',
    '["Proteggibile", "Copiabile"]',
    'Assorbe luce al primo turno e attacca al secondo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Braciere',
    'Fuoco',
    'Speciale',
    40,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Piccola fiammata che può scottare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dragartiglio',
    'Drago',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Graffia il nemico con artigli affilati.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Graffio',
    'Normale',
    'Fisico',
    40,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Graffia il nemico con artigli o unghie.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Muro di Fumo',
    'Normale',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Riduce la precisione del nemico con fumo o inchiostro.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ondacalda',
    'Fuoco',
    'Speciale',
    95,
    90,
    10,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Soffio ardente che colpisce i nemici vicini. Può scottare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Eterelama',
    'Volante',
    'Speciale',
    75,
    95,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Lame di vento che possono far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dragospiro',
    'Drago',
    'Speciale',
    60,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Soffio potente che può paralizzare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rogodenti',
    'Fuoco',
    'Fisico',
    65,
    95,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}, {"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Morso infuocato. Può scottare o far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Lacerazione',
    'Normale',
    'Fisico',
    70,
    100,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Taglia con artigli o falci. Alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Lanciafiamme',
    'Fuoco',
    'Speciale',
    90,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Potente fiammata che può scottare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Visotruce',
    'Normale',
    'Stato',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Copiabile", "Proteggibile"]',
    'Spaventa il nemico riducendone drasticamente la Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Turbofuoco',
    'Fuoco',
    'Speciale',
    35,
    85,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"TurniMin": 4, "TurniMax": 5, "DannoPerTurno": 0.125}}]',
    '["Proteggibile", "Copiabile"]',
    'Intrappola il nemico in un vortice di fuoco per 4-5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Marchiatura',
    'Fuoco',
    'Speciale',
    100,
    50,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile"]',
    'Scotta sempre il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fuococarica',
    'Fuoco',
    'Fisico',
    120,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 33.3, "Su": "DannoInflitto"}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "ScongelaUtente"]',
    'Carica infuocata che danneggia anche chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cannonflash',
    'Acciaio',
    'Speciale',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio luminoso che può ridurre la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Colpocoda',
    'Normale',
    'Stato',
    0,
    100,
    30,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Agita la coda per ridurre la Difesa del nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pistolacqua',
    'Acqua',
    'Speciale',
    40,
    100,
    25,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Spara un getto d''acqua contro il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ritirata',
    'Acqua',
    'Stato',
    0,
    0,
    40,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Si rifugia nel guscio aumentando la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rapigiro',
    'Normale',
    'Fisico',
    50,
    100,
    40,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RimuoviEffettiCampo", "Parametri": {"Lato": "Utente", "Effetti": ["Trappole", "Parassiseme", "Legatutto"]}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco rotante che libera da trappole e parassiti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Morso',
    'Buio',
    'Fisico',
    60,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Morso che può far tentennare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Idropulsar',
    'Acqua',
    'Speciale',
    60,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio", "Probabilità": 20}}]',
    '["Proteggibile", "Copiabile", "Pulsazione"]',
    'Onda ultrasonica che può confondere il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Protezione',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    4,
    '[{"NomeFunzione": "Proteggi", "Parametri": {"Bersaglio": "Utente"}}]',
    '[]',
    'Elude tutti gli attacchi per un turno. Può fallire se usata di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pioggiadanza',
    'Acqua',
    'Stato',
    0,
    0,
    5,
    'EntrambiLati',
    0,
    '[{"NomeFunzione": "CambiaMeteo", "Parametri": {"Meteo": "Pioggia", "Turni": 5}}]',
    '[]',
    'Invoca la pioggia per 5 turni, potenziando le mosse Acqua.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Idrondata',
    'Acqua',
    'Fisico',
    90,
    90,
    10,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce con una potente coda d''acqua.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gettaguscio',
    'Normale',
    'Stato',
    0,
    0,
    15,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": -1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": -1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 2}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 2}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Riduce le Difese per aumentare molto Attacchi e Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ferroscudo',
    'Acciaio',
    'Stato',
    0,
    0,
    15,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Indurisce il corpo aumentando drasticamente la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Idropompa',
    'Acqua',
    'Speciale',
    110,
    80,
    5,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Potente getto d''acqua che colpisce il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Capocciata',
    'Normale',
    'Fisico',
    130,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CaricaAttacco", "Parametri": {"TurniDiCarica": 1, "Messaggio": "Ritira la testa!"}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1, "Turno": 1}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Aumenta la Difesa al primo turno e attacca al secondo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Millebave',
    'Coleottero',
    'Stato',
    0,
    95,
    40,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Rallenta il bersaglio avvolgendolo nella seta.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Raffica',
    'Volante',
    'Speciale',
    40,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Sbatte le ali per creare una folata di vento.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rafforzatore',
    'Normale',
    'Stato',
    0,
    0,
    30,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Irrigidisce il corpo aumentando la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Furia',
    'Normale',
    'Fisico',
    15,
    85,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce da 2 a 5 volte di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenospina',
    'Veleno',
    'Fisico',
    15,
    100,
    35,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Puntura tossica che può avvelenare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tagliofuria',
    'Coleottero',
    'Fisico',
    40,
    95,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AumentaPotenzaConsecutiva", "Parametri": {"Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'La potenza aumenta ad ogni colpo consecutivo a segno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Concentrazione',
    'Normale',
    'Stato',
    0,
    0,
    30,
    'Utente',
    0,
    '[{"NomeFunzione": "ProssimoColpoCritico", "Parametri": {"Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Garantisce un brutto colpo al prossimo attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Focalenergia',
    'Normale',
    'Stato',
    0,
    0,
    30,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaTassoCritico", "Parametri": {"Gradi": 2, "Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Aumenta la probabilità di infliggere brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenoshock',
    'Veleno',
    'Speciale',
    65,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioAvvelenato", "Moltiplicatore": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Infligge danni doppi se il bersaglio è avvelenato.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Garanzia',
    'Buio',
    'Fisico',
    60,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioDanneggiatoInTurno", "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Danni doppi se il bersaglio ha già subito.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fielepunte',
    'Veleno',
    'Stato',
    0,
    0,
    20,
    'LatoNemico',
    0,
    '[{"NomeFunzione": "PiazzaTrappola", "Parametri": {"Tipo": "Fielepunte", "Lato": "Nemico"}}]',
    '["Copiabile"]',
    'Sparge punte velenose che avvelenano i nemici entranti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Missilspillo',
    'Coleottero',
    'Fisico',
    25,
    95,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia aculei che colpiscono da 2 a 5 volte.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenpuntura',
    'Veleno',
    'Fisico',
    80,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Pugnalata tossica che può avvelenare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Agilità',
    'Psico',
    'Stato',
    0,
    0,
    30,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente la Velocità rilassando i muscoli.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rimonta',
    'Normale',
    'Fisico',
    0,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaPS", "Parametri": {"Tipo": "UguagliaPSUtente", "Bersaglio": "Bersaglio"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Porta i PS del bersaglio pari a quelli di chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pungilione',
    'Coleottero',
    'Fisico',
    50,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 3, "Condizione": "MandaKO"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Se manda KO il bersaglio, aumenta molto l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Attacco Rapido',
    'Normale',
    'Fisico',
    40,
    100,
    30,
    'AltroVicino',
    1,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco fulmineo che colpisce per primo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tifone',
    'Volante',
    'Speciale',
    110,
    70,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio", "Probabilità": 30}}, {"NomeFunzione": "ModificaPrecisione", "Parametri": {"Condizione": "MeteoPioggia", "Valore": 1000}}]',
    '["Proteggibile", "Copiabile"]',
    'Tempesta che può confondere. Infallibile sotto la pioggia.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Turbosabbia',
    'Terra',
    'Stato',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Lancia sabbia negli occhi per ridurre la precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Turbine',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'AltroVicino',
    -6,
    '[{"NomeFunzione": "ForzaSostituzione", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Copiabile"]',
    'Spazza via il bersaglio e lo costringe alla sostituzione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tornado',
    'Volante',
    'Speciale',
    40,
    100,
    35,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioInVolo", "Moltiplicatore": 2}}, {"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 20}}]',
    '["Proteggibile", "Copiabile"]',
    'Danni doppi ai nemici in Volo. Può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Danzadipiume',
    'Volante',
    'Stato',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Copiabile", "Proteggibile"]',
    'Riduce drasticamente l''Attacco del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Attacco d''Ala',
    'Volante',
    'Fisico',
    60,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '[]',
    'Colpisce il nemico con ali spalancate.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Trespolo',
    'Volante',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 50}}, {"NomeFunzione": "RimuoviTipo", "Parametri": {"Tipo": "Volante", "Durata": "Turno"}}]',
    '["Copiabile"]',
    'Atterra e recupera metà dei PS massimi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ventoincoda',
    'Volante',
    'Stato',
    0,
    0,
    15,
    'LatoUtente',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "Ventoincoda", "Lato": "Utente", "Turni": 4}}]',
    '[]',
    'Raddoppia la Velocità della squadra per 4 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Danzaspada',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente l''Attacco combattivo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sgranocchio',
    'Buio',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Morso che può ridurre la Difesa del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sbigoattacco',
    'Buio',
    'Fisico',
    70,
    100,
    5,
    'AltroVicino',
    1,
    '[{"NomeFunzione": "VerificaCondizione", "Parametri": {"Condizione": "NemicoAttacca", "Altrimenti": "Fallisci"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce per primo, ma fallisce se il nemico non attacca.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Superanza',
    'Normale',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaPS", "Parametri": {"Tipo": "Dimezza", "Bersaglio": "Bersaglio", "Condizione": "PSMassimi"}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Dimezza i PS del bersaglio se li ha ancora tutti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Beccata',
    'Volante',
    'Fisico',
    35,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce il nemico con il becco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fulmisguardo',
    'Normale',
    'Stato',
    0,
    100,
    30,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Sguardo intimidatorio che riduce la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Giravvita',
    'Terra',
    'Fisico',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Alta probabilità di infliggere brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Perforbecco',
    'Volante',
    'Fisico',
    80,
    100,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacca il nemico ruotando il becco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Avvolgibotta',
    'Normale',
    'Fisico',
    15,
    90,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"TurniMin": 4, "TurniMax": 5, "DannoPerTurno": 0.125}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Intrappola il bersaglio per 4-5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fulmindenti',
    'Elettro',
    'Fisico',
    65,
    95,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 10}}, {"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Può paralizzare o far tentennare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gelodenti',
    'Ghiaccio',
    'Fisico',
    65,
    95,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Congelamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}, {"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Può congelare o far tentennare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sguardo Feroce',
    'Normale',
    'Stato',
    0,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Proteggibile"]',
    'Paralizza il nemico con uno sguardo spaventoso.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Stridio',
    'Normale',
    'Stato',
    0,
    85,
    40,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Suono", "Copiabile", "Proteggibile"]',
    'Riduce drasticamente la Difesa del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acido',
    'Veleno',
    'Speciale',
    40,
    100,
    30,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Spruzzo acido che può ridurre la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Accumulo',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "AccumulaEnergia", "Parametri": {"Max": 3}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Accumula energia aumentando le Difese.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Introenergia',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Tipo": "DipendenteDaAccumulo", "ConsumaAccumulo": true}}]',
    '["Copiabile"]',
    'Recupera PS usando l''energia accumulata.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sfoghenergia',
    'Normale',
    'Speciale',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoVariabile", "Parametri": {"Tipo": "DipendenteDaAccumulo", "ConsumaAccumulo": true}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacca con l''energia accumulata.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acidobomba',
    'Veleno',
    'Speciale',
    40,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -2, "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Riduce drasticamente la Difesa Speciale del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fangobomba',
    'Veleno',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Lancia fango tossico che può avvelenare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Nube',
    'Ghiaccio',
    'Stato',
    0,
    0,
    30,
    'TuttiCombattenti',
    0,
    '[{"NomeFunzione": "ResettaStatistiche", "Parametri": {"Bersaglio": "Tutti"}}]',
    '[]',
    'Azzera tutte le modifiche alle statistiche.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Arrotola',
    'Veleno',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Aumenta Attacco, Difesa e Precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sporcolancio',
    'Veleno',
    'Fisico',
    120,
    80,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia rifiuti tossici. Può avvelenare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Codacciaio',
    'Acciaio',
    'Fisico',
    100,
    75,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpo di coda rigida che può ridurre la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Congiura',
    'Buio',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente l''Attacco Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dolcebacio',
    'Folletto',
    'Stato',
    0,
    75,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Proteggibile"]',
    'Bacio dolce che confonde il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Doppioteam',
    'Normale',
    'Stato',
    0,
    0,
    15,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Elusione", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Crea copie illusorie aumentando l''Elusione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Elettrococcola',
    'Elettro',
    'Fisico',
    20,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Strofina le guance per paralizzare il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Energisfera',
    'Erba',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Sfera naturale che può ridurre la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fascino',
    'Folletto',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Copiabile", "Proteggibile"]',
    'Riduce drasticamente l''Attacco con moine.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fintoattacco',
    'Normale',
    'Fisico',
    30,
    100,
    10,
    'AltroVicino',
    2,
    '[{"NomeFunzione": "RompiProtezione", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Copiabile"]',
    'Colpisce e annulla Protezione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Scarica',
    'Elettro',
    'Speciale',
    80,
    100,
    15,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Scossa estesa che può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Schermoluce',
    'Psico',
    'Stato',
    0,
    0,
    30,
    'LatoUtente',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "SchermoLuce", "Lato": "Utente", "Turni": 5}}]',
    '["Copiabile"]',
    'Dimezza i danni speciali subiti per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Scintilla',
    'Elettro',
    'Fisico',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica elettrica che può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Simpatia',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Proteggibile"]',
    'Riduce l''Attacco del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tuono',
    'Elettro',
    'Speciale',
    110,
    70,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}, {"NomeFunzione": "ModificaPrecisione", "Parametri": {"Condizione": "MeteoPioggia", "Valore": 1000}}]',
    '["Proteggibile", "Copiabile"]',
    'Fulmine potente. Infallibile sotto la pioggia.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tuononda',
    'Elettro',
    'Stato',
    0,
    90,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Proteggibile"]',
    'Onda debole che paralizza il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tuonoshock',
    'Elettro',
    'Speciale',
    40,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Scossa elettrica che può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tuonopugno',
    'Elettro',
    'Fisico',
    75,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno elettrico che può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fulmine',
    'Elettro',
    'Speciale',
    90,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Scossa potente che può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ricciolscudo',
    'Normale',
    'Stato',
    0,
    0,
    40,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Si appallottola aumentando la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tirartigli',
    'Buio',
    'Stato',
    0,
    0,
    15,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Affila gli artigli aumentando Attacco e Precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rotolamento',
    'Roccia',
    'Fisico',
    30,
    90,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AumentaPotenzaConsecutiva", "Parametri": {"Turni": 5, "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacca per 5 turni raddoppiando la potenza.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Battiterra',
    'Terra',
    'Fisico',
    60,
    100,
    20,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile"]',
    'Riduce la Velocità colpendo tutto attorno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Comete',
    'Normale',
    'Speciale',
    60,
    0,
    20,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Raggi a stella che colpiscono infallibilmente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sfuriate',
    'Normale',
    'Fisico',
    18,
    80,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Graffia da 2 a 5 volte di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sabbiotomba',
    'Terra',
    'Fisico',
    35,
    85,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"TurniMin": 4, "TurniMax": 5, "DannoPerTurno": 0.125}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Intrappola in un vortice di sabbia per 4-5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fossa',
    'Terra',
    'Fisico',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CaricaAttacco", "Parametri": {"TurniDiCarica": 1, "StatoSeminvulnerabile": "Sottoterra", "Messaggio": "Scava una fossa!"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Scava al primo turno e attacca al secondo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vortexpalla',
    'Acciaio',
    'Fisico',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaVariabile", "Parametri": {"Formula": "25 * (VelocitàBersaglio / VelocitàUtente)", "Max": 150}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Bomba"]',
    'Più chi la usa è lento, più è potente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Terrempesta',
    'Roccia',
    'Stato',
    0,
    0,
    10,
    'EntrambiLati',
    0,
    '[{"NomeFunzione": "CambiaMeteo", "Parametri": {"Meteo": "TempestaSabbia", "Turni": 5}}]',
    '[]',
    'Scatena una tempesta di sabbia per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Terremoto',
    'Terra',
    'Fisico',
    100,
    100,
    10,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioSottoterra", "Moltiplicatore": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Scuote la terra colpendo tutti i Pokémon in campo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Adulazione',
    'Buio',
    'Stato',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Bersaglio", "Gradi": 1}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Proteggibile"]',
    'Confonde il bersaglio ma ne aumenta l''Attacco Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Altruismo',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'AlleatoVicino',
    5,
    '[{"NomeFunzione": "AumentaPotenzaMossaAlleato", "Parametri": {"Moltiplicatore": 1.5}}]',
    '[]',
    'Potenzia la mossa usata dal compagno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Doppiocalcio',
    'Lotta',
    'Fisico',
    30,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"NumeroColpi": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce due volte con i calci.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fangonda',
    'Veleno',
    'Speciale',
    95,
    100,
    10,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Onda di fango che colpisce tutti i Pokémon vicini. Può avvelenare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Geoforza',
    'Terra',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Potere della terra che può ridurre la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tossina',
    'Veleno',
    'Stato',
    0,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Iperavvelenamento", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Iperavvelena il bersaglio. Danni aumentano ogni turno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Troppoforte',
    'Lotta',
    'Fisico',
    120,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": -1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": -1}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco potentissimo che riduce Attacco e Difesa di chi lo usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Incornata',
    'Normale',
    'Fisico',
    65,
    100,
    25,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce il nemico con le corna.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Megacorno',
    'Coleottero',
    'Fisico',
    120,
    85,
    10,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica brutale con corna robuste.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Botta',
    'Normale',
    'Fisico',
    40,
    100,
    35,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce il nemico con una botta.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Canto',
    'Normale',
    'Stato',
    0,
    55,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Bersaglio": "Bersaglio"}}]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'Canto soave che addormenta il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Copione',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Nessuno',
    0,
    '[{"NomeFunzione": "CopiaUltimaMossa", "Parametri": {}}]',
    '[]',
    'Imita l''ultima mossa usata in battaglia.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cortesia',
    'Normale',
    'Stato',
    0,
    0,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CediTurno", "Parametri": {}}]',
    '[]',
    'Fa agire il bersaglio subito dopo chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cosmoforza',
    'Psico',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Assorbe potere mistico aumentando le Difese.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Curardore',
    'Folletto',
    'Stato',
    0,
    0,
    10,
    'AlleatoVicino',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 50, "Bersaglio": "Alleato"}}, {"NomeFunzione": "RimuoviStato", "Parametri": {"Bersaglio": "Alleato"}}]',
    '["Copiabile", "Proteggibile"]',
    'Cura PS e problemi di stato di un alleato.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Forza Lunare',
    'Folletto',
    'Speciale',
    95,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Attinge al potere della luna. Può ridurre l''Attacco Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Goccia Vitale',
    'Acqua',
    'Stato',
    0,
    0,
    10,
    'TuttiAlleati',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 25, "Bersaglio": "TuttiAlleati"}}]',
    '["Copiabile"]',
    'Spruzza acqua curativa che ridà PS alla squadra.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gravità',
    'Psico',
    'Stato',
    0,
    0,
    5,
    'EntrambiLati',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "Gravità", "Turni": 5}}]',
    '[]',
    'Intensifica la gravità per 5 turni. I Pokémon non possono volare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Incantavoce',
    'Folletto',
    'Speciale',
    40,
    0,
    15,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'Attacco sonoro che colpisce infallibilmente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Lucelunare',
    'Folletto',
    'Stato',
    0,
    0,
    5,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Tipo": "DipendenteDaMeteo"}}]',
    '["Copiabile"]',
    'Recupera PS. La quantità dipende dal meteo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Meteorpugno',
    'Acciaio',
    'Fisico',
    90,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno meteoritico che può aumentare l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Minimizzato',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Elusione", "Bersaglio": "Utente", "Gradi": 2}}, {"NomeFunzione": "ApplicaStatoUnico", "Parametri": {"Tipo": "Minimizzato", "Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Si rimpicciolisce aumentando drasticamente l''Elusione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ripeti',
    'Normale',
    'Stato',
    0,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ForzaRipetizioneMossa", "Parametri": {"Turni": 3}}]',
    '["Proteggibile", "Copiabile"]',
    'Costringe il nemico a ripetere l''ultima mossa per 3 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sonoqui',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'Utente',
    2,
    '[{"NomeFunzione": "AttiraAttacchi", "Parametri": {}}]',
    '[]',
    'Attira su di sé tutti gli attacchi nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Splash',
    'Normale',
    'Stato',
    0,
    0,
    40,
    'Utente',
    0,
    '[{"NomeFunzione": "NessunEffetto", "Parametri": {}}]',
    '[]',
    'Non ha alcun effetto. Si limita a sguazzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Veicovaforza',
    'Psico',
    'Speciale',
    20,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaBasataSuStatistiche", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Più le statistiche dell''utente sono alte, più è potente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dispetto',
    'Spettro',
    'Stato',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RiduciPP", "Parametri": {"Quantità": 4}}]',
    '["Proteggibile", "Copiabile"]',
    'Riduce i PP dell''ultima mossa usata dal nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Esclusiva',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ImpedisciUsoMossaUguale", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Impedisce al nemico di usare mosse che conosce anche l''utente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Extrasenso',
    'Psico',
    'Speciale',
    80,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco psichico che può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fuocobomba',
    'Fuoco',
    'Speciale',
    110,
    85,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Esplosione di fuoco che può scottare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fuocofatuo',
    'Fuoco',
    'Stato',
    0,
    85,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Fiammella sinistra che scotta il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Inibitore',
    'Normale',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "BloccaUltimaMossa", "Parametri": {"Turni": 4}}]',
    '["Proteggibile", "Copiabile"]',
    'Impedisce al nemico di usare l''ultima mossa per 4 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rancore',
    'Spettro',
    'Stato',
    0,
    0,
    5,
    'Utente',
    0,
    '[{"NomeFunzione": "AzzeraPPSeKO", "Parametri": {}}]',
    '[]',
    'Se l''utente va KO, azzera i PP della mossa che l''ha colpito.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Salvaguardia',
    'Normale',
    'Stato',
    0,
    0,
    25,
    'LatoUtente',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "Salvaguardia", "Lato": "Utente", "Turni": 5}}]',
    '["Copiabile"]',
    'Protegge la squadra dai problemi di stato per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Stordiraggio',
    'Spettro',
    'Stato',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio sinistro che confonde il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Coro',
    'Normale',
    'Speciale',
    60,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AumentaPotenzaInCoro", "Parametri": {}}]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'La potenza aumenta se usato da più Pokémon di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Corposcontro',
    'Normale',
    'Fisico',
    85,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Schiaccia il nemico col corpo. Può paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Echeggiavoce',
    'Normale',
    'Speciale',
    40,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AumentaPotenzaConsecutiva", "Parametri": {"Turni": 5, "Incremento": 40, "Max": 200}}]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'La potenza aumenta ogni turno che viene usata.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Granvoce',
    'Normale',
    'Speciale',
    90,
    100,
    10,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'Urlo lacerante che danneggia i nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Mimica',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CopiaMossa", "Parametri": {"Permanente": false}}]',
    '["Proteggibile", "Copiabile"]',
    'Copia l''ultima mossa usata dal bersaglio per la lotta.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Riposo',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 100}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Durata": 2}}]',
    '["Copiabile"]',
    'L''utente dorme per 2 turni recuperando tutti i PS.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Carineria',
    'Folletto',
    'Fisico',
    90,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Gioca col nemico. Può ridurne l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Aromaterapia',
    'Erba',
    'Stato',
    0,
    0,
    5,
    'TuttiAlleati',
    0,
    '[{"NomeFunzione": "RimuoviStato", "Parametri": {"Bersaglio": "TuttiAlleati"}}]',
    '["Copiabile"]',
    'Cura tutti i problemi di stato della squadra.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Assorbimento',
    'Erba',
    'Speciale',
    20,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AssorbiPS", "Parametri": {"Percentuale": 50}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco che assorbe metà del danno inflitto.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Campo Erboso',
    'Erba',
    'Stato',
    0,
    0,
    10,
    'EntrambiLati',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "CampoErboso", "Turni": 5}}]',
    '[]',
    'Crea un campo erboso per 5 turni che cura i Pokémon a terra.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gigassorbimento',
    'Erba',
    'Speciale',
    75,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AssorbiPS", "Parametri": {"Percentuale": 50}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco che assorbe metà del danno inflitto.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Megassorbimento',
    'Erba',
    'Speciale',
    40,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AssorbiPS", "Parametri": {"Percentuale": 50}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco che assorbe metà del danno inflitto.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Paralizzante',
    'Erba',
    'Stato',
    0,
    75,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio"}}]',
    '["Polvere", "Proteggibile", "Copiabile"]',
    'Polvere paralizzante che blocca il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenocroce',
    'Veleno',
    'Fisico',
    70,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico", "Taglio"]',
    'Taglio incrociato che può avvelenare. Alta probabilità brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Spora',
    'Erba',
    'Stato',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Bersaglio": "Bersaglio"}}]',
    '["Polvere", "Proteggibile", "Copiabile"]',
    'Spora che addormenta infallibilmente il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Polverabbia',
    'Coleottero',
    'Stato',
    0,
    0,
    20,
    'Utente',
    2,
    '[{"NomeFunzione": "AttiraAttacchi", "Parametri": {}}]',
    '["Polvere"]',
    'Attira su di sé tutti gli attacchi nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Forbice X',
    'Coleottero',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "Taglio"]',
    'Taglia il nemico incrociando falci o artigli.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Eledanza',
    'Coleottero',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile", "Danza"]',
    'Danza che aumenta Att. Sp., Dif. Sp. e Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Supersuono',
    'Normale',
    'Stato',
    0,
    55,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'Onda sonora che confonde il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Confusione',
    'Psico',
    'Speciale',
    50,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco psichico debole che può confondere.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Psicoraggio',
    'Psico',
    'Speciale',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio colorato che può confondere il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ronzio',
    'Coleottero',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Suono", "Proteggibile", "Copiabile"]',
    'Ronzio fastidioso. Può ridurre la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sanguisuga',
    'Coleottero',
    'Fisico',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AssorbiPS", "Parametri": {"Percentuale": 50}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Ruba PS al bersaglio attaccandolo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cozzata Zen',
    'Psico',
    'Fisico',
    80,
    90,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Testata concentrata che può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenodenti',
    'Veleno',
    'Fisico',
    50,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Iperavvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 50}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Morso"]',
    'Morso tossico. Alta probabilità di iperavvelenare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Psichico',
    'Psico',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Forte onda telecinetica. Può ridurre la Dif. Sp.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Nottesferza',
    'Buio',
    'Fisico',
    70,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico", "Taglio"]',
    'Fendente oscuro. Alta probabilità brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sgomento',
    'Spettro',
    'Fisico',
    30,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacca terrorizzando il nemico. Può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tripletta',
    'Normale',
    'Speciale',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStatoCasuale", "Parametri": {"Stati": ["Scottatura", "Paralisi", "Congelamento"], "Probabilità": 20}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio triplo. Può scottare, congelare o paralizzare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fangosberla',
    'Terra',
    'Speciale',
    20,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia fango in faccia riducendo la precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Abisso',
    'Terra',
    'Fisico',
    0,
    30,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Fa cadere il nemico in una voragine. KO in un colpo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bruciapelo',
    'Normale',
    'Fisico',
    40,
    100,
    10,
    'AltroVicino',
    3,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 100}}, {"NomeFunzione": "VerificaCondizione", "Parametri": {"Condizione": "PrimoTurno", "Altrimenti": "Fallisci"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco a sorpresa al primo turno. Fa tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gemmoforza',
    'Roccia',
    'Speciale',
    80,
    100,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Attacca con gemme luccicanti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Provocazione',
    'Buio',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "BloccaMosseStato", "Parametri": {"Turni": 3}}]',
    '["Proteggibile", "Copiabile"]',
    'Costringe il nemico a usare solo mosse d''attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acquagetto',
    'Acqua',
    'Fisico',
    40,
    100,
    20,
    'AltroVicino',
    1,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce per primo con un getto d''acqua.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Inondazione',
    'Acqua',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CambiaTipo", "Parametri": {"Tipo": "Acqua", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Trasforma il bersaglio nel tipo Acqua.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Psicamisù',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CopiaStatistiche", "Parametri": {}}]',
    '["Copiabile"]',
    'Copia le modifiche alle statistiche del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Amnesia',
    'Psico',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente la Difesa Speciale dimenticando.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Mirabolanza',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'TuttiCombattenti',
    0,
    '[{"NomeFunzione": "ScambiaStatistiche", "Parametri": {"Statistica1": "Difesa", "Statistica2": "DifesaSpeciale", "Turni": 5}}]',
    '["Copiabile"]',
    'Scambia Difesa e Difesa Speciale di tutti i Pokémon per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Boato',
    'Normale',
    'Stato',
    0,
    0,
    20,
    'AltroVicino',
    -6,
    '[{"NomeFunzione": "ForzaSostituzione", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Suono", "Riflettibile"]',
    'Costringe il bersaglio a fuggire o a essere sostituito.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Contropiede',
    'Lotta',
    'Fisico',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaInversaPS", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Più i PS sono bassi, più l''attacco è potente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gridodilotta',
    'Normale',
    'Stato',
    0,
    0,
    40,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile", "Suono"]',
    'Urla per aumentare il proprio spirito combattivo e l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Nemesi',
    'Normale',
    'Fisico',
    70,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "AlleatoKOTurnoPrecedente", "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Vendica un compagno caduto infliggendo danni doppi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ruotafuoco',
    'Fuoco',
    'Fisico',
    60,
    100,
    25,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "ScongelaUtente"]',
    'Carica infuocata rotante. Può scottare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Extrarapido',
    'Normale',
    'Fisico',
    80,
    100,
    5,
    'AltroVicino',
    2,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica a velocità estrema. Colpisce per primo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bollaraggio',
    'Acqua',
    'Speciale',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Spara bolle che possono ridurre la Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Colpodifango',
    'Terra',
    'Speciale',
    55,
    95,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia fango che riduce la Velocità del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dinamipugno',
    'Lotta',
    'Fisico',
    100,
    50,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio", "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno potente ma impreciso. Confonde se colpisce.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ipnosi',
    'Psico',
    'Stato',
    0,
    60,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Ipnosi che addormenta il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Leggimente',
    'Normale',
    'Stato',
    0,
    0,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ProssimoColpoSicuro", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Assicura che la prossima mossa vada a segno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Panciamburo',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "TagliaPS", "Parametri": {"Percentuale": 50}}, {"NomeFunzione": "MassimizzaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Sacrifica PS per massimizzare l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ribaltiro',
    'Lotta',
    'Fisico',
    60,
    90,
    10,
    'AltroVicino',
    -6,
    '[{"NomeFunzione": "ForzaSostituzione", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Lancia via il nemico costringendolo al cambio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sottomissione',
    'Lotta',
    'Fisico',
    80,
    80,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 25, "Su": "DannoInflitto"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Mossa spericolata con danno da contraccolpo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cinèsi',
    'Psico',
    'Stato',
    0,
    80,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Proteggibile", "Copiabile"]',
    'Piega un cucchiaio per ridurre la precisione del nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Teletrasporto',
    'Psico',
    'Stato',
    0,
    0,
    20,
    'Utente',
    -6,
    '[{"NomeFunzione": "FuggiOSostituisci", "Parametri": {}}]',
    '[]',
    'Fugge dalla lotta o cambia Pokémon.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Riflesso',
    'Psico',
    'Stato',
    0,
    0,
    20,
    'LatoUtente',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "Riflesso", "Lato": "Utente", "Turni": 5}}]',
    '["Copiabile"]',
    'Dimezza i danni fisici subiti per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cambiaposto',
    'Psico',
    'Stato',
    0,
    0,
    15,
    'Utente',
    0,
    '[{"NomeFunzione": "ScambiaPosizioneAlleato", "Parametri": {}}]',
    '[]',
    'Scambia posizione con un alleato in campo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Psicotaglio',
    'Psico',
    'Fisico',
    70,
    100,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Proteggibile", "Copiabile", "AltoTassoCritico", "Taglio"]',
    'Lama di energia psichica. Alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ripresa',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 50}}]',
    '["Copiabile"]',
    'Recupera metà dei PS massimi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Psicoshock',
    'Psico',
    'Speciale',
    80,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CalcolaDannoSuDifesaFisica", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Danno speciale calcolato sulla Difesa del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Divinazione',
    'Psico',
    'Speciale',
    120,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoFuturo", "Parametri": {"Turni": 2}}]',
    '[]',
    'Prevede un attacco che colpirà dopo 2 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Calmamente',
    'Psico',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Aumenta Attacco Speciale e Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bodyguard',
    'Roccia',
    'Stato',
    0,
    0,
    10,
    'LatoUtente',
    3,
    '[{"NomeFunzione": "ProteggiDaArea", "Parametri": {"Bersaglio": "LatoUtente"}}]',
    '[]',
    'Protegge la squadra dalle mosse ad ampio raggio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Colpo Basso',
    'Lotta',
    'Fisico',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaBasataSuPeso", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Più il nemico è pesante, più subisce danni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vendetta',
    'Lotta',
    'Fisico',
    60,
    100,
    10,
    'AltroVicino',
    -4,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "UtenteDanneggiato", "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Danni doppi se l''utente è stato colpito nello stesso turno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Calciobasso',
    'Lotta',
    'Fisico',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Calcio che riduce la Velocità del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vitaltiro',
    'Lotta',
    'Fisico',
    70,
    0,
    10,
    'AltroVicino',
    -1,
    '[{"NomeFunzione": "ColpoSicuro", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Mossa che non fallisce mai, ma agisce per seconda.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Forza',
    'Normale',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Potente attacco fisico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Doppiocolpo',
    'Normale',
    'Fisico',
    35,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"NumeroColpi": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce due volte.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Granfisico',
    'Lotta',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Gonfia i muscoli aumentando Attacco e Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Movimento Sismico',
    'Lotta',
    'Fisico',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoFisso", "Parametri": {"Formula": "LivelloUtente"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Infligge danni pari al livello di chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Incrocolpo',
    'Lotta',
    'Fisico',
    100,
    80,
    5,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Colpo incrociato con alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Schianto',
    'Normale',
    'Fisico',
    80,
    75,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce con forza il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vorticerba',
    'Erba',
    'Speciale',
    65,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 50}}]',
    '["Proteggibile", "Copiabile"]',
    'Intrappola il nemico in un tornado di foglie. Può ridurre la Precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Verdebufera',
    'Erba',
    'Speciale',
    130,
    90,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": -2}}]',
    '["Proteggibile", "Copiabile"]',
    'Potente tempesta che riduce drasticamente l''Attacco Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fendifoglia',
    'Erba',
    'Fisico',
    90,
    100,
    15,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico", "Taglio"]',
    'Lama vegetale. Alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Riflettipo',
    'Normale',
    'Stato',
    0,
    0,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CopiaTipo", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Copiabile"]',
    'L''utente assume lo stesso tipo del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sciagura',
    'Spettro',
    'Speciale',
    65,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioConStato", "Moltiplicatore": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Danni doppi se il bersaglio ha un problema di stato.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Scudo Acido',
    'Veleno',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Liquefa il corpo per aumentare drasticamente la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Surf',
    'Acqua',
    'Speciale',
    90,
    100,
    15,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioSottacqua", "Moltiplicatore": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Travolge tutto ciò che ha intorno. Danni doppi su Sub.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Lucidatura',
    'Roccia',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente la Velocità riducendo l''attrito.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pesobomba',
    'Acciaio',
    'Fisico',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaBasataSuPeso", "Parametri": {"Formula": "PesoUtenteVsBersaglio"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Più l''utente è pesante rispetto al nemico, più fa danno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sassata',
    'Lotta',
    'Fisico',
    0,
    100,
    10,
    'AltroVicino',
    -6,
    '[{"NomeFunzione": "ForzaSostituzione", "Parametri": {"Bersaglio": "Bersaglio"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Lancia il nemico costringendolo al cambio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Abbattimento',
    'Roccia',
    'Fisico',
    50,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AnnullaImmunitàTerra", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Fa precipitare al suolo i nemici in volo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Autodistruzione',
    'Normale',
    'Fisico',
    200,
    100,
    5,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {"Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Esplosione che mette KO l''utente e danneggia tutti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Levitoroccia',
    'Roccia',
    'Stato',
    0,
    0,
    20,
    'LatoNemico',
    0,
    '[{"NomeFunzione": "PiazzaTrappola", "Parametri": {"Tipo": "Levitoroccia"}}]',
    '["Copiabile"]',
    'Piazza rocce che danneggiano i nemici entranti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cadutamassi',
    'Roccia',
    'Fisico',
    75,
    90,
    10,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia massi. Può far tentennare i nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Esplosione',
    'Normale',
    'Fisico',
    250,
    100,
    5,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {"Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Violenta esplosione che mette KO l''utente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pietrataglio',
    'Roccia',
    'Fisico',
    100,
    80,
    5,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Pietre affilate. Alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sottilcorno',
    'Acciaio',
    'Fisico',
    70,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpoSicuro", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Infilza il nemico con un corno. Non fallisce mai.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Nitrocaica',
    'Fuoco',
    'Fisico',
    50,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco infuocato che aumenta la Velocità dell''utente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pestone',
    'Normale',
    'Fisico',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}, {"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioMinimizzato", "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Pesta il nemico. Danni doppi se è Minimizzato.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Maledizione',
    'Spettro',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "EffettoMaledizione", "Parametri": {}}]',
    '[]',
    'Effetto diverso se usata da uno Spettro.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Sbadiglio',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonnolenza", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Fa addormentare il nemico al turno successivo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bottintesta',
    'Psico',
    'Fisico',
    80,
    90,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Testata concentrata che può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pigro',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 50}}]',
    '["Copiabile"]',
    'Ozia recuperando metà dei PS massimi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Curapulsar',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Cura", "Parametri": {"Percentuale": 50, "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile", "Pulsazione"]',
    'Emette un''onda curativa che restituisce PS al bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Taglio',
    'Normale',
    'Fisico',
    50,
    95,
    30,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "Taglio"]',
    'Taglia il nemico. Utile per abbattere alberi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Aeroassalto',
    'Volante',
    'Fisico',
    60,
    0,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpoSicuro", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Taglio"]',
    'Attacco aereo estremamente veloce e infallibile.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Aerasoio',
    'Volante',
    'Speciale',
    60,
    95,
    25,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Proteggibile", "Copiabile", "AltoTassoCritico", "Taglio"]',
    'Vento tagliente con alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Falsofinale',
    'Normale',
    'Fisico',
    40,
    100,
    40,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Lascia1PS", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Taglio"]',
    'Lascia sempre almeno 1 PS al bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Baldeali',
    'Volante',
    'Fisico',
    120,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 33.3, "Su": "DannoInflitto"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica coraggiosa che danneggia anche chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Doppiosmash',
    'Normale',
    'Fisico',
    35,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"NumeroColpi": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce due volte con le appendici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Baraonda',
    'Normale',
    'Speciale',
    90,
    100,
    10,
    'NemicoVicinoCasuale',
    0,
    '[{"NomeFunzione": "BloccaPerTurni", "Parametri": {"Turni": 3}}, {"NomeFunzione": "ImpedisciSonno", "Parametri": {}}]',
    '["Suono", "Copiabile"]',
    'Chiasso infernale per 3 turni. Nessuno può dormire.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acupressione',
    'Normale',
    'Stato',
    0,
    0,
    30,
    'Alleato',
    0,
    '[{"NomeFunzione": "ModificaStatisticaCasuale", "Parametri": {"Gradi": 2}}]',
    '["Copiabile"]',
    'Aumenta drasticamente una statistica a caso di un alleato.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Assalto',
    'Coleottero',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Si lancia sull''avversario riducendone l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Colpo',
    'Normale',
    'Fisico',
    120,
    100,
    10,
    'NemicoVicinoCasuale',
    0,
    '[{"NomeFunzione": "BloccaPerTurni", "Parametri": {"TurniMin": 2, "TurniMax": 3}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Utente", "Condizione": "AlTermine"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacca per 2-3 turni e poi confonde chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Oltraggio',
    'Drago',
    'Fisico',
    120,
    100,
    10,
    'NemicoVicinoCasuale',
    0,
    '[{"NomeFunzione": "BloccaPerTurni", "Parametri": {"TurniMin": 2, "TurniMax": 3}}, {"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Utente", "Condizione": "AlTermine"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Si infuria per 2-3 turni, poi si confonde.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ultimascelta',
    'Normale',
    'Fisico',
    140,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FallisceSeMosseNonUsate", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Usabile solo dopo aver usato tutte le altre mosse.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cascata',
    'Acqua',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica il nemico con velocità. Può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Perforcorno',
    'Normale',
    'Fisico',
    0,
    30,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Manda KO in un colpo solo se colpisce.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acquadisale',
    'Acqua',
    'Speciale',
    65,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "BersaglioSottoMetaPS", "Moltiplicatore": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Potenza raddoppiata se i PS del bersaglio sono sotto la metà.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Anticipo',
    'Lotta',
    'Stato',
    0,
    0,
    15,
    'LatoUtente',
    3,
    '[{"NomeFunzione": "BloccaPriorità", "Parametri": {"Bersaglio": "LatoUtente"}}]',
    '[]',
    'Protegge la squadra dalle mosse ad alta priorità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Barattoforza',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ScambiaStatistiche", "Parametri": {"Statistiche": ["Attacco", "AttaccoSpeciale"]}}]',
    '["Proteggibile", "Copiabile"]',
    'Scambia l''Attacco e l''Att. Sp. con il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Barattoscudo',
    'Psico',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ScambiaStatistiche", "Parametri": {"Statistiche": ["Difesa", "DifesaSpeciale"]}}]',
    '["Proteggibile", "Copiabile"]',
    'Scambia la Difesa e la Dif. Sp. con il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Staffetta',
    'Normale',
    'Stato',
    0,
    0,
    40,
    'Utente',
    0,
    '[{"NomeFunzione": "SostituisciEPassaStatistiche", "Parametri": {}}]',
    '[]',
    'Cambia Pokémon passando le modifiche alle statistiche.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Magibrillio',
    'Folletto',
    'Speciale',
    80,
    100,
    10,
    'TuttiNemiciVicini',
    0,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Emette una luce potente che danneggia i nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Strampadanza',
    'Normale',
    'Stato',
    0,
    100,
    20,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile", "Danza"]',
    'Ballo frenetico che confonde tutti i Pokémon vicini.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Polneve',
    'Ghiaccio',
    'Speciale',
    40,
    100,
    25,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Congelamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Neve farinosa che può congelare i nemici.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Falselacrime',
    'Buio',
    'Stato',
    0,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Copiabile", "Proteggibile", "Riflettibile"]',
    'Riduce drasticamente la Difesa Speciale del nemico fingendo di piangere.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Demonbacio',
    'Normale',
    'Stato',
    0,
    75,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Sonno", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile", "Riflettibile"]',
    'Bacio demoniaco che addormenta il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bora',
    'Ghiaccio',
    'Speciale',
    110,
    70,
    5,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Congelamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}, {"NomeFunzione": "ModificaPrecisione", "Parametri": {"Condizione": "MeteoGrandine", "Valore": 1000}}]',
    '["Proteggibile", "Copiabile"]',
    'Tempesta di ghiaccio che può congelare. Infallibile sotto la grandine.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Presa',
    'Normale',
    'Fisico',
    55,
    100,
    30,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Stritola il nemico con forza.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Legatutto',
    'Normale',
    'Fisico',
    15,
    85,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"TurniMin": 4, "TurniMax": 5, "DannoPerTurno": 0.125}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Intrappola il bersaglio per 4-5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Tempestretta',
    'Lotta',
    'Fisico',
    60,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpoCriticoSicuro", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpisce sempre con un brutto colpo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ghigliottina',
    'Normale',
    'Fisico',
    0,
    30,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Manda KO in un colpo solo se colpisce.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Cuordileone',
    'Normale',
    'Stato',
    0,
    0,
    30,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile"]',
    'Aumenta Attacco e Attacco Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Scatanatoro',
    'Normale',
    'Fisico',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RompiBarriere", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Carica furiosa che distrugge le barriere difensive.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gigaimpatto',
    'Normale',
    'Fisico',
    150,
    90,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RicaricaTurnoSuccessivo", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco potentissimo, ma richiede un turno di riposo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dragodanza',
    'Drago',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": 1}}]',
    '["Copiabile", "Danza"]',
    'Danza mistica che aumenta Attacco e Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Iper Raggio',
    'Normale',
    'Speciale',
    150,
    90,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RicaricaTurnoSuccessivo", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio devastante. Richiede un turno di ricarica.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Nebbia',
    'Ghiaccio',
    'Stato',
    0,
    0,
    30,
    'LatoUtente',
    0,
    '[{"NomeFunzione": "ApplicaEffettoCampo", "Parametri": {"Effetto": "Nebbia", "Lato": "Utente", "Turni": 5}}]',
    '["Copiabile"]',
    'Protegge la squadra dalle riduzioni delle statistiche per 5 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Trasformazione',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "TrasformaInBersaglio", "Parametri": {}}]',
    '[]',
    'L''utente si trasforma in una copia esatta del bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Occhioni Teneri',
    'Folletto',
    'Stato',
    0,
    100,
    30,
    'AltroVicino',
    1,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1}}]',
    '["Copiabile", "Proteggibile"]',
    'Sguardo tenero che riduce l''Attacco del nemico. Priorità alta.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fanghiglia',
    'Acqua',
    'Speciale',
    90,
    85,
    10,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Precisione", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Acqua fangosa che colpisce i nemici. Può ridurre la Precisione.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Lavasbuffo',
    'Fuoco',
    'Speciale',
    80,
    100,
    15,
    'TuttiAltriVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Fiamme che colpiscono tutti i vicini. Alta probabilità di scottare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Forzantica',
    'Roccia',
    'Speciale',
    60,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AumentaTutteStatistiche", "Parametri": {"Gradi": 1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Potere preistorico che può aumentare tutte le statistiche.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Idrobreccia',
    'Acqua',
    'Fisico',
    85,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 20}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Spallata d''acqua. Può ridurre la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ferrostrido',
    'Acciaio',
    'Stato',
    0,
    85,
    40,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -2}}]',
    '["Suono", "Copiabile", "Proteggibile", "Riflettibile"]',
    'Suono stridente che riduce drasticamente la Difesa Speciale.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Resistenza',
    'Normale',
    'Stato',
    0,
    0,
    10,
    'Utente',
    4,
    '[{"NomeFunzione": "ResistiAKO", "Parametri": {"PSMinimi": 1}}]',
    '[]',
    'Resiste a qualsiasi attacco restando con almeno 1 PS.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Acquanello',
    'Acqua',
    'Stato',
    0,
    0,
    20,
    'Utente',
    0,
    '[{"NomeFunzione": "ApplicaStatoUnico", "Parametri": {"Tipo": "Acquanello", "Bersaglio": "Utente"}}]',
    '["Copiabile"]',
    'Velo d''acqua che restituisce PS a ogni turno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Flagello',
    'Normale',
    'Fisico',
    0,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "PotenzaInversaPS", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Più i PS sono bassi, più l''attacco è potente.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Leccata',
    'Spettro',
    'Fisico',
    30,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Leccata che può paralizzare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gelopugno',
    'Ghiaccio',
    'Fisico',
    75,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Congelamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno ghiacciato che può congelare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Malosguardo',
    'Normale',
    'Stato',
    0,
    0,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"Tipo": "ImpedisciFuga", "Bersaglio": "Bersaglio"}}]',
    '["Copiabile", "Riflettibile"]',
    'Impedisce al nemico di fuggire o di essere sostituito.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ultimocanto',
    'Normale',
    'Stato',
    0,
    0,
    5,
    'TuttiCombattenti',
    0,
    '[{"NomeFunzione": "ApplicaStatoUnico", "Parametri": {"Tipo": "Ultimocanto", "Turni": 3}}]',
    '["Suono"]',
    'Tutti i Pokémon in campo vanno KO dopo 3 turni.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Rivincita',
    'Buio',
    'Fisico',
    50,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaDanno", "Parametri": {"Condizione": "UtenteMuoveDopo", "Moltiplicatore": 2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Danni doppi se chi la usa agisce dopo il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Bullo',
    'Normale',
    'Stato',
    0,
    85,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Confusione", "Bersaglio": "Bersaglio"}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": 2}}]',
    '["Copiabile", "Proteggibile", "Riflettibile"]',
    'Confonde il bersaglio ma ne aumenta molto l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Mulinello',
    'Acqua',
    'Speciale',
    35,
    85,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "Intrappola", "Parametri": {"TurniMin": 4, "TurniMax": 5, "DannoPerTurno": 0.125}}]',
    '["Proteggibile", "Copiabile"]',
    'Intrappola il nemico in un vortice d''acqua.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Geloscheggia',
    'Ghiaccio',
    'Fisico',
    40,
    100,
    30,
    'AltroVicino',
    1,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Pezzo di ghiaccio scagliato con priorità alta.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Geloraggio',
    'Ghiaccio',
    'Speciale',
    90,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Congelamento", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio gelido che può congelare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Purogelo',
    'Ghiaccio',
    'Speciale',
    0,
    30,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "MandaKO", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Manda KO in un colpo solo se colpisce.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Smog',
    'Veleno',
    'Speciale',
    30,
    70,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 40}}]',
    '["Proteggibile", "Copiabile"]',
    'Gas esausto che può avvelenare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Raggiaurora',
    'Ghiaccio',
    'Speciale',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 10}}]',
    '["Proteggibile", "Copiabile"]',
    'Raggio colorato che può ridurre l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Aeroattacco',
    'Volante',
    'Fisico',
    140,
    90,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "CaricaAttacco", "Parametri": {"TurniDiCarica": 1, "Messaggio": "Si avvolge in una luce intensa!"}}, {"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Attacca al secondo turno. Alta probabilità di brutti colpi e può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Assorbipugno',
    'Lotta',
    'Fisico',
    75,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "AssorbiPS", "Parametri": {"Percentuale": 50}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Un pugno che assorbe l''energia. Restituisce metà dei danni inflitti.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Breccia',
    'Lotta',
    'Fisico',
    75,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "RompiBarriere", "Parametri": {}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Colpo possente che infrange barriere come Riflesso e Schermoluce.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Calciardente',
    'Fuoco',
    'Fisico',
    85,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Calcio infuocato con alta probabilità di brutti colpi. Può scottare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Conchilama',
    'Acqua',
    'Fisico',
    75,
    95,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 50}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Taglio"]',
    'Fendente sferrato con una conchiglia affilata. Può ridurre la Difesa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Crescipugno',
    'Lotta',
    'Fisico',
    40,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 100}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'I pugni si induriscono a ogni colpo andato a segno, aumentando l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Dragofuria',
    'Drago',
    'Speciale',
    0,
    100,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoFisso", "Parametri": {"Danno": 40}}]',
    '["Proteggibile", "Copiabile"]',
    'Palla di fuoco che infligge danni fissi pari a 40 PS.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Elettrocannone',
    'Elettro',
    'Speciale',
    120,
    50,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Paralisi", "Bersaglio": "Bersaglio", "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Raggio elettrico molto impreciso, ma se colpisce paralizza sempre il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Elettromistero',
    'Elettro',
    'Speciale',
    60,
    0,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpoSicuro", "Parametri": {}}]',
    '["Proteggibile", "Copiabile"]',
    'Attacco elettrico veloce e infallibile.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fango',
    'Veleno',
    'Speciale',
    65,
    100,
    20,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio", "Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Tira liquame tossico. Può avvelenare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ferrartigli',
    'Acciaio',
    'Fisico',
    50,
    95,
    35,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Attacco", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Graffia con artigli d''acciaio. Può aumentare l''Attacco.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Forza Equina',
    'Terra',
    'Fisico',
    95,
    95,
    10,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Si getta con foga contro il nemico travolgendolo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Frana',
    'Roccia',
    'Fisico',
    75,
    90,
    10,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia grossi massi contro i nemici. Può farli tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Fuocopugno',
    'Fuoco',
    'Fisico',
    75,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Scottatura", "Bersaglio": "Bersaglio", "Probabilità": 10}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno infuocato che può scottare il bersaglio.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Gelolancia',
    'Ghiaccio',
    'Fisico',
    25,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia ghiaccioli. Colpisce da due a cinque volte di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Martellata',
    'Acqua',
    'Fisico',
    100,
    90,
    10,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "AltoTassoCritico"]',
    'Potente fendente di chela. Alta probabilità di brutti colpi.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Martelpugno',
    'Lotta',
    'Fisico',
    100,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Utente", "Gradi": -1}}]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Colpisce con un pugno pesante, ma riduce la Velocità di chi lo usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Mazzuolegno',
    'Erba',
    'Fisico',
    120,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "DannoContraccolpo", "Parametri": {"Percentuale": 33.3, "Su": "DannoInflitto"}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Schianta sul nemico il corpo duro. Danneggia in parte anche chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Megacalcio',
    'Normale',
    'Fisico',
    120,
    75,
    5,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Un calcio dalla forza strabiliante.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Megapugno',
    'Normale',
    'Fisico',
    80,
    85,
    20,
    'AltroVicino',
    0,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Un pugno sferrato con incredibile potenza.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Metaltestata',
    'Acciaio',
    'Fisico',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Sferra una dura testata metallica. Può far tentennare il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Neropulsar',
    'Buio',
    'Speciale',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 20}}]',
    '["Proteggibile", "Copiabile", "Pulsazione"]',
    'Emette un''orribile aura oscura. Può far tentennare.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ossomerang',
    'Terra',
    'Fisico',
    50,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"NumeroColpi": 2}}]',
    '["Proteggibile", "Copiabile"]',
    'Lancia un osso come un boomerang, che colpisce all''andata e al ritorno.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ossoraffica',
    'Terra',
    'Fisico',
    25,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Proteggibile", "Copiabile"]',
    'Colpisce il nemico con un osso da due a cinque volte di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Palla Ombra',
    'Spettro',
    'Speciale',
    80,
    100,
    15,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 20}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Sfera di pura oscurità. Può ridurre la Difesa Speciale del nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pugnorapido',
    'Lotta',
    'Fisico',
    40,
    100,
    30,
    'AltroVicino',
    1,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno sferrato a velocità impercettibile. Colpisce per primo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Pugnoscarica',
    'Acciaio',
    'Fisico',
    40,
    100,
    30,
    'AltroVicino',
    1,
    '[]',
    '["Contatto", "Proteggibile", "Copiabile", "Pugno"]',
    'Pugno duro e veloce come un proiettile. Colpisce per primo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Raggioscossa',
    'Elettro',
    'Speciale',
    50,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": 1, "Probabilità": 70}}]',
    '["Proteggibile", "Copiabile"]',
    'Scaglia una carica elettrica. Spesso aumenta l''Attacco Speciale di chi la usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Scagliagelo',
    'Ghiaccio',
    'Fisico',
    85,
    90,
    10,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "FaiTentennare", "Parametri": {"Probabilità": 30}}]',
    '["Proteggibile", "Copiabile"]',
    'Scaglia pesanti blocchi di ghiaccio. Può far tentennare il nemico.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Semitraglia',
    'Erba',
    'Fisico',
    25,
    100,
    30,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ColpiMultipli", "Parametri": {"Min": 2, "Max": 5}}]',
    '["Proteggibile", "Copiabile", "Bomba"]',
    'Spara semi raffica contro il bersaglio da due a cinque volte di fila.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vampata',
    'Fuoco',
    'Speciale',
    130,
    90,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "AttaccoSpeciale", "Bersaglio": "Utente", "Gradi": -2}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Attacco di massima potenza, che però riduce drasticamente l''Attacco Speciale di chi lo usa.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Velenogas',
    'Veleno',
    'Stato',
    0,
    90,
    40,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ApplicaStato", "Parametri": {"Stato": "Avvelenamento", "Bersaglio": "Bersaglio"}}]',
    '["Proteggibile", "Copiabile"]',
    'Soffia gas velenoso sul volto dei nemici per avvelenarli.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Ventogelato',
    'Ghiaccio',
    'Speciale',
    55,
    95,
    15,
    'TuttiNemiciVicini',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Velocità", "Bersaglio": "Bersaglio", "Gradi": -1, "Probabilità": 100}}]',
    '["Proteggibile", "Copiabile"]',
    'Investe il bersaglio con vento gelido. Ne riduce la Velocità.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Vuotonda',
    'Lotta',
    'Speciale',
    40,
    100,
    30,
    'AltroVicino',
    1,
    '[]',
    '["Proteggibile", "Copiabile"]',
    'Lancia un''onda di vuoto concentrato. Colpisce per primo.'
  );

insert into
  "Mosse" (
    "Nome",
    "Tipo",
    "Categoria",
    "Potenza",
    "Precisione",
    "PP",
    "Bersaglio",
    "Priorità",
    "CodiceFunzione",
    "Flags",
    "Descrizione"
  )
values
  (
    'Zuffa',
    'Lotta',
    'Fisico',
    120,
    100,
    5,
    'AltroVicino',
    0,
    '[{"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "Difesa", "Bersaglio": "Utente", "Gradi": -1}}, {"NomeFunzione": "ModificaStatistica", "Parametri": {"Statistica": "DifesaSpeciale", "Bersaglio": "Utente", "Gradi": -1}}]',
    '["Contatto", "Proteggibile", "Copiabile"]',
    'Lotta sfrenata che abbassa Difesa e Difesa Speciale di chi la usa.'
  );

create table "Pokemon_Base" (
  "nome" TEXT primary key,
  "tipi" JSONB,
  "statistiche" JSONB,
  "mosse" JSONB,
  "sprite" JSONB
);

create index idx_pokemon_tipi on "Pokemon_Base" using GIN ("tipi");

create index idx_pokemon_mosse on "Pokemon_Base" using GIN ("mosse");

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Venusaur',
    '["Erba", "Veleno"]',
    '{"speed": {"base_stat": 80}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 83}, "attack": {"base_stat": 82}, "hp": {"base_stat": 80}}',
    '["Azione", "Crescita", "Fiortempesta", "Frustata", "Petalodanza", "Ruggito", "Parassiseme", "Foglielama", "Sonnifero", "Velenpolvere", "Semebomba", "Riduttore", "Profumino", "Sintesi", "Sdoppiatore", "Solarraggio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c8/Sprnbm0003.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/38/Sprnbmsh0003.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Charizard',
    '["Fuoco", "Volante"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 85}, "special-attack": {"base_stat": 109}, "defense": {"base_stat": 78}, "attack": {"base_stat": 84}, "hp": {"base_stat": 78}}',
    '["Braciere", "Dragartiglio", "Graffio", "Muro di Fumo", "Ondacalda", "Ruggito", "Eterelama", "Dragospiro", "Rogodenti", "Lacerazione", "Lanciafiamme", "Visotruce", "Turbofuoco", "Marchiatura", "Fuococarica"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/5/53/Sprnbm0006.gif", "shiny": "https://media.pokemoncentral.it/wiki/1/15/Sprnbmsh0006.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Blastoise',
    '["Acqua"]',
    '{"speed": {"base_stat": 78}, "special-defense": {"base_stat": 105}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 100}, "attack": {"base_stat": 83}, "hp": {"base_stat": 79}}',
    '["Azione", "Cannonflash", "Colpocoda", "Pistolacqua", "Ritirata", "Rapigiro", "Morso", "Idropulsar", "Protezione", "Pioggiadanza", "Idrondata", "Gettaguscio", "Ferroscudo", "Idropompa", "Capocciata"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/cf/Sprnbm0009.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/ba/Sprnbmsh0009.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Butterfree',
    '["Coleottero", "Volante"]',
    '{"speed": {"base_stat": 70}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 90}, "defense": {"base_stat": 50}, "attack": {"base_stat": 45}, "hp": {"base_stat": 60}}',
    '["Azione", "Millebave", "Raffica", "Rafforzatore"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/8d/Sprnbm0012.gif", "shiny": "https://media.pokemoncentral.it/wiki/0/0d/Sprnbmsh0012.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Beedrill',
    '["Coleottero", "Veleno"]',
    '{"speed": {"base_stat": 75}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 45}, "defense": {"base_stat": 40}, "attack": {"base_stat": 90}, "hp": {"base_stat": 65}}',
    '["Furia", "Millebave", "Rafforzatore", "Velenospina", "Tagliofuria", "Concentrazione", "Focalenergia", "Velenoshock", "Garanzia", "Fielepunte", "Missilspillo", "Velenpuntura", "Agilità", "Rimonta", "Pungilione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/2/22/Sprnbm0015.gif", "shiny": "https://media.pokemoncentral.it/wiki/e/ed/Sprnbmsh0015.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Pidgeot',
    '["Normale", "Volante"]',
    '{"speed": {"base_stat": 101}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 70}, "defense": {"base_stat": 75}, "attack": {"base_stat": 80}, "hp": {"base_stat": 83}}',
    '["Attacco Rapido", "Azione", "Raffica", "Tifone", "Turbosabbia", "Turbine", "Tornado", "Danzadipiume", "Agilità", "Attacco d''Ala", "Trespolo", "Ventoincoda", "Eterelama"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/2/2d/Sprnbm0018.gif", "shiny": "https://media.pokemoncentral.it/wiki/9/90/Sprnbmsh0018.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Raticate',
    '["Normale"]',
    '{"speed": {"base_stat": 97}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 50}, "defense": {"base_stat": 60}, "attack": {"base_stat": 81}, "hp": {"base_stat": 55}}',
    '["Attacco Rapido", "Azione", "Colpocoda", "Danzaspada", "Focalenergia", "Visotruce", "Morso", "Concentrazione", "Riduttore", "Garanzia", "Sgranocchio", "Sbigoattacco", "Superanza", "Sdoppiatore", "Rimonta"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/5/52/Sprnbm0020.gif", "shiny": "https://media.pokemoncentral.it/wiki/8/83/Sprnbmsh0020.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Fearow',
    '["Normale", "Volante"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 61}, "special-attack": {"base_stat": 61}, "defense": {"base_stat": 65}, "attack": {"base_stat": 90}, "hp": {"base_stat": 65}}',
    '["Beccata", "Fulmisguardo", "Giravvita", "Ruggito", "Garanzia", "Furia", "Attacco d''Ala", "Riduttore", "Agilità", "Focalenergia", "Trespolo", "Perforbecco"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/0b/Sprnbm0022.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/b2/Sprnbmsh0022.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Arbok',
    '["Veleno"]',
    '{"speed": {"base_stat": 80}, "special-defense": {"base_stat": 79}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 69}, "attack": {"base_stat": 95}, "hp": {"base_stat": 60}}',
    '["Avvolgibotta", "Fulmindenti", "Fulmisguardo", "Gelodenti", "Morso", "Rogodenti", "Sgranocchio", "Velenospina", "Sguardo Feroce", "Stridio", "Acido", "Accumulo", "Introenergia", "Sfoghenergia", "Acidobomba", "Fangobomba", "Nube", "Arrotola", "Sporcolancio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/e/ef/Sprnbm0024.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/3e/Sprnbmsh0024.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Raichu',
    '["Elettro"]',
    '{"speed": {"base_stat": 110}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 90}, "defense": {"base_stat": 55}, "attack": {"base_stat": 90}, "hp": {"base_stat": 60}}',
    '["Agilità", "Attacco Rapido", "Codacciaio", "Colpocoda", "Congiura", "Dolcebacio", "Doppioteam", "Elettrococcola", "Energisfera", "Fascino", "Fintoattacco", "Ruggito", "Scarica", "Schermoluce", "Scintilla", "Simpatia", "Tuono", "Tuononda", "Tuonoshock", "Tuonopugno", "Fulmine"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/2/28/Sprnbm0026.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/c8/Sprnbmsh0026.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Sandslash',
    '["Terra"]',
    '{"speed": {"base_stat": 65}, "special-defense": {"base_stat": 55}, "special-attack": {"base_stat": 45}, "defense": {"base_stat": 110}, "attack": {"base_stat": 100}, "hp": {"base_stat": 75}}',
    '["Agilità", "Graffio", "Ricciolscudo", "Tirartigli", "Turbosabbia", "Velenospina", "Rotolamento", "Tagliofuria", "Rapigiro", "Battiterra", "Comete", "Sfuriate", "Sabbiotomba", "Lacerazione", "Fossa", "Vortexpalla", "Danzaspada", "Terrempesta", "Terremoto"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/8e/Sprnbm0028.gif", "shiny": "https://media.pokemoncentral.it/wiki/5/59/Sprnbmsh0028.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Nidoqueen',
    '["Veleno", "Terra"]',
    '{"speed": {"base_stat": 76}, "special-defense": {"base_stat": 85}, "special-attack": {"base_stat": 75}, "defense": {"base_stat": 87}, "attack": {"base_stat": 92}, "hp": {"base_stat": 90}}',
    '["Adulazione", "Altruismo", "Colpocoda", "Doppiocalcio", "Fangonda", "Fielepunte", "Geoforza", "Graffio", "Morso", "Ruggito", "Sfuriate", "Sgranocchio", "Tossina", "Troppoforte", "Velenospina"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/cb/Sprnbf0031.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/b7/Sprnbfsh0031.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Nidoking',
    '["Veleno", "Terra"]',
    '{"speed": {"base_stat": 85}, "special-defense": {"base_stat": 75}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 77}, "attack": {"base_stat": 102}, "hp": {"base_stat": 81}}',
    '["Adulazione", "Altruismo", "Beccata", "Doppiocalcio", "Fangonda", "Fielepunte", "Focalenergia", "Fulmisguardo", "Furia", "Geoforza", "Incornata", "Megacorno", "Tossina", "Velenospina", "Velenpuntura"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c6/Sprnbm0034.gif", "shiny": "https://media.pokemoncentral.it/wiki/a/ad/Sprnbmsh0034.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Clefable',
    '["Folletto"]',
    '{"speed": {"base_stat": 60}, "special-defense": {"base_stat": 90}, "special-attack": {"base_stat": 95}, "defense": {"base_stat": 73}, "attack": {"base_stat": 70}, "hp": {"base_stat": 95}}',
    '["Botta", "Canto", "Copione", "Cortesia", "Cosmoforza", "Curardore", "Dolcebacio", "Fascino", "Forza Lunare", "Goccia Vitale", "Gravità", "Incantavoce", "Lucelunare", "Meteorpugno", "Minimizzato", "Ricciolscudo", "Ripeti", "Ruggito", "Sonoqui", "Splash", "Veicovaforza"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/3/36/Sprnbm0036.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/c0/Sprnbmsh0036.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Ninetales',
    '["Fuoco"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 81}, "defense": {"base_stat": 75}, "attack": {"base_stat": 76}, "hp": {"base_stat": 73}}',
    '["Attacco Rapido", "Braciere", "Colpocoda", "Congiura", "Dispetto", "Esclusiva", "Extrasenso", "Fuocobomba", "Fuocofatuo", "Inibitore", "Lanciafiamme", "Marchiatura", "Rancore", "Salvaguardia", "Stordiraggio", "Turbofuoco"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/a3/Sprnbm0038.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/cb/Sprnbmsh0038.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Wigglytuff',
    '["Normale", "Folletto"]',
    '{"speed": {"base_stat": 45}, "special-defense": {"base_stat": 50}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 45}, "attack": {"base_stat": 70}, "hp": {"base_stat": 140}}',
    '["Accumulo", "Botta", "Canto", "Copione", "Coro", "Corposcontro", "Dolcebacio", "Echeggiavoce", "Fascino", "Granvoce", "Incantavoce", "Inibitore", "Introenergia", "Mimica", "Ricciolscudo", "Riposo", "Sdoppiatore", "Sfoghenergia", "Vortexpalla", "Carineria"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/b/b6/Sprnbm0040.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/6b/Sprnbmsh0040.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Vileplume',
    '["Erba", "Veleno"]',
    '{"speed": {"base_stat": 50}, "special-defense": {"base_stat": 90}, "special-attack": {"base_stat": 110}, "defense": {"base_stat": 85}, "attack": {"base_stat": 80}, "hp": {"base_stat": 75}}',
    '["Acido", "Aromaterapia", "Assorbimento", "Campo Erboso", "Crescita", "Fiortempesta", "Forza Lunare", "Gigassorbimento", "Lucelunare", "Megassorbimento", "Paralizzante", "Petalodanza", "Profumino", "Sonnifero", "Tossina", "Velenpolvere"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c7/Sprnbm0045.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/37/Sprnbmsh0045.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Parasect',
    '["Coleottero", "Erba"]',
    '{"speed": {"base_stat": 30}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 60}, "defense": {"base_stat": 80}, "attack": {"base_stat": 95}, "hp": {"base_stat": 60}}',
    '["Assorbimento", "Graffio", "Paralizzante", "Velenocroce", "Velenpolvere", "Tagliofuria", "Spora", "Lacerazione", "Crescita", "Gigassorbimento", "Aromaterapia", "Polverabbia", "Forbice X"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/6/64/Sprnbm0047.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/b3/Sprnbmsh0047.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Venomoth',
    '["Coleottero", "Veleno"]',
    '{"speed": {"base_stat": 90}, "special-defense": {"base_stat": 75}, "special-attack": {"base_stat": 90}, "defense": {"base_stat": 60}, "attack": {"base_stat": 65}, "hp": {"base_stat": 70}}',
    '["Azione", "Eledanza", "Inibitore", "Supersuono", "Eterelama", "Confusione", "Velenpolvere", "Psicoraggio", "Paralizzante", "Ronzio", "Sonnifero", "Sanguisuga", "Cozzata Zen", "Velenodenti", "Psichico"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/83/Sprnbm0049.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/3b/Sprnbmsh0049.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Dugtrio',
    '["Terra"]',
    '{"speed": {"base_stat": 120}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 50}, "defense": {"base_stat": 50}, "attack": {"base_stat": 100}, "hp": {"base_stat": 35}}',
    '["Graffio", "Nottesferza", "Ruggito", "Sgomento", "Tripletta", "Turbosabbia", "Sabbiotomba", "Fangosberla", "Battiterra", "Sbigoattacco", "Lacerazione", "Terrempesta", "Fossa", "Geoforza", "Terremoto", "Abisso"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c8/Sprnbm0051.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/ba/Sprnbmsh0051.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Persian',
    '["Normale"]',
    '{"speed": {"base_stat": 115}, "special-defense": {"base_stat": 65}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 60}, "attack": {"base_stat": 70}, "hp": {"base_stat": 65}}',
    '["Bruciapelo", "Fintoattacco", "Graffio", "Ruggito", "Gemmoforza", "Morso", "Provocazione", "Garanzia", "Sfuriate", "Stridio", "Lacerazione", "Congiura", "Carineria"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/ca/Sprnbm0053.gif", "shiny": "https://media.pokemoncentral.it/wiki/8/82/Sprnbmsh0053.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Golduck',
    '["Acqua"]',
    '{"speed": {"base_stat": 85}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 95}, "defense": {"base_stat": 78}, "attack": {"base_stat": 82}, "hp": {"base_stat": 80}}',
    '["Acquagetto", "Colpocoda", "Confusione", "Graffio", "Pistolacqua", "Sfuriate", "Idropulsar", "Inibitore", "Cozzata Zen", "Stridio", "Idrondata", "Inondazione", "Psicamisù", "Amnesia", "Idropompa", "Mirabolanza"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/5/56/Sprnbm0055.gif", "shiny": "https://media.pokemoncentral.it/wiki/9/99/Sprnbmsh0055.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Arcanine',
    '["Fuoco"]',
    '{"speed": {"base_stat": 95}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 80}, "attack": {"base_stat": 110}, "hp": {"base_stat": 90}}',
    '["Agilità", "Altruismo", "Boato", "Braciere", "Carineria", "Contropiede", "Fulmisguardo", "Fuococarica", "Gridodilotta", "Morso", "Nemesi", "Riduttore", "Rogodenti", "Ruotafuoco", "Sgranocchio", "Extrarapido", "Lanciafiamme"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/4/43/Sprnbm0059.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/39/Sprnbmsh0059.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Poliwrath',
    '["Acqua"]',
    '{"speed": {"base_stat": 70}, "special-defense": {"base_stat": 90}, "special-attack": {"base_stat": 70}, "defense": {"base_stat": 95}, "attack": {"base_stat": 95}, "hp": {"base_stat": 90}}',
    '["Bollaraggio", "Botta", "Colpodifango", "Corposcontro", "Dinamipugno", "Geoforza", "Idropompa", "Ipnosi", "Leggimente", "Panciamburo", "Pioggiadanza", "Pistolacqua", "Ribaltiro", "Sdoppiatore", "Sottomissione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c8/Sprnbm0062.gif", "shiny": "https://media.pokemoncentral.it/wiki/1/14/Sprnbmsh0062.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Alakazam',
    '["Psico"]',
    '{"speed": {"base_stat": 120}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 135}, "defense": {"base_stat": 45}, "attack": {"base_stat": 50}, "hp": {"base_stat": 55}}',
    '["Cinèsi", "Confusione", "Inibitore", "Teletrasporto", "Psicoraggio", "Riflesso", "Cambiaposto", "Psicotaglio", "Ripresa", "Psicoshock", "Psichico", "Divinazione", "Calmamente"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/3/3d/Sprnbm0065.gif", "shiny": "https://media.pokemoncentral.it/wiki/d/d3/Sprnbmsh0065.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Machamp',
    '["Lotta"]',
    '{"speed": {"base_stat": 55}, "special-defense": {"base_stat": 85}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 80}, "attack": {"base_stat": 130}, "hp": {"base_stat": 90}}',
    '["Bodyguard", "Colpo Basso", "Focalenergia", "Fulmisguardo", "Vendetta", "Calciobasso", "Visotruce", "Vitaltiro", "Forza", "Doppiocolpo", "Granfisico", "Movimento Sismico", "Dinamipugno", "Incrocolpo", "Sdoppiatore"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/e/e8/Sprnbm0068.gif", "shiny": "https://media.pokemoncentral.it/wiki/2/2b/Sprnbmsh0068.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Victreebel',
    '["Erba", "Veleno"]',
    '{"speed": {"base_stat": 70}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 65}, "attack": {"base_stat": 105}, "hp": {"base_stat": 80}}',
    '["Accumulo", "Acido", "Avvolgibotta", "Crescita", "Foglielama", "Frustata", "Introenergia", "Paralizzante", "Profumino", "Schianto", "Sfoghenergia", "Sonnifero", "Velenpolvere", "Velenpuntura", "Vorticerba", "Verdebufera", "Fendifoglia"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/1/1c/Sprnbm0071.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/62/Sprnbmsh0071.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Tentacruel',
    '["Acqua", "Veleno"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 120}, "special-attack": {"base_stat": 80}, "defense": {"base_stat": 65}, "attack": {"base_stat": 70}, "hp": {"base_stat": 80}}',
    '["Acido", "Avvolgibotta", "Pistolacqua", "Riflettipo", "Velenospina", "Supersuono", "Idropulsar", "Stridio", "Bollaraggio", "Sciagura", "Scudo Acido", "Velenpuntura", "Surf", "Fangonda", "Idropompa"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/3/31/Sprnbm0073.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/68/Sprnbmsh0073.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Golem',
    '["Roccia", "Terra"]',
    '{"speed": {"base_stat": 45}, "special-defense": {"base_stat": 65}, "special-attack": {"base_stat": 55}, "defense": {"base_stat": 130}, "attack": {"base_stat": 120}, "hp": {"base_stat": 80}}',
    '["Azione", "Lucidatura", "Ricciolscudo", "Terrempesta", "Rotolamento", "Rafforzatore", "Sassata", "Abbattimento", "Battiterra", "Autodistruzione", "Levitoroccia", "Cadutamassi", "Terremoto", "Esplosione", "Sdoppiatore", "Pietrataglio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/aa/Sprnbm0076.gif", "shiny": "https://media.pokemoncentral.it/wiki/4/4e/Sprnbmsh0076.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Rapidash',
    '["Fuoco"]',
    '{"speed": {"base_stat": 105}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 80}, "defense": {"base_stat": 70}, "attack": {"base_stat": 100}, "hp": {"base_stat": 65}}',
    '["Attacco Rapido", "Azione", "Braciere", "Colpocoda", "Megacorno", "Ruggito", "Sottilcorno", "Velenpuntura", "Nitrocaica", "Agilità", "Ruotafuoco", "Pestone", "Turbofuoco", "Riduttore", "Marchiatura", "Fuocobomba", "Fuococarica"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/5/53/Sprnbm0078.gif", "shiny": "https://media.pokemoncentral.it/wiki/4/43/Sprnbmsh0078.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Slowbro',
    '["Acqua", "Psico"]',
    '{"speed": {"base_stat": 30}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 110}, "attack": {"base_stat": 75}, "hp": {"base_stat": 95}}',
    '["Azione", "Divinazione", "Maledizione", "Pistolacqua", "Ritirata", "Ruggito", "Sbadiglio", "Confusione", "Inibitore", "Idropulsar", "Bottintesta", "Cozzata Zen", "Amnesia", "Surf", "Pigro", "Psichico", "Psicamisù", "Pioggiadanza", "Curapulsar"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/4/46/Sprnbm0080.gif", "shiny": "https://media.pokemoncentral.it/wiki/d/da/Sprnbmsh0080.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Farfetch''d',
    '["Normale", "Volante"]',
    '{"speed": {"base_stat": 60}, "special-defense": {"base_stat": 62}, "special-attack": {"base_stat": 58}, "defense": {"base_stat": 55}, "attack": {"base_stat": 90}, "hp": {"base_stat": 52}}',
    '["Beccata", "Turbosabbia", "Fulmisguardo", "Tagliofuria", "Taglio", "Aeroassalto", "Aerasoio", "Falsofinale", "Lacerazione", "Danzaspada", "Eterelama", "Fendifoglia", "Agilità", "Baldeali"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/e/e2/Sprnbm0083.gif", "shiny": "https://media.pokemoncentral.it/wiki/2/23/Sprnbmsh0083.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Dodrio',
    '["Normale", "Volante"]',
    '{"speed": {"base_stat": 110}, "special-defense": {"base_stat": 60}, "special-attack": {"base_stat": 60}, "defense": {"base_stat": 70}, "attack": {"base_stat": 110}, "hp": {"base_stat": 60}}',
    '["Attacco Rapido", "Beccata", "Ruggito", "Tripletta", "Fulmisguardo", "Furia", "Attacco d''Ala", "Doppiosmash", "Agilità", "Baraonda", "Acupressione", "Danzaspada", "Assalto", "Perforbecco", "Rimonta", "Colpo"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/86/Sprnbm0085.gif", "shiny": "https://media.pokemoncentral.it/wiki/5/50/Sprnbmsh0085.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Dewgong',
    '["Acqua", "Ghiaccio"]',
    '{"speed": {"base_stat": 70}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 70}, "defense": {"base_stat": 80}, "attack": {"base_stat": 70}, "hp": {"base_stat": 90}}',
    '["Bollaraggio", "Bottintesta", "Pistolacqua", "Purogelo", "Ruggito", "Ventogelato", "Ripeti", "Geloscheggia", "Riposo", "Acquanello", "Raggiaurora", "Acquagetto", "Acquadisale", "Riduttore", "Idrondata", "Geloraggio", "Salvaguardia"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/a5/Sprnbm0087.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/b2/Sprnbmsh0087.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Muk',
    '["Veleno"]',
    '{"speed": {"base_stat": 50}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 75}, "attack": {"base_stat": 105}, "hp": {"base_stat": 105}}',
    '["Botta", "Fangosberla", "Rafforzatore", "Velenogas", "Inibitore", "Fango", "Colpodifango", "Minimizzato", "Tossina", "Fangobomba", "Fangonda", "Stridio", "Sporcolancio", "Scudo Acido"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/3/3c/Sprnbm0089.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/bc/Sprnbmsh0089.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Cloyster',
    '["Acqua", "Ghiaccio"]',
    '{"speed": {"base_stat": 70}, "special-defense": {"base_stat": 45}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 180}, "attack": {"base_stat": 95}, "hp": {"base_stat": 50}}',
    '["Azione", "Ferroscudo", "Fielepunte", "Fulmisguardo", "Geloraggio", "Geloscheggia", "Gettaguscio", "Idropompa", "Mulinello", "Pistolacqua", "Protezione", "Raggiaurora", "Ritirata", "Scagliagelo", "Supersuono", "Gelolancia", "Conchilama"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/07/Sprnbm0091.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/c0/Sprnbmsh0091.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Gengar',
    '["Spettro", "Veleno"]',
    '{"speed": {"base_stat": 110}, "special-defense": {"base_stat": 75}, "special-attack": {"base_stat": 130}, "defense": {"base_stat": 60}, "attack": {"base_stat": 65}, "hp": {"base_stat": 60}}',
    '["Ipnosi", "Leccata", "Malosguardo", "Stordiraggio", "Ultimocanto", "Rivincita", "Dispetto", "Maledizione", "Sciagura", "Sbigoattacco", "Neropulsar", "Palla Ombra"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/6/66/Sprnbm0094.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/bd/Sprnbmsh0094.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Hypno',
    '["Psico"]',
    '{"speed": {"base_stat": 67}, "special-defense": {"base_stat": 115}, "special-attack": {"base_stat": 73}, "defense": {"base_stat": 70}, "attack": {"base_stat": 73}, "hp": {"base_stat": 85}}',
    '["Botta", "Confusione", "Inibitore", "Ipnosi", "Bottintesta", "Velenogas", "Psicoraggio", "Psicamisù", "Cozzata Zen", "Bullo", "Psichico", "Congiura", "Psicoshock", "Divinazione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/d/d0/Sprnbf0097.gif", "shiny": "https://media.pokemoncentral.it/wiki/a/aa/Sprnbfsh0097.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Kingler',
    '["Acqua"]',
    '{"speed": {"base_stat": 75}, "special-defense": {"base_stat": 50}, "special-attack": {"base_stat": 50}, "defense": {"base_stat": 115}, "attack": {"base_stat": 130}, "hp": {"base_stat": 55}}',
    '["Bodyguard", "Ferrartigli", "Fulmisguardo", "Martelpugno", "Pistolacqua", "Rafforzatore", "Colpodifango", "Protezione", "Bollaraggio", "Pestone", "Flagello", "Conchilama", "Schianto", "Danzaspada", "Martellata"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/9/9e/Sprnbm0099.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/3a/Sprnbmsh0099.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Electrode',
    '["Elettro"]',
    '{"speed": {"base_stat": 150}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 80}, "defense": {"base_stat": 70}, "attack": {"base_stat": 50}, "hp": {"base_stat": 60}}',
    '["Azione", "Elettromistero", "Tuonoshock", "Scintilla", "Rotolamento", "Stridio", "Raggioscossa", "Comete", "Energisfera", "Autodistruzione", "Schermoluce", "Scarica", "Esplosione", "Vortexpalla"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/b/b1/Sprnbm0101.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/34/Sprnbmsh0101.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Exeggutor',
    '["Erba", "Psico"]',
    '{"speed": {"base_stat": 55}, "special-defense": {"base_stat": 75}, "special-attack": {"base_stat": 125}, "defense": {"base_stat": 85}, "attack": {"base_stat": 95}, "hp": {"base_stat": 95}}',
    '["Assorbimento", "Baraonda", "Confusione", "Extrasenso", "Gigassorbimento", "Ipnosi", "Mazzuolegno", "Megassorbimento", "Parassiseme", "Pestone", "Psicoshock", "Riflesso", "Semebomba", "Semitraglia", "Sintesi", "Solarraggio", "Verdebufera"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/d/d1/Sprnbm0103.gif", "shiny": "https://media.pokemoncentral.it/wiki/e/ed/Sprnbmsh0103.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Marowak',
    '["Terra"]',
    '{"speed": {"base_stat": 45}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 50}, "defense": {"base_stat": 110}, "attack": {"base_stat": 80}, "hp": {"base_stat": 60}}',
    '["Colpocoda", "Falsofinale", "Fangosberla", "Ruggito", "Bottintesta", "Nemesi", "Ossoraffica", "Focalenergia", "Rimonta", "Ossomerang", "Colpo", "Sdoppiatore"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/a3/Sprnbm0105.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/32/Sprnbmsh0105.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Hitmonlee',
    '["Lotta"]',
    '{"speed": {"base_stat": 87}, "special-defense": {"base_stat": 110}, "special-attack": {"base_stat": 35}, "defense": {"base_stat": 53}, "attack": {"base_stat": 120}, "hp": {"base_stat": 50}}',
    '["Altruismo", "Azione", "Breccia", "Bruciapelo", "Calciobasso", "Fintoattacco", "Focalenergia", "Doppiocalcio", "Colpo Basso", "Resistenza", "Vendetta", "Bodyguard", "Calciardente", "Leggimente", "Megacalcio", "Zuffa", "Contropiede"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/aa/Sprnbm0106.gif", "shiny": "https://media.pokemoncentral.it/wiki/5/5b/Sprnbmsh0106.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Hitmonchan',
    '["Lotta"]',
    '{"speed": {"base_stat": 76}, "special-defense": {"base_stat": 110}, "special-attack": {"base_stat": 35}, "defense": {"base_stat": 79}, "attack": {"base_stat": 105}, "hp": {"base_stat": 50}}',
    '["Altruismo", "Assorbipugno", "Azione", "Bruciapelo", "Fintoattacco", "Focalenergia", "Pugnoscarica", "Vuotonda", "Pugnorapido", "Crescipugno", "Vendetta", "Anticipo", "Fuocopugno", "Gelopugno", "Tuonopugno", "Agilità", "Megapugno", "Zuffa"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/5/59/Sprnbm0107.gif", "shiny": "https://media.pokemoncentral.it/wiki/f/f6/Sprnbmsh0107.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Weezing',
    '["Veleno"]',
    '{"speed": {"base_stat": 60}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 120}, "attack": {"base_stat": 90}, "hp": {"base_stat": 65}}',
    '["Azione", "Doppiosmash", "Muro di Fumo", "Ondacalda", "Smog", "Velenogas", "Garanzia", "Fango", "Nube", "Autodistruzione", "Fangobomba", "Tossina", "Esplosione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/4/43/Sprnbm0110.gif", "shiny": "https://media.pokemoncentral.it/wiki/e/ef/Sprnbmsh0110.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Kangaskhan',
    '["Normale"]',
    '{"speed": {"base_stat": 90}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 40}, "defense": {"base_stat": 80}, "attack": {"base_stat": 95}, "hp": {"base_stat": 105}}',
    '["Botta", "Colpocoda", "Ruggito", "Bruciapelo", "Morso", "Pestone", "Focalenergia", "Bottintesta", "Sbigoattacco", "Doppiosmash", "Sgranocchio", "Resistenza", "Contropiede", "Oltraggio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/a/a9/Sprnbf0115.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/64/Sprnbfsh0115.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Seaking',
    '["Acqua"]',
    '{"speed": {"base_stat": 68}, "special-defense": {"base_stat": 80}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 65}, "attack": {"base_stat": 92}, "hp": {"base_stat": 80}}',
    '["Beccata", "Colpocoda", "Idropulsar", "Supersuono", "Incornata", "Agilità", "Acquanello", "Flagello", "Cascata", "Inondazione", "Megacorno", "Perforcorno"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/7/79/Sprnbm0119.gif", "shiny": "https://media.pokemoncentral.it/wiki/7/75/Sprnbmsh0119.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Starmie',
    '["Acqua"]',
    '{"speed": {"base_stat": 115}, "special-defense": {"base_stat": 85}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 85}, "attack": {"base_stat": 75}, "hp": {"base_stat": 60}}',
    '["Acquadisale", "Azione", "Comete", "Cosmoforza", "Gemmoforza", "Idropompa", "Minimizzato", "Pistolacqua", "Psichico", "Psicoraggio", "Rafforzatore", "Rapigiro", "Ripresa", "Schermoluce", "Stordiraggio", "Surf"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/3/32/Sprnbm0121.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/3b/Sprnbmsh0121.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Mr.mime',
    '["Psico", "Folletto"]',
    '{"speed": {"base_stat": 90}, "special-defense": {"base_stat": 120}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 65}, "attack": {"base_stat": 45}, "hp": {"base_stat": 40}}',
    '["Anticipo", "Barattoforza", "Barattoscudo", "Bodyguard", "Botta", "Copione", "Ripeti", "Staffetta", "Confusione", "Protezione", "Psicoraggio", "Mimica", "Riflesso", "Salvaguardia", "Schermoluce", "Sbigoattacco", "Magibrillio", "Psichico", "Strampadanza"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/b/bd/Sprnbm0122.gif", "shiny": "https://media.pokemoncentral.it/wiki/9/90/Sprnbmsh0122.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Jynx',
    '["Ghiaccio", "Psico"]',
    '{"speed": {"base_stat": 95}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 115}, "defense": {"base_stat": 35}, "attack": {"base_stat": 50}, "hp": {"base_stat": 65}}',
    '["Botta", "Copione", "Dolcebacio", "Leccata", "Polneve", "Confusione", "Canto", "Falselacrime", "Gelopugno", "Psichico", "Demonbacio", "Malosguardo", "Ultimocanto", "Bora"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/05/Sprnbf0124.gif", "shiny": "https://media.pokemoncentral.it/wiki/4/44/Sprnbfsh0124.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Pinsir',
    '["Coleottero"]',
    '{"speed": {"base_stat": 85}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 55}, "defense": {"base_stat": 100}, "attack": {"base_stat": 125}, "hp": {"base_stat": 65}}',
    '["Presa", "Rafforzatore", "Focalenergia", "Legatutto", "Movimento Sismico", "Tempestretta", "Doppiosmash", "Vitaltiro", "Forbice X", "Forza", "Danzaspada", "Sottomissione", "Troppoforte"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/4/43/Sprnbm0127.gif", "shiny": "https://media.pokemoncentral.it/wiki/d/db/Sprnbmsh0127.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Tauros',
    '["Normale"]',
    '{"speed": {"base_stat": 110}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 40}, "defense": {"base_stat": 95}, "attack": {"base_stat": 100}, "hp": {"base_stat": 75}}',
    '["Azione", "Colpocoda", "Cuordileone", "Rivincita", "Garanzia", "Incornata", "Visotruce", "Cozzata Zen", "Scatanatoro", "Riposo", "Bullo", "Sdoppiatore", "Gigaimpatto"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/8f/Sprnbm0128.gif", "shiny": "https://media.pokemoncentral.it/wiki/e/e6/Sprnbmsh0128.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Gyarados',
    '["Acqua", "Volante"]',
    '{"speed": {"base_stat": 81}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 60}, "defense": {"base_stat": 79}, "attack": {"base_stat": 125}, "hp": {"base_stat": 95}}',
    '["Azione", "Flagello", "Fulmisguardo", "Splash", "Tornado", "Morso", "Mulinello", "Gelodenti", "Acquadisale", "Visotruce", "Cascata", "Sgranocchio", "Pioggiadanza", "Idrondata", "Dragodanza", "Idropompa", "Tifone", "Colpo", "Iper Raggio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/7/7b/Sprnbm0130.gif", "shiny": "https://media.pokemoncentral.it/wiki/7/73/Sprnbmsh0130.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Lapras',
    '["Acqua", "Ghiaccio"]',
    '{"speed": {"base_stat": 60}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 85}, "defense": {"base_stat": 80}, "attack": {"base_stat": 85}, "hp": {"base_stat": 130}}',
    '["Pistolacqua", "Ruggito", "Canto", "Nebbia", "Goccia Vitale", "Geloscheggia", "Stordiraggio", "Idropulsar", "Acquadisale", "Corposcontro", "Geloraggio", "Pioggiadanza", "Idropompa", "Ultimocanto", "Purogelo"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/7/78/Sprnbm0131.gif", "shiny": "https://media.pokemoncentral.it/wiki/2/25/Sprnbmsh0131.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Ditto',
    '["Normale"]',
    '{"speed": {"base_stat": 48}, "special-defense": {"base_stat": 48}, "special-attack": {"base_stat": 48}, "defense": {"base_stat": 48}, "attack": {"base_stat": 48}, "hp": {"base_stat": 48}}',
    '["Trasformazione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/d/d4/Sprnbm0132.gif", "shiny": "https://media.pokemoncentral.it/wiki/0/01/Sprnbmsh0132.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Vaporeon',
    '["Acqua"]',
    '{"speed": {"base_stat": 65}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 110}, "defense": {"base_stat": 60}, "attack": {"base_stat": 65}, "hp": {"base_stat": 130}}',
    '["Altruismo", "Azione", "Colpocoda", "Comete", "Copione", "Fascino", "Morso", "Riduttore", "Ruggito", "Sdoppiatore", "Staffetta", "Pistolacqua", "Turbosabbia", "Attacco Rapido", "Occhioni Teneri", "Nube", "Idropulsar", "Raggiaurora", "Acquanello", "Fanghiglia", "Scudo Acido", "Idropompa"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/0e/Sprnbm0134.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/c6/Sprnbmsh0134.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Jolteon',
    '["Elettro"]',
    '{"speed": {"base_stat": 130}, "special-defense": {"base_stat": 95}, "special-attack": {"base_stat": 110}, "defense": {"base_stat": 60}, "attack": {"base_stat": 65}, "hp": {"base_stat": 65}}',
    '["Altruismo", "Azione", "Colpocoda", "Comete", "Copione", "Fascino", "Morso", "Riduttore", "Ruggito", "Sdoppiatore", "Staffetta", "Tuonoshock", "Turbosabbia", "Attacco Rapido", "Occhioni Teneri", "Tuononda", "Doppiocalcio", "Fulmindenti", "Missilspillo", "Scarica", "Agilità", "Tuono", "Ultimascelta"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/f/f1/Sprnbm0135.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/67/Sprnbmsh0135.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Flareon',
    '["Fuoco"]',
    '{"speed": {"base_stat": 65}, "special-defense": {"base_stat": 110}, "special-attack": {"base_stat": 95}, "defense": {"base_stat": 60}, "attack": {"base_stat": 130}, "hp": {"base_stat": 65}}',
    '["Altruismo", "Azione", "Colpocoda", "Comete", "Copione", "Fascino", "Morso", "Riduttore", "Ruggito", "Sdoppiatore", "Staffetta", "Braciere", "Turbosabbia", "Attacco Rapido", "Occhioni Teneri", "Smog", "Rogodenti", "Turbofuoco", "Lavasbuffo", "Visotruce", "Fuococarica", "Ultimascelta"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/e/e4/Sprnbm0136.gif", "shiny": "https://media.pokemoncentral.it/wiki/d/df/Sprnbmsh0136.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Omastar',
    '["Roccia", "Acqua"]',
    '{"speed": {"base_stat": 55}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 115}, "defense": {"base_stat": 125}, "attack": {"base_stat": 60}, "hp": {"base_stat": 70}}',
    '["Legatutto", "Ritirata", "Rotolamento", "Sgranocchio", "Turbosabbia", "Pistolacqua", "Fulmisguardo", "Colpodifango", "Forzantica", "Acquadisale", "Protezione", "Cadutamassi", "Surf", "Gettaguscio", "Idropompa"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/d/df/Sprnbm0139.gif", "shiny": "https://media.pokemoncentral.it/wiki/a/a8/Sprnbmsh0139.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Kabutops',
    '["Roccia", "Acqua"]',
    '{"speed": {"base_stat": 80}, "special-defense": {"base_stat": 70}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 105}, "attack": {"base_stat": 115}, "hp": {"base_stat": 60}}',
    '["Assorbimento", "Fintoattacco", "Graffio", "Lacerazione", "Nottesferza", "Rafforzatore", "Turbosabbia", "Acquagetto", "Fulmisguardo", "Colpodifango", "Forzantica", "Acquadisale", "Protezione", "Sanguisuga", "Idrobreccia", "Ferrostrido", "Pietrataglio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/6/69/Sprnbm0141.gif", "shiny": "https://media.pokemoncentral.it/wiki/7/7f/Sprnbmsh0141.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Aerodactyl',
    '["Roccia", "Volante"]',
    '{"speed": {"base_stat": 130}, "special-defense": {"base_stat": 75}, "special-attack": {"base_stat": 60}, "defense": {"base_stat": 65}, "attack": {"base_stat": 105}, "hp": {"base_stat": 80}}',
    '["Forzantica", "Morso", "Supersuono", "Attacco d''Ala", "Visotruce", "Frana", "Boato", "Sgranocchio", "Metaltestata", "Riduttore", "Pietrataglio", "Agilità", "Iper Raggio", "Gigaimpatto"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/b/b5/Sprnbm0142.gif", "shiny": "https://media.pokemoncentral.it/wiki/8/88/Sprnbmsh0142.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Snorlax',
    '["Normale"]',
    '{"speed": {"base_stat": 30}, "special-defense": {"base_stat": 110}, "special-attack": {"base_stat": 65}, "defense": {"base_stat": 65}, "attack": {"base_stat": 110}, "hp": {"base_stat": 160}}',
    '["Accumulo", "Azione", "Flagello", "Introenergia", "Leccata", "Ricciolscudo", "Stridio", "Sbadiglio", "Morso", "Riposo", "Sgranocchio", "Corposcontro", "Amnesia", "Forza Equina", "Martelpugno", "Gigaimpatto"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/08/Sprnbm0143.gif", "shiny": "https://media.pokemoncentral.it/wiki/9/90/Sprnbmsh0143.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Articuno',
    '["Ghiaccio", "Volante"]',
    '{"speed": {"base_stat": 85}, "special-defense": {"base_stat": 125}, "special-attack": {"base_stat": 95}, "defense": {"base_stat": 100}, "attack": {"base_stat": 85}, "hp": {"base_stat": 90}}',
    '["Nebbia", "Raffica", "Polneve", "Riflesso", "Geloscheggia", "Agilità", "Forzantica", "Ventoincoda", "Trespolo", "Geloraggio", "Tifone", "Nube", "Bora", "Purogelo"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/0/0a/Sprnbm0144.gif", "shiny": "https://media.pokemoncentral.it/wiki/3/32/Sprnbmsh0144.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Zapdos',
    '["Elettro", "Volante"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 90}, "special-attack": {"base_stat": 125}, "defense": {"base_stat": 85}, "attack": {"base_stat": 90}, "hp": {"base_stat": 90}}',
    '["Beccata", "Tuononda", "Tuonoshock", "Schermoluce", "Agilità", "Forzantica", "Perforbecco", "Trespolo", "Scarica", "Pioggiadanza", "Tuono", "Elettrocannone"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/1/16/Sprnbm0145.gif", "shiny": "https://media.pokemoncentral.it/wiki/9/9c/Sprnbmsh0145.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Moltres',
    '["Fuoco", "Volante"]',
    '{"speed": {"base_stat": 90}, "special-defense": {"base_stat": 85}, "special-attack": {"base_stat": 125}, "defense": {"base_stat": 90}, "attack": {"base_stat": 100}, "hp": {"base_stat": 90}}',
    '["Fulmisguardo", "Raffica", "Braciere", "Salvaguardia", "Attacco d''Ala", "Agilità", "Forzantica", "Eterelama", "Trespolo", "Ondacalda", "Tifone", "Resistenza", "Vampata", "Aeroattacco"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/8/88/Sprnbm0146.gif", "shiny": "https://media.pokemoncentral.it/wiki/6/63/Sprnbmsh0146.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Dragonite',
    '["Drago", "Volante"]',
    '{"speed": {"base_stat": 80}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 95}, "attack": {"base_stat": 134}, "hp": {"base_stat": 91}}',
    '["Attacco d''Ala", "Avvolgibotta", "Extrarapido", "Fulmisguardo", "Fuocopugno", "Tornado", "Trespolo", "Tuononda", "Tuonopugno", "Tifone", "Agilità", "Schianto", "Idrondata", "Dragofuria", "Oltraggio", "Salvaguardia", "Pioggiadanza", "Dragodanza", "Iper Raggio"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/c/c6/Sprnbm0149.gif", "shiny": "https://media.pokemoncentral.it/wiki/f/f8/Sprnbmsh0149.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Mewtwo',
    '["Psico"]',
    '{"speed": {"base_stat": 130}, "special-defense": {"base_stat": 90}, "special-attack": {"base_stat": 154}, "defense": {"base_stat": 90}, "attack": {"base_stat": 110}, "hp": {"base_stat": 106}}',
    '["Comete", "Confusione", "Inibitore", "Forzantica", "Psicoraggio", "Salvaguardia", "Amnesia", "Psichico", "Barattoforza", "Barattoscudo", "Nebbia", "Ripresa", "Divinazione"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/d/db/Sprnbm0150.gif", "shiny": "https://media.pokemoncentral.it/wiki/b/b8/Sprnbmsh0150.gif"}'
  );

insert into
  "Pokemon_Base" ("nome", "tipi", "statistiche", "mosse", "sprite")
values
  (
    'Mew',
    '["Psico"]',
    '{"speed": {"base_stat": 100}, "special-defense": {"base_stat": 100}, "special-attack": {"base_stat": 100}, "defense": {"base_stat": 100}, "attack": {"base_stat": 100}, "hp": {"base_stat": 100}}',
    '["Botta", "Riflettipo", "Amnesia", "Staffetta", "Forzantica", "Goccia Vitale", "Congiura", "Esclusiva", "Trasformazione", "Psichico"]',
    '{"normal": "https://media.pokemoncentral.it/wiki/e/e2/Sprnbm0151.gif", "shiny": "https://media.pokemoncentral.it/wiki/c/c2/Sprnbmsh0151.gif"}'
  );