class Effetti {
    
    static verificaCondizione(Condizione, target, utente) {
        // Metodo di placeholder per verificare le logiche custom se fornite nel motore.
        return true;
    }

    static ModificaStatistica({ Gradi, Bersaglio, Statistica, Probabilita = 100, Condizione = null, Turno = null, Utente }) {
        // Applica o rimuove gradi alle statistiche del bersaglio fino a un massimo di +/-6.
        if (Math.random() * 100 > Probabilita) return false;
        
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio; 
        if (!target) return false;
        if (Condizione && !this.verificaCondizione(Condizione, target, Utente)) return false;

        target.modificatori = target.modificatori || {};
        let statKey = Statistica.toLowerCase();
        let statAttuale = target.modificatori[statKey] || 0;
        if ((Gradi > 0 && statAttuale >= 6) || (Gradi < 0 && statAttuale <= -6)) {
            return false; 
        }

        target.modificatori[statKey] = Math.max(-6, Math.min(6, statAttuale + Gradi));
        return true;
    }

    static BloccaPerTurni({ Turni = null, TurniMin = 2, TurniMax = 3, Utente }) {
        // Blocca l'uso della stessa mossa per alcuni turni e causa confusione alla fine.
        let utente = Utente;
        if (!utente) return false;
        let durata = Turni !== null ? Turni : Math.floor(Math.random() * (TurniMax - TurniMin + 1)) + TurniMin;
        
        utente.statiVolatili = utente.statiVolatili || {};
        utente.statiVolatili.bloccoMosse = {
            attivo: true,
            turniRimanenti: durata,
            mossa: utente.ultimaMossaUsata
        };
        
        utente.statiVolatili.applicaConfusioneAlTermine = true;
        return true;
    }

    static ApplicaStato({ Stato, Bersaglio, Probabilita = 100, Condizione = null, Durata = null, Utente }) {
        // Applica uno stato alterato primario al bersaglio (es. Scottatura, Paralisi, Sonno).
        if (Math.random() * 100 > Probabilita) return false;
        
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || (target.stato !== null && target.stato !== undefined)) return false; 

        if (Condizione && !this.verificaCondizione(Condizione, target, Utente)) return false;

        if (Stato === "Scottatura" && target.tipi.includes("Fuoco")) return false;
        if (Stato === "Paralisi" && target.tipi.includes("Elettro")) return false;
        if ((Stato === "Avvelenamento" || Stato === "Iperavvelenamento") && (target.tipi.includes("Veleno") || target.tipi.includes("Acciaio"))) return false;
        if (Stato === "Congelamento" && target.tipi.includes("Ghiaccio")) return false;

        target.stato = Stato;
        target.contatoriStato = target.contatoriStato || {};
        
