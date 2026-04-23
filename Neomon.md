# Documentazione del Sistema Informativo: Neomon

> **Documentazione Tecnica** > **Versione:** 1.0.0  
> **Stato:** Bozza  
> **Ultimo aggiornamento:** 2026-03-26  
> **Autore/i:** Alessio Grasso e Ahmed Dere Omar

---

# Indice

1. [Abstract](#1-abstract)
2. [Introduzione](#2-introduzione)
3. [Panoramica del Sistema](#3-panoramica-del-sistema)
4. [Data Flow Diagram (DFD)](#4-data-flow-diagram-dfd)
5. [Requisiti di Sistema](#5-requisiti-of-sistema)
6. [Schema Entità-Relazione (E/R)](#6-schema-entità-relazione-er)
7. [Struttura dell’Interfaccia (Markup)](#7-struttura-dellinterfaccia-markup)
8. [Strategia di Test](#8-strategia-di-test)
9. [Evoluzioni Future](#9-evoluzioni-future)
10. [Glossario](#10-glossario)

---

# 1. Abstract

Il progetto è una WEB-APP stile gioco di ruolo ispirato a Pokémon introducendo il multiplayer in tempo reale, permettendo agli utenti di interagire in una Lobby 2D condivisa. Il sistema gestisce sfide tra i giocatori sincronizzate e una modalità contro il computer.

---

# 2. Introduzione

L'idea di Neomon nasce dalla volontà di ricreare l'esperienza dei classici Pokémon in una nuova veste online. Il progetto si evolve da una nostra precedente versione sviluppata in Python, che risultava troppo macchinosa nell'avvio; abbiamo quindi optato per una Web-App per garantire un accesso immediato da browser.
Il sistema introduce la possibilità di vedere gli altri giocatori sulla mappa in tempo reale e sfidarli istantaneamente. Oltre al multiplayer, la modalità contro il computer permette di testare tattiche e fare esperienza, preparando il giocatore alle sfide più impegnative contro i propri amici.

---

# 3. Panoramica del Sistema

## 3.1 Architettura Generale

Il sistema Neomon è progettato come una Web-App distribuita basata su un'architettura Client-Server con comunicazione bidirezionale in tempo reale.
* **Frontend:** Sviluppato con tecnologie web standard (HTML5, CSS3, JavaScript) e framework per il gaming 2D (Phaser.js), garantendo una natura Responsive per l'accesso da PC, tablet e smartphone.
* **Backend:** Un server centrale gestisce la logica di business, l'invio dei dati tramite API REST e la sincronizzazione della Lobby 2D.
* **Comunicazione Real-time:** Per la gestione del multiplayer e dei movimenti nella mappa condivisa, il sistema utilizza il protocollo WebSocket, riducendo la latenza rispetto alle tradizionali chiamate HTTP.
* **Accesso ai Dati:** Il sistema interagisce con un database relazionale per la persistenza dei profili utente e l’esperienza di gioco come il recupero di pokémon, mosse, tipi è integrata in modo statica nel backend.

## 3.2 Stack Tecnologico

| Livello | Tecnologia |
|----------|-----------|
| Frontend | HTML, CSS, JavaScript, Phaser.js (Motore grafico 2D) |
| Backend | Node.js |
| Database | POSTGRESQL (Relazionale) |
| Autenticazione | JWT (JSON Web Token) |
| Infrastruttura | Hosting Cloud (Render) |

---

# 4. Data Flow Diagram (DFD)

Il Data Flow Diagram illustra come i dati fluiscono tra l'utente, i processi logici ospitati su Render e la persistenza dei dati su Supabase (PostgreSQL).

## 4.1 Diagramma di Contesto (Livello 0)

Il Livello 0 definisce i confini del sistema e le interazioni con l'utente esterno.

* **Entità Esterne:**
    * **Giocatore:** Interagisce con il client (Netlify) inviando credenziali, comandi di movimento, messaggi in chat e scelte tattiche. Riceve lo stato aggiornato del mondo, i messaggi degli altri utenti e il feedback visivo delle battaglie.
* **Processo Principale:**
    * **0.0 Sistema Gestionale Neomon:** L'intera infrastruttura (Netlify + Render + Supabase) che elabora le richieste e mantiene la coerenza del gioco.
* **Archivi Dati (Data Store):**
    * **Database Relazionale (Supabase/PostgreSQL):** Archivio centrale per utenti, Pokémon dell'utente e stati della squadra.

---

<img width="945" height="650" alt="Screenshot 2026-04-22 221142" src="https://github.com/user-attachments/assets/7d094d98-24b5-433c-bd6a-70989a4c2b89" />


## 4.2 DFD Livello 1 (Esplosione dei Processi)

Il sistema viene suddiviso in processi logici che riflettono l'architettura relazionale e le funzionalità di gioco.

| ID Processo | Nome Processo | Descrizione |
| :--- | :--- | :--- |
| **1.0** | **Gestione Accessi e Profili** | Gestisce la registrazione e il login. Interroga Supabase Auth e le tabelle dei profili per caricare le statistiche e l'avatar del giocatore. |
| **2.0** | **Sincronizzazione Mondiale e Chat** | Gestisce i flussi Socket.io su Render. Smista le coordinate di movimento tra i client e gestisce lo scambio di messaggi testuali nella chat globale/privata. |
| **3.0** | **Logica di Combattimento (PvP/PvE)** | Riceve le scelte delle mosse o il cambio Pokémon. Calcola i danni e gli effetti di stato tramite le relazioni tra mosse e tipi memorizzate nel DB PostgreSQL. Gestisce l'IA per le sfide contro i Bot. |
| **4.0** | **Gestione Ecosistema (Erba/NPC)** | Gestisce l'ingresso nell'erba alta e l'interazione con NPC. Genera incontri casuali e gestisce la logica di cattura o sconfitta dei Pokémon selvatici. |
| **5.0** | **Gestione PC e Squadra** | Permette l'apertura del PC Pokémon. Gestisce lo spostamento dei Pokémon tra il database dei "Box" e la tabella della "Squadra Attiva" (Party) del giocatore. |
| **6.0** | **Persistenza e Salvataggio** | Processo di scrittura che aggiorna su PostgreSQL il progresso del giocatore, i Pokémon catturati. |

---

## 4.3 Flusso dei Dati per le Funzionalità Chiave
-Utente non loggato
-Utente Loggato
### Percorso del Giocatore non Loggato
1.  **Input:** Il Giocatore inserisce i dati nel form su **Netlify**.
2.  **Processo 1.0:** Invia le credenziali a **Supabase**.
3.  **Risposta:** Il database valida la relazione e restituisce il profilo, sbloccando l'accesso alla Lobby.

### Percorso del Giocatore Loggato (Lobby, Gestione e PvE)
1.  **Input (Lobby Base):** Il giocatore accede alla Lobby, dove può visualizzare il profilo, chattare con altri utenti e decidere la modalità di gioco (PvP online o PvE).
2.  **Processo (Gestione Squadra):** Il giocatore apre il PC Pokémon per esplorare i box e scegliere i Pokémon da mettere in squadra, aggiornando la formazione attiva.
3.  **Interazione (Esplorazione PvE):** Entrando in modalità PvE, il giocatore accede alle aree d'erba dove può incontrare, catturare o sconfiggere Pokémon selvatici, oppure sfidare dei bot. Durante la lotta gestisce le mosse o il cambio Pokémon.
4.  **Chiusura (Salvataggio):** Il sistema salva il progresso dell'avventura PvE (team, catture, XP) sul database.

### Percorso di Battaglia Online (PvP)
1.  **Input:** Due giocatori inviano il comando di "Sfida".
2.  **Processo 2.0:** Crea una stanza virtuale su **Render** e sincronizza i due client.
3.  **Interazione:** I giocatori scelgono mosse o cambiano Pokémon (invio ID a **P3.0**).
4.  **Processo 3.0:** Elabora l'ordine di velocità e i danni, aggiornando temporaneamente lo stato degli HP.
5.  **Chiusura:** A fine match, **P6.0** salva l'esito (vittoria/sconfitta) e l'esperienza guadagnata su **PostgreSQL**.
---

# 5. Requisiti di Sistema

## 5.1 Requisiti Funzionali

| ID | Descrizione del Requisito | Priorità |
|---|---|---|
| RF-01 | Gestione Account: Registrazione e login con dati salvati in POSTGRESQL. | Alta |
| RF-02 | Lobby 2D Real-time: Movimento sincronizzato via WebSocket. | Alta |
| RF-03 | Sistema di Lotta: Gestione turni e calcoli basati su DB. | Alta |
| RF-04 | Modalità Offline: Combattimenti contro bot con struttura roguelike. | Alta |
| RF-05 | Integrazione Asset: Caricamento dinamico delle animazioni. | Alta |
| RF-06 | Ranking Skill: Aggiornamento automatico dello status vittoria/sconfitta. | Media |
| RF-07 | Personalizzazione: Scelta e salvataggio dello sprite del personaggio. | Bassa |

## 5.2 Requisiti Non Funzionali

* **Latenza:** Movimenti nella Lobby 2D (target < 100ms).
* **Sicurezza:** Password in POSTGRESQL criptate tramite hashing; sessioni via JWT.
* **Scalabilità:** Supporto per almeno 20 utenti contemporanei per istanza.
* **Usabilità:** Design Responsive per adattarsi a PC, Tablet e Smartphone.

## 5.3 Requisiti Hardware (Minimi)

| Componente | Lato Client (Giocatore) | Lato Server (Hosting) |
|---|---|---|
| CPU | Dual-core 2.0 GHz | Shared CPU (Tier gratuito Render) |
| RAM | 4 GB | 512 MB - 1 GB |
| Storage | 200 MB (Cache browser) | 1 GB (Logica e Asset) |

## 5.4 Requisiti Software

| Componente | Versione / Tipo |
|---|---|
| Sistema Operativo | Agnostico (Linux, Windows, Android, iOS) |
| Database | POSTGRESQL e MongoDB |
| Runtime Backend | Node.js v18+ |
| Motore Grafico | Phaser.js |
| Browser | Chrome, Firefox, Safari (supporto WebGL) |

---

# 6. Schema Entità-Relazione (E/R)

L'architettura dei dati separa la gestione degli utenti, dei progressi e delle sessioni (salvati in un database relazionale PostgreSQL tramite Supabase) dai dati statici e strutturali del gioco (gestiti tramite file JSON locali caricati a runtime dal server).

<img width="884" height="581" alt="Screenshot 2026-04-23 174619" src="https://github.com/user-attachments/assets/fe8f5ddb-9f5d-4b12-b6a6-165dad684c14" />

## 6.1 Entità

| Entità | Descrizione | Archiviazione |
| :--- | :--- | :--- |
| **UTENTE** | Credenziali d'accesso, hash della password e data di registrazione. | PostgreSQL |
| **PROFILO** | Progressi, coordinate mappa, contatori vittorie/partite e avatar dell'utente. | PostgreSQL |
| **PARTITA** | Log della singola sessione di gioco (PvP o PvE). | PostgreSQL |
| **POKEMON** | Istanza dinamica ed esclusiva catturata dal giocatore. | PostgreSQL |

## 6.2 Relazioni

| Relazione | Entità Coinvolte | Cardinalità | Descrizione |
| :--- | :--- | :--- | :--- |
| **Possiede** | UTENTE - PROFILO | **1 : 1** | Ogni utente registrato ha un solo profilo. Quando l'utente viene eliminato, il profilo (e i suoi Pokémon) si eliminano a cascata. |
| **Gioca** | PROFILO - PARTITA | **N : M** | In PvP, due profili partecipano alla stessa partita. Questa tabella contiene l'attributo `Esito` (Vittoria, Sconfitta, Abbandono). |
| **Cattura / Ha** | PROFILO - POKEMON | **1 : N** | Un profilo è proprietario di molteplici Pokémon tramite la Foreign Key `ID_Profilo_Proprietario`. |
| **Partecipa** | PARTITA - POKEMON | **N : M** | Registra quali esemplari specifici sono scesi fisicamente in campo durante quella lotta (utile per statistiche ed EXP). |

---
# 7. Struttura dell’Interfaccia (Markup)

*(Da completare nelle versioni future)*

## 7.1 Struttura delle Pagine

| Pagina | Descrizione | Livello di Accesso |
|--------|------------|-------------------|
| | | |

## 7.2 Componenti Principali

- Navigazione  
- Form  
- Tabelle dati  
- Dashboard  
- Notifiche  

---

# 8. Strategia di Test

## 8.1 Approccio ai Test

- Test Unitari  
- Test di Integrazione  
- Test di Sistema  
- Test di Accettazione Utente (UAT)  

---

## 8.2 Casi di Test

| ID Test | Descrizione | Input | Output Atteso | Stato |
|---------|------------|-------|--------------|--------|
| TC-01 | | | | |

---

## 8.3 Tracciamento Difetti

| ID Issue | Descrizione | Gravità | Stato |
|----------|------------|----------|--------|
| | | | |

---

# 9. Evoluzioni Future

- Miglioramenti pianificati  
- Refactoring architetturale  
- Ottimizzazione delle performance  
- Estensione funzionalità  

---

# 10. Glossario

| Termine | Definizione |
|----------|------------|
| | |

---
