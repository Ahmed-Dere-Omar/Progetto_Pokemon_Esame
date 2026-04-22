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
    }

    processaTurno(azioneP1, azioneP2) {
        this.logs = [];
        
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

        return this.ottieniStatoAggiornato();
    }

    calcolaVelocitaCorrente(pk) {
        let velBase = pk.statistiche.velocita || pk.statistiche.speed?.base_stat || 50;
        let grado = Math.max(-6, Math.min(6, Math.floor(pk.modificatori?.velocita || 0)));
        let moltiplicatore = grado >= 0 ? (2 + grado) / 2 : 2 / (2 - grado);
        let velFinale = Math.floor(velBase * moltiplicatore);
        if (pk.stato === 'Paralisi') velFinale = Math.floor(velFinale / 2);
        return velFinale;
    }

    determinaOrdine(a1, a2) {
        const pkP1 = this.p1.squadra[this.p1.attivoIdx];
        const pkP2 = this.p2.squadra[this.p2.attivoIdx];

        const mosse = [
            { ...a1, proprietario: this.p1, bersaglio: this.p2, pk: pkP1 },
            { ...a2, proprietario: this.p2, bersaglio: this.p1, pk: pkP2 }
        ];

        // Rimuoviamo eventuali azioni con mosse non valide prima di ordinarle
        const mosseValide = mosse.filter(azione => {
            if (!azione.mossa) {
                this.logs.push(`${azione.pk.nome} tentenna confuso... (Mossa non trovata nel DB!)`);
                return false;
            }
            return true;
        });

        return mosseValide.sort((a, b) => {
            let prioA = a.mossa.Priorità || 0;
            let prioB = b.mossa.Priorità || 0;
            if (prioA !== prioB) {
                return prioB - prioA;
            }
            const velA = a.pk.statistiche.velocita * (a.pk.modificatori.velocita || 1);
            const velB = b.pk.statistiche.velocita * (b.pk.modificatori.velocita || 1);
            return velB - velA;
        });
    }

    eseguiAzione(azione) {
        const { pk, bersaglio, mossa } = azione;
        let targetPk = bersaglio.squadra[bersaglio.attivoIdx];

        if (pk.hp <= 0 || targetPk.hp <= 0) return;

        if (GestoreFlagsModulo.gestione_scongelautente(mossa) && pk.stato === 'Congelato') {
            pk.stato = null;
            this.logs.push(`${pk.nome} si è scongelato usando ${mossa.Nome}!`);
        }

        if (pk.stato === 'Congelato') {
            this.logs.push(`${pk.nome} è congelato e non può attaccare!`);
            return;
        }

        this.logs.push(`${pk.nome} usa ${mossa.Nome}!`);

        if (GestoreFlagsModulo.gestione_proteggibile(mossa) && targetPk.protetto) {
            this.logs.push(`${targetPk.nome} si è protetto!`);
            return;
        }

        if (GestoreFlagsModulo.gestione_riflettibile(mossa) && targetPk.riflette) {
            this.logs.push(`${targetPk.nome} riflette la mossa!`);
            targetPk = pk;
        }
        let dannoInflittoReale = 0;
        if (mossa.Categoria !== 'Stato') {
            const danno = this.calcolaDanno(pk, targetPk, mossa);
            let vecchiHp = targetPk.hp;
            targetPk.hp = Math.max(0, targetPk.hp - danno);
            dannoInflittoReale = vecchiHp - targetPk.hp;
            this.logs.push(`Inflitti ${dannoInflittoReale} danni a ${targetPk.nome}!`);
        }

        if (mossa.CodiceFunzione && mossa.CodiceFunzione.length > 0) {
            mossa.CodiceFunzione.forEach(eff => {
                console.log(`[Sistema Effetti] Lancio effetto: ${eff.NomeFunzione} da mossa ${mossa.Nome}`, eff.Parametri);
                
                if (EffettiModulo[eff.NomeFunzione]) {
                    let risultato = EffettiModulo[eff.NomeFunzione]({
                        ...eff.Parametri,
                        Utente: pk,
                        Bersaglio: targetPk,
                        DannoInflitto: dannoInflittoReale, // Utile per effetti come AssorbiPS o DannoContraccolpo
                        Logs: this.logs // FONDAMENTALE: collega i log visivi all'interfaccia
                    });
                    
                    console.log(`[Sistema Effetti] Esito ${eff.NomeFunzione}: ${risultato ? 'SUCCESSO' : 'FALLITO/NON APPLICABILE'}`);
                } else {
                    console.warn(`[Sistema Effetti] ATTENZIONE: Funzione ${eff.NomeFunzione} non trovata in EffettiModulo!`);
                }
            });
        }
    }

    calcolaDanno(a, d, m) {
        const livello = a.livello || 50;
        const att = m.Categoria === 'Fisico' ? a.statistiche.attacco : a.statistiche.attaccoSpeciale;
        const dif = m.Categoria === 'Fisico' ? d.statistiche.difesa : d.statistiche.difesaSpeciale;
        
        let dannoBase = (((2 * livello / 5 + 2) * (m.Potenza || 0) * att / dif) / 50) + 2;
        
        const stab = a.tipi.includes(m.Tipo) ? 1.5 : 1;
        const random = (Math.floor(Math.random() * (100 - 85 + 1)) + 85) / 100;
        
        let effectiveness = 1;
        d.tipi.forEach(tipoDifesa => {
            if (EfficaciaTipi[m.Tipo] && EfficaciaTipi[m.Tipo][tipoDifesa] !== undefined) {
                effectiveness *= EfficaciaTipi[m.Tipo][tipoDifesa];
            }
        });
        
        if (effectiveness > 1) this.logs.push("È superefficace!");
        else if (effectiveness < 1 && effectiveness > 0) this.logs.push("Non è molto efficace...");
        else if (effectiveness === 0) this.logs.push("Non ha effetto...");

        return Math.floor(dannoBase * stab * effectiveness * random);
    }

    applicaEffettiFineTurno() {
        [this.p1, this.p2].forEach(p => {
            const pk = p.squadra[p.attivoIdx];
            if (pk.stato === 'Avvelenato') {
                const danno = Math.floor(pk.hpMax / 8);
                pk.hp = Math.max(0, pk.hp - danno);
                this.logs.push(`${pk.nome} subisce danni dal veleno!`);
            }
        });
    }

    controllaFinePartita() {
        const p1Perso = this.p1.squadra.every(p => p.hp <= 0);
        const p2Perso = this.p2.squadra.every(p => p.hp <= 0);

        if (p1Perso || p2Perso) {
            this.finito = true;
            this.logs.push("La partita è terminata!");
        }
    }

    ottieniStatoAggiornato() {
        return {
            p1: { hp: this.p1.squadra[this.p1.attivoIdx].hp, attivo: this.p1.attivoIdx },
            p2: { hp: this.p2.squadra[this.p2.attivoIdx].hp, attivo: this.p2.attivoIdx },
            logs: this.logs,
            finito: this.finito,
            turno: this.turno
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = gestionePartita;
} else {
    window.gestionePartita = gestionePartita;
}
