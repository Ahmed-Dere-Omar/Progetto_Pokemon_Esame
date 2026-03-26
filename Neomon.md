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
* **Accesso ai Dati:** Il sistema interagisce con un database relazionale per la persistenza dei profili utente e utilizza invece database non relazionale per l’esperienza di gioco quindi il recupero di pokémon, mosse, tipi ecc.

## 3.2 Stack Tecnologico

| Livello | Tecnologia |
|----------|-----------|
| Frontend | HTML, CSS, JavaScript, Phaser.js (Motore grafico 2D) |
| Backend | Node.js / Python |
| Database | MySQL (Relazionale) e mongoDB (Non relazionale) |
| Autenticazione | JWT (JSON Web Token) |
| Infrastruttura | Hosting Cloud (Render) |

---

# 4. Data Flow Diagram (DFD)

## 4.1 Diagramma di Contesto (Livello 0)

* **Entità esterne:**
  * **Giocatore:** Invia credenziali, comandi di movimento nella lobby e scelte tattiche durante i combattimenti. Riceve lo stato del mondo di gioco, le animazioni di lotta e l'aggiornamento del proprio profilo.
* **Processo principale:** Sistema Informativo Neomon (Web-App).
* **Flussi di dati primari:**
  * **Input:** Richieste di login, coordinate di movimento 2D, selezione mosse.
  * **Output:** Visualizzazione sincronizzata dei player, feedback visivo delle battaglie, statistiche aggiornate.
 
<img width="3215" height="8192" alt="Neomon Game" src="https://github.com/user-attachments/assets/ba58d783-6a11-4d78-9a2a-dfd5e318c134" />

## 4.2 DFD Livello 1

| ID Processo | Nome Processo | Descrizione |
|------------|--------------|------------|
| P1 | Gestione Profili | Gestisce l'accesso (MySQL). Legge/Scrive dati utente e livello skill. |
| P2 | Sincronizzazione Real-time | Gestisce i WebSocket per smistare le posizioni tra i client. |
| P3 | Logica di Combattimento | Gestisce i turni PvP/PvE recuperando dati da MongoDB. |
| P4 | Motore Roguelike/Bot | Gestisce la modalità offline endless basata sui dati MongoDB. |

**Flusso tra Processi e Archivi Dati:**
Dall'Utente a P1/P2: Il giocatore si autentica (P1) e inizia a muoversi nella mappa (P2). Quando inizia una lotta, P3 interroga l'archivio MongoDB per ottenere i documenti relativi a mosse e statistiche. Al termine del combattimento, il risultato viene inviato a P1 per aggiornare il campo "Livello" in MySQL. Il frontend riceve i dati da MongoDB per mappare le animazioni corrette durante lo scontro.

---

# 5. Requisiti di Sistema

## 5.1 Requisiti Funzionali

| ID | Descrizione del Requisito | Priorità |
|---|---|---|
| RF-01 | Gestione Account: Registrazione e login con dati salvati in MySQL. | Alta |
| RF-02 | Lobby 2D Real-time: Movimento sincronizzato via WebSocket. | Alta |
| RF-03 | Sistema di Lotta: Gestione turni e calcoli basati su MongoDB. | Alta |
| RF-04 | Modalità Offline: Combattimenti contro bot con struttura roguelike. | Alta |
| RF-05 | Integrazione Asset: Caricamento dinamico delle animazioni. | Alta |
| RF-06 | Ranking Skill: Aggiornamento automatico dello status vittoria/sconfitta. | Media |
| RF-07 | Personalizzazione: Scelta e salvataggio dello sprite del personaggio. | Bassa |

## 5.2 Requisiti Non Funzionali

* **Latenza:** Movimenti nella Lobby 2D (target < 100ms).
* **Sicurezza:** Password in MySQL criptate tramite hashing; sessioni via JWT.
* **Scalabilità:** Supporto per almeno 50 utenti contemporanei per istanza.
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
| Database | MySQL e MongoDB |
| Runtime Backend | Node.js v18+ o Python 3.10+ |
| Motore Grafico | Phaser.js |
| Browser | Chrome, Firefox, Safari (supporto WebGL) |

---

# 6. Schema Entità-Relazione (E/R)

L'architettura dei dati separa la gestione degli utenti e delle sessioni (MySQL) dai dati statici e strutturali del gioco (MongoDB).

![Schema E/R Neomon](https://github.com/user-attachments/assets/959af4c0-7190-4938-822e-9000e16e9e2a)

## 6.1 Entità

| Entità | Descrizione | DB |
| :--- | :--- | :--- |
| **UTENTE** | Credenziali d'accesso e dati anagrafici del giocatore. | MySQL |
| **PROFILO** | Progressi, statistiche globali e personalizzazioni dell'utente. | MySQL |
| **PARTITA** | Sessione specifica di gioco (PvP o PvE). | MySQL |
| **POKEMON_ESTRATTO** | Istanza dinamica di un Neomon durante una specifica partita. | MySQL |
| **SPECIE_POKEMON** | Dati strutturali del Neomon (statistiche base, nome, ID asset). | MongoDB |
| **MOSSA** | Descrizione tecnica delle abilità (danno, precisione, tipo). | MongoDB |
| **TIPO_ELEMENTALE** | Definizione degli elementi (Fuoco, Acqua, ecc.) e relative tabelle efficacia. | MongoDB |

## 6.2 Relazioni

| Relazione | Entità Coinvolte | Cardinalità | Descrizione |
| :--- | :--- | :--- | :--- |
| **Possiede** | UTENTE - PROFILO | **1 : 1** | Ogni utente ha un profilo univoco. |
| **Gioca** | PROFILO - PARTITA | **1 : N** | Un profilo può avviare molteplici partite nel tempo. |
| **Comprende** | PARTITA - POKEMON_ESTRATTO | **1 : N** | Una partita coinvolge più istanze di Neomon. |
| **Istanza di** | POKEMON_ESTRATTO - SPECIE_POKEMON | **N : 1** | Più mostri in campo appartengono alla stessa specie del catalogo. |
| **Può usare** | SPECIE_POKEMON - MOSSA | **N : M** | Una specie può imparare più mosse; una mossa può appartenere a più specie. |
| **Definisce** | SPECIE_POKEMON - TIPO_ELEMENTALE | **N : 1 o 2** | Ogni specie è caratterizzata da uno o due tipi. |
| **Definisce** | MOSSA - TIPO_ELEMENTALE | **N : 1** | Ogni mossa appartiene a un solo tipo elementale. |

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
