const EffettiModulo = (typeof window === 'undefined') ? require('./funzioni_effetti.js') : window.Effetti;
const GestoreFlagsModulo = (typeof window === 'undefined') ? require('./gestione_flags.js') : window.GestoreFlags;

const EfficaciaTipi = {
    "Normale": { "Roccia": 0.5, "Spettro": 0, "Acciaio": 0.5 },
    "Fuoco": { "Fuoco": 0.5, "Acqua": 0.5, "Erba": 2, "Ghiaccio": 2, "Coleottero": 2, "Roccia": 0.5, "Drago": 0.5, "Acciaio": 2 },
    "Acqua": { "Fuoco": 2, "Acqua": 0.5, "Erba": 0.5, "Terra": 2, "Roccia": 2, "Drago": 0.5 },
    "Elettro": { "Acqua": 2, "Elettro": 0.5, "Erba": 0.5, "Terra": 0, "Volante": 2, "Drago": 0.5 },
    "Erba": { "Fuoco": 0.5, "Acqua": 0.5, "Erba": 0.5, "Veleno": 0.5, "Terra": 2, "Volante": 0.5, "Coleottero": 0.5, "Roccia": 2, "Drago": 0.5, "Acciaio": 0.5 },
    "Ghiaccio": { "Fuoco": 0.5, "Acqua": 0.5, "Erba": 2, "Ghiaccio": 0.5, "Terra": 2, "Volante": 2, "Drago": 2, "Acciaio": 0.5 },
    "Lotta": { "Normale": 2, "Ghiaccio": 2, "Veleno": 0.5, "Volante": 0.5, "Psico": 0.5, "Coleottero": 0.5, "Roccia": 2, "Spettro": 0, "Buio": 2, "Acciaio": 2, "Folletto": 0.5 },
    "Veleno": { "Erba": 2, "Veleno": 0.5, "Terra": 0.5, "Roccia": 0.5, "Spettro": 0.5, "Acciaio": 0, "Folletto": 2 },
    "Terra": { "Fuoco": 2, "Elettro": 2, "Erba": 0.5, "Veleno": 2, "Volante": 0, "Coleottero": 0.5, "Roccia": 2, "Acciaio": 2 },
    "Volante": { "Elettro": 0.5, "Erba": 2, "Lotta": 2, "Coleottero": 2, "Roccia": 0.5, "Acciaio": 0.5 },
    "Psico": { "Lotta": 2, "Veleno": 2, "Psico": 0.5, "Buio": 0, "Acciaio": 0.5 },
    "Coleottero": { "Fuoco": 0.5, "Lotta": 0.5, "Veleno": 0.5, "Volante": 0.5, "Psico": 2, "Spettro": 0.5, "Buio": 2, "Acciaio": 0.5, "Folletto": 0.5, "Erba": 2 },
    "Roccia": { "Fuoco": 2, "Ghiaccio": 2, "Lotta": 0.5, "Terra": 0.5, "Volante": 2, "Coleottero": 2, "Acciaio": 0.5 },
    "Spettro": { "Normale": 0, "Psico": 2, "Spettro": 2, "Buio": 0.5 },
    "Drago": { "Drago": 2, "Acciaio": 0.5, "Folletto": 0 },
    "Buio": { "Lotta": 0.5, "Psico": 2, "Spettro": 2, "Buio": 0.5, "Folletto": 0.5 },
    "Acciaio": { "Fuoco": 0.5, "Acqua": 0.5, "Elettro": 0.5, "Ghiaccio": 2, "Roccia": 2, "Acciaio": 0.5, "Folletto": 2 },
    "Folletto": { "Fuoco": 0.5, "Lotta": 2, "Veleno": 0.5, "Drago": 2, "Buio": 2, "Acciaio": 0.5 }
};

class gestionePartita {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.turno = 1;
        this.logs = [];
        this.finito = false;

        if (this.p1.attivoIdx === undefined) this.p1.attivoIdx = 0;
        if (this.p2.attivoIdx === undefined) this.p2.attivoIdx = 0;
        this.p1.haFuggito = false;
        this.p2.haFuggito = false;

        // Supporto per Barriere, Trappole e Meteo
        this.p1.effetti = {};
        this.p2.effetti = {};
        this.p1.trappole = {};
        this.p2.trappole = {};
        this.meteo = null;
        this.turniMeteo = 0;
        this.ultimaMossaGlobale = null;

        // TRUCCO MAGICO: Sovrascriviamo il push per "fotografare" gli HP in tempo reale ad ogni log!
        let origPush = this.logs.push.bind(this.logs);
        this.logs.push = (testo) => {
            let p1Hp = this.p1 && this.p1.squadra && this.p1.squadra[this.p1.attivoIdx] ? this.p1.squadra[this.p1.attivoIdx].hp : 0;
            let p2Hp = this.p2 && this.p2.squadra && this.p2.squadra[this.p2.attivoIdx] ? this.p2.squadra[this.p2.attivoIdx].hp : 0;
            origPush({ testo: testo, p1Hp: p1Hp, p2Hp: p2Hp });
        };