        if (Stato === "Sonno") {
            target.contatoriStato.sonno = Durata || Math.floor(Math.random() * 3) + 1; 
        } else if (Stato === "Iperavvelenamento") {
            target.contatoriStato.tossina = 1;
        }
        return true;
    }

    static ApplicaStatoUnico({ Tipo, Bersaglio, Turni = null, Utente }) {
        // Applica stati alterati volatili al bersaglio come Parassiseme o Confusione.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        
        target.statiVolatili = target.statiVolatili || {};
        if (target.statiVolatili[Tipo]) return false; 

        if (Tipo === "Parassiseme" && target.tipi.includes("Erba")) return false;

        target.statiVolatili[Tipo] = true;
        
        if (Tipo === "Confusione") {
            target.contatoriStato = target.contatoriStato || {};
            target.contatoriStato.confusione = Turni || Math.floor(Math.random() * 4) + 2; 
        }
        return true;
    }

    static DannoContraccolpo({ Percentuale, Su, DannoInflitto = 0, Utente }) {
        // Infligge danni di contraccolpo all'utente basati sul danno causato o sui PS massimi.
        let utente = Utente;
        if (!utente) return false;

        let danno = 0;
        if (Su === "DannoInflitto") {
            danno = Math.floor(DannoInflitto * (Percentuale / 100));
        } else if (Su === "PSMassimi") {
            danno = Math.floor(utente.hpMax * (Percentuale / 100));
        }

        if (danno === 0 && DannoInflitto > 0) danno = 1; 
        
        utente.hp = Math.max(0, utente.hp - danno);
        return true;
    }

    static Cura({ Tipo = null, Bersaglio = "Utente", Percentuale = null, ConsumaAccumulo = false, Utente }) {
        // Cura l'utente o un alleato ricaricando i PS in base a percentuale, accumulo o condizioni meteo.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || target.hp >= target.hpMax) return false;

        let psDaCurare = 0;
        target.statiVolatili = target.statiVolatili || {};

        if (Percentuale) {
            psDaCurare = Math.floor(target.hpMax * (Percentuale / 100));
        } else if (Tipo === "DipendenteDaMeteo") {
            let meteo = typeof getMeteo !== "undefined" ? getMeteo() : "Normale";
            if (meteo === "Sole") psDaCurare = Math.floor(target.hpMax * (2 / 3));
            else if (["Pioggia", "TempestaSabbia", "Neve"].includes(meteo)) psDaCurare = Math.floor(target.hpMax * 0.25);
            else psDaCurare = Math.floor(target.hpMax * 0.5);
        } else if (Tipo === "DipendenteDaAccumulo") {
            let accumuli = target.statiVolatili.accumuli || 0;
            if (accumuli === 0) return false;
            let moltiplicatori = [0, 0.25, 0.5, 1];
            psDaCurare = Math.floor(target.hpMax * moltiplicatori[accumuli]);
            if (ConsumaAccumulo) target.statiVolatili.accumuli = 0;
        }

        target.hp = Math.min(target.hpMax, target.hp + psDaCurare);
        return true;
    }

    static CaricaAttacco({ StatoSeminvulnerabile = null, TurniDiCarica = 1, Messaggio = null, Utente }) {
        // Prepara un attacco per il turno successivo applicando un eventuale stato di invulnerabilità.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        if (utente.statiVolatili.inCarica) {
            utente.statiVolatili.inCarica = false;
            utente.statiVolatili.statoSeminvulnerabile = null;
            return true; 
        }

        utente.statiVolatili.inCarica = true;
        utente.statiVolatili.turniCaricaRimanenti = TurniDiCarica;
        if (StatoSeminvulnerabile) utente.statiVolatili.statoSeminvulnerabile = StatoSeminvulnerabile;
        
        return "IN_CARICA";
    }

    static FaiTentennare({ Probabilità = 100, Probabilita = null, Bersaglio, Utente }) {
        // Costringe il bersaglio a tentennare impedendogli di agire nel turno corrente.
        let prob = Probabilita !== null ? Probabilita : Probabilità;
        if (Math.random() * 100 > prob) return false;
        
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || target.haGiaAgito) return false;
        target.statiVolatili = target.statiVolatili || {};

        target.statiVolatili.tentennamento = true;
        return true;
    }

    static Intrappola({ Bersaglio = "Bersaglio", DannoPerTurno = 0.125, Tipo = null, TurniMax = 5, TurniMin = 4, Utente }) {
        // Blocca il bersaglio in campo infliggendo danni periodici o impedendo la fuga.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || target.tipi.includes("Spettro")) return false;
        target.statiVolatili = target.statiVolatili || {};

        if (Tipo === "ImpedisciFuga") {
            if (target.statiVolatili.bloccoFuga) return false;
            target.statiVolatili.bloccoFuga = true;
            return true;
        }

        if (target.statiVolatili.dannoIntrappolamento) return false;

        let durata = Math.floor(Math.random() * (TurniMax - TurniMin + 1)) + TurniMin;
        target.statiVolatili.dannoIntrappolamento = {
            attivo: true,
            turniRimanenti: durata,
            dannoPerTurno: DannoPerTurno
        };
        return true;
    }

    static RimuoviEffettiCampo({ Effetti, Lato = "Utente", Utente, Bersaglio }) {
        // Libera l'utente o il lato alleato da effetti persistenti come trappole o prese.
        let latoTarget = typeof getLatoCampo !== "undefined" ? getLatoCampo(Lato) : { trappoleAttive: false, effetti: {} }; 
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        let successo = false;

        if (Effetti.includes("Trappole") && latoTarget.trappoleAttive) {
            latoTarget.trappole = { levitoroccia: false, punte: 0, fielepunte: 0, ragnatela: false };
            successo = true;
        }
        if (Effetti.includes("Parassiseme") && utente.statiVolatili["Parassiseme"]) {
            utente.statiVolatili["Parassiseme"] = false;
            successo = true;
        }
        if (Effetti.includes("Legatutto") && utente.statiVolatili.dannoIntrappolamento) {
            utente.statiVolatili.dannoIntrappolamento = null;
            successo = true;
        }
        
        return successo;
    }

    static Proteggi({ Bersaglio = "Utente", Utente }) {
        // Garantisce invulnerabilità dagli attacchi per un turno con efficacia decrescente se ripetuta.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;

        target.contatoriStato = target.contatoriStato || {};
        let probabilitaSuccesso = target.contatoriStato.usciteProtezione ? Math.pow(1/3, target.contatoriStato.usciteProtezione) : 1;
        
        if (Math.random() > probabilitaSuccesso) {
            target.contatoriStato.usciteProtezione = 0;
            return false;
        }

        target.protetto = true;
        target.contatoriStato.usciteProtezione = (target.contatoriStato.usciteProtezione || 0) + 1;
        return true;
    }

    static CambiaMeteo({ Turni = 5, Meteo, Utente }) {
        // Sostituisce il meteo del campo di lotta per un determinato numero di turni.
        if (typeof getMeteoAttivo === "undefined" || typeof impostaMeteo === "undefined") return true; // Graceful fallback
        let meteoAttuale = getMeteoAttivo();
        let meteoEstremi = ["Luce Solare Intensa", "Pioggia Battente", "Correnti Misteriose"];
        
        if (meteoAttuale === Meteo || meteoEstremi.includes(meteoAttuale)) {
            return false;
        }

        let durata = Turni;
        impostaMeteo(Meteo, durata);
        return true;
    }

    static ColpiMultipli({ Min = 2, Max = 5, NumeroColpi = null, Utente }) {
        // Calcola e definisce casualmente il numero di colpi per le mosse a ripetizione.
        if (NumeroColpi !== null) {
            return NumeroColpi;
        }

        let rand = Math.random() * 100;
        if (rand < 35) return 2;
        if (rand < 70) return 3;
        if (rand < 85) return 4;
        return 5;
    }

    static AumentaPotenzaConsecutiva({ Max = null, Turni = null, Incremento = null, Moltiplicatore = null, Utente }) {
        // Aumenta un contatore che fa crescere i danni della mossa se usata in turni consecutivi.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        let mossaAttuale = utente.mossaInUso;
        
        if (!utente.statiVolatili.potenzaConsecutiva || utente.statiVolatili.potenzaConsecutiva.mossa !== mossaAttuale) {
            utente.statiVolatili.potenzaConsecutiva = { mossa: mossaAttuale, contatore: 1 };
        } else {
            utente.statiVolatili.potenzaConsecutiva.contatore++;
            if (Turni && utente.statiVolatili.potenzaConsecutiva.contatore > Turni) {
                utente.statiVolatili.potenzaConsecutiva.contatore = 1;
            }
        }
        
        return true;
    }

    static ProssimoColpoCritico({ Bersaglio = "Utente", Utente }) {
        // Rende infallibilmente critico il prossimo attacco dell'utente.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        
        target.statiVolatili = target.statiVolatili || {};
        target.statiVolatili.prossimoColpoCritico = true;
        return true;
    }

    static ModificaTassoCritico({ Gradi, Bersaglio = "Utente", Utente }) {
        // Incrementa la probabilità dell'utente di infliggere brutti colpi fino al massimo consentito.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        
        target.modificatori = target.modificatori || {};
        if (!target.modificatori.tassoCritico) target.modificatori.tassoCritico = 0;
        if (target.modificatori.tassoCritico >= 3) return false;
        
        target.modificatori.tassoCritico = Math.min(3, target.modificatori.tassoCritico + Gradi);
        return true;
    }

    static ModificaDanno({ Condizione, Moltiplicatore, Bersaglio, Utente }) {
        // Ritorna un moltiplicatore di danno se le condizioni richieste sono soddisfatte.
        let target = Bersaglio;
        let utente = Utente;
        
        if (this.verificaCondizione(Condizione, target, utente)) {
            return Moltiplicatore;
        }
        return 1;
    }

    static PiazzaTrappola({ Tipo, Lato = "Nemico" }) {
        // Piazza trappole sul lato nemico che penalizzeranno i Pokémon entranti.
        let latoTarget = typeof getLatoCampo !== "undefined" ? getLatoCampo(Lato) : null;
        if (!latoTarget) return false;
        
        if (!latoTarget.trappole) latoTarget.trappole = {};
        
        switch (Tipo) {
            case "Levitoroccia":
            case "ReteVischiosa":
            case "Puntacciaio":
                if (latoTarget.trappole[Tipo]) return false;
                latoTarget.trappole[Tipo] = true;
                break;
            case "Punte":
                if (latoTarget.trappole[Tipo] >= 3) return false;
                latoTarget.trappole[Tipo] = (latoTarget.trappole[Tipo] || 0) + 1;
                break;
            case "Fielepunte":
                if (latoTarget.trappole[Tipo] >= 2) return false;
                latoTarget.trappole[Tipo] = (latoTarget.trappole[Tipo] || 0) + 1;
                break;
            default:
                return false;
        }
        
        latoTarget.trappoleAttive = true;
        return true;
    }

    static ModificaPS({ Tipo, Bersaglio = "Bersaglio", Condizione = null, Utente }) {
        // Permette di dimezzare o far combaciare i PS del bersaglio a quelli dell'utente.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        let utente = Utente;
        if (!target || !utente) return false;

        if (Condizione && !this.verificaCondizione(Condizione, target, utente)) return false;

        if (Tipo === "UguagliaPSUtente") {
            if (target.hp <= utente.hp) return false;
            target.hp = utente.hp;
            return true;
        } else if (Tipo === "Dimezza") {
            let danno = Math.max(1, Math.floor(target.hp / 2));
            target.hp -= danno;
            return true;
        }
        return false;
    }

    static ModificaPrecisione({ Valore, Condizione = null, Bersaglio, Utente }) {
        // Modifica temporaneamente il controllo di precisione se una specifica condizione è vera.
        let target = Bersaglio;
        if (Condizione && this.verificaCondizione(Condizione, target, Utente)) {
            return Valore; 
        }
        return null; 
    }

    static ForzaSostituzione({ Bersaglio = "Bersaglio", Utente }) {
        // Costringe il Pokémon avversario a rientrare nella Poké Ball.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        target.statiVolatili = target.statiVolatili || {};

        if (target.statiVolatili["Radicamento"]) {
            return false;
        }

        target.statiVolatili.forzaSostituzione = true;
        return true;
    }

    static RimuoviTipo({ Tipo, Durata = "Turno", Utente }) {
        // Elimina temporaneamente un tipo all'utente per l'intero turno.
        let utente = Utente;
        if (!utente || !utente.tipi.includes(Tipo)) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        utente.statiVolatili.tipoRimosso = {
            tipo: Tipo,
            durata: Durata,
            turniRimanenti: Durata === "Turno" ? 1 : null
        };
        return true;
    }

    static ApplicaEffettoCampo({ Effetto, Lato = "Utente", Turni = 5, Utente }) {
        // Applica uno schermo o campo (es. Ventoincoda, Riflesso) su uno o entrambi i lati.
        if (typeof getCampo === "undefined" || typeof getLatoCampo === "undefined") return true;
        let campo = getCampo(); 
        let latoTarget = getLatoCampo(Lato);

        let durata = Turni;

        if (Lato === "EntrambiLati" || Lato === "Tutti") {
            if (campo.effetti[Effetto]) return false;
            campo.effetti[Effetto] = durata;
        } else {
            if (latoTarget.effetti[Effetto]) return false;
            latoTarget.effetti[Effetto] = durata;
        }

        return true;
    }

    static VerificaCondizione({ Condizione, Altrimenti = "Fallisci", Bersaglio, Utente }) {
        // Controlla se la condizione indicata si applica, determinando il successo o fallimento.
        let utente = Utente;
        let target = Bersaglio;
        
        let soddisfatta = this.verificaCondizione(Condizione, target, utente);
        
        if (!soddisfatta && Altrimenti === "Fallisci") {
            return false;
        }
        return soddisfatta;
    }

    static AccumulaEnergia({ Max = 3, Utente }) {
        // Somma fino a tre cariche energetiche sfruttate da mosse correlate.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        if (!utente.statiVolatili.accumuli) utente.statiVolatili.accumuli = 0;
        
        if (utente.statiVolatili.accumuli >= Max) {
            return false; 
        }

        utente.statiVolatili.accumuli++;
        return true;
    }

    static DannoVariabile({ Tipo, ConsumaAccumulo = false, Utente }) {
        // Restituisce una potenza d'attacco dipendente da cariche accumulate precedentemente.
        let utente = Utente;
        if (!utente) return 0;
        utente.statiVolatili = utente.statiVolatili || {};

        let potenzaBase = 0;

        if (Tipo === "DipendenteDaAccumulo") {
            let accumuli = utente.statiVolatili.accumuli || 0;
            if (accumuli === 0) return false;
            
            potenzaBase = accumuli * 100;
            
            if (ConsumaAccumulo) {
                utente.statiVolatili.accumuli = 0;
            }
        }
        
        return potenzaBase; 
    }

    static ResettaStatistiche({ Bersaglio = "Tutti", BersaglioObj, Utente }) {
        // Azzera i cambiamenti positivi e negativi delle statistiche sui Pokémon scelti.
        let targets = [];
        
        if (Bersaglio === "Tutti") {
            targets = typeof getTuttiIPokemonInCampo !== "undefined" ? getTuttiIPokemonInCampo() : [BersaglioObj, Utente].filter(Boolean);
        } else {
            let t = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : BersaglioObj;
            if (t) targets.push(t);
        }

        if (targets.length === 0) return false;

        targets.forEach(t => {
            if (!t.modificatori) return;
            for (let stat in t.modificatori) {
                t.modificatori[stat] = 0;
            }
        });

        return true;
    }

    static RompiProtezione({ Bersaglio = "Bersaglio", Utente }) {
        // Rimuove lo stato di protezione del bersaglio annullandone le difese.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || !target.protetto) return false;
        
        target.protetto = false;
        return true;
    }

    static PotenzaVariabile({ Formula, Max = 150, Bersaglio, Utente }) {
        // Calcola dinamicamente la potenza di una mossa in base al divario tra specifiche statistiche.
        let utente = Utente;
        let bersaglio = Bersaglio;
        if (!utente || !bersaglio) return 1;
        let potenza = 1;

        if (Formula === "25 * (VelocitàBersaglio / VelocitàUtente)") {
            let velUtente = utente.statistiche.velocita * (utente.modificatori.velocita || 1);
            let velBersaglio = bersaglio.statistiche.velocita * (bersaglio.modificatori.velocita || 1);
            potenza = Math.floor(25 * (velBersaglio / Math.max(1, velUtente)));
        }
        
        return Math.min(potenza || 1, Max);
    }

    static AumentaPotenzaMossaAlleato({ Moltiplicatore = 1.5, Utente }) {
        // Potenzia il danno della mossa che l'alleato effettuerà nel turno corrente.
        let alleato = typeof getPokemon !== "undefined" ? getPokemon("AlleatoVicino") : null; // Fallback required context
        if (!alleato) return false;
        alleato.statiVolatili = alleato.statiVolatili || {};
        
        alleato.statiVolatili.altruismo = Moltiplicatore;
        return true;
    }

    static CopiaUltimaMossa() {
        // Ritorna l'ultima mossa utilizzata in campo, ignorando alcune esclusioni.
        if (typeof getCampo === "undefined") return false;
        let campo = getCampo();
        let mossa = campo.ultimaMossaUsata;
        
        const mosseNonCopiabili = ["Copione", "Assistente", "Sonnolalia", "Metronomo", "Naturaforza", "Protezione", "Individua", "Resistenza"];
        if (!mossa || mosseNonCopiabili.includes(mossa)) return false;
        
        return mossa;
    }

    static CediTurno({ Bersaglio, Utente }) {
        // Fa agire il bersaglio immediatamente dopo l'utente ignorando la Velocità.
        let target = Bersaglio;
        if (!target || target.haGiaAgito) return false;
        target.statiVolatili = target.statiVolatili || {};
        
        target.statiVolatili.agisceSubito = true;
        return true;
    }

    static RimuoviStato({ Bersaglio = "Alleato", BersaglioObj, Utente }) {
        // Cura il bersaglio scelto rimuovendone il problema di stato primario.
        let targets = Bersaglio === "TuttiAlleati" && typeof getTuttiAlleati !== "undefined" ? getTuttiAlleati() : [(Bersaglio === "Utente" ? Utente : BersaglioObj)];
        let successo = false;
        
        targets.forEach(t => {
            if (t && t.stato) {
                t.stato = null;
                if (t.contatoriStato) {
                    t.contatoriStato.sonno = 0;
                    t.contatoriStato.tossina = 0;
                }
                successo = true;
            }
        });
        
        return successo;
    }

    static ForzaRipetizioneMossa({ Turni = 3, Bersaglio, Utente }) {
        // Costringe il bersaglio a continuare a utilizzare la sua ultima mossa per più turni.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || !target.ultimaMossaUsata) return false;
        target.statiVolatili = target.statiVolatili || {};
        if (target.statiVolatili.ripeti) return false;
        
        target.statiVolatili.ripeti = {
            attivo: true,
            mossa: target.ultimaMossaUsata,
            turniRimanenti: Turni
        };
        return true;
    }

    static AttiraAttacchi({ Utente }) {
        // Devia tutte le mosse mono-bersaglio avversarie sull'utente.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};
        utente.statiVolatili.attiraAttacchi = true; 
        return true;
    }

    static NessunEffetto() {
        // Non esegue assolutamente alcuna azione logica.
        return false;
    }

    static PotenzaBasataSuStatistiche({ Utente }) {
        // Genera una potenza elevata proporzionata ai modificatori positivi dell'utente.
        let utente = Utente;
        if (!utente || !utente.modificatori) return 20;
        let aumenti = 0;
        
        for (let stat in utente.modificatori) {
            if (utente.modificatori[stat] > 0) {
                aumenti += utente.modificatori[stat];
            }
        }
        
        return 20 + (20 * aumenti);
    }

    static RiduciPP({ Quantita = 4, Bersaglio = "Bersaglio", Utente }) {
        // Toglie PP aggiuntivi all'ultima mossa utilizzata dal bersaglio.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || !target.ultimaMossaUsata) return false;

        let mossa = target.mosse.find(m => m.nome === target.ultimaMossaUsata);
        if (!mossa || mossa.ppAttuali <= 0) return false;

        mossa.ppAttuali = Math.max(0, mossa.ppAttuali - Quantita);
        return true;
    }

    static ImpedisciUsoMossaUguale({ Utente }) {
        // Impedisce all'avversario l'utilizzo di mosse condivise col set dell'utente.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};
        if (utente.statiVolatili.esclusiva) return false;
        
        utente.statiVolatili.esclusiva = true;
        return true;
    }

    static BloccaUltimaMossa({ Turni = 4, Bersaglio = "Bersaglio", Utente }) {
        // Sospende l'accesso all'ultima mossa usata dall'avversario per alcuni turni.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || !target.ultimaMossaUsata) return false;
        target.statiVolatili = target.statiVolatili || {};
        if (target.statiVolatili.inibizione) return false;

        target.statiVolatili.inibizione = {
            attivo: true,
            mossa: target.ultimaMossaUsata,
            turniRimanenti: Turni
        };
        return true;
    }

    static AzzeraPPSeKO({ Utente }) {
        // Azzera i PP della mossa del nemico se questo attacco causa il KO dell'utente.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};
        utente.statiVolatili.rancore = true; 
        return true;
    }

    static AumentaPotenzaInCoro() {
        // Aumenta e raddoppia la potenza d'attacco se questa mossa è stata appena usata nel turno.
        if (typeof getCampo === "undefined") return 60;
        let campo = getCampo();
        if (campo.statiTurno.coroUsato) {
            return 120;
        }
        campo.statiTurno.coroUsato = true;
        return 60;
    }

    static CopiaMossa({ Permanente = false, Bersaglio = "Bersaglio", Utente }) {
        // Impara temporaneamente o per sempre l'ultima mossa utilizzata dal nemico.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!utente || !target || !target.ultimaMossaUsata) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        let mosseEscluse = ["Schizzo", "Mimica", "Scontro"];
        if (mosseEscluse.includes(target.ultimaMossaUsata)) return false;

        let indiceMossa = utente.mosse.findIndex(m => m.nome === (Permanente ? "Schizzo" : "Mimica"));
        if (indiceMossa === -1) return false;

        if (typeof ottieniDatiMossa === "undefined") return false;
        let mossaCopiata = ottieniDatiMossa(target.ultimaMossaUsata);
        utente.mosse[indiceMossa] = { ...mossaCopiata };
        
        if (!Permanente) {
            utente.statiVolatili.mossaCopiata = { indice: indiceMossa, originale: "Mimica" };
        }
        return true;
    }

    static AssorbiPS({ Percentuale = 50, DannoInflitto = 0, Bersaglio = "Bersaglio", Utente }) {
        // Recupera un quantitativo di PS calcolati in base alla porzione di danno inflitto.
        let utente = Utente;
        if (!utente || DannoInflitto <= 0) return false;

        let psAssorbiti = Math.floor(DannoInflitto * (Percentuale / 100));
        if (psAssorbiti === 0) psAssorbiti = 1;

        utente.hp = Math.min(utente.hpMax, utente.hp + psAssorbiti);
        return true;
    }

    static ApplicaStatoCasuale({ Probabilita = 100, Stati = [], Bersaglio = "Bersaglio", Utente }) {
        // Seleziona uno stato dalla lista in input per applicarlo sul Pokémon nemico.
        if (Math.random() * 100 > Probabilita || Stati.length === 0) return false;

        let statoScelto = Stati[Math.floor(Math.random() * Stati.length)];
        return this.ApplicaStato({ Stato: statoScelto, Bersaglio: Bersaglio, Probabilita: 100, Utente: Utente });
    }

    static MandaKO({ Bersaglio = "Bersaglio", Utente }) {
        // Porta immediatamente a zero la salute del bersaglio mandandolo K.O.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;

        target.hp = 0;
        return true;
    }

    static BloccaMosseStato({ Turni = 3, Bersaglio = "Bersaglio", Utente }) {
        // Impedisce al Pokémon avversario l'uso di qualsiasi mossa che non rechi danno diretto.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        target.statiVolatili = target.statiVolatili || {};
        if (target.statiVolatili.provocazione) return false;

        target.statiVolatili.provocazione = {
            attivo: true,
            turniRimanenti: Turni
        };
        return true;
    }

    static CambiaTipo({ Tipo, Bersaglio = "Bersaglio", Utente }) {
        // Sostituisce la combinazione di Tipi del bersaglio con quella indicata.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        
        if (!target || target.isTerastallizzato) return false;

        target.tipi = Array.isArray(Tipo) ? Tipo : [Tipo];
        return true;
    }

    static CopiaStatistiche({ Bersaglio = "Bersaglio", Utente }) {
        // Adotta gli stessi valori nei modificatori di statistiche presenti sul bersaglio.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!utente || !target) return false;
        utente.modificatori = utente.modificatori || {};

        for (let stat in target.modificatori) {
            utente.modificatori[stat] = target.modificatori[stat];
        }
        return true;
    }

    static ScambiaStatistiche({ Statistiche = ["Attacco", "AttaccoSpeciale"], Bersaglio = "Bersaglio", Utente }) {
        // Inverte in modo permanente i modificatori delle statistiche indicate tra utente e bersaglio.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!utente || !target) return false;
        utente.modificatori = utente.modificatori || {};
        target.modificatori = target.modificatori || {};

        Statistiche.forEach(statKey => {
            let stat = statKey.toLowerCase();
            let temp = utente.modificatori[stat] || 0;
            utente.modificatori[stat] = target.modificatori[stat] || 0;
            target.modificatori[stat] = temp;
        });
        return true;
    }

    static PotenzaInversaPS({ Utente }) {
        // Produce un colpo molto più dannoso tanto più i PS di chi attacca sono bassi.
        let utente = Utente;
        if (!utente) return 1;

        let percentuale = (utente.hp / utente.hpMax) * 100;

        if (percentuale <= 4.17) return 200;
        if (percentuale <= 10.42) return 150;
        if (percentuale <= 20.83) return 100;
        if (percentuale <= 35.42) return 80;
        if (percentuale <= 68.75) return 40;
        return 20;
    }

    static ProssimoColpoSicuro({ Bersaglio = "Bersaglio", Utente }) {
        // Garantisce che il prossimo attacco inferto non possa eludere i controlli di precisione.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target || !utente) return false;
        target.statiVolatili = target.statiVolatili || {};
        if (target.statiVolatili.mirino) return false;

        target.statiVolatili.mirino = {
            attivo: true,
            daParteDi: utente.id 
        };
        return true;
    }

    static TagliaPS({ Percentuale = 50, Bersaglio = "Bersaglio", Utente }) {
        // Sottrae un quantitativo fisso percentuale ai Punti Salute correnti dell'avversario.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;

        let danno = Math.floor(target.hp * (Percentuale / 100));
        if (danno === 0 && target.hp > 0) danno = 1; 

        target.hp = Math.max(0, target.hp - danno);
        return true;
    }

    static MassimizzaStatistica({ Statistica, Bersaglio = "Utente", Utente }) {
        // Innalza istantaneamente il grado di una statistica sino al massimo scalino possibile (+6).
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        
        target.modificatori = target.modificatori || {};
        let statKey = Statistica.toLowerCase();

        if (!target.modificatori[statKey]) target.modificatori[statKey] = 0;
        
        if (target.modificatori[statKey] === 6) return false;

        target.modificatori[statKey] = 6;
        return true;
    }

    static FuggiOSostituisci({ Utente }) {
        // Ritira l'utente dalla lotta in modo forzato attivandone la sostituzione logica.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};
        
        utente.statiVolatili.sostituzioneForzata = true;
        return true;
    }

    static ScambiaPosizioneAlleato({ Utente }) {
        // Scambia di posto in campo l'utente col Pokémon suo alleato.
        let utente = Utente;
        let alleato = typeof getPokemon !== "undefined" ? getPokemon("Alleato") : null;
        
        if (!alleato || !utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};
        alleato.statiVolatili = alleato.statiVolatili || {};
        
        utente.statiVolatili.scambiatoConAlleato = true;
        alleato.statiVolatili.scambiatoConAlleato = true;
        return true;
    }

    static CalcolaDannoSuDifesaFisica() {
        // Imposta un flag che ordina al motore di calcolare i danni speciali usando la Difesa base nemica.
        return "UsaDifesaFisicaTarget";
    }

    static DannoFuturo({ Turni = 2, Bersaglio, Utente }) {
        // Piazzia un attacco sospeso in grado di colpire il bersaglio con un ritardo di alcuni turni.
        let target = Bersaglio;
        let utente = Utente;
        if (!target || !utente) return false;
        target.statiVolatili = target.statiVolatili || {};
        
        if (target.statiVolatili.dannoFuturo) return false;

        target.statiVolatili.dannoFuturo = {
            attivo: true,
            turniRimanenti: Turni,
            origine: utente.id,
            mossa: utente.mossaInUso
        };
        return true;
    }

    static ProteggiDaArea({ Bersaglio = "TuttiAlleati" }) {
        // Salva il lato in campo alleato da tutti gli attacchi che bersaglierebbero tutta l'area.
        if (typeof getLatoCampo === "undefined") return true;
        let lato = getLatoCampo("Utente");
        
        lato.effetti["Vastaguardia"] = true;
        return true;
    }

    static PotenzaBasataSuPeso({ Formula, Bersaglio, Utente }) {
        // Misura il danno applicando scaglioni proporzionali al peso dei combattenti in scena.
        let target = Bersaglio;
        let utente = Utente;
        if (!target || !utente) return 1;

        let pesoTarget = target.peso || 10;
        let pesoUtente = utente.peso || 10;

        if (Formula === "Laccioerboso" || Formula === "Colpokarate") {
            if (pesoTarget < 10) return 20;
            if (pesoTarget < 25) return 40;
            if (pesoTarget < 50) return 60;
            if (pesoTarget < 100) return 80;
            if (pesoTarget < 200) return 100;
            return 120;
        } else if (Formula === "Pesobomba" || Formula === "Marchiafuoco") {
            let rapporto = pesoTarget / pesoUtente;
            if (rapporto <= 0.2) return 120;
            if (rapporto <= 0.25) return 100;
            if (rapporto <= 0.33) return 80;
            if (rapporto <= 0.5) return 60;
            return 40;
        }
        
        return 1;
    }

    static ColpoSicuro() {
        // Contrassegna questa azione come infallibile scavalcando Precisione ed Elusione.
        return "Infallibile";
    }
    
    static DannoFisso({ Danno = null, Formula = null, Utente }) {
        // Ritorna un valore di danno invariato basato sulla configurazione o sul livello.
        let utente = Utente;
        if (!utente) return false;

        if (Danno !== null) {
            return Danno;
        }

        if (Formula === "LivelloUtente") {
            return utente.livello || 50;
        }

        return false;
    }

    static CopiaTipo({ Bersaglio = "Bersaglio", Utente }) {
        // Trasforma il proprio schieramento elementale eguagliandolo alle tipologie avversarie.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        
        if (!target || !utente || utente.isTerastallizzato || target.tipi.length === 0) return false;

        utente.tipi = [...target.tipi];
        return true;
    }

    static AnnullaImmunitàTerra({ Bersaglio = "Bersaglio", Utente }) {
        // Blocca lo stato di volo abbattendo il nemico al suolo contro le immunità Terra.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        target.statiVolatili = target.statiVolatili || {};

        target.statiVolatili.abbattimento = true;
        target.statiVolatili.magnetascesa = false;
        target.statiVolatili.telecinesi = false;

        return true; 
    }

    static EffettoMaledizione({ Bersaglio = "Bersaglio", Utente }) {
        // Maledice il nemico se di tipo Spettro offrendo un tributo in salute o cambia le statistiche.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!utente) return false;

        if (utente.tipi.includes("Spettro")) {
            if (!target) return false;
            target.statiVolatili = target.statiVolatili || {};
            if (target.statiVolatili.maledizione) return false;
            
            let costoPS = Math.floor(utente.hpMax / 2);
            if (utente.hp <= costoPS && utente.hp > 1) {
                utente.hp = 0; 
            } else {
                utente.hp -= costoPS;
            }
            
            target.statiVolatili.maledizione = true;
            return true;
        } else {
            let successo = false;
            successo = this.ModificaStatistica({ Gradi: -1, Bersaglio: "Utente", Statistica: "Velocita", Utente }) || successo;
            successo = this.ModificaStatistica({ Gradi: 1, Bersaglio: "Utente", Statistica: "Attacco", Utente }) || successo;
            successo = this.ModificaStatistica({ Gradi: 1, Bersaglio: "Utente", Statistica: "Difesa", Utente }) || successo;
            return successo;
        }
    }

    static Lascia1PS() {
        // Flag che ostacola i KO costringendo l'esito dei danni del bersaglio ad almeno 1 PS.
        return "NonMandareKO";
    }

    static ImpedisciSonno({ Turni = 3, Utente }) {
        // Inibisce lo status Sonno svegliando i combattenti ed eliminando il riposo.
        let utente = Utente;
        if (typeof getCampo === "undefined" || typeof getTuttiIPokemonInCampo === "undefined") return true;
        let campo = getCampo();
        
        campo.effetti["Baraonda"] = Turni;
        
        let tutti = getTuttiIPokemonInCampo();
        tutti.forEach(p => {
            if (p.stato === "Sonno") {
                p.stato = null;
                if(p.contatoriStato) p.contatoriStato.sonno = 0;
            }
        });
        
        if (utente) {
            utente.statiVolatili = utente.statiVolatili || {};
            utente.statiVolatili.baraonda = { attivo: true, turniRimanenti: Turni };
        }
        return true;
    }

    static ModificaStatisticaCasuale({ Gradi = 2, Bersaglio = "Utente", Utente }) {
        // Migliora l'indice di una statistica bersagliata casualmente.
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;
        if (!target) return false;
        target.modificatori = target.modificatori || {};

        let statisticheBase = ["attacco", "difesa", "attaccospeciale", "difesaspeciale", "velocita", "precisione", "elusione"];
        let statisticheAumentabili = statisticheBase.filter(stat => (target.modificatori[stat] || 0) < 6);

        if (statisticheAumentabili.length === 0) return false;

        let statScelta = statisticheAumentabili[Math.floor(Math.random() * statisticheAumentabili.length)];
        return this.ModificaStatistica({ Gradi: Gradi, Bersaglio: target, Statistica: statScelta, Utente });
    }

    static FallisceSeMosseNonUsate({ Utente }) {
        // Valida che tutte le altre abilità del Pokémon in campo siano state testate in precedenza.
        let utente = Utente;
        if (!utente || utente.mosse.length <= 1) return false;
        
        let altreMosse = utente.mosse.filter(m => m.nome !== "Ultima Scelta");
        let tutteUsate = altreMosse.every(m => m.usataAlmenoUnaVolta === true);
        
        if (!tutteUsate) return false;
        return true;
    }

    static BloccaPriorità({ Bersaglio = "TuttiAlleati" }) {
        // Alza difese insormontabili nel campo isolandolo dalle azioni che dispongono di alta priorità.
        if (typeof getLatoCampo === "undefined") return true;
        let lato = getLatoCampo(Bersaglio.includes("Alleat") ? "Utente" : "Nemico");
        
        lato.effetti["Anticipo"] = true;
        return true;
    }

    static SostituisciEPassaStatistiche({ Utente }) {
        // Programma un cambio mandando lo schieramento e le alterazioni a favore del Pokémon subentrante.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        utente.statiVolatili.preparaStaffetta = true;
        utente.statiVolatili.sostituzioneForzata = true;
        return true;
    }

    static ColpoCriticoSicuro() {
        // Genera un contrassegno letto dal danno per scavalcare casualità e causare colpi inflessibilmente critici.
        return "CriticoSicuro";
    }

    static RompiBarriere({ Lato = "Nemico" }) {
        // Frantuma i muri di schermi ed aurore di velo sollevati sull'inquadratura nemica.
        if (typeof getLatoCampo === "undefined") return true;
        let latoTarget = getLatoCampo(Lato);
        if (!latoTarget) return false;

        let successo = false;
        const barriere = ["Riflesso", "SchermoLuce", "Velaurora"];

        barriere.forEach(barriera => {
            if (latoTarget.effetti[barriera]) {
                latoTarget.effetti[barriera] = false;
                successo = true;
            }
        });

        return successo;
    }

    static RicaricaTurnoSuccessivo({ Utente }) {
        // Richiede forzatamente all'utente una fase d'immobilità e di riposo per concludere la reazione al turno.
        let utente = Utente;
        if (!utente) return false;
        utente.statiVolatili = utente.statiVolatili || {};

        utente.statiVolatili.ricarica = true;
        return true;
    }

    static TrasformaInBersaglio({ Bersaglio = "Bersaglio", Utente }) {
        // Copia in tutto e per tutto la sembianza, la tipologia, la tecnica e i vantaggi avversari.
        let utente = Utente;
        let target = (typeof Bersaglio === "string" && Bersaglio === "Utente") ? Utente : Bersaglio;

        if (!utente || !target) return false;
        target.statiVolatili = target.statiVolatili || {};
        utente.statiVolatili = utente.statiVolatili || {};

        if (target.statiVolatili.trasformato || target.isIllusion) return false;

        utente.statiVolatili.trasformato = true;
        utente.tipi = [...target.tipi];
        utente.peso = target.peso;

        const statisticheBase = ["attacco", "difesa", "attaccospeciale", "difesaspeciale", "velocita"];
        utente.statistiche = utente.statistiche || {};
        utente.modificatori = utente.modificatori || {};
        
        statisticheBase.forEach(stat => {
            if(target.statistiche) utente.statistiche[stat] = target.statistiche[stat];
            if(target.modificatori) utente.modificatori[stat] = target.modificatori[stat] || 0;
        });
        
        if(target.modificatori) {
            utente.modificatori.precisione = target.modificatori.precisione || 0;
            utente.modificatori.elusione = target.modificatori.elusione || 0;
            utente.modificatori.tassoCritico = target.modificatori.tassoCritico || 0;
        }

        utente.mosse = target.mosse.map(m => ({
            ...m,
            ppAttuali: 5,
            ppMassimi: 5
        }));

        return true;
    }

    static AumentaTutteStatistiche({ Gradi = 1, Probabilita = 10, Utente }) {
        // Attua l'upgrade sincrono e progressivo ad ognuna delle statistiche centrali combattive.
        if (Math.random() * 100 > Probabilita) return false;

        let successo = false;
        const statistiche = ["Attacco", "Difesa", "AttaccoSpeciale", "DifesaSpeciale", "Velocita"];

        statistiche.forEach(stat => {
            if (this.ModificaStatistica({ Gradi: Gradi, Bersaglio: Utente, Statistica: stat, Utente })) {
                successo = true;
            }
        });

        return successo;
    }

    static ResistiAKO({ PSMinimi = 1, Utente }) {
        // Assicura la resistenza della creatura impedendo un incasso dannoso che oltrepassi i suoi PS attuali.
        let utente = Utente;
        if (!utente) return false;
        utente.contatoriStato = utente.contatoriStato || {};
        utente.statiVolatili = utente.statiVolatili || {};

        let probabilitaSuccesso = utente.contatoriStato.usciteProtezione ? Math.pow(1/3, utente.contatoriStato.usciteProtezione) : 1;

        if (Math.random() > probabilitaSuccesso) {
            utente.contatoriStato.usciteProtezione = 0;
            return false;
        }

        utente.statiVolatili.resistenza = PSMinimi;
        utente.contatoriStato.usciteProtezione = (utente.contatoriStato.usciteProtezione || 0) + 1;
        return true;
    }
}

module.exports = Effetti;