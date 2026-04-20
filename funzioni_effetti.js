function ModificaStatistica({ Gradi, Bersaglio, Statistica, Probabilita = 100, Condizione = null, Turno = null }) {
    // Applica o rimuove gradi alle statistiche del bersaglio fino a un massimo di +/-6.
    if (Math.random() * 100 > Probabilita) return false;
    
    let target = getPokemon(Bersaglio); 
    if (!target) return false;
    if (Condizione && !verificaCondizione(Condizione, target)) return false;

    let statAttuale = target.modificatori[Statistica] || 0;
    if ((Gradi > 0 && statAttuale >= 6) || (Gradi < 0 && statAttuale <= -6)) {
        return false; 
    }

    target.modificatori[Statistica] = Math.max(-6, Math.min(6, statAttuale + Gradi));
    return true;
}

function BloccaPerTurni({ Turni = null, TurniMin = 2, TurniMax = 3 }) {
    // Blocca l'uso della stessa mossa per alcuni turni e causa confusione alla fine.
    let utente = getPokemon("Utente");
    let durata = Turni !== null ? Turni : Math.floor(Math.random() * (TurniMax - TurniMin + 1)) + TurniMin;
    
    utente.statiVolatili.bloccoMosse = {
        attivo: true,
        turniRimanenti: durata,
        mossa: utente.ultimaMossaUsata
    };
    
    utente.statiVolatili.applicaConfusioneAlTermine = true;
    return true;
}

function ApplicaStato({ Stato, Bersaglio, Probabilita = 100, Condizione = null, Durata = null }) {
    // Applica uno stato alterato primario al bersaglio (es. Scottatura, Paralisi, Sonno).
    if (Math.random() * 100 > Probabilita) return false;
    
    let target = getPokemon(Bersaglio);
    if (!target || target.statoPrincipale !== null) return false; 

    if (Condizione && !verificaCondizione(Condizione, target)) return false;

    if (Stato === "Scottatura" && target.tipi.includes("Fuoco")) return false;
    if (Stato === "Paralisi" && target.tipi.includes("Elettro")) return false;
    if ((Stato === "Avvelenamento" || Stato === "Iperavvelenamento") && (target.tipi.includes("Veleno") || target.tipi.includes("Acciaio"))) return false;
    if (Stato === "Congelamento" && target.tipi.includes("Ghiaccio")) return false;

    target.statoPrincipale = Stato;
    
    if (Stato === "Sonno") {
        target.contatoriStato.sonno = Durata || Math.floor(Math.random() * 3) + 1; 
    } else if (Stato === "Iperavvelenamento") {
        target.contatoriStato.tossina = 1;
    }
    return true;
}

function ApplicaStatoUnico({ Tipo, Bersaglio, Turni = null }) {
    // Applica stati alterati volatili al bersaglio come Parassiseme o Confusione.
    let target = getPokemon(Bersaglio);
    if (!target || target.statiVolatili[Tipo]) return false; 

    if (Tipo === "Parassiseme" && target.tipi.includes("Erba")) return false;

    target.statiVolatili[Tipo] = true;
    
    if (Tipo === "Confusione") {
        target.contatoriStato.confusione = Turni || Math.floor(Math.random() * 4) + 2; 
    }
    return true;
}

function DannoContraccolpo({ Percentuale, Su, DannoInflitto = 0 }) {
    // Infligge danni di contraccolpo all'utente basati sul danno causato o sui PS massimi.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    let danno = 0;
    if (Su === "DannoInflitto") {
        danno = Math.floor(DannoInflitto * (Percentuale / 100));
    } else if (Su === "PSMassimi") {
        danno = Math.floor(utente.psMassimi * (Percentuale / 100));
    }

    if (danno === 0 && DannoInflitto > 0) danno = 1; 
    
    utente.psAttuali = Math.max(0, utente.psAttuali - danno);
    return true;
}