        if (this.p1.squadra[this.p1.attivoIdx]) this.p1.squadra[this.p1.attivoIdx].statiVolatili = { primoTurnoInCampo: true };
        if (this.p2.squadra[this.p2.attivoIdx]) this.p2.squadra[this.p2.attivoIdx].statiVolatili = { primoTurnoInCampo: true };
    }

    processaTurno(azioneP1, azioneP2) {
        this.logs.length = 0;
        this.statiTurno = {};
        this.azioneP1 = azioneP1;
        this.azioneP2 = azioneP2;

        let p1DeadBefore = this.p1.squadra.filter(p => p.hp <= 0).length;
        let p2DeadBefore = this.p2.squadra.filter(p => p.hp <= 0).length;

        // 0. Controlla subito le fughe PvP e forza il termine
        let haFuggitoQualcuno = false;
        if (azioneP1 && azioneP1.tipo === 'flee') { this.p1.haFuggito = true; this.logs.push(`L'allenatore si arrende e ritira ${this.p1.squadra[this.p1.attivoIdx].nome}!`); haFuggitoQualcuno = true; }
        if (azioneP2 && azioneP2.tipo === 'flee') { this.p2.haFuggito = true; this.logs.push(`L'allenatore si arrende e ritira ${this.p2.squadra[this.p2.attivoIdx].nome}!`); haFuggitoQualcuno = true; }

        if (haFuggitoQualcuno) {
            this.finito = true;
            this.logs.push("La partita è terminata!");
            return this.ottieniStatoAggiornato();
        }

        // Reset flag di inizio turno per tentennamenti e protezioni
        [this.p1, this.p2].forEach(p => {
            let pk = p.squadra[p.attivoIdx];
            if (pk) {
                pk.haGiaAgito = false;
                pk.protetto = false;
                pk.hpInizioTurno = pk.hp;
                if (pk.statiVolatili) pk.statiVolatili.tentennamento = false;
            }
        });

        const codaAzioni = this.determinaOrdine(azioneP1, azioneP2);

        for (const azione of codaAzioni) {
            if (this.finito) break;
            this.eseguiAzione(azione);
            this.controllaFinePartita();
        }

        if (!this.finito) {
            this.applicaEffettiFineTurno();
            this.turno++;
        }

        let p1DeadAfter = this.p1.squadra.filter(p => p.hp <= 0).length;
        let p2DeadAfter = this.p2.squadra.filter(p => p.hp <= 0).length;

        let p1KoThisTurn = p1DeadAfter > p1DeadBefore;
        let p2KoThisTurn = p2DeadAfter > p2DeadBefore;

        [this.p1, this.p2].forEach(p => {
            let koThisTurn = (p === this.p1) ? p1KoThisTurn : p2KoThisTurn;
            p.squadra.forEach(pk => {
                pk.statiVolatili = pk.statiVolatili || {};
                pk.statiVolatili.alleatoKOTurnoPrecedente = koThisTurn;
            });
        });

        return this.ottieniStatoAggiornato();
    }

    calcolaVelocitaCorrente(pk, proprietario) {
        let velBase = pk.statistiche.velocita || pk.statistiche.speed?.base_stat || 50;
        let grado = Math.max(-6, Math.min(6, Math.floor(pk.modificatori?.velocita || 0)));
        let moltiplicatore = grado >= 0 ? (2 + grado) / 2 : 2 / (2 - grado);
        let velFinale = Math.floor(velBase * moltiplicatore);
        if (pk.stato === 'Paralisi') velFinale = Math.floor(velFinale / 2);
        if (proprietario && proprietario.effetti && proprietario.effetti["Ventoincoda"]) {
            velFinale *= 2;
        }
        return velFinale;
    }

    determinaOrdine(a1, a2) {
        const pkP1 = this.p1.squadra[this.p1.attivoIdx];
        const pkP2 = this.p2.squadra[this.p2.attivoIdx];

        const azioni = [
            { ...a1, proprietario: this.p1, bersaglio: this.p2, pk: pkP1 },
            { ...a2, proprietario: this.p2, bersaglio: this.p1, pk: pkP2 }
        ];

        return azioni.sort((a, b) => {
            // 1. Priorità massima alla sostituzione o all'uso di strumenti
            let isSwitchA = a.tipo === 'switch' || a.tipo === 'item';
            let isSwitchB = b.tipo === 'switch' || b.tipo === 'item';
            if (isSwitchA && !isSwitchB) return -1;
            if (!isSwitchA && isSwitchB) return 1;
            if (isSwitchA && isSwitchB) {
                if (a.tipo === 'switch' && b.tipo === 'item') return -1;
                if (a.tipo === 'item' && b.tipo === 'switch') return 1;
                return 0;
            }

            // 2. Priorità delle mosse (se entrambi non stanno switchando)
            let prioA = a.mossa ? (a.mossa.Priorità || 0) : 0;
            let prioB = b.mossa ? (b.mossa.Priorità || 0) : 0;
            if (prioA !== prioB) return prioB - prioA;

            // 3. Velocità
            const velA = this.calcolaVelocitaCorrente(a.pk, a.proprietario);
            const velB = this.calcolaVelocitaCorrente(b.pk, b.proprietario);
            return velB - velA;
        });
    }

    eseguiAzione(azione) {
        let { pk, bersaglio, mossa, proprietario } = azione;

        // 0. GESTIONE SOSTITUZIONE (SWITCH)
        if (azione.tipo === 'switch') {
            const vecchioPk = proprietario.squadra[proprietario.attivoIdx];

            if (vecchioPk) {
                vecchioPk.statiVolatili = {};
                vecchioPk.modificatori = {};
                vecchioPk.trappoleApplicate = false;
                if (vecchioPk.tipiOriginali) {
                    vecchioPk.tipi = [...vecchioPk.tipiOriginali];
                }
            }
            proprietario.attivoIdx = azione.nuovoIdx;
            const nuovoPk = proprietario.squadra[proprietario.attivoIdx];
            nuovoPk.statiVolatili = { primoTurnoInCampo: true }; // Flag per Bruciapelo

            this.logs.push(`${proprietario.id === this.p1.id ? 'Hai' : "L'allenatore avversario"} ritirato ${vecchioPk.nome}!`);
            this.logs.push(`Vai, ${nuovoPk.nome}!`);

            this.applicaTrappoleAlPokemon(proprietario, nuovoPk);

            nuovoPk.haGiaAgito = true;
            return;
        }

        // 0.5 GESTIONE STRUMENTI (ITEM)
        if (azione.tipo === 'item') {
            pk.haGiaAgito = true;
            return;
        }

        // Recuperiamo il target corretto (perché se ha appena switchato dobbiamo colpire il nuovo!)
        let targetPk = bersaglio.squadra[bersaglio.attivoIdx];

        if (pk.hp <= 0 || targetPk.hp <= 0) return;

        // 1. Controllo Sonno
        if (pk.stato === 'Sonno') {
            if (pk.contatoriStato && pk.contatoriStato.sonno > 0) {
                pk.contatoriStato.sonno--;
                this.logs.push(`${pk.nome} sta dormendo...`);
                pk.haGiaAgito = true;
                return;
            } else {
                pk.stato = null;
                this.logs.push(`${pk.nome} si è svegliato!`);
            }
        }
        // 2. Controllo Congelamento
        if (GestoreFlagsModulo.gestione_scongelautente(mossa) && pk.stato === 'Congelamento') {
            pk.stato = null;
            this.logs.push(`${pk.nome} si è scongelato usando ${mossa.Nome}!`);
        } else if (pk.stato === 'Congelamento') {
            if (Math.random() < 0.2) {
                pk.stato = null;
                this.logs.push(`${pk.nome} si è scongelato!`);
            } else {
                this.logs.push(`${pk.nome} è congelato e non può attaccare!`);
                pk.haGiaAgito = true;
                return;
            }
        }

        // 3. Controllo Paralisi
        if (pk.stato === 'Paralisi') {
            if (Math.random() < 0.25) {
                this.logs.push(`${pk.nome} è paralizzato e non può muoversi!`);
                pk.haGiaAgito = true;
                return;
            }
        }

        // 4. Controllo Stati Volatili (Tentennamento, Confusione, Ricarica)
        if (pk.statiVolatili) {
            if (pk.statiVolatili.tentennamento) {
                this.logs.push(`${pk.nome} tentenna e non può attaccare!`);
                pk.statiVolatili.tentennamento = false; // Consumato
                pk.haGiaAgito = true;
                return;
            }
            if (pk.statiVolatili['Confusione']) {
                if (pk.contatoriStato && pk.contatoriStato.confusione > 0) {
                    pk.contatoriStato.confusione--;
                    this.logs.push(`${pk.nome} è confuso!`);
                    if (Math.random() < 0.33) {
                        this.logs.push(`Così confuso da colpirsi da solo!`);
                        let dannoConfusione = Math.max(1, Math.floor(pk.hpMax * 0.1));
                        pk.hp = Math.max(0, pk.hp - dannoConfusione);
                        pk.haGiaAgito = true;
                        return;
                    }
                } else {
                    pk.statiVolatili['Confusione'] = false;
                    this.logs.push(`${pk.nome} non è più confuso!`);
                }
            }

            if (pk.statiVolatili.inibizione && pk.statiVolatili.inibizione.attivo && pk.statiVolatili.inibizione.mossa === mossa.Nome) {
                this.logs.push(`${pk.nome} non può usare ${mossa.Nome} a causa di Inibitore!`);
                pk.haGiaAgito = true;
                return;
            }
            if (pk.statiVolatili.provocazione && pk.statiVolatili.provocazione.attivo && mossa.Categoria === 'Stato') {
                this.logs.push(`${pk.nome} non può usare ${mossa.Nome} a causa di Provocazione!`);
                pk.haGiaAgito = true;
                return;
            }
        }

        if (targetPk.statiVolatili && targetPk.statiVolatili.esclusiva) {
            if (targetPk.mosse.some(m => m.Nome === mossa.Nome)) {
                this.logs.push(`${pk.nome} non può usare ${mossa.Nome} a causa di Esclusiva!`);
                pk.haGiaAgito = true;
                return;
            }
        }

        let mossaPK = pk.mosse.find(m => m.Nome === mossa.Nome);
        let forzaScontro = false;
        if (mossa.Nome !== "Scontro" && mossa.Nome !== "Ricarica") {
            if (!mossaPK || mossaPK.ppAttuali <= 0) {
                forzaScontro = true;
            }
        }

        if (forzaScontro) {
            mossa = {
                Nome: "Scontro",
                Tipo: "Normale",
                Categoria: "Fisico",
                Potenza: 50,
                Precisione: 100,
                PP: 1,
                CodiceFunzione: [
                    {
                        NomeFunzione: "DannoContraccolpo",
                        Parametri: {
                            Percentuale: 25,
                            Su: "PSMassimi"
                        }
                    }
                ]
            };
            mossaPK = null;
        }

        if (mossaPK && mossaPK.ppAttuali > 0) {
            mossaPK.ppAttuali--; // Sottrae il PP solo se il pokemon non è bloccato
            mossaPK.usataAlmenoUnaVolta = true; // Tracciamento per Ultimascelta
        }
        // ==========================================

        let latoPk = (pk === this.p1.squadra[this.p1.attivoIdx]) ? 1 : 2;
        let latoTarget = (targetPk === this.p1.squadra[this.p1.attivoIdx]) ? 1 : 2;

        if (mossa.Nome === "Ricarica") {
            this.logs.push(`${pk.nome} deve riposarsi!|LATO:${latoPk}`);
            if (pk.statiVolatili) {
                pk.statiVolatili.ricarica = false;
                pk.statiVolatili.mossaForzata = null;
            }
            pk.haGiaAgito = true;
            return;
        }

        if (mossa.Nome === "Copione") {
            if (this.ultimaMossaGlobale && !["Copione", "Scontro", "Ricarica"].includes(this.ultimaMossaGlobale.Nome)) {
                mossa = { ...this.ultimaMossaGlobale };
                this.logs.push(`${pk.nome} usa Copione e copia ${mossa.Nome}!|LATO:${latoPk}`);
            } else {
                this.logs.push(`${pk.nome} usa Copione, ma fallisce!|LATO:${latoPk}`);
                pk.haGiaAgito = true;
                return;
            }
        } else {
            this.logs.push(`${pk.nome} usa ${mossa.Nome}!|LATO:${latoPk}`);
        }

        if (GestoreFlagsModulo.gestione_proteggibile(mossa) && targetPk.protetto) {
            this.logs.push(`${targetPk.nome} si è protetto!|LATO:${latoTarget}`);
            return;
        }

        if (GestoreFlagsModulo.gestione_riflettibile(mossa) && targetPk.riflette) {
            this.logs.push(`${targetPk.nome} riflette la mossa!|LATO:${latoTarget}`);
            targetPk = pk;
            latoTarget = latoPk;
        }

        this.ultimaMossaUsata = mossa; // Tracciamo la mossa per le meccaniche che la richiedono

        // --- CONTROLLO FALLIMENTO PREVENTIVO (es. Sbigoattacco, Ultimascelta, Bruciapelo) ---
        if (mossa.CodiceFunzione) {
            let fallisce = false;
            mossa.CodiceFunzione.forEach(eff => {
                if (eff.NomeFunzione === "VerificaCondizione" && !EffettiModulo.VerificaCondizione({ ...eff.Parametri, Bersaglio: targetPk, Utente: pk, Partita: this })) fallisce = true;
                if (eff.NomeFunzione === "FallisceSeMosseNonUsate" && !EffettiModulo.FallisceSeMosseNonUsate({ Utente: pk })) fallisce = true;
            });
            if (fallisce) {
                this.logs.push(`${pk.nome} usa ${mossa.Nome}, ma fallisce!|LATO:${latoPk}`);
                pk.haGiaAgito = true;
                return;
            }
        }

        // --- CONTROLLO PRECISIONE E FALLIMENTO ---
        if (mossa.Categoria !== 'Stato' || mossa.Precisione > 0) {
            let isColpoSicuro = mossa.CodiceFunzione && mossa.CodiceFunzione.some(e => e.NomeFunzione === "ColpoSicuro");
            if (targetPk.statiVolatili && targetPk.statiVolatili.mirino && targetPk.statiVolatili.mirino.daParteDi === pk.id) isColpoSicuro = true;

            let precisione = mossa.Precisione || 100;
            if (mossa.CodiceFunzione) {
                mossa.CodiceFunzione.forEach(e => {
                    if (e.NomeFunzione === "ModificaPrecisione" && EffettiModulo.verificaCondizione(e.Parametri.Condizione, targetPk, pk, this)) precisione = e.Parametri.Valore;
                });
            }

            if (!isColpoSicuro && precisione > 0 && precisione <= 100) {
                let accMod = pk.modificatori.precisione || 0;
                let evaMod = targetPk.modificatori.elusione || 0;
                let stage = Math.max(-6, Math.min(6, accMod - evaMod));
                let mult = stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);

                if ((Math.random() * 100) > (precisione * mult)) {
                    this.logs.push(`${pk.nome} usa ${mossa.Nome} ma fallisce!|LATO:${latoPk}`);
                    pk.haGiaAgito = true;
                    if (pk.statiVolatili && pk.statiVolatili.potenzaConsecutiva) pk.statiVolatili.potenzaConsecutiva = null;
                    return;
                }
            }
        }

        let dannoInflittoReale = 0;

        // --- GESTIONE MOSSE CON CARICA (es. Solarraggio, Fossa) ---
        let effettoCarica = mossa.CodiceFunzione ? mossa.CodiceFunzione.find(eff => eff.NomeFunzione === "CaricaAttacco") : null;
        if (effettoCarica) {
            pk.statiVolatili = pk.statiVolatili || {};
            if (!pk.statiVolatili.inCarica) {
                pk.statiVolatili.inCarica = true;
                pk.statiVolatili.mossaForzata = mossa.Nome;
                let messaggio = (effettoCarica.Parametri && effettoCarica.Parametri.Messaggio) || `${pk.nome} si sta preparando per l'attacco!`;
                this.logs.push(messaggio + `|LATO:${latoPk}`);
                if (effettoCarica.Parametri && effettoCarica.Parametri.StatoSeminvulnerabile) {
                    pk.statiVolatili.statoSeminvulnerabile = effettoCarica.Parametri.StatoSeminvulnerabile;
                }

                // Esegue SOLO gli effetti previsti per il turno 1 (es. aumento Difesa di Capocciata)
                mossa.CodiceFunzione.forEach(eff => {
                    if (eff.Parametri && eff.Parametri.Turno === 1 && EffettiModulo[eff.NomeFunzione]) {
                        let reqTarget = (eff.Parametri.Bersaglio === "Utente") ? pk : targetPk;

                        EffettiModulo[eff.NomeFunzione]({
                            ...eff.Parametri,
                            Utente: pk,
                            Bersaglio: reqTarget,
                            Partita: this,
                            Logs: this.logs,
                            MossaNome: mossa.Nome
                        });
                    }
                });

                pk.haGiaAgito = true;
                return; // INTERROMPE IL TURNO QUI
            } else {
                // E' il secondo turno: rimuove la carica e sferra finalmente l'attacco!
                pk.statiVolatili.inCarica = false;
                pk.statiVolatili.statoSeminvulnerabile = null;
            }
        }
        // ----------------------------------------------------------

        let isDannoFuturo = mossa.CodiceFunzione && mossa.CodiceFunzione.some(e => e.NomeFunzione === "DannoFuturo");

        if (mossa.Categoria !== 'Stato' && !isDannoFuturo) {
            let multiHitEff = mossa.CodiceFunzione ? mossa.CodiceFunzione.find(eff => eff.NomeFunzione === "ColpiMultipli") : null;
            let hits = multiHitEff ? EffettiModulo.ColpiMultipli({ ...multiHitEff.Parametri }) : 1;

            let totalDanno = 0;
            let actualHits = 0;
            let effectiveness = 1;

            for (let i = 0; i < hits; i++) {
                if (targetPk.hp <= 0) break;

                let dmgResult = this.calcolaDanno(pk, targetPk, mossa, azione.bersaglio);
                let danno = dmgResult.danno;
                effectiveness = dmgResult.effectiveness;

                if (effectiveness === 0) {
                    if (i === 0) this.logs.push(`Non ha effetto su ${targetPk.nome}...|LATO:${latoTarget}`);
                    break;
                }

                if (dmgResult.isCrit) this.logs.push(`Brutto colpo!|LATO:${latoTarget}`);
                if (i === 0 && effectiveness > 1) this.logs.push(`È superefficace!|LATO:${latoTarget}`);
                if (i === 0 && effectiveness < 1 && effectiveness > 0) this.logs.push(`Non è molto efficace...|LATO:${latoTarget}`);

                let isFalseSwipe = mossa.CodiceFunzione && mossa.CodiceFunzione.some(e => e.NomeFunzione === "Lascia1PS");
                let limit = isFalseSwipe ? 1 : 0;

                if (targetPk.statiVolatili && targetPk.statiVolatili.resistenza && (targetPk.hp - danno) <= 0) {
                    limit = targetPk.statiVolatili.resistenza;
                    if (i === 0) this.logs.push(`${targetPk.nome} resiste al colpo!|LATO:${latoTarget}`);
                    targetPk.statiVolatili.resistenza = 0; // Consuma l'effetto
                }

                let vecchiHp = targetPk.hp;
                targetPk.hp = Math.max(limit, targetPk.hp - danno);
                totalDanno += vecchiHp - targetPk.hp;
                actualHits++;

                if (targetPk.hp <= 0 && targetPk.statiVolatili && targetPk.statiVolatili.rancore) {
                    let mPK = pk.mosse.find(m => m.Nome === mossa.Nome);
                    if (mPK) {
                        mPK.ppAttuali = 0;
                        this.logs.push(`I PP di ${mossa.Nome} si sono azzerati a causa di Rancore!|LATO:${latoPk}`);
                    }
                }
            }

            dannoInflittoReale = totalDanno;

            if (actualHits > 1) {
                this.logs.push(`Ha colpito ${actualHits} volte!|LATO:${latoTarget}`);
            }

            if (effectiveness > 0) {
                this.logs.push(`Inflitti ${dannoInflittoReale} danni a ${targetPk.nome}!|LATO:${latoTarget}|HP:${targetPk.hp}`);
            } else {
                pk.haGiaAgito = true;
                return; // Interrompe il turno senza applicare effetti secondari
            }
        }

        if (mossa.CodiceFunzione && mossa.CodiceFunzione.length > 0) {
            const nativeMods = ["ColpiMultipli", "Lascia1PS", "ColpoSicuro", "CalcolaDannoSuDifesaFisica", "ColpoCriticoSicuro", "PotenzaInversaPS", "DannoFisso", "PotenzaVariabile", "ModificaDanno", "AumentaPotenzaInCoro", "PotenzaBasataSuStatistiche", "PotenzaBasataSuPeso", "DannoVariabile", "DannoFuturo"];

            mossa.CodiceFunzione.forEach(eff => {
                if (eff.Parametri && eff.Parametri.Turno === 1) return; // Saltiamo gli effetti già eseguiti nella carica
                if (nativeMods.includes(eff.NomeFunzione)) return; // Ignoriamo i flag perché adesso gestiti nativamente da calcolaDanno

                let bersaglioEffetto = targetPk;
                let reqTarget = (eff.Parametri && eff.Parametri.Bersaglio) ? eff.Parametri.Bersaglio : mossa.Bersaglio;

                // Se il nemico è KO applichiamo solo gli effetti che buffano l'utente
                if (targetPk.hp <= 0 && eff.NomeFunzione !== "MandaKO" && eff.NomeFunzione !== "AzzeraPPSeKO" &&
                    !(reqTarget === 'Utente' || reqTarget === 'LatoUtente' || reqTarget === 'TuttiAlleati' || reqTarget === 'Alleato')) {
                    return;
                }

                if (reqTarget === 'Utente' || reqTarget === 'LatoUtente' || reqTarget === 'Alleato' || reqTarget === 'AlleatoVicino' || reqTarget === 'TuttiAlleati') {
                    bersaglioEffetto = pk;
                } else if (reqTarget === 'Bersaglio' || reqTarget === 'AltroVicino' || reqTarget === 'TuttiNemiciVicini' || reqTarget === 'NemicoVicinoCasuale' || reqTarget === 'TuttiAltriVicini' || reqTarget === 'LatoNemico') {
                    bersaglioEffetto = targetPk;
                }

                let parametriEffetto = {
                    ...eff.Parametri,
                    Utente: pk,
                    Bersaglio: bersaglioEffetto, // Questo è l'oggetto reale del Pokemon
                    DannoInflitto: dannoInflittoReale,
                    Proprietario: azione.proprietario,
                    Avversario: azione.bersaglio,
                    Partita: this,
                    Logs: this.logs,
                    MossaNome: mossa.Nome,
                    Mossa: mossa
                };

                // Evitiamo di sovrascrivere l'oggetto Bersaglio con una stringa,
                // a meno che non sia una delle pochissime funzioni che legge esplicitamente il testo!
                let effettiConStringa = ["ResettaStatistiche", "RimuoviStato", "ProteggiDaArea", "BloccaPriorità"];

                if (effettiConStringa.includes(eff.NomeFunzione) && eff.Parametri && typeof eff.Parametri.Bersaglio === "string") {
                    parametriEffetto.Bersaglio = eff.Parametri.Bersaglio;
                }

                if (EffettiModulo[eff.NomeFunzione]) {
                    let risultato = EffettiModulo[eff.NomeFunzione](parametriEffetto);

                    let esitoLog = risultato ? '✅ APPLICATO' : '❌ FALLITO / NON APPLICABILE';
                    console.log(`[Sistema Effetti] | Mossa: ${mossa.Nome} | Effetto: ${eff.NomeFunzione} | Bersaglio: ${bersaglioEffetto.nome} | Esito: ${esitoLog}`);
                } else {
                    console.warn(`[Sistema Effetti] ATTENZIONE: Funzione ${eff.NomeFunzione} non trovata in EffettiModulo!`);
                }
            });
        }

        if (isDannoFuturo) {
            let effDannoFuturo = mossa.CodiceFunzione.find(e => e.NomeFunzione === "DannoFuturo");
            let turni = effDannoFuturo && effDannoFuturo.Parametri && effDannoFuturo.Parametri.Turni ? effDannoFuturo.Parametri.Turni : 2;
            this.logs.push(`${pk.nome} ha previsto un attacco!`);
            EffettiModulo.DannoFuturo({ Turni: turni, Bersaglio: targetPk, Utente: pk, Mossa: mossa });
        }

        // --- GESTIONE SOSTITUZIONI FORZATE E RITIRATE (Boato, Teletrasporto, Staffetta) ---
        if (targetPk.statiVolatili && targetPk.statiVolatili.forzaSostituzione) {
            targetPk.statiVolatili.forzaSostituzione = false;
            let available = azione.bersaglio.squadra.map((p, i) => ({ p, i })).filter(obj => obj.p.hp > 0 && obj.i !== azione.bersaglio.attivoIdx);
            if (available.length > 0) {
                targetPk.statiVolatili = {};
                targetPk.modificatori = {};
                targetPk.trappoleApplicate = false;
                if (targetPk.tipiOriginali) targetPk.tipi = [...targetPk.tipiOriginali];

                let randomPk = available[Math.floor(Math.random() * available.length)];
                azione.bersaglio.attivoIdx = randomPk.i;
                this.logs.push(`${targetPk.nome} è stato spazzato via!`);
                this.logs.push(`È stato trascinato in campo ${randomPk.p.nome}!`);
                
                let subentrato = azione.bersaglio.squadra[randomPk.i];
                subentrato.statiVolatili = { primoTurnoInCampo: true };
                this.applicaTrappoleAlPokemon(azione.bersaglio, subentrato);
            } else {
                this.logs.push(`Ma fallisce!`);
            }
        }
        if (pk.statiVolatili && pk.statiVolatili.sostituzioneForzata) {
            let prepStaffetta = pk.statiVolatili.preparaStaffetta;
            pk.statiVolatili.sostituzioneForzata = false;
            pk.statiVolatili.preparaStaffetta = false;
            let available = azione.proprietario.squadra.map((p, i) => ({ p, i })).filter(obj => obj.p.hp > 0 && obj.i !== azione.proprietario.attivoIdx);
            if (available.length > 0) {
                let randomPk = available[Math.floor(Math.random() * available.length)];
                let msg = prepStaffetta ? "passa il testimone a" : "torna indietro! Vai,";

                if (!prepStaffetta) {
                    pk.modificatori = {};
                    if (pk.tipiOriginali) pk.tipi = [...pk.tipiOriginali];
                    pk.statiVolatili = {};
                } else {
                    azione.proprietario.squadra[randomPk.i].modificatori = { ...pk.modificatori };
                    pk.modificatori = {};
                    if (pk.tipiOriginali) pk.tipi = [...pk.tipiOriginali];
                    pk.statiVolatili = {};
                }
                
                azione.proprietario.attivoIdx = randomPk.i;
                this.logs.push(`${pk.nome} ${msg} ${randomPk.p.nome}!`);
                
                let subentrato = azione.proprietario.squadra[randomPk.i];
                subentrato.statiVolatili = { primoTurnoInCampo: true };
                this.applicaTrappoleAlPokemon(azione.proprietario, subentrato);
            } else {
                this.logs.push(`Ma fallisce!`);
            }
        }

        pk.haGiaAgito = true; // Necessario per garantire che i tentennamenti contino i turni sfalsati
        pk.ultimaMossaUsata = mossa.Nome;
        this.ultimaMossaGlobale = mossa;
    }

    calcolaDanno(a, d, m, targetPlayer) {
        const livello = a.livello || 50;
        const isFisico = m.Categoria === 'Fisico';

        let att = isFisico ? a.statistiche.attacco : a.statistiche.attaccoSpeciale;
        let dif = isFisico ? d.statistiche.difesa : d.statistiche.difesaSpeciale;

        // Controllo per mosse come Psicoshock
        if (m.CodiceFunzione && m.CodiceFunzione.some(eff => eff.NomeFunzione === "CalcolaDannoSuDifesaFisica")) {
            dif = d.statistiche.difesa;
        }

        let attMod = a.modificatori[isFisico ? 'attacco' : 'attaccospeciale'] || 0;
        let difMod = d.modificatori[m.CodiceFunzione && m.CodiceFunzione.some(e => e.NomeFunzione === "CalcolaDannoSuDifesaFisica") ? 'difesa' : (isFisico ? 'difesa' : 'difesaspeciale')] || 0;

        let isCrit = false;
        let critStage = a.modificatori.tassoCritico || 0;
        if (m.Flags && m.Flags.includes("AltoTassoCritico")) critStage += 1;
        if (a.statiVolatili && a.statiVolatili.prossimoColpoCritico) critStage = 100;
        if (m.CodiceFunzione && m.CodiceFunzione.some(e => e.NomeFunzione === "ColpoCriticoSicuro")) critStage = 100;

        if (critStage >= 3) isCrit = true;
        else if (critStage === 2) isCrit = Math.random() < 0.5;
        else if (critStage === 1) isCrit = Math.random() < 0.125;
        else isCrit = Math.random() < 0.0416;

        // Un colpo critico ignora i cali di attacco dell'utente e gli aumenti di difesa del bersaglio
        if (isCrit) {
            attMod = Math.max(0, attMod);
            difMod = Math.min(0, difMod);
            if (a.statiVolatili) a.statiVolatili.prossimoColpoCritico = false;
        }

        att = Math.floor(att * (attMod >= 0 ? (2 + attMod) / 2 : 2 / (2 - attMod)));
        dif = Math.floor(dif * (difMod >= 0 ? (2 + difMod) / 2 : 2 / (2 - difMod)));
        if (dif === 0) dif = 1;

        let potenzaReale = m.Potenza || 0;
        let moltiplicatoreDanno = 1;
        let dannoFisso = null;

        let ownerD = targetPlayer;
        let ownerA = targetPlayer === this.p1 ? this.p2 : this.p1;

        // Controlla dinamicamente le variazioni di danno previste dal JSON
        if (m.CodiceFunzione) {
            m.CodiceFunzione.forEach(eff => {
                if (eff.NomeFunzione === "DannoFisso") {
                    if (eff.Parametri.Danno) dannoFisso = eff.Parametri.Danno;
                    else if (eff.Parametri.Formula === "LivelloUtente") dannoFisso = a.livello || 50;
                }
                if (eff.NomeFunzione === "PotenzaVariabile" && eff.Parametri.Formula === "25 * (VelocitàBersaglio / VelocitàUtente)") {
                    let velA = this.calcolaVelocitaCorrente(a, ownerA);
                    let velD = this.calcolaVelocitaCorrente(d, ownerD);
                    potenzaReale = Math.min(150, Math.floor(25 * (velD / Math.max(1, velA))));
                    if (potenzaReale === 0) potenzaReale = 1;
                }
                if (eff.NomeFunzione === "PotenzaInversaPS") {
                    let pct = (a.hp / a.hpMax) * 100;
                    if (pct <= 4.17) potenzaReale = 200;
                    else if (pct <= 10.42) potenzaReale = 150;
                    else if (pct <= 20.83) potenzaReale = 100;
                    else if (pct <= 35.42) potenzaReale = 80;
                    else if (pct <= 68.75) potenzaReale = 40;
                    else potenzaReale = 20;
                }
                if (eff.NomeFunzione === "ModificaDanno") {
                    if (EffettiModulo.verificaCondizione(eff.Parametri.Condizione, d, a, this)) {
                        moltiplicatoreDanno *= eff.Parametri.Moltiplicatore;
                    }
                }
                if (eff.NomeFunzione === "AumentaPotenzaInCoro") {
                    potenzaReale = EffettiModulo.AumentaPotenzaInCoro({ Partita: this });
                }
                if (eff.NomeFunzione === "PotenzaBasataSuStatistiche") {
                    potenzaReale = EffettiModulo.PotenzaBasataSuStatistiche({ Utente: a });
                }
                if (eff.NomeFunzione === "DannoVariabile") {
                    potenzaReale = EffettiModulo.DannoVariabile({ ...eff.Parametri, Utente: a });
                }
                if (eff.NomeFunzione === "PotenzaBasataSuPeso") {
                    let velA = this.calcolaVelocitaCorrente(a, ownerA);
                    let velD = this.calcolaVelocitaCorrente(d, ownerD);
                    if (eff.Parametri && eff.Parametri.Formula === "PesoUtenteVsBersaglio") {
                        // Per Pesobomba (Heavy Slam)
                        let ratio = velD / Math.max(1, velA);
                        if (ratio <= 0.2) potenzaReale = 120;
                        else if (ratio <= 0.25) potenzaReale = 100;
                        else if (ratio <= 0.33) potenzaReale = 80;
                        else if (ratio <= 0.5) potenzaReale = 60;
                        else potenzaReale = 40;
                    } else {
                        // Per Colpo Basso (Low Kick)
                        let w = velD;
                        if (w < 50) potenzaReale = 20;
                        else if (w < 80) potenzaReale = 40;
                        else if (w < 110) potenzaReale = 60;
                        else if (w < 150) potenzaReale = 80;
                        else if (w < 200) potenzaReale = 100;
                        else potenzaReale = 120;
                    }
                }
            });
        }

        // Raddoppiamenti progressivi (es. Rotolamento e Tagliofuria)
        // Raddoppiamenti progressivi o incrementi (es. Rotolamento, Tagliofuria, Echeggiavoce)
        if (a.statiVolatili && a.statiVolatili.potenzaConsecutiva && a.statiVolatili.potenzaConsecutiva.mossa === m.Nome) {
            moltiplicatoreDanno *= Math.pow(2, a.statiVolatili.potenzaConsecutiva.contatore - 1);
            let effConsecutiva = m.CodiceFunzione ? m.CodiceFunzione.find(e => e.NomeFunzione === "AumentaPotenzaConsecutiva") : null;
            if (effConsecutiva && effConsecutiva.Parametri) {
                let count = a.statiVolatili.potenzaConsecutiva.contatore - 1;
                if (effConsecutiva.Parametri.Incremento) {
                    potenzaReale += (effConsecutiva.Parametri.Incremento * count);
                    if (effConsecutiva.Parametri.Max && potenzaReale > effConsecutiva.Parametri.Max) potenzaReale = effConsecutiva.Parametri.Max;
                } else if (effConsecutiva.Parametri.Moltiplicatore) {
                    moltiplicatoreDanno *= Math.pow(effConsecutiva.Parametri.Moltiplicatore, count);
                }
            } else {
                moltiplicatoreDanno *= Math.pow(2, a.statiVolatili.potenzaConsecutiva.contatore - 1);
            }
        }

        let isGravitaAttiva = (this.p1.effetti && this.p1.effetti["Gravità"]) || (this.p2.effetti && this.p2.effetti["Gravità"]);
        let hasAbbattimento = d.statiVolatili && d.statiVolatili.abbattimento;

        let effectiveness = 1;
        d.tipi.forEach(tipoDifesa => {
            if (EfficaciaTipi[m.Tipo] && EfficaciaTipi[m.Tipo][tipoDifesa] !== undefined) {
                let eff = EfficaciaTipi[m.Tipo][tipoDifesa];
                if (m.Tipo === "Terra" && tipoDifesa === "Volante" && (isGravitaAttiva || hasAbbattimento)) {
                    eff = 1;
                }
                effectiveness *= eff;
            }
        });

        if (effectiveness === 0) return { danno: 0, effectiveness, isCrit: false };
        if (dannoFisso !== null) return { danno: dannoFisso, effectiveness, isCrit };

        let dannoBase = (((2 * livello / 5 + 2) * potenzaReale * att / dif) / 50) + 2;

        const stab = a.tipi.includes(m.Tipo) ? 1.5 : 1;
        const random = (Math.floor(Math.random() * (100 - 85 + 1)) + 85) / 100;

        // Applica le barriere della squadra in difesa
        let modificatoreSchermo = 1;
        if (!isCrit && targetPlayer && targetPlayer.effetti) {
            if (isFisico && targetPlayer.effetti["Riflesso"]) modificatoreSchermo = 0.5;
            if (!isFisico && targetPlayer.effetti["SchermoLuce"]) modificatoreSchermo = 0.5;
        }

        if (isCrit) modificatoreSchermo *= 1.5;
        if (a.stato === 'Scottatura' && isFisico) modificatoreSchermo *= 0.5; // Il taglio del danno ai bruciati!
        dannoBase *= moltiplicatoreDanno;

        // Meteo boosts / reductions:
        let moltiplicatoreMeteo = 1;
        if (this.meteo === "Pioggia") {
            if (m.Tipo === "Acqua") moltiplicatoreMeteo = 1.5;
            else if (m.Tipo === "Fuoco") moltiplicatoreMeteo = 0.5;
        } else if (this.meteo === "Sole") {
            if (m.Tipo === "Fuoco") moltiplicatoreMeteo = 1.5;
            else if (m.Tipo === "Acqua") moltiplicatoreMeteo = 0.5;
        }

        let dannoFinale = Math.floor(dannoBase * stab * effectiveness * random * modificatoreSchermo * moltiplicatoreMeteo);
        if (dannoFinale < 1 && effectiveness > 0) dannoFinale = 1;

        return { danno: dannoFinale, effectiveness, isCrit };
    }

    applicaEffettiFineTurno() {
        // Decadimento effetti del campo (Schermoluce, Riflesso, Ventoincoda, etc.)
        [this.p1, this.p2].forEach(p => {
            if (p.effetti) {
                for (let eff in p.effetti) {
                    p.effetti[eff]--;
                    if (p.effetti[eff] <= 0) {
                        delete p.effetti[eff];
                        this.logs.push(`L'effetto di ${eff} svanisce.`);
                    }
                }
            }
        });

        if (this.meteo) {
            this.turniMeteo--;
            if (this.turniMeteo <= 0) {
                this.logs.push(`Il meteo ${this.meteo} si è calmato.`);
                this.meteo = null;
            } else {
                if (this.meteo === "TempestaSabbia") this.logs.push(`La tempesta di sabbia infuria!`);
                if (this.meteo === "Pioggia") this.logs.push(`Continua a piovere!`);
                if (this.meteo === "Grandine") this.logs.push(`La grandine continua a cadere!`);
            }
        }

        if (this.meteo === "TempestaSabbia" || this.meteo === "Grandine") {
            [this.p1, this.p2].forEach(p => {
                const pk = p.squadra[p.attivoIdx];
                if (!pk || pk.hp <= 0) return;
                
                let immune = false;
                if (this.meteo === "TempestaSabbia") {
                    if (pk.tipi.includes("Roccia") || pk.tipi.includes("Terra") || pk.tipi.includes("Acciaio")) {
                        immune = true;
                    }
                } else if (this.meteo === "Grandine") {
                    if (pk.tipi.includes("Ghiaccio")) {
                        immune = true;
                    }
                }
                
                if (!immune) {
                    let dannoMeteo = Math.max(1, Math.floor(pk.hpMax / 16));
                    pk.hp = Math.max(0, pk.hp - dannoMeteo);
                    let lato = (p === this.p1) ? 1 : 2;
                    let msgMeteo = this.meteo === "TempestaSabbia" ? 
                        `${pk.nome} è colpito dalla tempesta di sabbia!|LATO:${lato}|HP:${pk.hp}` :
                        `${pk.nome} è colpito dalla grandine!|LATO:${lato}|HP:${pk.hp}`;
                    this.logs.push(msgMeteo);
                }
            });
        }

        [this.p1, this.p2].forEach(p => {
            const pk = p.squadra[p.attivoIdx];
            if (!pk || pk.hp <= 0) return;

            let lato = (p === this.p1) ? 1 : 2;

            if (pk.statiVolatili && pk.statiVolatili.primoTurnoInCampo) {
                pk.statiVolatili.primoTurnoInCampo = false;
            }

            // 1. Problemi di Stato Primari
            if (pk.stato === 'Avvelenamento') {
                const danno = Math.max(1, Math.floor(pk.hpMax / 8));
                pk.hp = Math.max(0, pk.hp - danno);
                this.logs.push(`${pk.nome} subisce danni dal veleno!|LATO:${lato}|HP:${pk.hp}`);
            } else if (pk.stato === 'Iperavvelenamento') {
                pk.contatoriStato = pk.contatoriStato || {};
                let tossina = pk.contatoriStato.tossina || 2;
                const danno = Math.max(1, Math.floor(pk.hpMax * (tossina / 16)));
                pk.hp = Math.max(0, pk.hp - danno);
                this.logs.push(`${pk.nome} subisce gravi danni dal veleno!|LATO:${lato}|HP:${pk.hp}`);
                pk.contatoriStato.tossina = tossina + 1;
            } else if (pk.stato === 'Scottatura') {
                const danno = Math.max(1, Math.floor(pk.hpMax / 8));
                pk.hp = Math.max(0, pk.hp - danno);
                this.logs.push(`${pk.nome} subisce danni dalla scottatura!|LATO:${lato}|HP:${pk.hp}`);
            }

            // 2. Intrappolamento Volatile (Legatutto, Mulinello, ecc.)
            if (pk.statiVolatili && pk.statiVolatili.dannoIntrappolamento && pk.statiVolatili.dannoIntrappolamento.attivo) {
                let dannoTrap = Math.max(1, Math.floor(pk.hpMax * pk.statiVolatili.dannoIntrappolamento.dannoPerTurno));
                pk.hp = Math.max(0, pk.hp - dannoTrap);
                this.logs.push(`${pk.nome} subisce danni perché è intrappolato!|LATO:${lato}|HP:${pk.hp}`);

                pk.statiVolatili.dannoIntrappolamento.turniRimanenti--;
                if (pk.statiVolatili.dannoIntrappolamento.turniRimanenti <= 0) {
                    pk.statiVolatili.dannoIntrappolamento = null;
                    this.logs.push(`${pk.nome} si è liberato!|LATO:${lato}`);
                }
            }

            // 3. Parassiseme
            if (pk.statiVolatili && pk.statiVolatili["Parassiseme"]) {
                let dannoLeech = Math.max(1, Math.floor(pk.hpMax / 8));
                let effDanno = Math.min(pk.hp, dannoLeech);
                pk.hp = Math.max(0, pk.hp - effDanno);
                this.logs.push(`I semi rubano energia a ${pk.nome}!|LATO:${lato}|HP:${pk.hp}`);

                let pAvversario = (p === this.p1) ? this.p2 : this.p1;
                let avversario = pAvversario.squadra[pAvversario.attivoIdx];
                if (avversario && avversario.hp > 0) {
                    avversario.hp = Math.min(avversario.hpMax, avversario.hp + effDanno);
                    let latoOpp = (pAvversario === this.p1) ? 1 : 2;
                    this.logs.push(`${avversario.nome} recupera energia dai semi!|LATO:${latoOpp}|HP:${avversario.hp}`);
                }
            }

            // 4. Acquanello
            if (pk.statiVolatili && pk.statiVolatili["Acquanello"]) {
                let cura = Math.max(1, Math.floor(pk.hpMax / 16));
                pk.hp = Math.min(pk.hpMax, pk.hp + cura);
                this.logs.push(`Il velo d'acqua rigenera i PS di ${pk.nome}!|LATO:${lato}|HP:${pk.hp}`);
            }

            // 5. Sbadiglio (Sonnolenza si trasforma in Sonno)
            if (pk.stato === 'Sonnolenza') {
                if (pk.contatoriStato && pk.contatoriStato.sonnolenzaTurni > 0) {
                    pk.contatoriStato.sonnolenzaTurni--;
                } else {
                    pk.stato = 'Sonno';
                    pk.contatoriStato = pk.contatoriStato || {};
                    pk.contatoriStato.sonno = Math.floor(Math.random() * 3) + 1;
                    this.logs.push(`${pk.nome} si è addormentato per la sonnolenza!|LATO:${lato}`);
                }
            }

            // 6. Ripeti (Encore)
            if (pk.statiVolatili && pk.statiVolatili.ripeti && pk.statiVolatili.ripeti.attivo) {
                pk.statiVolatili.ripeti.turniRimanenti--;
                if (pk.statiVolatili.ripeti.turniRimanenti <= 0) {
                    pk.statiVolatili.ripeti = null;
                    pk.statiVolatili.mossaForzata = null;
                    this.logs.push(`${pk.nome} non deve più ripetere la mossa!|LATO:${lato}`);
                }
            }

            // 7. Danno Futuro (Divinazione)
            if (pk.statiVolatili && pk.statiVolatili.dannoFuturo && pk.statiVolatili.dannoFuturo.attivo) {
                pk.statiVolatili.dannoFuturo.turniRimanenti--;
                if (pk.statiVolatili.dannoFuturo.turniRimanenti <= 0) {
                    this.logs.push(`${pk.nome} subisce l'attacco previsto!|LATO:${lato}`);
                    let mossaFutura = pk.statiVolatili.dannoFuturo.mossa;
                    let origine = pk.statiVolatili.dannoFuturo.origineAttacco;

                    let dmgRes = this.calcolaDanno(origine || pk, pk, mossaFutura, null);
                    pk.hp = Math.max(0, pk.hp - dmgRes.danno);
                    this.logs.push(`Inflitti ${dmgRes.danno} danni a ${pk.nome}!|LATO:${lato}|HP:${pk.hp}`);

                    pk.statiVolatili.dannoFuturo = null;
                }
            }

            // 8. Inibitore
            if (pk.statiVolatili && pk.statiVolatili.inibizione && pk.statiVolatili.inibizione.attivo) {
                pk.statiVolatili.inibizione.turniRimanenti--;
                if (pk.statiVolatili.inibizione.turniRimanenti <= 0) {
                    pk.statiVolatili.inibizione = null;
                    this.logs.push(`${pk.nome} non è più inibito!|LATO:${lato}`);
                }
            }

            // 9. Provocazione
            if (pk.statiVolatili && pk.statiVolatili.provocazione && pk.statiVolatili.provocazione.attivo) {
                pk.statiVolatili.provocazione.turniRimanenti--;
                if (pk.statiVolatili.provocazione.turniRimanenti <= 0) {
                    pk.statiVolatili.provocazione = null;
                    this.logs.push(`${pk.nome} non è più provocato!|LATO:${lato}`);
                }
            }

            // 10. Ultimocanto
            if (pk.statiVolatili && pk.statiVolatili.ultimocanto) {
                pk.statiVolatili.ultimocanto.turniRimanenti--;
                if (pk.statiVolatili.ultimocanto.turniRimanenti <= 0) {
                    pk.hp = 0;
                    this.logs.push(`Il conteggio di Ultimocanto scende a 0! ${pk.nome} va KO!|LATO:${lato}`);
                } else {
                    this.logs.push(`Il conteggio di Ultimocanto per ${pk.nome} è a ${pk.statiVolatili.ultimocanto.turniRimanenti}!|LATO:${lato}`);
                }
            }
        });
    }

    controllaFinePartita() {
        const p1Perso = this.p1.squadra.every(p => p.hp <= 0) || this.p1.haFuggito;
        const p2Perso = this.p2.squadra.every(p => p.hp <= 0) || this.p2.haFuggito;

        if (p1Perso || p2Perso) {
            this.finito = true;
            this.logs.push("La partita è terminata!");
        }
    }

    getMossaForzata(pk) {
        if (pk.statiVolatili) {
            if (pk.statiVolatili.mossaForzata) return pk.statiVolatili.mossaForzata;
        }
        return null;
    }

    ottieniStatoAggiornato() {
        let p1Pk = this.p1.squadra[this.p1.attivoIdx];
        let p2Pk = this.p2.squadra[this.p2.attivoIdx];

        if (p1Pk && !p1Pk.trappoleApplicate && p1Pk.hp > 0) {
            this.applicaTrappoleAlPokemon(this.p1, p1Pk);
        }
        if (p2Pk && !p2Pk.trappoleApplicate && p2Pk.hp > 0) {
            this.applicaTrappoleAlPokemon(this.p2, p2Pk);
        }

        let teamP1 = this.p1.squadra.map(p => ({ nome: p.nome, hp: p.hp, maxHp: p.hpMax, modificatori: p.modificatori || {} }));
        let teamP2 = this.p2.squadra.map(p => ({ nome: p.nome, hp: p.hp, maxHp: p.hpMax, modificatori: p.modificatori || {} }));

        return {
            p1: {
                hp: p1Pk.hp,
                nome: p1Pk.nome,
                mosse: p1Pk.mosse,
                trasformato: !!(p1Pk.statiVolatili && p1Pk.statiVolatili.trasformato),
                mossaForzata: this.getMossaForzata(p1Pk),
                attivoIdx: this.p1.attivoIdx,
                squadra: teamP1,
                sconfitto: this.p1.squadra.every(p => p.hp <= 0) || this.p1.haFuggito
            },
            p2: {
                hp: p2Pk.hp,
                nome: p2Pk.nome,
                mosse: p2Pk.mosse,
                trasformato: !!(p2Pk.statiVolatili && p2Pk.statiVolatili.trasformato),
                mossaForzata: this.getMossaForzata(p2Pk),
                attivoIdx: this.p2.attivoIdx,
                squadra: teamP2,
                sconfitto: this.p2.squadra.every(p => p.hp <= 0) || this.p2.haFuggito
            },
            logs: this.logs,
            finito: this.finito,
            turno: this.turno
        };
    }

    applicaTrappoleAlPokemon(proprietario, pk) {
        if (pk.hp <= 0) return;
        if (pk.trappoleApplicate) return;
        pk.trappoleApplicate = true;

        if (!proprietario.trappole || !proprietario.trappoleAttive) return;

        let lato = (proprietario === this.p1) ? 1 : 2;

        // 1. Fielepunte (Toxic Spikes) assorbimento
        if (pk.tipi.includes("Veleno") && !pk.tipi.includes("Volante")) {
            if (proprietario.trappole["Fielepunte"]) {
                delete proprietario.trappole["Fielepunte"];
                this.logs.push(`Le fielepunte sono state assorbite da ${pk.nome}!|LATO:${lato}`);
                this.aggiornaTrappoleAttive(proprietario);
            }
        } else if (proprietario.trappole["Fielepunte"] && !pk.tipi.includes("Volante") && !pk.tipi.includes("Acciaio")) {
            if (pk.stato === null || pk.stato === undefined) {
                let strati = proprietario.trappole["Fielepunte"];
                if (strati === 1) {
                    pk.stato = "Avvelenamento";
                    this.logs.push(`${pk.nome} è stato avvelenato dalle fielepunte!|LATO:${lato}`);
                } else if (strati >= 2) {
                    pk.stato = "Iperavvelenamento";
                    pk.contatoriStato = pk.contatoriStato || {};
                    pk.contatoriStato.tossina = 2; // Inizia a 2 come da requisiti
                    this.logs.push(`${pk.nome} è stato iperavvelenato dalle fielepunte!|LATO:${lato}`);
                }
            }
        }

        // 2. Levitoroccia (Stealth Rock)
        if (proprietario.trappole["Levitoroccia"]) {
            let effectiveness = 1;
            pk.tipi.forEach(t => {
                if (EfficaciaTipi["Roccia"] && EfficaciaTipi["Roccia"][t] !== undefined) {
                    effectiveness *= EfficaciaTipi["Roccia"][t];
                }
            });
            let quota = 0.125 * effectiveness;
            let danno = Math.max(1, Math.floor(pk.hpMax * quota));
            pk.hp = Math.max(0, pk.hp - danno);
            this.logs.push(`${pk.nome} è colpito dalle pietre appuntite! Perde ${danno} PS.|LATO:${lato}|HP:${pk.hp}`);
            if (pk.hp <= 0) {
                this.logs.push(`${pk.nome} è esausto!|LATO:${lato}`);
                return;
            }
        }

        // 3. Punte (Spikes)
        if (proprietario.trappole["Punte"] && !pk.tipi.includes("Volante")) {
            let strati = proprietario.trappole["Punte"];
            let frazione = 0.125;
            if (strati === 2) frazione = 0.166;
            if (strati >= 3) frazione = 0.25;
            let danno = Math.max(1, Math.floor(pk.hpMax * frazione));
            pk.hp = Math.max(0, pk.hp - danno);
            this.logs.push(`${pk.nome} soffre per le punte! Perde ${danno} PS.|LATO:${lato}|HP:${pk.hp}`);
            if (pk.hp <= 0) {
                this.logs.push(`${pk.nome} è esausto!|LATO:${lato}`);
                return;
            }
        }
    }

    aggiornaTrappoleAttive(proprietario) {
        let attive = false;
        if (proprietario.trappole) {
            for (let k in proprietario.trappole) {
                if (proprietario.trappole[k]) attive = true;
            }
        }
        proprietario.trappoleAttive = attive;
    }
    scegliMossaBotIntelligente(botPk, playerPk, botLati, playerLati) {
        let mosseDisponibili = botPk.mosse.filter(m => m && m.ppAttuali > 0);
        if (mosseDisponibili.length === 0) return { Nome: "Scontro" };

        let mossaMigliore = null;
        let punteggioMassimo = -9999;

        // Valutiamo la % di vita del bot e del nemico
        let botHpPct = botPk.hp / botPk.hpMax;
        let playerHpPct = playerPk.hp / playerPk.hpMax;

        mosseDisponibili.forEach(mossa => {
            let score = 0;

            // ==========================================
            // 1. VALUTAZIONE DANNO DIRETTO (Potenza e Tipi)
            // ==========================================
            if (mossa.Potenza > 0) {
                score += mossa.Potenza; // Base di partenza

                // Calcolo Efficacia
                let efficacia = 1;
                playerPk.tipi.forEach(tipoDifesa => {
                    if (EfficaciaTipi[mossa.Tipo] && EfficaciaTipi[mossa.Tipo][tipoDifesa] !== undefined) {
                        efficacia *= EfficaciaTipi[mossa.Tipo][tipoDifesa];
                    }
                });

                if (efficacia === 0) {
                    score = -1000; // Impossibile colpire, scarta la mossa!
                } else {
                    score *= efficacia; // x2, x4, x0.5 etc.

                    // Bonus Kill (Se stima di poterlo mandare KO, priorità massima)
                    if (efficacia >= 2 && playerHpPct < 0.4) score += 500;
                }

                // STAB (Bonus di tipo)
                if (botPk.tipi.includes(mossa.Tipo)) score *= 1.5;
            }

            // ==========================================
            // 2. VALUTAZIONE EFFETTI SPECIALI (Il vero intelletto)
            // ==========================================
            if (mossa.CodiceFunzione && mossa.CodiceFunzione.length > 0) {
                mossa.CodiceFunzione.forEach(eff => {
                    let p = eff.Parametri || {};

                    switch (eff.NomeFunzione) {

                        // --- STATI PRIMARI (Sonno, Veleno, Paralisi...) ---
                        case "ApplicaStato":
                            if (playerPk.stato) {
                                score -= 500; // Ha già uno status, non spammarlo!
                            } else {
                                if (p.Stato === "Avvelenamento" || p.Stato === "Iperavvelenamento") {
                                    if (playerPk.tipi.includes("Veleno") || playerPk.tipi.includes("Acciaio")) score -= 500;
                                    else score += (playerHpPct > 0.6) ? 150 : 30; // Ottimo se il nemico ha tanta vita
                                } else {
                                    score += 100; // Ottimo rompere le scatole con Sonno/Paralisi
                                }
                            }
                            break;

                        // --- STATI UNICI (Parassiseme, Confusione, Intrappolamento...) ---
                        case "ApplicaStatoUnico":
                        case "Intrappola":
                            let tipoEffetto = p.Tipo || eff.NomeFunzione;
                            if (playerPk.statiVolatili && playerPk.statiVolatili[tipoEffetto]) {
                                score -= 500; // Già applicato
                            } else {
                                if (p.Tipo === "Parassiseme" && playerPk.tipi.includes("Erba")) score -= 500;
                                else score += 120; // Le mosse logoranti piacciono molto all'IA
                            }
                            break;

                        // --- CURE E RIGENERAZIONI ---
                        case "Cura":
                            if (botHpPct > 0.8) {
                                score -= 500; // Inutile curarsi se si è sani
                            } else if (botHpPct < 0.4) {
                                score += 300; // Priorità di sopravvivenza
                            }
                            break;

                        // --- MODIFICA STATISTICHE ---
                        case "ModificaStatistica":
                            let bersaglioEffetto = (p.Bersaglio === "Utente") ? botPk : playerPk;
                            let statMod = bersaglioEffetto.modificatori ? (bersaglioEffetto.modificatori[p.Statistica.toLowerCase()] || 0) : 0;

                            if (p.Bersaglio === "Utente" && p.Gradi > 0) {
                                // Mi sto potenziando
                                if (statMod >= 4) score -= 200; // Già abbastanza boostato
                                else score += 80;
                            } else if (p.Bersaglio !== "Utente" && p.Gradi < 0) {
                                // Sto debuffando il nemico
                                if (statMod <= -4) score -= 200;
                                else score += 70;
                            }
                            break;

                        // --- TRAPPOLE SUL CAMPO (Levitoroccia, Punte...) ---
                        case "PiazzaTrappola":
                            if (playerLati && playerLati.trappole && playerLati.trappole[p.Tipo]) {
                                score -= 500; // Trappola già in campo
                            } else {
                                score += 150; // Ottimo da usare a inizio partita!
                            }
                            break;

                        // --- DANNO CONTRACCOLPO (es. Sdoppiatore) ---
                        case "DannoContraccolpo":
                            if (botHpPct < 0.2) score -= 100; // Evita il suicidio se ha poca vita
                            break;

                        // --- PROTEZIONE E IMMUNITA' ---
                        case "Proteggi":
                        case "ResistiAKO":
                            let contatore = botPk.contatoriStato ? (botPk.contatoriStato.usciteProtezione || 0) : 0;
                            if (contatore > 0) score -= 300; // Fallirà quasi sicuramente, evitala
                            else score += (botHpPct < 0.3) ? 150 : 50;
                            break;
                    }
                });
            }

            // ==========================================
            // 3. FATTORE IMPREVEDIBILITÀ (Jitter)
            // ==========================================
            // Aggiungiamo un leggero valore casuale (0-15) per evitare che il bot faccia SEMPRE
            // la stessa identica sequenza di mosse a parità di punteggio.
            score += Math.floor(Math.random() * 15);

            if (score > punteggioMassimo) {
                punteggioMassimo = score;
                mossaMigliore = mossa;
            }
        });

        // Fallback di sicurezza
        return mossaMigliore || mosseDisponibili[0];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = gestionePartita;
} else {
    window.gestionePartita = gestionePartita;
}
