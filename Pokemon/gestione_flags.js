class GestoreFlags {
    static haFlag(mossa, flagNome) {
        return mossa.Flags && mossa.Flags.includes(flagNome);
    }

    static gestione_altotassocritico(mossa) {
        return this.haFlag(mossa, "AltoTassoCritico");
    }

    static gestione_copiabile(mossa) {
        return this.haFlag(mossa, "Copiabile");
    }

    static gestione_proteggibile(mossa) {
        return this.haFlag(mossa, "Proteggibile");
    }

    static gestione_riflettibile(mossa) {
        return this.haFlag(mossa, "Riflettibile");
    }

    static gestione_scongelautente(mossa) {
        return this.haFlag(mossa, "ScongelaUtente");
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestoreFlags;
} else {
    window.GestoreFlags = GestoreFlags;
}