function Cura({ Tipo = null, Bersaglio = "Utente", Percentuale = null, ConsumaAccumulo = false }) {
    // Cura l'utente o un alleato ricaricando i PS in base a percentuale, accumulo o condizioni meteo.
    let target = getPokemon(Bersaglio);
    if (!target || target.psAttuali >= target.psMassimi) return false;

    let psDaCurare = 0;

    if (Percentuale) {
        psDaCurare = Math.floor(target.psMassimi * (Percentuale / 100));
    } else if (Tipo === "DipendenteDaMeteo") {
        let meteo = getMeteo();
        if (meteo === "Sole") psDaCurare = Math.floor(target.psMassimi * (2 / 3));
        else if (["Pioggia", "TempestaSabbia", "Neve"].includes(meteo)) psDaCurare = Math.floor(target.psMassimi * 0.25);
        else psDaCurare = Math.floor(target.psMassimi * 0.5);
    } else if (Tipo === "DipendenteDaAccumulo") {
        let accumuli = target.statiVolatili.accumuli || 0;
        if (accumuli === 0) return false;
        let moltiplicatori = [0, 0.25, 0.5, 1];
        psDaCurare = Math.floor(target.psMassimi * moltiplicatori[accumuli]);
        if (ConsumaAccumulo) target.statiVolatili.accumuli = 0;
    }

    target.psAttuali = Math.min(target.psMassimi, target.psAttuali + psDaCurare);
    return true;
}

