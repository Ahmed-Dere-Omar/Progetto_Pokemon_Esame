# Documentazione del Sistema Informativo


> Documentazione Tecnica  
> Versione: 1.0.0  
> Stato: Bozza  
> Ultimo aggiornamento: 2026-03-26  
> Autore/i: Dere Omar Ahmed  


---


# Indice


1. [Abstract](#1-abstract)
2. [Introduzione](#2-introduzione)
3. [Panoramica del Sistema](#3-panoramica-del-sistema)
4. [Data Flow Diagram (DFD)](#4-data-flow-diagram-dfd)
5. [Requisiti di Sistema](#5-requisiti-di-sistema)
6. [Schema Entità-Relazione (E/R)](#6-schema-entità-relazione-er)
7. [Struttura dell’Interfaccia (Markup)](#7-struttura-dellinterfaccia-markup)
8. [Strategia di Test](#8-strategia-di-test)
9. [Evoluzioni Future](#9-evoluzioni-future)
10. [Glossario](#10-glossario)
---


# 1. Abstract


Sviluppo di un Sistema Informativo Ospedaliero modulare per la digitalizzazione delle cartelle cliniche e la gestione centralizzata delle prenotazioni. Il sistema risolve i problemi di sovrapposizione degli appuntamenti e garantisce ai medici un accesso remoto e sicuro ai dati dei pazienti, ottimizzando le risorse della struttura.


---


# 2. Introduzione


Il progetto nasce dalla necessità del Direttore Sanitario, Dr. Martinelli, di dotare il nuovo Ospedale San Leonardo di un'infrastruttura informatica moderna in vista della sua apertura tra 6 mesi. La struttura ospiterà 150 posti letto e 20 medici, e richiede un sistema in grado di ottimizzare le risorse ed eliminare i "buchi" e i doppioni nelle agende mediche. 


A causa di vincoli stringenti di budget (80.000 €) e di tempo, il sistema verrà rilasciato tramite un approccio incrementale (Fase 1). L'obiettivo primario è informatizzare almeno i primi 4 reparti essenziali, implementando la Cartella Clinica Elettronica (CCE), la gestione standardizzata delle immagini radiografiche (DICOM) e un portale di accesso sicuro per i medici, anche da remoto. Funzionalità accessorie come l'Intelligenza Artificiale, l'App mobile per i pazienti e l'integrazione con l'Agenzia delle Entrate sono state posticipate a rilasci futuri per garantire la messa a regime nei tempi stabiliti.


---


# 3. Panoramica del Sistema


## 3.1 Architettura Generale


Il sistema si basa su un'architettura Web-based (Client-Server) progettata a moduli per garantire la scalabilità futura. Per ridurre i costi di infrastruttura hardware in sede e consentire l'accesso remoto ai medici in totale sicurezza, si adotterà una soluzione in Cloud (es. server virtuali in un data center certificato ISO/IEC 27001 e conforme al GDPR per i dati sanitari). 


Il backend esporrà delle API RESTful per far comunicare in modo sicuro il database centrale con il frontend web utilizzato nei reparti e per preparare il terreno a future integrazioni (es. App Mobile). L'accesso esterno per il personale medico sarà protetto tramite VPN aziendale e autenticazione a due fattori (2FA).


---


## 3.2 Stack Tecnologico


| Livello | Tecnologia |
|----------|-----------|
| **Frontend** | React.js (per un'interfaccia utente reattiva e veloce in reparto) |
| **Backend** | Node.js con framework Express (o Java Spring Boot per alta affidabilità) |
| **Database** | PostgreSQL (relazionale, robusto per dati transazionali) |
| **Autenticazione** | JSON Web Tokens (JWT) + Autenticazione a Due Fattori (2FA) |
| **Infrastruttura** | Cloud Provider certificato (es. AWS EU, Azure) con container Docker |


---


# 4. Data Flow Diagram (DFD)


## 4.1 Diagramma di Contesto (Livello 0)


- **Entità esterne:** Paziente, Medici
- **Processo principale del sistema:** Sistema Informativo Ospedaliero (SIO) - P0.
- **Flussi di dati primari:** - Il Paziente fornisce i dati della Ricetta per effettuare una prenotazione e invia i dati per il Pagamento.
  - I Medici inviano le informazioni necessarie all'aggiornamento dei dati clinici.
  - Il sistema inoltra i dati contabili all'Amministrazione, che a sua volta li trasmette all'Agenzia delle Entrate.

---

<img width="981" height="714" alt="Screenshot 2026-03-26 174809" src="https://github.com/user-attachments/assets/6d1fe77e-4493-49d7-afe7-5b9a99e2082e" />

## 4.2 DFD Livello 1

| ID Processo | Nome Processo | Descrizione |
|---|---|---|
| **P1** | Aggiornamento Dati | Riceve le informazioni in input dai medici per aggiornare e popolare la cartella clinica del paziente. |
| **P2** | Prenotazione | Riceve e verifica la ricetta fornita dal paziente, genera l'appuntamento e invia i dati sia alla cartella clinica che al database. |
| **P3** | Pagamento | Gestisce le transazioni in entrata dal paziente e veicola le informazioni verso i sistemi amministrativi e fiscali. |

**Flusso Operativo:** I dati si originano principalmente da due entità: **Paziente** e **Medici**. 
Il Paziente avvia due flussi separati: fornisce la *Ricetta* che innesca il processo di *Prenotazione* (il quale aggiorna la *Cartella Clinica* e salva le informazioni nel *Database* centrale) ed effettua il *Pagamento*, che viene registrato dall'*Amministrazione* e successivamente comunicato all'*Agenzia delle Entrate*. 
In parallelo, i Medici avviano il processo di *Aggiornamento Dati*, che va a confluire direttamente nella *Cartella Clinica*. Infine, tutti i dati sanitari strutturati passano dalla *Cartella Clinica* al *Database* per l'archiviazione definitiva.

---


# 5. Requisiti di Sistema


## 5.1 Requisiti Funzionali


I requisiti funzionali descrivono ciò che il sistema deve fare.


| ID | Descrizione del Requisito | Priorità |
|---|---|---|
| **RF-01** | Il sistema deve fornire una Cartella Clinica Elettronica (CCE) aggiornata in tempo reale per tutti i medici. | Alta |
| **RF-02** | Il sistema deve gestire le agende dei medici bloccando automaticamente sovrapposizioni e doppioni. | Alta |
| **RF-03** | Il sistema deve permettere l'archiviazione e la visualizzazione di file radiografici di formati diversi (convertiti in standard DICOM). | Alta |
| **RF-04** | Il sistema deve consentire l'accesso sicuro da remoto per il personale medico. | Alta |
| **RF-05** | Il sistema deve permettere ai pazienti di utilizzare il codice della ricetta medica per l'accettazione e la prenotazione. | Media |
| **RF-06** | Il sistema deve monitorare i tempi di richiesta dei macchinari per ottimizzare i costi di immagazzinamento. | Media |


---


## 5.2 Requisiti Non Funzionali


I requisiti non funzionali definiscono attributi di qualità.


### Prestazioni
- **Tempo massimo di risposta:** < 2 secondi per il caricamento anagrafiche, < 5 secondi per immagini diagnostiche pesanti.
- **Numero di utenti concorrenti supportati:** Almeno 50 utenti simultanei (20 medici + personale amministrativo + pazienti connessi).
- **Throughput:** Elevata capacità transazionale nel database per garantire aggiornamenti "in tempo reale" delle agende.


### Sicurezza
- **Metodo di autenticazione:** Password forte + MFA (Multi-Factor Authentication) obbligatoria per gli accessi esterni.
- **Modello di autorizzazione:** RBAC (Role-Based Access Control) per separare i permessi in base al ruolo (Medico, CUP, Admin).
- **Crittografia dei dati:** AES-256 per i dati salvati (data at rest) e TLS 1.3 per i dati in transito (data in transit).
- **Logging e audit:** Tracciamento rigoroso, inalterabile e cronologico di ogni accesso o modifica a una cartella clinica (conformità GDPR).


### Affidabilità
- **Strategia di backup:** Backup incrementale giornaliero e completo settimanale, conservati in un server geograficamente separato (Disaster Recovery).
- **RTO (Recovery Time Objective):** Massimo 4 ore per ripristinare la piena operatività in caso di blocco totale.
- **RPO (Recovery Point Objective):** Massimo 1 ora (perdita massima di dati tollerata equivalente a 1 ora lavorativa).
- **Disponibilità:** Operatività garantita 24 ore su 24, 7 giorni su 7.


### Scalabilità
- **Scalabilità orizzontale:** Architettura predisposta all'aggiunta di nuovi nodi server all'aumentare del carico (dal passaggio dai 4 reparti iniziali a tutto l'ospedale).
- **Scalabilità verticale:** Database strutturato fin da subito per supportare l'aumento massivo di record storici e immagini mediche negli anni.


### Usabilità
- **Conformità accessibilità:** Interfacce chiare e ad alto contrasto (WCAG 2.1 AA) per un utilizzo rapido nei monitor in corsia.
- **Browser supportati:** Ultime versioni di Chrome, Edge, Firefox e Safari.
- **Responsive design:** Layout fluido e adattabile, fondamentale per l'utilizzo tramite tablet durante le visite in reparto.


---


## 5.3 Requisiti Hardware


*(Infrastruttura Cloud stimata per la Fase 1 - 4 Reparti)*


| Componente | Requisito Minimo |
|---|---|
| **CPU** | 8 vCPU (Server Applicativo) + 8 vCPU (Database Server) |
| **RAM** | 16 GB (Server Applicativo) + 32 GB (Database Server dedicato a transazioni veloci) |
| **Storage** | 500 GB SSD NVMe (Sistema e Database) + 2 TB Block Storage (Archivio immagini radiografiche) |


---


## 5.4 Requisiti Software


| Componente | Versione |
|---|---|
| **Sistema Operativo** | Ubuntu Server 22.04 LTS (o distribuzione Linux Enterprise equivalente) |


---


# 6. Schema Entità-Relazione (E/R)


*(Da completare nelle versioni future)*


## 6.1 Entità


| Entità | Descrizione |
|--------|------------|
| | |


## 6.2 Relazioni


| Relazione | Entità Coinvolte | Cardinalità |
|-----------|-----------------|-------------|
| | | |


Inserire il diagramma E/R qui.


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