function CaricaAttacco({ StatoSeminvulnerabile = null, TurniDiCarica = 1, Messaggio = null }) {
    // Prepara un attacco per il turno successivo applicando un eventuale stato di invulnerabilità.
    let utente = getPokemon("Utente");
    if (!utente) return false;

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

function FaiTentennare({ Probabilità = 100 }) {
    // Costringe il bersaglio a tentennare impedendogli di agire nel turno corrente.
    if (Math.random() * 100 > Probabilità) return false;
    
    let target = getPokemon("Bersaglio");
    if (!target || target.haGiaAgito) return false;

    target.statiVolatili.tentennamento = true;
    return true;
}

function Intrappola({ Bersaglio = "Bersaglio", DannoPerTurno = 0.125, Tipo = null, TurniMax = 5, TurniMin = 4 }) {
    // Blocca il bersaglio in campo infliggendo danni periodici o impedendo la fuga.
    let target = getPokemon(Bersaglio);
    if (!target || target.tipi.includes("Spettro")) return false;

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

function RimuoviEffettiCampo({ Effetti, Lato = "Utente" }) {
    // Libera l'utente o il lato alleato da effetti persistenti come trappole o prese.
    let latoTarget = getLatoCampo(Lato); 
    let utente = getPokemon("Utente");

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

function Proteggi({ Bersaglio = "Utente" }) {
    // Garantisce invulnerabilità dagli attacchi per un turno con efficacia decrescente se ripetuta.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    let probabilitaSuccesso = target.contatoriStato.usciteProtezione ? Math.pow(1/3, target.contatoriStato.usciteProtezione) : 1;
    
    if (Math.random() > probabilitaSuccesso) {
        target.contatoriStato.usciteProtezione = 0;
        return false;
    }

    target.statiVolatili.protezione = true;
    target.contatoriStato.usciteProtezione = (target.contatoriStato.usciteProtezione || 0) + 1;
    return true;
}

function CambiaMeteo({ Turni = 5, Meteo }) {
    // Sostituisce il meteo del campo di lotta per un determinato numero di turni.
    let meteoAttuale = getMeteoAttivo();
    let meteoEstremi = ["Luce Solare Intensa", "Pioggia Battente", "Correnti Misteriose"];
    
    if (meteoAttuale === Meteo || meteoEstremi.includes(meteoAttuale)) {
        return false;
    }

    let utente = getPokemon("Utente");
    let durata = Turni;

    impostaMeteo(Meteo, durata);
    return true;
}

function ColpiMultipli({ Min = 2, Max = 5, NumeroColpi = null }) {
    // Calcola e definisce casualmente il numero di colpi per le mosse a ripetizione.
    if (NumeroColpi !== null) {
        return NumeroColpi;
    }

    let utente = getPokemon("Utente");

    let rand = Math.random() * 100;
    if (rand < 35) return 2;
    if (rand < 70) return 3;
    if (rand < 85) return 4;
    return 5;
}

function AumentaPotenzaConsecutiva({ Max = null, Turni = null, Incremento = null, Moltiplicatore = null }) {
    // Aumenta un contatore che fa crescere i danni della mossa se usata in turni consecutivi.
    let utente = getPokemon("Utente");
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

function ProssimoColpoCritico({ Bersaglio = "Utente" }) {
    // Rende infallibilmente critico il prossimo attacco dell'utente.
    let target = getPokemon(Bersaglio);
    if (!target) return false;
    
    target.statiVolatili.prossimoColpoCritico = true;
    return true;
}

function ModificaTassoCritico({ Gradi, Bersaglio = "Utente" }) {
    // Incrementa la probabilità dell'utente di infliggere brutti colpi fino al massimo consentito.
    let target = getPokemon(Bersaglio);
    if (!target) return false;
    
    if (!target.modificatori.tassoCritico) target.modificatori.tassoCritico = 0;
    
    if (target.modificatori.tassoCritico >= 3) return false;
    
    target.modificatori.tassoCritico = Math.min(3, target.modificatori.tassoCritico + Gradi);
    return true;
}

function ModificaDanno({ Condizione, Moltiplicatore }) {
    // Ritorna un moltiplicatore di danno se le condizioni richieste sono soddisfatte.
    let target = getPokemon("Bersaglio");
    let utente = getPokemon("Utente");
    
    if (verificaCondizione(Condizione, target, utente)) {
        return Moltiplicatore;
    }
    return 1;
}

function PiazzaTrappola({ Tipo, Lato = "Nemico" }) {
    // Piazza trappole sul lato nemico che penalizzeranno i Pokémon entranti.
    let latoTarget = getLatoCampo(Lato);
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

function ModificaPS({ Tipo, Bersaglio = "Bersaglio", Condizione = null }) {
    // Permette di dimezzare o far combaciare i PS del bersaglio a quelli dell'utente.
    let target = getPokemon(Bersaglio);
    let utente = getPokemon("Utente");
    if (!target || !utente) return false;

    if (Condizione && !verificaCondizione(Condizione, target)) return false;

    if (Tipo === "UguagliaPSUtente") {
        if (target.psAttuali <= utente.psAttuali) return false;
        target.psAttuali = utente.psAttuali;
        return true;
    } else if (Tipo === "Dimezza") {
        let danno = Math.max(1, Math.floor(target.psAttuali / 2));
        target.psAttuali -= danno;
        return true;
    }
    return false;
}

function ModificaPrecisione({ Valore, Condizione = null }) {
    // Modifica temporaneamente il controllo di precisione se una specifica condizione è vera.
    let target = getPokemon("Bersaglio");
    if (Condizione && verificaCondizione(Condizione, target)) {
        return Valore; 
    }
    return null; 
}

function ForzaSostituzione({ Bersaglio = "Bersaglio" }) {
    // Costringe il Pokémon avversario a rientrare nella Poké Ball.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    if (target.statiVolatili["Radicamento"]) {
        return false;
    }

    target.statiVolatili.forzaSostituzione = true;
    return true;
}

function RimuoviTipo({ Tipo, Durata = "Turno" }) {
    // Elimina temporaneamente un tipo all'utente per l'intero turno.
    let utente = getPokemon("Utente");
    if (!utente || !utente.tipi.includes(Tipo)) return false;

    utente.statiVolatili.tipoRimosso = {
        tipo: Tipo,
        durata: Durata,
        turniRimanenti: Durata === "Turno" ? 1 : null
    };
    return true;
}

function ApplicaEffettoCampo({ Effetto, Lato = "Utente", Turni = 5 }) {
    // Applica uno schermo o campo (es. Ventoincoda, Riflesso) su uno o entrambi i lati.
    let utente = getPokemon("Utente");
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

function VerificaCondizione({ Condizione, Altrimenti = "Fallisci" }) {
    // Controlla se la condizione indicata si applica, determinando il successo o fallimento.
    let utente = getPokemon("Utente");
    let target = getPokemon("Bersaglio");
    
    let soddisfatta = verificaCondizione(Condizione, target, utente);
    
    if (!soddisfatta && Altrimenti === "Fallisci") {
        return false;
    }
    return soddisfatta;
}

function AccumulaEnergia({ Max = 3 }) {
    // Somma fino a tre cariche energetiche sfruttate da mosse correlate.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    if (!utente.statiVolatili.accumuli) utente.statiVolatili.accumuli = 0;
    
    if (utente.statiVolatili.accumuli >= Max) {
        return false; 
    }

    utente.statiVolatili.accumuli++;
    return true;
}

function DannoVariabile({ Tipo, ConsumaAccumulo = false }) {
    // Restituisce una potenza d'attacco dipendente da cariche accumulate precedentemente.
    let utente = getPokemon("Utente");
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

function ResettaStatistiche({ Bersaglio = "Tutti" }) {
    // Azzera i cambiamenti positivi e negativi delle statistiche sui Pokémon scelti.
    let targets = [];
    
    if (Bersaglio === "Tutti") {
        targets = getTuttiIPokemonInCampo();
    } else {
        let t = getPokemon(Bersaglio);
        if (t) targets.push(t);
    }

    if (targets.length === 0) return false;

    targets.forEach(t => {
        for (let stat in t.modificatori) {
            t.modificatori[stat] = 0;
        }
    });

    return true;
}
function RompiProtezione({ Bersaglio = "Bersaglio" }) {
    // Rimuove lo stato di protezione del bersaglio annullandone le difese.
    let target = getPokemon(Bersaglio);
    if (!target || !target.statiVolatili.protezione) return false;
    
    target.statiVolatili.protezione = false;
    return true;
}

function PotenzaVariabile({ Formula, Max = 150 }) {
    // Calcola dinamicamente la potenza di una mossa in base al divario tra specifiche statistiche.
    let utente = getPokemon("Utente");
    let bersaglio = getPokemon("Bersaglio");
    let potenza = 1;

    if (Formula === "25 * (VelocitàBersaglio / VelocitàUtente)") {
        let velUtente = calcolaStatistica(utente, "Velocità");
        let velBersaglio = calcolaStatistica(bersaglio, "Velocità");
        potenza = Math.floor(25 * (velBersaglio / Math.max(1, velUtente)));
    }
    
    return Math.min(potenza || 1, Max);
}

function AumentaPotenzaMossaAlleato({ Moltiplicatore = 1.5 }) {
    // Potenzia il danno della mossa che l'alleato effettuerà nel turno corrente.
    let alleato = getPokemon("AlleatoVicino");
    if (!alleato) return false;
    
    alleato.statiVolatili.altruismo = Moltiplicatore;
    return true;
}

function CopiaUltimaMossa() {
    // Ritorna l'ultima mossa utilizzata in campo, ignorando alcune esclusioni.
    let campo = getCampo();
    let mossa = campo.ultimaMossaUsata;
    
    const mosseNonCopiabili = ["Copione", "Assistente", "Sonnolalia", "Metronomo", "Naturaforza", "Protezione", "Individua", "Resistenza"];
    if (!mossa || mosseNonCopiabili.includes(mossa)) return false;
    
    return mossa;
}

function CediTurno() {
    // Fa agire il bersaglio immediatamente dopo l'utente ignorando la Velocità.
    let target = getPokemon("Bersaglio");
    if (!target || target.haGiaAgito) return false;
    
    target.statiVolatili.agisceSubito = true;
    return true;
}

function RimuoviStato({ Bersaglio = "Alleato" }) {
    // Cura il bersaglio scelto rimuovendone il problema di stato primario.
    let targets = Bersaglio === "TuttiAlleati" ? getTuttiAlleati() : [getPokemon(Bersaglio)];
    let successo = false;
    
    targets.forEach(t => {
        if (t && t.statoPrincipale) {
            t.statoPrincipale = null;
            t.contatoriStato.sonno = 0;
            t.contatoriStato.tossina = 0;
            successo = true;
        }
    });
    
    return successo;
}

function ForzaRipetizioneMossa({ Turni = 3 }) {
    // Costringe il bersaglio a continuare a utilizzare la sua ultima mossa per più turni.
    let target = getPokemon("Bersaglio");
    if (!target || !target.ultimaMossaUsata || target.statiVolatili.ripeti) return false;
    
    target.statiVolatili.ripeti = {
        attivo: true,
        mossa: target.ultimaMossaUsata,
        turniRimanenti: Turni
    };
    return true;
}

function AttiraAttacchi() {
    // Devia tutte le mosse mono-bersaglio avversarie sull'utente.
    let utente = getPokemon("Utente");
    utente.statiVolatili.attiraAttacchi = true; 
    return true;
}

function NessunEffetto() {
    // Non esegue assolutamente alcuna azione logica.
    return false;
}

function PotenzaBasataSuStatistiche() {
    // Genera una potenza elevata proporzionata ai modificatori positivi dell'utente.
    let utente = getPokemon("Utente");
    let aumenti = 0;
    
    for (let stat in utente.modificatori) {
        if (utente.modificatori[stat] > 0) {
            aumenti += utente.modificatori[stat];
        }
    }
    
    return 20 + (20 * aumenti);
}

function RiduciPP({ Quantita = 4, Bersaglio = "Bersaglio" }) {
    // Toglie PP aggiuntivi all'ultima mossa utilizzata dal bersaglio.
    let target = getPokemon(Bersaglio);
    if (!target || !target.ultimaMossaUsata) return false;

    let mossa = target.mosse.find(m => m.nome === target.ultimaMossaUsata);
    if (!mossa || mossa.ppAttuali <= 0) return false;

    mossa.ppAttuali = Math.max(0, mossa.ppAttuali - Quantita);
    return true;
}

function ImpedisciUsoMossaUguale() {
    // Impedisce all'avversario l'utilizzo di mosse condivise col set dell'utente.
    let utente = getPokemon("Utente");
    if (utente.statiVolatili.esclusiva) return false;
    
    utente.statiVolatili.esclusiva = true;
    return true;
}

function BloccaUltimaMossa({ Turni = 4, Bersaglio = "Bersaglio" }) {
    // Sospende l'accesso all'ultima mossa usata dall'avversario per alcuni turni.
    let target = getPokemon(Bersaglio);
    if (!target || !target.ultimaMossaUsata || target.statiVolatili.inibizione) return false;

    target.statiVolatili.inibizione = {
        attivo: true,
        mossa: target.ultimaMossaUsata,
        turniRimanenti: Turni
    };
    return true;
}

function AzzeraPPSeKO() {
    // Azzera i PP della mossa del nemico se questo attacco causa il KO dell'utente.
    let utente = getPokemon("Utente");
    utente.statiVolatili.rancore = true; 
    return true;
}

function AumentaPotenzaInCoro() {
    // Aumenta e raddoppia la potenza d'attacco se questa mossa è stata appena usata nel turno.
    let campo = getCampo();
    if (campo.statiTurno.coroUsato) {
        return 120;
    }
    campo.statiTurno.coroUsato = true;
    return 60;
}

function CopiaMossa({ Permanente = false, Bersaglio = "Bersaglio" }) {
    // Impara temporaneamente o per sempre l'ultima mossa utilizzata dal nemico.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!target || !target.ultimaMossaUsata) return false;

    let mosseEscluse = ["Schizzo", "Mimica", "Scontro"];
    if (mosseEscluse.includes(target.ultimaMossaUsata)) return false;

    let indiceMossa = utente.mosse.findIndex(m => m.nome === (Permanente ? "Schizzo" : "Mimica"));
    if (indiceMossa === -1) return false;

    let mossaCopiata = ottieniDatiMossa(target.ultimaMossaUsata);
    utente.mosse[indiceMossa] = { ...mossaCopiata };
    
    if (!Permanente) {
        utente.statiVolatili.mossaCopiata = { indice: indiceMossa, originale: "Mimica" };
    }
    return true;
}

function AssorbiPS({ Percentuale = 50, DannoInflitto = 0, Bersaglio = "Bersaglio" }) {
    // Recupera un quantitativo di PS calcolati in base alla porzione di danno inflitto.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!utente || DannoInflitto <= 0) return false;

    let psAssorbiti = Math.floor(DannoInflitto * (Percentuale / 100));
    if (psAssorbiti === 0) psAssorbiti = 1;

    utente.psAttuali = Math.min(utente.psMassimi, utente.psAttuali + psAssorbiti);
    return true;
}

function ApplicaStatoCasuale({ Probabilita = 100, Stati = [], Bersaglio = "Bersaglio" }) {
    // Seleziona uno stato dalla lista in input per applicarlo sul Pokémon nemico.
    if (Math.random() * 100 > Probabilita || Stati.length === 0) return false;

    let statoScelto = Stati[Math.floor(Math.random() * Stati.length)];
    return ApplicaStato({ Stato: statoScelto, Bersaglio: Bersaglio, Probabilita: 100 });
}

function MandaKO({ Bersaglio = "Bersaglio" }) {
    // Porta immediatamente a zero la salute del bersaglio mandandolo K.O.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    target.psAttuali = 0;
    return true;
}

function BloccaMosseStato({ Turni = 3, Bersaglio = "Bersaglio" }) {
    // Impedisce al Pokémon avversario l'uso di qualsiasi mossa che non rechi danno diretto.
    let target = getPokemon(Bersaglio);
    if (!target || target.statiVolatili.provocazione) return false;

    target.statiVolatili.provocazione = {
        attivo: true,
        turniRimanenti: Turni
    };
    return true;
}

function CambiaTipo({ Tipo, Bersaglio = "Bersaglio" }) {
    // Sostituisce la combinazione di Tipi del bersaglio con quella indicata.
    let target = getPokemon(Bersaglio);
    
    if (!target || target.isTerastallizzato) return false;

    target.tipi = Array.isArray(Tipo) ? Tipo : [Tipo];
    return true;
}

function CopiaStatistiche({ Bersaglio = "Bersaglio" }) {
    // Adotta gli stessi valori nei modificatori di statistiche presenti sul bersaglio.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!utente || !target) return false;

    for (let stat in target.modificatori) {
        utente.modificatori[stat] = target.modificatori[stat];
    }
    return true;
}

function ScambiaStatistiche({ Statistiche = ["Attacco", "AttaccoSpeciale"], Bersaglio = "Bersaglio" }) {
    // Inverte in modo permanente i modificatori delle statistiche indicate tra utente e bersaglio.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!utente || !target) return false;

    Statistiche.forEach(stat => {
        let temp = utente.modificatori[stat] || 0;
        utente.modificatori[stat] = target.modificatori[stat] || 0;
        target.modificatori[stat] = temp;
    });
    return true;
}

function PotenzaInversaPS() {
    // Produce un colpo molto più dannoso tanto più i PS di chi attacca sono bassi.
    let utente = getPokemon("Utente");
    if (!utente) return 1;

    let percentuale = (utente.psAttuali / utente.psMassimi) * 100;

    if (percentuale <= 4.17) return 200;
    if (percentuale <= 10.42) return 150;
    if (percentuale <= 20.83) return 100;
    if (percentuale <= 35.42) return 80;
    if (percentuale <= 68.75) return 40;
    return 20;
}

function ProssimoColpoSicuro({ Bersaglio = "Bersaglio" }) {
    // Garantisce che il prossimo attacco inferto non possa eludere i controlli di precisione.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!target || target.statiVolatili.mirino) return false;

    target.statiVolatili.mirino = {
        attivo: true,
        daParteDi: utente.id 
    };
    return true;
}

function TagliaPS({ Percentuale = 50, Bersaglio = "Bersaglio" }) {
    // Sottrae un quantitativo fisso percentuale ai Punti Salute correnti dell'avversario.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    let danno = Math.floor(target.psAttuali * (Percentuale / 100));
    if (danno === 0 && target.psAttuali > 0) danno = 1; 

    target.psAttuali = Math.max(0, target.psAttuali - danno);
    return true;
}

function MassimizzaStatistica({ Statistica, Bersaglio = "Utente" }) {
    // Innalza istantaneamente il grado di una statistica sino al massimo scalino possibile (+6).
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    if (!target.modificatori[Statistica]) target.modificatori[Statistica] = 0;
    
    if (target.modificatori[Statistica] === 6) return false;

    target.modificatori[Statistica] = 6;
    return true;
}

function FuggiOSostituisci() {
    // Ritira l'utente dalla lotta in modo forzato attivandone la sostituzione logica.
    let utente = getPokemon("Utente");
    if (!utente) return false;
    
    utente.statiVolatili.sostituzioneForzata = true;
    return true;
}

function ScambiaPosizioneAlleato() {
    // Scambia di posto in campo l'utente col Pokémon suo alleato.
    let utente = getPokemon("Utente");
    let alleato = getPokemon("Alleato");
    
    if (!alleato || !utente) return false;
    
    utente.statiVolatili.scambiatoConAlleato = true;
    alleato.statiVolatili.scambiatoConAlleato = true;
    return true;
}

function CalcolaDannoSuDifesaFisica() {
    // Imposta un flag che ordina al motore di calcolare i danni speciali usando la Difesa base nemica.
    return "UsaDifesaFisicaTarget";
}

function DannoFuturo({ Turni = 2 }) {
    // Piazzia un attacco sospeso in grado di colpire il bersaglio con un ritardo di alcuni turni.
    let target = getPokemon("Bersaglio");
    let utente = getPokemon("Utente");
    
    if (!target || target.statiVolatili.dannoFuturo) return false;

    target.statiVolatili.dannoFuturo = {
        attivo: true,
        turniRimanenti: Turni,
        origine: utente.id,
        mossa: utente.mossaInUso
    };
    return true;
}

function ProteggiDaArea({ Bersaglio = "TuttiAlleati" }) {
    // Salva il lato in campo alleato da tutti gli attacchi che bersaglierebbero tutta l'area.
    let lato = getLatoCampo("Utente");
    
    lato.effetti["Vastaguardia"] = true;
    return true;
}

function PotenzaBasataSuPeso({ Formula }) {
    // Misura il danno applicando scaglioni proporzionali al peso dei combattenti in scena.
    let target = getPokemon("Bersaglio");
    let utente = getPokemon("Utente");
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

function ColpoSicuro() {
    // Contrassegna questa azione come infallibile scavalcando Precisione ed Elusione.
    return "Infallibile";
}
function DannoFisso({ Danno = null, Formula = null }) {
    // Ritorna un valore di danno invariato basato sulla configurazione o sul livello.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    if (Danno !== null) {
        return Danno;
    }

    if (Formula === "LivelloUtente") {
        return utente.livello;
    }

    return false;
}

function CopiaTipo({ Bersaglio = "Bersaglio" }) {
    // Trasforma il proprio schieramento elementale eguagliandolo alle tipologie avversarie.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    
    if (!target || !utente || utente.isTerastallizzato || target.tipi.length === 0) return false;

    utente.tipi = [...target.tipi];
    return true;
}

function AnnullaImmunitàTerra({ Bersaglio = "Bersaglio" }) {
    // Blocca lo stato di volo abbattendo il nemico al suolo contro le immunità Terra.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    target.statiVolatili.abbattimento = true;
    target.statiVolatili.magnetascesa = false;
    target.statiVolatili.telecinesi = false;

    return true; 
}

function EffettoMaledizione({ Bersaglio = "Bersaglio" }) {
    // Maledice il nemico se di tipo Spettro offrendo un tributo in salute o cambia le statistiche.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);
    if (!utente) return false;

    if (utente.tipi.includes("Spettro")) {
        if (!target || target.statiVolatili.maledizione) return false;
        
        let costoPS = Math.floor(utente.psMassimi / 2);
        if (utente.psAttuali <= costoPS && utente.psAttuali > 1) {
            utente.psAttuali = 0; 
        } else {
            utente.psAttuali -= costoPS;
        }
        
        target.statiVolatili.maledizione = true;
        return true;
    } else {
        let successo = false;
        successo = ModificaStatistica({ Gradi: -1, Bersaglio: "Utente", Statistica: "Velocita" }) || successo;
        successo = ModificaStatistica({ Gradi: 1, Bersaglio: "Utente", Statistica: "Attacco" }) || successo;
        successo = ModificaStatistica({ Gradi: 1, Bersaglio: "Utente", Statistica: "Difesa" }) || successo;
        return successo;
    }
}

function Lascia1PS() {
    // Flag che ostacola i KO costringendo l'esito dei danni del bersaglio ad almeno 1 PS.
    return "NonMandareKO";
}

function ImpedisciSonno({ Turni = 3 }) {
    // Inibisce lo status Sonno svegliando i combattenti ed eliminando il riposo.
    let utente = getPokemon("Utente");
    let campo = getCampo();
    
    campo.effetti["Baraonda"] = Turni;
    
    let tutti = getTuttiIPokemonInCampo();
    tutti.forEach(p => {
        if (p.statoPrincipale === "Sonno") {
            p.statoPrincipale = null;
            p.contatoriStato.sonno = 0;
        }
    });
    
    utente.statiVolatili.baraonda = { attivo: true, turniRimanenti: Turni };
    return true;
}

function ModificaStatisticaCasuale({ Gradi = 2, Bersaglio = "Utente" }) {
    // Migliora l'indice di una statistica bersagliata casualmente.
    let target = getPokemon(Bersaglio);
    if (!target) return false;

    let statisticheBase = ["Attacco", "Difesa", "AttaccoSpeciale", "DifesaSpeciale", "Velocita", "Precisione", "Elusione"];
    let statisticheAumentabili = statisticheBase.filter(stat => (target.modificatori[stat] || 0) < 6);

    if (statisticheAumentabili.length === 0) return false;

    let statScelta = statisticheAumentabili[Math.floor(Math.random() * statisticheAumentabili.length)];
    return ModificaStatistica({ Gradi: Gradi, Bersaglio: Bersaglio, Statistica: statScelta });
}

function FallisceSeMosseNonUsate() {
    // Valida che tutte le altre abilità del Pokémon in campo siano state testate in precedenza.
    let utente = getPokemon("Utente");
    if (!utente || utente.mosse.length <= 1) return false;
    
    let altreMosse = utente.mosse.filter(m => m.nome !== "Ultima Scelta");
    let tutteUsate = altreMosse.every(m => m.usataAlmenoUnaVolta === true);
    
    if (!tutteUsate) return false;
    return true;
}

function BloccaPriorità({ Bersaglio = "TuttiAlleati" }) {
    // Alza difese insormontabili nel campo isolandolo dalle azioni che dispongono di alta priorità.
    let lato = getLatoCampo(Bersaglio.includes("Alleat") ? "Utente" : "Nemico");
    
    lato.effetti["Anticipo"] = true;
    return true;
}

function SostituisciEPassaStatistiche() {
    // Programma un cambio mandando lo schieramento e le alterazioni a favore del Pokémon subentrante.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    utente.statiVolatili.preparaStaffetta = true;
    utente.statiVolatili.sostituzioneForzata = true;
    return true;
}

function ColpoCriticoSicuro() {
    // Genera un contrassegno letto dal danno per scavalcare casualità e causare colpi inflessibilmente critici.
    return "CriticoSicuro";
}

function RompiBarriere({ Lato = "Nemico" }) {
    // Frantuma i muri di schermi ed aurore di velo sollevati sull'inquadratura nemica.
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

function RicaricaTurnoSuccessivo() {
    // Richiede forzatamente all'utente una fase d'immobilità e di riposo per concludere la reazione al turno.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    utente.statiVolatili.ricarica = true;
    return true;
}

function TrasformaInBersaglio({ Bersaglio = "Bersaglio" }) {
    // Copia in tutto e per tutto la sembianza, la tipologia, la tecnica e i vantaggi avversari.
    let utente = getPokemon("Utente");
    let target = getPokemon(Bersaglio);

    if (!target || target.statiVolatili.trasformato || target.isIllusion) return false;

    utente.statiVolatili.trasformato = true;
    utente.tipi = [...target.tipi];
    utente.peso = target.peso;

    const statisticheBase = ["Attacco", "Difesa", "AttaccoSpeciale", "DifesaSpeciale", "Velocita"];
    statisticheBase.forEach(stat => {
        utente.statistiche[stat] = target.statistiche[stat];
        utente.modificatori[stat] = target.modificatori[stat] || 0;
    });
    utente.modificatori.precisione = target.modificatori.precisione || 0;
    utente.modificatori.elusione = target.modificatori.elusione || 0;
    utente.modificatori.tassoCritico = target.modificatori.tassoCritico || 0;

    utente.mosse = target.mosse.map(m => ({
        ...m,
        ppAttuali: 5,
        ppMassimi: 5
    }));

    return true;
}

function AumentaTutteStatistiche({ Gradi = 1, Probabilita = 10 }) {
    // Attua l'upgrade sincrono e progressivo ad ognuna delle statistiche centrali combattive.
    if (Math.random() * 100 > Probabilita) return false;

    let successo = false;
    const statistiche = ["Attacco", "Difesa", "AttaccoSpeciale", "DifesaSpeciale", "Velocita"];

    statistiche.forEach(stat => {
        if (ModificaStatistica({ Gradi: Gradi, Bersaglio: "Utente", Statistica: stat })) {
            successo = true;
        }
    });

    return successo;
}

function ResistiAKO({ PSMinimi = 1 }) {
    // Assicura la resistenza della creatura impedendo un incasso dannoso che oltrepassi i suoi PS attuali.
    let utente = getPokemon("Utente");
    if (!utente) return false;

    let probabilitaSuccesso = utente.contatoriStato.usciteProtezione ? Math.pow(1/3, utente.contatoriStato.usciteProtezione) : 1;

    if (Math.random() > probabilitaSuccesso) {
        utente.contatoriStato.usciteProtezione = 0;
        return false;
    }

    utente.statiVolatili.resistenza = PSMinimi;
    utente.contatoriStato.usciteProtezione = (utente.contatoriStato.usciteProtezione || 0) + 1;
    return true;
}