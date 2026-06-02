import { InputConfig } from './tasti_input.js';

// 1. INIZIALIZZA SUPABASE
const supabaseUrl = 'https://zlmjvbtmzkphkdfspcht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbWp2YnRtemtwaGtkZnNwY2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDA4NDUsImV4cCI6MjA5MjMxNjg0NX0.j6aRmC3tTrFiZj62WrEmSKkuICoBHagFzKS3b8_adeM';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==============================================================================
// TRUCCO GLOBALE ANTI-RACE CONDITION
// Memorizziamo SE QUESTA SPECIFICA SCHEDA è quella aperta dalla mail.
// ==============================================================================
window.isRecoveryLink = window.location.href.includes('type=recovery');

// FUNZIONE HELPER: Rilevamento touch
const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
};

// ==============================================================================
// BANNER GLOBALE (Per avvisi in tutte le scene)
// ==============================================================================

window.showBanner = function (testo, isError = true) {
    let old = document.getElementById('global-banner');
    if (old) old.remove();

    let banner = document.createElement('div');
    banner.id = 'global-banner';
    banner.style.position = 'absolute';
    banner.style.top = '20px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%) translateY(-20px)';
    banner.style.backgroundColor = isError ? '#ff7477' : '#4caf50'; // Rosso o verde
    banner.style.color = '#fff';
    banner.style.padding = '15px 30px';
    banner.style.border = '4px solid #fff';
    banner.style.borderRadius = '8px';
    banner.style.fontFamily = "'Courier New', Courier, monospace";
    banner.style.fontWeight = 'bold';
    banner.style.fontSize = '1.3rem';
    banner.style.zIndex = '10000';
    banner.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.5)';
    banner.style.transition = 'all 0.3s ease-out';
    banner.style.opacity = '0';
    banner.innerText = testo;

    document.getElementById('game-container').appendChild(banner);

    // Animazione entrata
    setTimeout(() => {
        banner.style.transform = 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
    }, 10);

    // Animazione uscita
    setTimeout(() => {
        if (document.body.contains(banner)) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => banner.remove(), 300);
        }
    }, 2500);
};
// ==============================================================================
// CONTROLLO MULTI-FINESTRA (Previene corruzione salvataggi PvE)
// ==============================================================================
const multiTabChannel = new BroadcastChannel('neomon_session');
multiTabChannel.onmessage = (event) => {
    if (event.data === 'new_login') {
        // Distrugge il gioco in questa scheda sostituendo tutto l'HTML, 
        // ma NON fa il logout da Supabase!
        document.body.innerHTML = `
            <div style="background-color: #3E1E68; color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Courier New', monospace;">
                <h1 style="font-size: 3rem; text-shadow: 2px 2px 0px #000; color: #ff7477;">GIOCO SOSPESO</h1>
                <h2 style="margin-top: 20px;">Hai aperto Neomon in un'altra finestra.</h2>
                <p>Puoi chiudere questa scheda in modo sicuro.</p>
            </div>
        `;
    }
};
// ==============================================================================
// PARTE 2: SCENE DI PHASER
// ==============================================================================

// 1. BOOT SCENE: Carica i file e mappa i DB
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.load.json('pokemonDB', 'DB/DB_pokemon.json');
        this.load.json('moveDB', 'DB/DB_mosse.json');

        this.load.tilemapTiledJSON('map', 'assets/mappa.tmj');
        this.load.tilemapTiledJSON('mapPVE', 'assets/mappaPVE.tmj');
        this.load.tilemapTiledJSON('mapPVE2', 'assets/mappaPVE2.tmj');
        this.load.tilemapTiledJSON('mapPvP', 'assets/mappaPvP.tmj');
        this.load.tilemapTiledJSON('mapCPK', 'assets/mappaCPK.tmj');
        this.load.image('tilesA', 'assets/a.png');
        this.load.image('tilesE', 'assets/e.png');
        this.load.image('tilesC', 'assets/c.png');
        this.load.image('tilesD', 'assets/d.png');
        this.load.spritesheet('avatar', 'assets/avatar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar2', 'assets/avatar2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar3', 'assets/avatar3.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar4', 'assets/avatar4.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar5', 'assets/avatar5.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar6', 'assets/avatar6.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('allenatore', 'assets/npc.png');
        this.load.image('nurse', 'assets/nurse.png');
    }

    create() {
        let pDB = {};
        this.cache.json.get('pokemonDB').forEach(p => pDB[p.nome] = p);
        this.registry.set('pokemonDB', pDB);

        let mDB = {};
        this.cache.json.get('moveDB').forEach(m => mDB[m.Nome] = m);
        this.registry.set('moveDB', mDB);

        this.scene.start('LoginScene');
    }
}

// 2. LOGIN SCENE
class LoginScene extends Phaser.Scene {
    constructor() { super({ key: 'LoginScene' }); }

    create() {
        this.isLoginMode = true;
        this.isStarting = false;
        this.authEventBlocked = false;
        // NUOVO SCUDO: Dice alla vecchia scheda di farsi gli affari suoi!
        this.isWaitingForReset = false;

        const html = `
            <div id="login-container">
                <h1 class="text-shadows" style="font-size: 5rem; margin-bottom: 0;">NEOMON</h1>
                <h2 style="font-size: 2rem; letter-spacing: 10px; margin-top: 0; color: #fff;">MULTIPLAYER</h2>
                
                <div id="form-box" style="display: flex; flex-direction: column; align-items: center;">
                    <input type="text" id="username-input" placeholder="NICKNAME..." autocomplete="off" 
                        style="display: none; width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; margin-top: 20px; outline: none;">
                    
                    <input type="email" id="email-input" placeholder="EMAIL..." autocomplete="off" 
                        style="width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; margin-top: 20px; outline: none;">
                    
                    <input type="password" id="password-input" placeholder="PASSWORD..." 
                        style="width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; margin-top: 10px; outline: none;">
                    
                    <p id="forgot-btn" style="color: #b5d6d6; font-family: 'Courier New', monospace; font-size: 0.9rem; margin-top: 5px; cursor: pointer; text-decoration: underline;">Hai dimenticato la password?</p>

                    <button id="main-btn" style="width: 338px; padding: 15px; margin-top: 15px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597;">ACCEDI</button>
                    
                    <button id="google-btn" style="width: 338px; padding: 15px; margin-top: 10px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #ffffff; color: #4285F4; border: 4px solid #4285F4; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #a0c1f9; display: flex; align-items: center; justify-content: center;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" style="width: 20px; margin-right: 10px;"> ACCEDI CON GOOGLE
                    </button>

                    <p id="toggle-mode" style="color: #fff; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 20px; cursor: pointer; text-decoration: underline;">Nuovo allenatore? Registrati</p>
                    
                    <p id="auth-msg" style="color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 10px; text-align: center;"></p>
                </div>
            </div>`;

        let dom = this.add.dom(500, 400).createFromHTML(html);

        if (window.location.href.includes('error=')) {
            let params = new URLSearchParams(window.location.hash.substring(1) || window.location.search.substring(1));
            let errorMsg = params.get('error_description') || "Link non valido o scaduto.";
            dom.getChildByID('auth-msg').innerText = "ERRORE: " + errorMsg.replace(/\+/g, ' ') + "\nRichiedi un nuovo link.";
            window.history.replaceState(null, null, window.location.pathname);
            return;
        }

        if (window.isRecoveryLink) {
            this.mostraSchermataRecupero(dom);
        }

        const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                if (window.isRecoveryLink) {
                    this.authEventBlocked = true;
                    if (!this.isStarting) this.mostraSchermataRecupero(dom);
                }
            }
            else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (session && !window.isRecoveryLink && !this.isStarting) {
                    // LA MAGIA E' QUI: Se la vecchia scheda stava aspettando il reset, ignora la sessione!
                    if (this.isWaitingForReset) return;

                    this.mostraTestoCaricamento();
                    this.avviaGioco(session.user, dom);
                }
            }
        });
        this.authSubscription = authListener.subscription;

        if (!window.isRecoveryLink) {
            supabaseClient.auth.getSession().then(({ data }) => {
                if (data.session && !window.isRecoveryLink && !this.isStarting && !this.isWaitingForReset) {
                    this.mostraTestoCaricamento();
                    this.avviaGioco(data.session.user, dom);
                }
            });
        }

        dom.addListener('click').on('click', async (e) => {
            if (!['main-btn', 'google-btn', 'toggle-mode', 'forgot-btn'].includes(e.target.id) && e.target.parentElement?.id !== 'google-btn') return;

            let msgLabel = dom.getChildByID('auth-msg');
            let emailEl = dom.getChildByID('email-input');
            let emailInput = emailEl ? emailEl.value.trim() : '';

            // --- PASSWORD DIMENTICATA ---
            if (e.target.id === 'forgot-btn') {
                if (!emailInput) { msgLabel.innerText = "Inserisci l'email qui sopra per recuperarla!"; return; }
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(emailInput)) { msgLabel.innerText = "Formato email non valido!"; return; }

                // ALZIAMO LO SCUDO: Da questo momento, questa scheda ignorerà ogni login automatico!
                this.isWaitingForReset = true;

                msgLabel.innerText = "Verifica account...";
                e.target.disabled = true;

                const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput);

                if (error) {
                    if (error.message.includes('rate limit')) msgLabel.innerText = "Troppi tentativi. Riprova tra un'ora!";
                    else if (error.message.includes('not found') || error.message.includes('User not')) msgLabel.innerText = "Nessun allenatore trovato con questa email.";
                    else msgLabel.innerText = "Errore: " + error.message;
                } else {
                    msgLabel.innerText = "Se l'email esiste, riceverai un link a breve!";
                }
                setTimeout(() => { e.target.disabled = false; }, 3000);
                return;
            }

            // ABBASSANO LO SCUDO SE L'UTENTE CAMBIA IDEA E CLICCA UN ALTRO TASTO:
            if (e.target.id === 'google-btn' || e.target.parentElement.id === 'google-btn') {
                this.isWaitingForReset = false;
                msgLabel.innerText = "Reindirizzamento a Google...";
                await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
                return;
            }

            if (e.target.id === 'toggle-mode') {
                this.isWaitingForReset = false;
                this.isLoginMode = !this.isLoginMode;
                dom.getChildByID('username-input').style.display = this.isLoginMode ? 'none' : 'block';
                dom.getChildByID('forgot-btn').style.display = this.isLoginMode ? 'block' : 'none';

                let btn = dom.getChildByID('main-btn');
                btn.innerText = this.isLoginMode ? 'ACCEDI' : 'REGISTRATI';
                btn.style.backgroundColor = this.isLoginMode ? '#f6eedf' : '#e69597';
                btn.style.color = this.isLoginMode ? '#ff7477' : '#fff';
                dom.getChildByID('toggle-mode').innerText = this.isLoginMode ? 'Nuovo allenatore? Registrati' : 'Hai già un account? Accedi';
                msgLabel.innerText = '';
                return;
            }

            if (e.target.id === 'main-btn') {
                this.isWaitingForReset = false;
                let pwdEl = dom.getChildByID('password-input');
                let usrEl = dom.getChildByID('username-input');
                let password = pwdEl ? pwdEl.value.trim() : '';
                let username = usrEl ? usrEl.value.trim() : '';

                if (!emailInput || !password) { msgLabel.innerText = "Inserisci email e password!"; return; }
                if (!this.isLoginMode && !username) { msgLabel.innerText = "Scegli un Nickname per giocare!"; return; }

                msgLabel.innerText = "Attendere...";

                if (!this.isLoginMode) {
                    const { error } = await supabaseClient.auth.signUp({
                        email: emailInput, password: password, options: { data: { username: username } }
                    });
                    if (error) msgLabel.innerText = "Errore: " + error.message;
                    else {
                        msgLabel.innerText = "Registrazione OK! Ora accedi.";
                        dom.getChildByID('toggle-mode').click();
                    }
                } else {
                    const { error } = await supabaseClient.auth.signInWithPassword({ email: emailInput, password: password });
                    if (error) msgLabel.innerText = "Errore: Credenziali errate.";
                    // Se OK, la "spia" di onAuthStateChange rileverà SIGNED_IN e ti butterà in gioco.
                }
            }
        });
    }

    mostraTestoCaricamento() {
        let container = document.getElementById('login-container');
        if (container) {
            container.innerHTML = `
                <h1 class="text-shadows" style="font-size: 5rem; margin-bottom: 0;">NEOMON</h1>
                <h2 style="font-size: 2rem; color: #fff; font-family: 'Courier New';">Bentornato! Accesso in corso...</h2>
            `;
        }
    }

    mostraSchermataRecupero(dom) {
        let container = document.getElementById('login-container');
        container.innerHTML = `
            <h1 class="text-shadows" style="font-size: 4rem; margin-bottom: 0;">RECUPERO</h1>
            <h2 style="font-size: 1.5rem; color: #fff; font-family: 'Courier New'; text-align: center; margin-top: 10px;">Inserisci la tua nuova password:</h2>
            <input type="password" id="new-password-input" placeholder="NUOVA PASSWORD..." autocomplete="off" 
                style="width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; margin-top: 20px; outline: none;">
            <button id="save-pwd-btn" style="width: 338px; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597;">SALVA</button>
            <p id="pwd-msg" style="color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 15px; text-align: center;"></p>
        `;

        let btn = document.getElementById('save-pwd-btn');
        btn.addEventListener('click', async () => {
            let newPwd = document.getElementById('new-password-input').value.trim();
            let msg = document.getElementById('pwd-msg');

            if (newPwd.length < 6) { msg.innerText = "La password deve avere almeno 6 caratteri!"; return; }

            msg.innerText = "Salvataggio in corso...";
            const { error } = await supabaseClient.auth.updateUser({ password: newPwd });

            if (error) {
                msg.innerText = "Errore: " + error.message;
            } else {
                msg.innerText = "Password aggiornata! Accesso in corso...";

                // Puliamo l'URL e abbassiamo il semaforo globale
                window.history.replaceState(null, null, window.location.pathname);
                window.isRecovery = false;

                setTimeout(() => {
                    supabaseClient.auth.getSession().then(({ data }) => {
                        if (data.session) this.avviaGioco(data.session.user, dom);
                    });
                }, 1500);
            }
        });
    }

    async avviaGioco(user, dom) {
        if (this.isStarting) return;
        this.isStarting = true;
        multiTabChannel.postMessage('new_login');
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
            this.authSubscription = null;
        }

        // 1. RECUPERO PROFILO
        let profiloUtente = null;
        for (let i = 0; i < 3; i++) {
            const { data: profile } = await supabaseClient.from('profilo').select('*').eq('id_utente', user.id).single();
            if (profile) { profiloUtente = profile; break; }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!profiloUtente) return;
        this.registry.set('playerProfile', profiloUtente);

        // 2. RECUPERO POKÉMON
        let { data: myPokemon } = await supabaseClient
            .from('pokemon')
            .select('*')
            .eq('id_profilo_proprietario', profiloUtente.id_profilo)
            .order('posizione_slot', { ascending: true });

        let isNewPlayer = (!myPokemon || myPokemon.length === 0);

        // --- GENERAZIONE AUTOMATICA SE NUOVO ---
        if (isNewPlayer) {
            let pkmnDB = this.registry.get('pokemonDB');
            let randomTre = [...Object.keys(pkmnDB)].sort(() => 0.5 - Math.random()).slice(0, 3);
            let nuoviStarter = randomTre.map((nome, idx) => ({
                id_specie: nome,
                id_profilo_proprietario: profiloUtente.id_profilo,
                in_squadra: true,
                posizione_slot: idx + 1
            }));

            const { data: inseriti } = await supabaseClient.from('pokemon').insert(nuoviStarter).select();
            myPokemon = inseriti;
        }

        this.registry.set('userPokemon', myPokemon || []);
        let nomeFinal = profiloUtente.username.toUpperCase();
        // Accende i controlli se si è da smartphone
        if (isTouchDevice() || window.innerWidth <= 1024) {
            let controls = document.getElementById('mobile-controls');
            if (controls) controls.style.display = 'flex';
        }
        // 3. REINDIRIZZAMENTO
        if (isNewPlayer) {
            // Se è nuovo, gli mostriamo cosa ha ricevuto
            if (dom) dom.destroy();
            this.scene.start('StarterScene', { name: nomeFinal, user: user, starters: myPokemon });
        } else {
            // Se è vecchio, dritto in mappa (SEMPRE NELLA LOBBY)
            setTimeout(() => {
                if (dom) dom.destroy();
                this.scene.start('WorldScene', { name: nomeFinal, user: user });
            }, 200);
        }
    }

    // Funzione per gestire il cambio Nickname se necessario
    async mostraSceltaNickname(user, profilo, pkmnList, dom) {
        if (dom) dom.destroy();
        let nameHtml = `
            <div id="login-container">
                <h1 class="text-shadows" style="font-size: 3rem; margin-bottom: 0;">BENVENUTO!</h1>
                <h2 style="font-size: 1.5rem; color: #fff; font-family: 'Courier New'; text-align: center;">Scegli il tuo Nickname da Allenatore:</h2>
                <input type="text" id="new-username" placeholder="${profilo.username}" style="width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; outline: none; margin-top: 20px;">
                <button id="save-name-btn" style="width: 338px; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597;">CONFERMA</button>
                <p id="name-msg" style="color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 10px;"></p>
            </div>`;

        let nameDom = this.add.dom(500, 400).createFromHTML(nameHtml);

        nameDom.addListener('click').on('click', async (e) => {
            if (e.target.id === 'save-name-btn') {
                let newName = nameDom.getChildByID('new-username').value.trim();
                if (!newName) return;

                const { error } = await supabaseClient.from('profilo').update({ username: newName }).eq('id_profilo', profilo.id_profilo);
                if (error) {
                    nameDom.getChildByID('name-msg').innerText = "Nome già in uso!";
                } else {
                    nameDom.destroy();
                    this.indirizzaGiocatore(newName.toUpperCase(), user, pkmnList);
                }
            }
        });
    }

    indirizzaGiocatore(nome, user, pkmnList) {
        if (isTouchDevice() || window.innerWidth <= 1024) {
            let controls = document.getElementById('mobile-controls');
            if (controls) controls.style.display = 'flex';
        }
        if (pkmnList.length === 0) {
            console.log("Nuovo giocatore: Reindirizzo alla scelta dello Starter");
            // Manda l'utente alla nuova schermata di selezione!
            this.scene.start('StarterScene', { name: nome, user: user });
        } else {
            console.log(`Bentornato ${nome}! Squadra caricata.`);
            this.scene.start('WorldScene', { name: nome, user: user });
        }
    }
}
// ==============================================================================
// SCENA STARTER: Scelta del primo Pokémon
// ==============================================================================
class StarterScene extends Phaser.Scene {
    constructor() { super({ key: 'StarterScene' }); }

    init(data) {
        this.user = data.user;
        this.playerName = data.name;
        this.starters = data.starters || [];
    }

    create() {
        const pkmnDB = this.registry.get('pokemonDB');

        let html = `
            <div style="background-color: #3E1E68; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1000px; height: 800px; box-sizing: border-box;">
                <h1 class="text-shadows" style="font-size: 3.5rem; margin-bottom: 20px;">PACCHETTO BENVENUTO!</h1>
                <h2 style="color: #fff; font-family: 'Courier New'; margin-bottom: 40px; text-align: center;">Ecco i tuoi primi compagni di avventura:</h2>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 50px;">
        `;

        this.starters.forEach(p => {
            let pData = pkmnDB[p.id_specie];
            let sprite = pData?.sprite?.normal || '';
            html += `
                <div style="background: var(--battle-panel); border: 4px solid var(--color-secondary); border-radius: 12px; padding: 20px; text-align: center; width: 180px; box-shadow: 6px 6px 0 var(--battle-shadow-heavy);">
                    <img src="${sprite}" style="width: 130px; height: 130px; image-rendering: pixelated; filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.5));">
                    <h2 style="color: var(--battle-accent); font-family: 'Courier New'; margin-top: 15px; font-size: 1.2rem;">${p.id_specie.toUpperCase()}</h2>
                </div>
            `;
        });

        html += `
                </div>
                <button id="start-adventure-btn" style="padding: 20px 50px; font-size: 1.8rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #e69597;">INIZIA L'AVVENTURA!</button>
            </div>
        `;

        let dom = this.add.dom(500, 400).createFromHTML(html);

        dom.addListener('click').on('click', (e) => {
            if (e.target.id === 'start-adventure-btn') {
                dom.destroy();
                this.scene.start('WorldScene', { name: this.playerName, user: this.user });
            }
        });
    }
}
// 3. WORLD SCENE: Mappa e Multiplayer
class WorldScene extends Phaser.Scene {
    constructor() { super({ key: 'WorldScene' }); }
    init(data) {
        this.myPlayerName = data.name;
        this.vengoDa = data.vengoDa; // Registra da quale porta stai uscendo
    }
    create() {
        let profilo = this.registry.get('playerProfile');
        let avatarNum = profilo ? (profilo.avatar_sprite || 1) : 1;
        this.textureKey = avatarNum == 1 ? 'avatar' : `avatar${avatarNum}`;

        this.player = null;
        this.playerNameText = null;
        this.npc = null;
        this.isMovingGrid = false;

        this.setupMap();
        this.setupAnimations(); // <-- CORRETTO
        this.setupNPCs();
        this.setupPlayer();

        this.keys = this.input.keyboard.addKeys(InputConfig);
        this.isPaused = false;
        this.pauseMenuDom = null;
        this.pcOpen = false;
        this.isDialogActive = false;

        this.canEncounter = true;
        this.isTransitioning = false;

        this.events.on('resume', () => {
            this.keys.LEFT.reset(); this.keys.RIGHT.reset();
            this.keys.UP.reset(); this.keys.DOWN.reset();
            this.keys.A.reset(); this.keys.D.reset();
            this.keys.W.reset(); this.keys.S.reset();
            this.canEncounter = false;
            setTimeout(() => { this.canEncounter = true; }, 1500);
            this.registry.set('lastBattleResult', null);
        });
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'map' });

        // I parametri sono: (nome_tileset, chiave_asset, tileWidth, tileHeight, margin, spacing)
        // Impostiamo spacing a 1 per allineare perfettamente i disegni di Pokémon FireRed
        const tilesetA = map.addTilesetImage('a', 'tilesA', 16, 16, 1, 1);
        const tilesetB = map.addTilesetImage('e', 'tilesE', 16, 16, 0, 0);
        const tilesetC = map.addTilesetImage('c', 'tilesC', 16, 16, 1, 1);
        const tilesetD = map.addTilesetImage('d', 'tilesD', 16, 16, 1, 1);

        const allTilesets = [tilesetA, tilesetB, tilesetC, tilesetD];

        // Caricamento dei layer definiti in Tiled
        map.createLayer('Sfondo', allTilesets, 0, 0);
        this.wallLayer = map.createLayer('Ostacoli', allTilesets, 0, 0);
        this.grassLayer = map.createLayer('Erba', allTilesets, 0, 0);

        // Dimensioni fisiche del mondo
        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // Collisioni (tutti i tile tranne quelli vuoti)
        this.wallLayer.setCollisionByExclusion([-1]);

        // Setup delle zone interattive (PC, porte, ecc.)
        this.zoneInterattive = [];
        const objLayer = map.getObjectLayer('Interazioni');
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                let zone = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0);
                zone.nomeInterazione = obj.name;
                this.zoneInterattive.push(zone);
            });
        }
    }

    setupNPCs() {
        this.npc = this.physics.add.sprite(280, 184, 'allenatore');
        this.npc.setScale(1);
        this.npc.body.updateFromGameObject();
        this.npc.setCollideWorldBounds(true);
        this.npc.setImmovable(true);
        this.physics.add.collider(this.npc, this.wallLayer);
    }



    setupAnimations() {
        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
        ['down', 'left', 'right', 'up'].forEach((key, i) => {
            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
        });
    }

    setupPlayer() {
        let startX = 64;
        let startY = 64;
        let startAnim = 'down';

        if (this.vengoDa && this.zoneInterattive) {
            let porta = this.zoneInterattive.find(z => z.nomeInterazione === this.vengoDa);
            if (porta) {
                startX = porta.x + (porta.width || 16) / 2;
                startY = porta.y + 32;
                startAnim = 'down';
            }
        }

        this.player = this.physics.add.sprite(startX, startY, this.textureKey).setCollideWorldBounds(true);
        this.player.setScale(0.5);
        this.player.body.setSize(32, 32).setOffset(16, 32);
        this.player.setDepth(10);

        this.player.anims.play(startAnim, true);
        this.player.anims.stop();

        this.physics.add.collider(this.player, this.wallLayer);
        if (this.npc) this.physics.add.collider(this.player, this.npc);

        this.cameras.main.startFollow(this.player, true).setZoom(4).setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL) && !this.isTransitioning && !this.pcOpen && !this.isDialogActive) {
            this.togglePauseMenu();
        }

        if (this.isTransitioning || !this.player || this.isPaused || this.pcOpen || this.isMovingGrid || this.isDialogActive) return;

        const TILE_SIZE = 16;

        let currentAnim = null;
        let dx = 0;
        let dy = 0;

        if (this.keys.LEFT.isDown || this.keys.A.isDown) { dx = -TILE_SIZE; currentAnim = 'left'; }
        else if (this.keys.RIGHT.isDown || this.keys.D.isDown) { dx = TILE_SIZE; currentAnim = 'right'; }
        else if (this.keys.UP.isDown || this.keys.W.isDown) { dy = -TILE_SIZE; currentAnim = 'up'; }
        else if (this.keys.DOWN.isDown || this.keys.S.isDown) { dy = TILE_SIZE; currentAnim = 'down'; }

        if (dx !== 0 || dy !== 0) {
            let targetX = this.player.x + dx;
            let targetY = this.player.y + dy;

            this.player.anims.play(currentAnim, true);

            let isOutOfBounds = targetX < 0 || targetX >= this.mapWidth || targetY < 0 || targetY >= this.mapHeight;
            let ostacolo = this.wallLayer.getTileAtWorldXY(targetX, targetY, true);
            let isWall = (ostacolo && ostacolo.index !== -1);
            let isNpc = this.npc ? Phaser.Math.Distance.Between(targetX, targetY, this.npc.x, this.npc.y) < 16 : false;

            if (!isWall && !isNpc && !isOutOfBounds) {
                this.isMovingGrid = true;

                this.tweens.add({
                    targets: this.player,
                    x: targetX,
                    y: targetY,
                    duration: 250,
                    onComplete: () => {
                        this.isMovingGrid = false;
                        this.player.anims.stop();

                        let grassTile = this.grassLayer.getTileAtWorldXY(targetX, targetY, true);
                        if (this.canEncounter && grassTile && grassTile.index !== -1) {
                            if (Phaser.Math.Between(1, 100) <= 5) {
                                this.startEncounter({ isWild: true }, "POKÉMON SELVATICO!");
                            }
                            this.canEncounter = false;
                            this.time.delayedCall(250, () => this.canEncounter = true);
                        }

                        if (this.zoneInterattive && !this.isDialogActive && !this.isTransitioning) {
                            let interazioneCalpestata = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 20);
                            if (interazioneCalpestata) {
                                if (interazioneCalpestata.nomeInterazione === 'Porta PVE') {
                                    this.gestisciPortaPVE();
                                } else if (interazioneCalpestata.nomeInterazione === 'Porta PVP') {
                                    this.gestisciPortaPvP();
                                } else if (interazioneCalpestata.nomeInterazione === 'Porta Centro') {
                                    this.gestisciPortaCPK();
                                }
                            }
                        }
                    }
                });
            } else {
                this.player.anims.stop();
            }
        } else {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CONFIRM) && !this.isTransitioning && !this.isDialogActive) {

            if (this.zoneInterattive) {
                let interazioneVicino = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 40);
                if (interazioneVicino) {
                    if (interazioneVicino.nomeInterazione === 'PC') {
                        this.player.anims.stop();
                        this.apriPC();
                        return;
                    } else if (interazioneVicino.nomeInterazione && interazioneVicino.nomeInterazione.includes('Cartello')) {
                        this.player.anims.stop();
                        this.leggiCartello();
                        return;
                    }
                }
            }

            if (this.npc) {
                let distToNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
                if (distToNpc < 50) {
                    this.player.anims.stop();
                    this.parlaConTutorialNPC();
                    return;
                }
            }
        }
    }

    async gestisciPortaPVE() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        try {
            // 1. Controlla il salvataggio sul DB
            let profilo = this.registry.get('playerProfile');
            let hasSave = false;
            let savedLevel = 1;

            const { data, error } = await supabaseClient.from('profilo').select('id_mappa').eq('id_profilo', profilo.id_profilo).single();
            if (error) {
                console.warn("Nessun salvataggio trovato o colonna mancante sul DB:", error.message);
            } else if (data && data.id_mappa && data.id_mappa.startsWith('mappa_pve')) {
                hasSave = true;
                // Estrapola il numero del livello (es. "mappa_pve_2" -> 2)
                let parts = data.id_mappa.split('_');
                if (parts.length === 3) savedLevel = parseInt(parts[2]) || 1;
            }

            // 2. Crea la UI del dialogo
            this.createDialogUI();

            // 3. Mostra i testi in sequenza
            let dialoghi = hasSave
                ? [`Hai un salvataggio in corso al Livello ${savedLevel}.`, "Vuoi riprendere la tua avventura?"]
                : ["Benvenuto nella modalità PvE!", "Vuoi iniziare una nuova avventura?"];

            this.mostraTestiDialogo(dialoghi, () => {
                this.mostraSceltaSiNo((scelta) => {
                    this.chiudiDialogo();
                    if (scelta === 'SI') {
                        this.avviaPVE(hasSave, savedLevel);
                    } else {
                        this.time.delayedCall(100, () => {
                            this.isDialogActive = false;
                        });
                    }
                });
            });
        } catch (err) {
            console.error("Errore fatale imprevisto nella porta PVE:", err);
            this.isDialogActive = false;
            window.showBanner("Impossibile contattare il server DB!");
        }
    }

    createDialogUI() {
        let container = document.getElementById('dialog-ui-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dialog-ui-container';
            container.style.position = 'absolute';   /* Cambia da 'fixed' ad 'absolute' */
            container.style.bottom = '22vh';         /* Cambia da '20px' a '22vh' (così fluttua sopra i tasti) */
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.width = '95vw';
            container.style.maxWidth = '800px';
            container.style.height = 'auto';
            container.style.minHeight = '140px';
            container.style.backgroundColor = '#2b2b2b';
            container.style.border = '6px solid #d05050';
            container.style.boxSizing = 'border-box';
            container.style.padding = '20px 30px';
            container.style.zIndex = '999999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.justifyContent = 'flex-start';
            container.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';

            let textEl = document.createElement('div');
            textEl.id = 'dialog-ui-text';
            textEl.style.color = '#ffffff';
            textEl.style.fontFamily = '"Courier New", Courier, monospace';
            textEl.style.fontSize = '26px';
            textEl.style.fontWeight = 'bold';
            textEl.style.textShadow = '2px 2px 0 #000';
            textEl.style.lineHeight = '1.3';

            container.appendChild(textEl);

            // Cambia 'document.body' con 'document.getElementById('game-container')'
            document.getElementById('game-container').appendChild(container);
        }
        container.style.display = 'flex';
        document.getElementById('dialog-ui-text').innerText = '';
    }

    chiudiDialogo() {
        let container = document.getElementById('dialog-ui-container');
        if (container) container.style.display = 'none';
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (choiceContainer) choiceContainer.style.display = 'none';
    }

    mostraTestiDialogo(testi, onComplete) {
        let index = 0;
        let textEl = document.getElementById('dialog-ui-text');

        const mostraProssimo = () => {
            if (index < testi.length) {
                textEl.innerHTML = testi[index] + '<span style="color:#ffcc00;"> ▼</span>';
                index++;

                setTimeout(() => {
                    const handleEnter = (e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                            e.preventDefault();
                            window.removeEventListener('keydown', handleEnter);
                            if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset();
                            if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset();
                            mostraProssimo();
                        }
                    };
                    window.addEventListener('keydown', handleEnter);
                }, 100);
            } else {
                if (onComplete) onComplete();
            }
        };
        mostraProssimo();
    }

    mostraSceltaSiNo(onChoice) {
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (!choiceContainer) {
            choiceContainer = document.createElement('div');
            choiceContainer.id = 'dialog-choice-container';
            choiceContainer.style.position = 'fixed';
            choiceContainer.style.bottom = '180px'; /* Alzato sopra il dialogo */
            choiceContainer.style.left = '65%';     /* Centrato orizzontalmente */
            choiceContainer.style.transform = 'translateX(-50%)';
            choiceContainer.style.right = 'auto';   /* Rimosso l'ancoraggio a destra */
            choiceContainer.style.width = 'auto';
            choiceContainer.style.minWidth = '120px';
            choiceContainer.style.backgroundColor = '#2b2b2b';
            choiceContainer.style.border = '4px solid #d05050';
            choiceContainer.style.boxSizing = 'border-box';
            choiceContainer.style.padding = '15px';
            choiceContainer.style.zIndex = '999999';
            choiceContainer.style.display = 'flex';
            choiceContainer.style.flexDirection = 'column';
            choiceContainer.style.gap = '15px';
            choiceContainer.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';

            let optSi = document.createElement('div');
            optSi.id = 'dialog-opt-si';
            optSi.style.color = '#ffffff';
            optSi.style.fontFamily = '"Courier New", Courier, monospace';
            optSi.style.fontSize = '26px';
            optSi.style.fontWeight = 'bold';
            optSi.style.textShadow = '2px 2px 0 #000';

            let optNo = document.createElement('div');
            optNo.id = 'dialog-opt-no';
            optNo.style.color = '#ffffff';
            optNo.style.fontFamily = '"Courier New", Courier, monospace';
            optNo.style.fontSize = '26px';
            optNo.style.fontWeight = 'bold';
            optNo.style.textShadow = '2px 2px 0 #000';

            choiceContainer.appendChild(optSi);
            choiceContainer.appendChild(optNo);
            document.body.appendChild(choiceContainer);
        }

        choiceContainer.style.display = 'flex';
        this.sceltaAttuale = 0; // 0 = SÌ, 1 = NO

        const aggiornaCursoreScelta = () => {
            let optSi = document.getElementById('dialog-opt-si');
            let optNo = document.getElementById('dialog-opt-no');
            if (this.sceltaAttuale === 0) {
                optSi.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">SÌ</span>`;
                optNo.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">NO</span>`;
            } else {
                optSi.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">SÌ</span>`;
                optNo.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">NO</span>`;
            }
        };

        aggiornaCursoreScelta();

        const handleChoiceInput = (e) => {
            let key = e.key || (e.detail && e.detail.key);
            if (!key) return;
            if (key === 'ArrowUp' || key === 'w' || key === 'ArrowDown' || key === 's') { this.sceltaAttuale = this.sceltaAttuale === 0 ? 1 : 0; aggiornaCursoreScelta(); }
            else if (key === 'Enter' || key === ' ') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset(); onChoice(this.sceltaAttuale === 0 ? 'SI' : 'NO'); }
            else if (key === 'Escape' || key === 'Backspace') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset(); onChoice('NO'); }
        };

        setTimeout(() => {
            window.addEventListener('keydown', handleChoiceInput);
            window.addEventListener('dpad-input', handleChoiceInput);
        }, 100);
    }

    leggiCartello() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;

        this.createDialogUI();

        this.mostraTestiDialogo([
            "BENVENUTO A NEOMON!",
            "Esplora la mappa, incontra altri giocatori e preparati per l'avventura.",
            "Usa il PC per gestire la tua squadra."
        ], () => {
            this.chiudiDialogo();
            this.time.delayedCall(100, () => { this.isDialogActive = false; });
        });
    }
    parlaConTutorialNPC() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;

        this.createDialogUI();

        this.mostraTestiDialogo([
            "Benvenuto nel mondo di NEOMON!",
            "Qui puoi sfidare altri giocatori nel PvP, progredire nella campagna PvE o completare il tuo Pokédex.",
            "Vuoi testare le tue abilità con una battaglia tutorial? ▼"
        ], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.startEncounter({ isWild: true, isNPC: true }, "SFIDA TUTORIAL!");
                } else {
                    this.time.delayedCall(100, () => { this.isDialogActive = false; });
                }
            });
        });
    }

    gestisciPortaPvP() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        this.createDialogUI();

        this.mostraTestiDialogo(["Vuoi entrare nell'Arena PvP? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.avviaPvP();
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                    });
                }
            });
        });
    }

    avviaPvP() {
        this.isTransitioning = true;

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">CARICAMENTO ARENA PVP...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">CARICAMENTO ARENA PVP...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;

            this.scene.stop('WorldScene');
            this.scene.start('PvPScene', { name: this.myPlayerName, user: this.registry.get('playerProfile') });
        }, 1000);
    }

    gestisciPortaCPK() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        this.createDialogUI();

        this.mostraTestiDialogo(["Vuoi entrare nel Centro Pokémon? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.avviaCPK();
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                    });
                }
            });
        });
    }

    avviaCPK() {
        this.isTransitioning = true;

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">CARICAMENTO CENTRO POKÉMON...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">CARICAMENTO CENTRO POKÉMON...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;

            this.scene.stop('WorldScene');
            this.scene.start('CPKScene', { name: this.myPlayerName, user: this.registry.get('playerProfile') });
        }, 1000);
    }

    async avviaPVE(hasSave, savedLevel = 1) {
        this.isTransitioning = true;

        let levelToLoad = hasSave ? savedLevel : 1;
        let mappaDaSalvare = `mappa_pve_${levelToLoad}`;

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">CARICAMENTO LIVELLO ${levelToLoad}...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">CARICAMENTO LIVELLO ${levelToLoad}...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        try {
            let profilo = this.registry.get('playerProfile');
            const { error } = await supabaseClient.from('profilo').update({ id_mappa: mappaDaSalvare }).eq('id_profilo', profilo.id_profilo);
            if (error) {
                console.error("Errore aggiornamento DB (Mappa PVE):", error);
            } else {
                profilo.id_mappa = mappaDaSalvare;
            }
        } catch (err) {
            console.error("Errore nel salvataggio dell'ingresso in PVE:", err);
        }

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;

            this.scene.stop('WorldScene');
            // Passiamo il levelToLoad alla PVEScene
            this.scene.start('PVEScene', { name: this.myPlayerName, user: this.registry.get('playerProfile'), level: levelToLoad });
        }, 1000);
    }

    togglePauseMenu() {
        if (this.isPaused) {
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu && existingMenu.inSubMenu) {
                existingMenu.renderMainPause();
                return;
            }
            this.isPaused = false;
            if (this.handlePauseKeyDown) {
                window.removeEventListener('keydown', this.handlePauseKeyDown);
                this.handlePauseKeyDown = null;
            }
            if (existingMenu) existingMenu.remove();
        } else {
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'modal-overlay';

            let selectedIdx = 0;
            let currentButtons = [];

            const updateSelection = () => {
                if (overlay.inSubMenu) return;
                currentButtons.forEach((btnId, idx) => {
                    let btn = document.getElementById(btnId);
                    if (btn) {
                        if (idx === selectedIdx) {
                            btn.style.transform = 'scale(1.05)';
                            btn.style.backgroundColor = '#4a3b5c';
                            btn.style.color = '#ffcc00';
                            btn.style.borderColor = '#ffcc00';
                            btn.style.boxShadow = '6px 6px 0 #ffcc00';
                        } else {
                            btn.style.transform = 'scale(1)';
                            btn.style.backgroundColor = '#f6eedf';
                            btn.style.color = '#ff7477';
                            btn.style.borderColor = '#ff7477';
                            btn.style.boxShadow = '4px 4px 0 #e69597';
                        }
                    }
                });
            };

            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'logout-btn'];

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 400px;">
                        <h2 class="text-shadows" style="font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 30px; text-align: center;">MENU PAUSA</h2>
                        <button id="profile-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 10px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">PROFILO</button>
                        <button id="controls-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">COMANDI</button>
                        <button id="logout-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">ESCI DAL GIOCO</button>
                        <p style="color: #fff; margin-top: 40px; font-size: 1.2rem; font-family: 'Courier New'; font-weight: bold; text-align: center;">Premi ESC per tornare al gioco</p>
                    </div>`;
                updateSelection();
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;

                let controlsHtml = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">MOVIMENTO</h3>
                        <p style="margin: 0;"><strong>WASD</strong> o <strong>Frecce Direzionali</strong></p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">AZIONI</h3>
                        <p style="margin: 0;"><strong>Conferma:</strong> INVIO</p>
                        <p style="margin: 5px 0 0 0;"><strong>Annulla / Indietro:</strong> ESC</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">IN BATTAGLIA</h3>
                        <p style="margin: 0;"><strong>Statistiche:</strong> SHIFT</p>
                    </div>
                    <div>
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">GENERICI</h3>
                        <p style="margin: 0;"><strong>Mouse / Touch:</strong> Interfaccia UI e Dialoghi</p>
                    </div>
                `;

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 500px;">
                        <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">COMANDI</h2>
                        <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ffcc00; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: left; max-height: 50vh; overflow-y: auto;">
                            ${controlsHtml}
                        </div>
                        <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-size: 1.5rem; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                    </div>
                `;
            };

            renderMainPause();
            document.getElementById('game-container').appendChild(overlay);

            this.handlePauseKeyDown = (e) => {
                let key = e.key;
                if (!overlay.inSubMenu) {
                    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                        selectedIdx = (selectedIdx - 1 + currentButtons.length) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                        selectedIdx = (selectedIdx + 1) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'Enter' || key === ' ') {
                        let btn = document.getElementById(currentButtons[selectedIdx]);
                        if (btn) btn.click();
                    }
                } else if (overlay.inSubMenu) {
                    if (key === 'Enter' || key === ' ' || key === 'Escape' || key === 'Backspace') {
                        let btn = document.getElementById('back-pause-btn');
                        if (btn) btn.click();
                    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        let btnPrev = document.getElementById('prev-avatar');
                        if (btnPrev) btnPrev.click();
                    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        let btnNext = document.getElementById('next-avatar');
                        if (btnNext) btnNext.click();
                    }
                }
            };
            window.addEventListener('keydown', this.handlePauseKeyDown);

            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'logout-btn') {
                    e.target.innerText = "USCITA IN CORSO...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) window.removeEventListener('keydown', this.handlePauseKeyDown);
                    await supabaseClient.auth.signOut();
                    window.location.reload();
                } else if (e.target.id === 'controls-btn') {
                    renderControls();
                } else if (e.target.id === 'profile-btn') {
                    overlay.inSubMenu = true;
                    let profilo = this.registry.get('playerProfile');
                    let winRate = profilo.partite_totali > 0 ? ((profilo.vittorie_totali / profilo.partite_totali) * 100).toFixed(1) : 0;
                    let box = document.getElementById('pause-box');
                    let avatarNum = profilo.avatar_sprite || 1;
                    let currentAvatarPath = avatarNum == 1 ? 'assets/avatar.png' : `assets/avatar${avatarNum}.png`;

                    if (box) {
                        box.innerHTML = `
                            <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">PROFILO</h2>
                            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ff7477; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: center;">
                                <p><strong>NOME:</strong> ${profilo.username || 'Sconosciuto'}</p>
                                <p><strong>VITTORIE:</strong> ${profilo.vittorie_totali || 0}</p>
                                <p><strong>PARTITE:</strong> ${profilo.partite_totali || 0}</p>
                                <p><strong>VITTORIE %:</strong> ${winRate}%</p>
                                <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 15px;">
                                    <button id="prev-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&lt;</button>
                                    <div style="width: 32px; height: 32px; overflow: hidden; position: relative; transform: scale(2); margin: 0 15px; image-rendering: pixelated;">
                                        <img id="profile-avatar" src="${currentAvatarPath}" style="position: absolute; top: 0; left: 0; width: 400%; height: 400%; max-width: none;">
                                    </div>
                                    <button id="next-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&gt;</button>
                                </div>
                            </div>
                            <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                        `;
                    }
                } else if (e.target.id === 'prev-avatar' || e.target.id === 'next-avatar') {
                    let profilo = this.registry.get('playerProfile');
                    const avatars = ['assets/avatar.png', 'assets/avatar2.png', 'assets/avatar3.png', 'assets/avatar4.png', 'assets/avatar5.png', 'assets/avatar6.png'];
                    let imgEl = document.getElementById('profile-avatar');
                    let idx = avatars.indexOf(imgEl.getAttribute('src'));
                    if (idx === -1) idx = 0;
                    idx = e.target.id === 'prev-avatar' ? (idx - 1 + avatars.length) % avatars.length : (idx + 1) % avatars.length;

                    let newAvatarPath = avatars[idx];
                    imgEl.src = newAvatarPath;
                    let numberToSave = idx + 1;
                    profilo.avatar_sprite = numberToSave;

                    supabaseClient.from('profilo').update({ avatar_sprite: numberToSave }).eq('id_profilo', profilo.id_profilo);

                    let textureKey = newAvatarPath.split('/').pop().replace('.png', '');
                    if (this.player) {
                        this.player.setTexture(textureKey);
                        this.textureKey = textureKey;

                        // Distrugge le vecchie animazioni e le ricrea con il nuovo spritesheet
                        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
                        ['down', 'left', 'right', 'up'].forEach((key, i) => {
                            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                        });
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }
    async apriPC() {
        if (this.pcOpen) return;
        this.pcOpen = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        let profilo = this.registry.get('playerProfile');
        const { data: myPokemon, error } = await supabaseClient.from('pokemon').select('*').eq('id_profilo_proprietario', profilo.id_profilo);

        if (error) { console.error("Errore lettura PC:", error); this.pcOpen = false; return; }

        let squadra = myPokemon.filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
        let box = myPokemon.filter(p => !p.in_squadra);

        let pkmnDB = this.registry.get('pokemonDB');
        let moveDB = this.registry.get('moveDB');

        this.pcState = { view: 'browsing', area: 'squadra', index: 0, actionIdx: 0, summaryPage: 0, moveSelectionIdx: 0 };

        // APPLICHIAMO LE NUOVE CLASSI GLOBALI!
        let overlay = document.createElement('div');
        overlay.className = 'pkmn-modal-overlay';
        overlay.id = 'pc-overlay-main';
        overlay.innerHTML = `
            <div class="pkmn-modal-content" id="pc-modal-content">
                <div class="pkmn-modal-header" style="margin-bottom: 15px;">SISTEMA MEMORIA POKÉMON</div>
                
                <div id="pc-main-view" style="display: flex; gap: 20px; flex: 1;">
                    <div style="flex: 1; display: flex; flex-direction: column; background: var(--battle-panel); border: 4px solid var(--color-secondary); border-radius: 8px; padding: 15px; box-sizing: border-box;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; flex-shrink: 0;">SQUADRA</h2>
                        <div id="pc-squadra" style="display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box; flex: 1; align-content: start; padding: 10px;"></div>
                    </div>

                    <div style="flex: 2.2; background: var(--battle-panel); border: 4px solid var(--battle-border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; box-sizing: border-box;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; flex-shrink: 0;">BOX DATI</h2>
                        <div id="pc-box" class="pc-grid-box" style="display: grid; gap: 10px; box-sizing: border-box; flex: 1; align-content: start; padding: 10px;"></div>
                    </div>

                    <div style="flex: 1; background: var(--battle-bg); border: 4px dashed var(--color-quaternary); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                        <div id="pc-preview-panel" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                            <h3 id="pc-preview-name" style="color: var(--battle-text); margin: 0 0 10px 0; font-size: 1.5rem; min-height: 30px;">--</h3>
                            <div style="width: 160px; height: 160px; background: #000; border: 2px solid #555; border-radius: 8px; display: flex; justify-content: center; align-items: center; margin-bottom: 15px; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8);">
                                <img id="pc-preview-sprite" src="" style="width: 140px; height: 140px; object-fit: contain; image-rendering: pixelated; display: none;">
                            </div>
                            <div id="pc-preview-types" style="display: flex; gap: 5px; margin-bottom: 15px; min-height: 25px;"></div>
                            <div id="pc-preview-stats" style="color: var(--battle-accent); font-weight: bold; width: 100%; text-align: left; padding: 0 10px;"></div>
                        </div>

                        <div id="pc-action-menu" style="display: none; flex-direction: column; gap: 10px; width: 100%; margin-top: auto; padding-bottom: 5px;">
                            <div class="pc-action-btn" data-action="0">SPOSTA</div>
                            <div class="pc-action-btn" data-action="1">SUMMARY</div>
                            <div class="pc-action-btn" data-action="2">INDIETRO</div>
                        </div>
                    </div>
                </div>

                <div id="pc-summary-view" class="summary-view" style="display: none; flex-direction: column; width: 100%; flex: 1; overflow: hidden;">
                    <div class="pkmn-modal-header" id="pc-summary-page-indicator" style="cursor: pointer; padding: 5px 0; margin-bottom: 25px;">◀ INFO E STATISTICHE ▶</div>
                    
                    <div class="summary-layout" style="display: flex; gap: 20px; flex: 1; overflow: hidden;">
                        
                        <div class="summary-left" style="flex: 1; text-align: center; border-right: 4px dashed var(--color-quaternary); display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
                            <div class="pkmn-name" id="pc-sum-name" style="margin-bottom: 10px; font-size: 1.8rem; flex-shrink: 0;">NOME</div>
                            <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 140px;">
                              <img id="pc-sum-sprite" src="" style="width: 240px; height: 240px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.5));">
                            </div>
                            <div class="summary-types" id="pc-sum-types" style="display: flex; justify-content: center; gap: 10px; margin-top: 10px; margin-bottom: 15px; flex-shrink: 0;"></div>
                            
                            <div class="move-description-box" id="pc-summary-move-desc" style="display: none; width: 100%; height: 130px; flex-shrink: 0;">
                                <div id="pc-desc-text" style="flex: 1; text-align: left; font-size: 1.1rem; overflow-y: auto; padding-right: 5px; line-height: 1.3;">Seleziona una mossa...</div>
                                <div style="display: flex; justify-content: space-between; border-top: 2px dashed #ff7477; padding-top: 8px; margin-top: 8px; font-weight: bold; color: #ffcc00; font-size: 1.1rem;">
                                    <div>POT: <span id="pc-desc-pot" style="color:#fff;">--</span></div>
                                    <div>PREC: <span id="pc-desc-prec" style="color:#fff;">--</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="summary-right" style="flex: 1.5; padding-left: 5px; display: flex; flex-direction: column; overflow: hidden;">
                            <div id="pc-sum-page-0" class="stats-grid" style="flex: 1; align-content: center;"></div>
                            
                            <div id="pc-sum-page-1" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
                                <div id="pc-moves-list-container" class="moves-scroll-area"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 30px; flex-shrink: 0; height: 65px;">
                    <button id="pc-save-btn" style="padding: 10px 40px; font-size: 1.5rem; font-weight: bold; font-family: 'Courier New'; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597;">SALVA ED ESCI</button>
                    <p style="color: #fff; line-height: 1.2; font-size: 0.9rem; margin: 0;">Comandi:<br>Frecce: Muoviti<br>Invio: Seleziona<br>ESC/CANC: Indietro/Chiudi</p>
                </div>
            </div>
        `;
        document.getElementById('game-container').appendChild(overlay);

        let style = document.createElement('style');
        style.id = 'pc-styles-extra';
        style.innerHTML = `
            .pc-grid-slot { background: #222; border: 3px solid #555; border-radius: 8px; height: 65px; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5); }
            
            .pc-sq-slot { width: 100%; max-width: 92%; margin: 0 auto; background: #3d2b4f; border: 3px dashed #555; border-radius: 8px; height: 100px; display: flex; align-items: center; padding: 0 15px; gap: 15px; box-sizing: border-box; box-shadow: 2px 2px 0 var(--battle-shadow); } 
            
            .pc-grid-slot.selected, .pc-sq-slot.selected { border-color: var(--battle-accent) !important; background-color: #4a3b5c !important; transform: scale(1.05); box-shadow: 0 0 10px var(--battle-accent); z-index: 10; }
            .pc-action-btn { background: var(--battle-panel); border: 2px solid var(--battle-border); color: #fff; padding: 10px; font-weight: bold; cursor: pointer; }
            .pc-action-btn.selected { border-color: var(--battle-accent); color: var(--battle-accent); background: #3d2b4f; transform: translateX(-5px); box-shadow: 4px 4px 0 var(--battle-accent); }
            
            /* Griglia Box dinamica (Desktop) */
            .pc-grid-box { grid-template-columns: repeat(6, 1fr); }

            /* MEDIA QUERIES PER MOBILE */
            @media (max-width: 1024px) {
                #pc-modal-content { height: 90dvh !important; max-height: 90dvh !important; overflow-y: scroll !important; overflow-x: hidden !important; }
                #pc-main-view { flex-direction: column !important; overflow-y: visible !important; }
                .pc-grid-box { grid-template-columns: repeat(auto-fit, minmax(50px, 1fr)) !important; }
                #pc-squadra, #pc-box { overflow: visible !important; }
                .pc-sq-slot { width: 100% !important; max-width: 100% !important; }
                .summary-right { overflow-y: visible !important; }
            }
        `;
        document.head.appendChild(style);

        const renderPCLists = () => {
            let sqHtml = '';
            for (let i = 0; i < 3; i++) {
                let p = squadra[i];
                if (p) {
                    let sprite = pkmnDB[p.id_specie]?.sprite?.normal || '';
                    // Immagine passata da 60px a 80px!
                    sqHtml += `<div class="pc-sq-slot" data-area="squadra" data-index="${i}"><img src="${sprite}" style="width: 80px; max-height: 80px; image-rendering: pixelated;"><span style="color: white; font-weight: bold; font-size: 1.2rem;">${p.id_specie.toUpperCase()}</span></div>`;
                } else {
                    sqHtml += `<div class="pc-sq-slot" data-area="squadra" data-index="${i}"><span style="color: #666; font-style: italic;">SLOT VUOTO</span></div>`;
                }
            }
            document.getElementById('pc-squadra').innerHTML = sqHtml;

            let bxHtml = '';
            for (let i = 0; i < 30; i++) {
                let p = box[i];
                if (p) {
                    let sprite = pkmnDB[p.id_specie]?.sprite?.normal || '';
                    bxHtml += `<div class="pc-grid-slot" data-area="box" data-index="${i}"><img src="${sprite}" style="width: 50px; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 #000);"></div>`;
                } else {
                    bxHtml += `<div class="pc-grid-slot" data-area="box" data-index="${i}"></div>`;
                }
            }
            document.getElementById('pc-box').innerHTML = bxHtml;
        };

        const getColor = (tipo) => {
            const colors = { "Normale": "#A8A878", "Fuoco": "#F08030", "Acqua": "#6890F0", "Elettro": "#F8D030", "Erba": "#78C850", "Ghiaccio": "#98D8D8", "Lotta": "#C03028", "Veleno": "#A040A0", "Terra": "#E0C068", "Volante": "#A890F0", "Psico": "#F85888", "Coleottero": "#A8B820", "Roccia": "#B8A038", "Spettro": "#705898", "Drago": "#7038F8", "Buio": "#705848", "Acciaio": "#B8B8D0", "Folletto": "#EE99AC" };
            return colors[tipo] || "#777";
        };

        const updateVisuals = () => {
            document.querySelectorAll('.pc-sq-slot, .pc-grid-slot, .pc-action-btn, .move-entry').forEach(el => el.classList.remove('selected'));

            if (this.pcState.view === 'browsing' || this.pcState.view === 'actions') {
                let activeClass = this.pcState.area === 'squadra' ? '.pc-sq-slot' : '.pc-grid-slot';
                let activeEl = document.querySelector(`${activeClass}[data-index="${this.pcState.index}"]`);
                if (activeEl) activeEl.classList.add('selected');

                let list = this.pcState.area === 'squadra' ? squadra : box;
                let pkmn = list[this.pcState.index];

                let nameEl = document.getElementById('pc-preview-name');
                let spriteEl = document.getElementById('pc-preview-sprite');
                let typesEl = document.getElementById('pc-preview-types');
                let statsEl = document.getElementById('pc-preview-stats');

                if (pkmn) {
                    let pData = pkmnDB[pkmn.id_specie];
                    nameEl.innerText = pData.nome.toUpperCase();
                    spriteEl.src = pData.sprite.normal;
                    spriteEl.style.display = 'block';
                    typesEl.innerHTML = pData.tipi.map(t => `<div class="badge" style="background:${getColor(t)}">${t.toUpperCase()}</div>`).join('');

                    let maxHp = Math.floor(pData.statistiche.hp.base_stat * 1.5);
                    statsEl.innerHTML = `HP: ${maxHp}<br>ATK: ${pData.statistiche.attack.base_stat}<br>DEF: ${pData.statistiche.defense.base_stat}<br>ATT.SP: ${pData.statistiche['special-attack'].base_stat}<br>DIF.SP: ${pData.statistiche['special-defense'].base_stat}<br>VEL: ${pData.statistiche.speed.base_stat}`;
                } else {
                    nameEl.innerText = "Nessun Pokémon";
                    spriteEl.style.display = 'none';
                    typesEl.innerHTML = '';
                    statsEl.innerHTML = '';
                }

                let menu = document.getElementById('pc-action-menu');
                if (this.pcState.view === 'actions') {
                    menu.style.display = 'flex';
                    document.querySelector(`.pc-action-btn[data-action="${this.pcState.actionIdx}"]`).classList.add('selected');
                } else {
                    menu.style.display = 'none';
                }
            } else if (this.pcState.view === 'summary') {
                document.getElementById('pc-summary-page-indicator').innerText = this.pcState.summaryPage === 0 ? '◀ INFO E STATISTICHE ▶' : '◀ MOSSE ▶';
                document.getElementById('pc-sum-page-0').style.display = this.pcState.summaryPage === 0 ? 'grid' : 'none';
                document.getElementById('pc-sum-page-1').style.display = this.pcState.summaryPage === 1 ? 'flex' : 'none';
                document.getElementById('pc-summary-move-desc').style.display = this.pcState.summaryPage === 1 ? 'flex' : 'none';

                if (this.pcState.summaryPage === 1) {
                    const moves = document.querySelectorAll('#pc-moves-list-container .move-entry');
                    if (moves[this.pcState.moveSelectionIdx]) {
                        let activeMove = moves[this.pcState.moveSelectionIdx];
                        activeMove.classList.add('selected');
                        activeMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                        document.getElementById('pc-desc-text').innerText = activeMove.getAttribute('data-desc');
                        document.getElementById('pc-desc-pot').innerText = activeMove.getAttribute('data-pot');
                        document.getElementById('pc-desc-prec').innerText = activeMove.getAttribute('data-prec');
                    }
                }
            }
        };

        const renderSummary = () => {
            let list = this.pcState.area === 'squadra' ? squadra : box;
            let pkmn = list[this.pcState.index];
            if (!pkmn) return;

            let pData = pkmnDB[pkmn.id_specie];
            document.getElementById('pc-sum-name').innerText = pData.nome.toUpperCase();
            document.getElementById('pc-sum-sprite').src = pData.sprite.normal;
            document.getElementById('pc-sum-types').innerHTML = pData.tipi.map(t => `<div class="badge" style="background:${getColor(t)}">${t.toUpperCase()}</div>`).join('');

            let maxHp = Math.floor(pData.statistiche.hp.base_stat * 1.5);
            document.getElementById('pc-sum-page-0').innerHTML = `
                <div class="stat-row"><span class="stat-label">HP MAX</span><span class="stat-value">${maxHp}</span></div>
                <div class="stat-row"><span class="stat-label">ATTACCO</span><span class="stat-value">${pData.statistiche.attack.base_stat}</span></div>
                <div class="stat-row"><span class="stat-label">DIFESA</span><span class="stat-value">${pData.statistiche.defense.base_stat}</span></div>
                <div class="stat-row"><span class="stat-label">ATT. SP.</span><span class="stat-value">${pData.statistiche['special-attack'].base_stat}</span></div>
                <div class="stat-row"><span class="stat-label">DIF. SP.</span><span class="stat-value">${pData.statistiche['special-defense'].base_stat}</span></div>
                <div class="stat-row"><span class="stat-label">VELOCITÀ</span><span class="stat-value">${pData.statistiche.speed.base_stat}</span></div>
            `;

            let mosseRaw = pkmn.mosse && pkmn.mosse.length > 0 ? pkmn.mosse : (pData.mosse || []);
            let movesHtml = ``;
            mosseRaw.forEach((mRaw, i) => {
                let nomeMossa = typeof mRaw === 'object' ? mRaw.Nome : mRaw;
                const m = moveDB[nomeMossa] || { Nome: nomeMossa, Tipo: '???', PP: '--', Potenza: '--', Precisione: '--', Descrizione: 'Nessuna descrizione.' };
                const catColor = m.Categoria === "Fisico" ? '#ff7477' : (m.Categoria === "Speciale" ? '#6874e8' : '#aaaaaa');
                movesHtml += `
                <div class="move-entry" data-desc="${m.Descrizione || 'Nessuna descrizione.'}" data-pot="${m.Potenza > 0 ? m.Potenza : '--'}" data-prec="${m.Precisione > 0 ? m.Precisione : '--'}">
                    <div class="move-name-line"><span>${String(m.Nome).toUpperCase()}</span><span>PP ${m.PP}/${m.PP}</span></div>
                    <div class="move-summary-badges"><span class="badge" style="background:${getColor(m.Tipo)}">${String(m.Tipo).toUpperCase()}</span><span class="badge" style="background:${catColor}">${(m.Categoria || '???').toUpperCase()}</span></div>
                </div>`;
            });
            document.getElementById('pc-moves-list-container').innerHTML = movesHtml;
        };

        const eseguiSpostamento = () => {
            let s = this.pcState;
            let list = s.area === 'squadra' ? squadra : box;
            let pkmn = list[s.index];

            if (!pkmn) { window.showBanner("Non c'è nessun Pokémon qui!"); return; }

            if (s.area === 'squadra') {
                if (squadra.length <= 1) { window.showBanner("Non puoi viaggiare senza Pokémon in squadra!"); return; }
                box.push(squadra.splice(s.index, 1)[0]);
            } else {
                if (squadra.length >= 3) { window.showBanner("La tua squadra è già piena! (Max 3)"); return; }
                squadra.push(box.splice(s.index, 1)[0]);
            }

            s.view = 'browsing';
            renderPCLists();
            updateVisuals();
        };

        const chiudiESalva = async () => {
            let btn = document.getElementById('pc-save-btn');
            btn.innerText = "SALVATAGGIO...";
            btn.style.backgroundColor = "#ffcc00";
            window.removeEventListener('keydown', handleKey);

            squadra.forEach((p, i) => { p.in_squadra = true; p.posizione_slot = i + 1; });
            box.forEach((p, i) => { p.in_squadra = false; p.posizione_slot = null; });

            let allUpdates = [...squadra, ...box].map(p => ({
                id_pokemon: p.id_pokemon, id_specie: p.id_specie, id_profilo_proprietario: p.id_profilo_proprietario, in_squadra: p.in_squadra, posizione_slot: p.posizione_slot
            }));

            const { error } = await supabaseClient.from('pokemon').upsert(allUpdates);

            if (error) {
                window.showBanner("Errore di rete durante il salvataggio!");
                btn.innerText = "SALVA ED ESCI";
                btn.style.backgroundColor = "#f6eedf";
                window.addEventListener('keydown', handleKey);
            } else {
                this.registry.set('userPokemon', [...squadra, ...box]);
                window.showBanner("Dati del PC sincronizzati!", false);
                setTimeout(() => {
                    if (document.getElementById('pc-overlay-main')) {
                        overlay.remove();
                        document.getElementById('pc-styles-extra').remove();
                        this.pcOpen = false;
                    }
                }, 1000);
            }
        };

        const handleKey = (e) => {
            const key = e.key;
            let s = this.pcState;

            if (s.view === 'browsing') {
                if (s.area === 'squadra') {
                    if (key === 'ArrowDown' || key === 's') s.index = Math.min(2, s.index + 1);
                    if (key === 'ArrowUp' || key === 'w') s.index = Math.max(0, s.index - 1);
                    if (key === 'ArrowRight' || key === 'd') { s.area = 'box'; s.index = Math.min(29, s.index * 6); }
                } else if (s.area === 'box') {
                    if (key === 'ArrowLeft' || key === 'a') {
                        if (s.index % 6 === 0) { s.area = 'squadra'; s.index = Math.min(2, Math.floor(s.index / 6)); }
                        else s.index--;
                    }
                    if (key === 'ArrowRight' || key === 'd') { if ((s.index + 1) % 6 !== 0) s.index = Math.min(29, s.index + 1); }
                    if (key === 'ArrowUp' || key === 'w') { if (s.index >= 6) s.index -= 6; }
                    if (key === 'ArrowDown' || key === 's') { if (s.index + 6 < 30) s.index += 6; }
                }

                if (key === 'Enter' || key === ' ') {
                    let targetList = s.area === 'squadra' ? squadra : box;
                    if (targetList[s.index]) { s.view = 'actions'; s.actionIdx = 0; }
                    else { window.showBanner("Questo slot è vuoto!"); }
                }
                if (key === 'Escape' || key === 'Backspace') chiudiESalva();

            } else if (s.view === 'actions') {
                if (key === 'ArrowDown' || key === 's') s.actionIdx = (s.actionIdx + 1) % 3;
                if (key === 'ArrowUp' || key === 'w') s.actionIdx = (s.actionIdx - 1 + 3) % 3;
                if (key === 'Escape' || key === 'Backspace') s.view = 'browsing';
                if (key === 'Enter' || key === ' ') {
                    if (s.actionIdx === 0) eseguiSpostamento();
                    else if (s.actionIdx === 1) {
                        s.view = 'summary'; s.summaryPage = 0; s.moveSelectionIdx = 0;
                        document.getElementById('pc-main-view').style.display = 'none';
                        document.getElementById('pc-summary-view').style.display = 'flex';
                        renderSummary();
                    }
                    else if (s.actionIdx === 2) s.view = 'browsing';
                }
            } else if (s.view === 'summary') {
                if (s.summaryPage === 1) {
                    let numMoves = document.querySelectorAll('#pc-moves-list-container .move-entry').length;
                    if (numMoves > 0) {
                        if (key === 'ArrowDown' || key === 's') s.moveSelectionIdx = Math.min(numMoves - 1, s.moveSelectionIdx + 1);
                        if (key === 'ArrowUp' || key === 'w') s.moveSelectionIdx = Math.max(0, s.moveSelectionIdx - 1);
                    }
                }
                if (key === 'ArrowRight' || key === 'd' || key === 'ArrowLeft' || key === 'a') {
                    s.summaryPage = s.summaryPage === 0 ? 1 : 0;
                    s.moveSelectionIdx = 0;
                }
                if (key === 'Escape' || key === 'Backspace') {
                    s.view = 'actions';
                    document.getElementById('pc-summary-view').style.display = 'none';
                    document.getElementById('pc-main-view').style.display = 'flex';
                }
            }
            updateVisuals();
        };

        window.addEventListener('keydown', handleKey);

        overlay.addEventListener('click', (e) => {
            // CLICK SULLE MOSSE NEL PC
            let moveItem = e.target.closest('.move-entry');
            if (moveItem && this.pcState.view === 'summary' && this.pcState.summaryPage === 1) {
                let idx = Array.from(moveItem.parentNode.children).indexOf(moveItem);
                this.pcState.moveSelectionIdx = idx;
                updateVisuals();
                return;
            }
            let slot = e.target.closest('.pc-sq-slot, .pc-grid-slot');
            if (slot && this.pcState.view === 'browsing') {
                this.pcState.area = slot.dataset.area;
                this.pcState.index = parseInt(slot.dataset.index);
                updateVisuals();

                let targetList = this.pcState.area === 'squadra' ? squadra : box;
                if (targetList[this.pcState.index]) {
                    this.pcState.view = 'actions'; this.pcState.actionIdx = 0; updateVisuals();
                } else { window.showBanner("Questo slot è vuoto!"); }
            }
            if (e.target.classList.contains('pc-action-btn')) {
                this.pcState.actionIdx = parseInt(e.target.dataset.action);
                updateVisuals(); handleKey({ key: 'Enter' });
            }
            if (e.target.id === 'pc-summary-page-indicator') handleKey({ key: 'ArrowRight' });
            if (e.target.id === 'pc-save-btn') chiudiESalva();
        });

        renderPCLists();
        updateVisuals();
    }
    startEncounter(battleData, testo = "BATTAGLIA!") {
        this.isTransitioning = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%;">${testo}</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%;">${testo}</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;
            this.scene.pause();

            let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
            if (myDbTeam.length === 0) {
                alert("Non hai Pokémon in squadra! Visita il PC.");
                this.scene.resume('WorldScene');
                if (battleData.socket) battleData.socket.emit('setInBattle', false);
                return;
            }

            // Bypassiamo SelectionScene e andiamo dritti alla lotta!
            battleData.parentScene = 'WorldScene';
            this.scene.launch('BattleScene', battleData);
        }, 2000);
    }
}

// ==============================================================================
// CPK SCENE: Centro Pokémon
// ==============================================================================
class CPKScene extends Phaser.Scene {
    constructor() { super({ key: 'CPKScene' }); }
    init(data) {
        this.myPlayerName = data.name;
        this.user = data.user;
    }

    create() {
        let profilo = this.registry.get('playerProfile');
        let avatarNum = profilo ? (profilo.avatar_sprite || 1) : 1;
        this.textureKey = avatarNum == 1 ? 'avatar' : `avatar${avatarNum}`;

        this.player = null;
        this.isMovingGrid = false;

        this.setupMap();
        this.setupNPCs();

        let startX = 80;
        let startY = 140;
        if (this.zoneInterattive) {
            let startZone = this.zoneInterattive.find(z => z.nomeInterazione === 'Porta Inizio');
            if (startZone) {
                startX = startZone.x + (startZone.width || 16) / 2;
                startY = startZone.y - 16;
            }
        }

        this.setupPlayer(startX, startY);

        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
        ['down', 'left', 'right', 'up'].forEach((key, i) => {
            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
        });

        this.keys = this.input.keyboard.addKeys(InputConfig);

        this.isPaused = false;
        this.isDialogActive = false;
        this.isTransitioning = false;
        this.pcOpen = false;
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'mapCPK' });

        // Omesso margin e spacing: Phaser li leggerà direttamente dal file .tmj per allinearli in modo perfetto!
        const tilesetA = map.addTilesetImage('a', 'tilesA');
        const tilesetE = map.addTilesetImage('e', 'tilesE');
        const tilesetD = map.addTilesetImage('d', 'tilesD');

        const allTilesets = [tilesetA, tilesetD, tilesetE];

        map.createLayer('Sfondo', allTilesets, 0, 0);
        map.createLayer('Erba', allTilesets, 0, 0);
        this.wallLayer = map.createLayer('Ostacoli', allTilesets, 0, 0);

        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        this.wallLayer.setCollisionByExclusion([-1]);

        this.zoneInterattive = [];
        const objLayer = map.getObjectLayer('Interazioni');
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                let zone = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0);
                zone.nomeInterazione = obj.name;
                this.zoneInterattive.push(zone);
            });
        }
    }

    setupNPCs() {
        // Crea solo l'NPC di sinistra (assicurati che le coordinate x e y combacino con la tua mappa)
        this.npc = this.physics.add.sprite(64, 30, 'nurse').setScale(1).setImmovable(true);
        this.physics.add.collider(this.npc, this.wallLayer);
    }

    setupPlayer(startX, startY) {
        this.player = this.physics.add.sprite(startX, startY, this.textureKey).setCollideWorldBounds(true);
        this.player.setScale(0.5);
        this.player.body.setSize(32, 32).setOffset(16, 32);

        this.physics.add.collider(this.player, this.wallLayer);
        this.cameras.main.startFollow(this.player, true).setZoom(4).setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true).setZoom(4.5);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL) && !this.isTransitioning && !this.pcOpen && !this.isDialogActive) {
            this.togglePauseMenu();
        }

        if (this.isTransitioning || !this.player || this.isPaused || this.pcOpen || this.isMovingGrid || this.isDialogActive) return;

        const TILE_SIZE = 16;
        let currentAnim = null;
        let dx = 0;
        let dy = 0;

        if (this.keys.LEFT.isDown || this.keys.A.isDown) { dx = -TILE_SIZE; currentAnim = 'left'; }
        else if (this.keys.RIGHT.isDown || this.keys.D.isDown) { dx = TILE_SIZE; currentAnim = 'right'; }
        else if (this.keys.UP.isDown || this.keys.W.isDown) { dy = -TILE_SIZE; currentAnim = 'up'; }
        else if (this.keys.DOWN.isDown || this.keys.S.isDown) { dy = TILE_SIZE; currentAnim = 'down'; }

        if (dx !== 0 || dy !== 0) {
            let targetX = this.player.x + dx;
            let targetY = this.player.y + dy;

            this.player.anims.play(currentAnim, true);

            let isOutOfBounds = targetX < 0 || targetX >= this.mapWidth || targetY < 0 || targetY >= this.mapHeight;
            let ostacolo = this.wallLayer.getTileAtWorldXY(targetX, targetY, true);
            let isWall = (ostacolo && ostacolo.index !== -1);
            let isNpc1 = this.npc ? Phaser.Math.Distance.Between(targetX, targetY, this.npc.x, this.npc.y) < 16 : false;

            if (!isWall && !isNpc1 && !isOutOfBounds) {
                this.isMovingGrid = true;

                this.tweens.add({
                    targets: this.player,
                    x: targetX,
                    y: targetY,
                    duration: 250,
                    onComplete: () => {
                        this.isMovingGrid = false;
                        this.player.anims.stop();

                        // Controllo porta d'uscita
                        if (this.zoneInterattive && !this.isDialogActive && !this.isTransitioning) {
                            let interazioneCalpestata = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 20);
                            if (interazioneCalpestata && interazioneCalpestata.nomeInterazione === 'Porta Inizio') {
                                this.gestisciUscita();
                            }
                        }
                    }
                });
            } else {
                this.player.anims.stop();
            }
        } else {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CONFIRM) && !this.isTransitioning && !this.isDialogActive) {
            let interactionHandled = false;

            if (this.npc && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 40) {
                this.player.anims.stop();
                this.parlaConNPC();
                interactionHandled = true;
            }

            if (!interactionHandled && this.zoneInterattive) {
                let interazioneVicino = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 40);
                if (interazioneVicino && interazioneVicino.nomeInterazione === 'PC') {
                    this.player.anims.stop();
                    this.apriPC();
                }
            }
        }
    }

    apriPC() {
        this.scene.manager.getScene('WorldScene').apriPC.call(this);
    }

    parlaConNPC() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.createDialogUI();

        this.mostraTestiDialogo([
            "Benvenuto al Centro Pokémon!",
            "I tuoi Pokémon vengono curati completamente in automatico dopo ogni lotta.",
            "Usa il PC per gestire e organizzare la tua squadra.",
        ], () => {
            this.chiudiDialogo();
            this.time.delayedCall(100, () => { this.isDialogActive = false; });
        });
    }

    gestisciUscita() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        this.createDialogUI();

        this.mostraTestiDialogo(["Vuoi tornare alla Lobby? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.tornaAllaLobby();
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                        this.player.y -= 16; // Allontana di un passo per non re-innescare il tap
                    });
                }
            });
        });
    }

    mostraSceltaSiNo(onChoice) {
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (!choiceContainer) {
            choiceContainer = document.createElement('div');
            choiceContainer.id = 'dialog-choice-container';
            choiceContainer.style.position = 'fixed';
            choiceContainer.style.bottom = '160px';
            choiceContainer.style.right = '5%';
            choiceContainer.style.transform = 'none';
            choiceContainer.style.width = 'auto';
            choiceContainer.style.minWidth = '120px';
            choiceContainer.style.backgroundColor = '#2b2b2b';
            choiceContainer.style.border = '4px solid #d05050';
            choiceContainer.style.boxSizing = 'border-box';
            choiceContainer.style.padding = '15px';
            choiceContainer.style.zIndex = '999999';
            choiceContainer.style.display = 'flex';
            choiceContainer.style.flexDirection = 'column';
            choiceContainer.style.gap = '15px';
            choiceContainer.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';

            let optSi = document.createElement('div');
            optSi.id = 'dialog-opt-si';
            optSi.style.color = '#ffffff';
            optSi.style.fontFamily = '"Courier New", Courier, monospace';
            optSi.style.fontSize = '26px';
            optSi.style.fontWeight = 'bold';
            optSi.style.textShadow = '2px 2px 0 #000';

            let optNo = document.createElement('div');
            optNo.id = 'dialog-opt-no';
            optNo.style.color = '#ffffff';
            optNo.style.fontFamily = '"Courier New", Courier, monospace';
            optNo.style.fontSize = '26px';
            optNo.style.fontWeight = 'bold';
            optNo.style.textShadow = '2px 2px 0 #000';

            choiceContainer.appendChild(optSi);
            choiceContainer.appendChild(optNo);
            document.body.appendChild(choiceContainer);
        }

        choiceContainer.style.display = 'flex';
        this.sceltaAttuale = 0;

        const aggiornaCursoreScelta = () => {
            let optSi = document.getElementById('dialog-opt-si');
            let optNo = document.getElementById('dialog-opt-no');
            if (this.sceltaAttuale === 0) {
                optSi.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">SÌ</span>`;
                optNo.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">NO</span>`;
            } else {
                optSi.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">SÌ</span>`;
                optNo.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">NO</span>`;
            }
        };
        aggiornaCursoreScelta();
        const handleChoiceInput = (e) => {
            let key = e.key || (e.detail && e.detail.key);
            if (!key) return;
            if (key === 'ArrowUp' || key === 'w' || key === 'ArrowDown' || key === 's') { this.sceltaAttuale = this.sceltaAttuale === 0 ? 1 : 0; aggiornaCursoreScelta(); }
            else if (key === 'Enter' || key === ' ') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset(); onChoice(this.sceltaAttuale === 0 ? 'SI' : 'NO'); }
            else if (key === 'Escape' || key === 'Backspace') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset(); onChoice('NO'); }
        };
        setTimeout(() => { window.addEventListener('keydown', handleChoiceInput); window.addEventListener('dpad-input', handleChoiceInput); }, 100);
    }

     createDialogUI() {
        let container = document.getElementById('dialog-ui-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dialog-ui-container';
            container.style.position = 'absolute';   /* Cambia da 'fixed' ad 'absolute' */
            container.style.bottom = '22vh';         /* Cambia da '20px' a '22vh' (così fluttua sopra i tasti) */
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.width = '95vw';
            container.style.maxWidth = '800px';
            container.style.height = 'auto';
            container.style.minHeight = '140px';
            container.style.backgroundColor = '#2b2b2b';
            container.style.border = '6px solid #d05050';
            container.style.boxSizing = 'border-box';
            container.style.padding = '20px 30px';
            container.style.zIndex = '999999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.justifyContent = 'flex-start';
            container.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';

            let textEl = document.createElement('div');
            textEl.id = 'dialog-ui-text';
            textEl.style.color = '#ffffff';
            textEl.style.fontFamily = '"Courier New", Courier, monospace';
            textEl.style.fontSize = '26px';
            textEl.style.fontWeight = 'bold';
            textEl.style.textShadow = '2px 2px 0 #000';
            textEl.style.lineHeight = '1.3';
            container.appendChild(textEl);

            // Cambia 'document.body' con 'document.getElementById('game-container')'
            document.getElementById('game-container').appendChild(container);
        }
        container.style.display = 'flex';
        document.getElementById('dialog-ui-text').innerText = '';
    }

    chiudiDialogo() {
        let container = document.getElementById('dialog-ui-container');
        if (container) container.style.display = 'none';
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (choiceContainer) choiceContainer.style.display = 'none';
    }

    mostraTestiDialogo(testi, onComplete) {
        let index = 0;
        let textEl = document.getElementById('dialog-ui-text');
        const mostraProssimo = () => {
            if (index < testi.length) {
                textEl.innerHTML = testi[index].replace(' ▼', '') + '<span style="color:#ffcc00;"> ▼</span>';
                index++;
                setTimeout(() => {
                    const handleEnter = (e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                            e.preventDefault(); window.removeEventListener('keydown', handleEnter);
                            if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset();
                            if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset();
                            mostraProssimo();
                        }
                    };
                    window.addEventListener('keydown', handleEnter);
                }, 100);
            } else { if (onComplete) onComplete(); }
        };
        mostraProssimo();
    }

    tornaAllaLobby() {
        this.isTransitioning = true;
        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;

            this.scene.stop('CPKScene');
            this.scene.start('WorldScene', { name: this.myPlayerName, user: this.user, vengoDa: 'Porta Centro' });
        }, 1000);
    }

    togglePauseMenu() {
        if (this.isPaused) {
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu && existingMenu.inSubMenu) {
                existingMenu.renderMainPause();
                return;
            }
            this.isPaused = false;
            if (this.handlePauseKeyDown) {
                window.removeEventListener('keydown', this.handlePauseKeyDown);
                this.handlePauseKeyDown = null;
            }
            if (existingMenu) existingMenu.remove();
        } else {
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'modal-overlay';

            let selectedIdx = 0;
            let currentButtons = [];

            const updateSelection = () => {
                if (overlay.inSubMenu) return;
                currentButtons.forEach((btnId, idx) => {
                    let btn = document.getElementById(btnId);
                    if (btn) {
                        if (idx === selectedIdx) {
                            btn.style.transform = 'scale(1.05)';
                            btn.style.backgroundColor = '#4a3b5c';
                            btn.style.color = '#ffcc00';
                            btn.style.borderColor = '#ffcc00';
                            btn.style.boxShadow = '6px 6px 0 #ffcc00';
                        } else {
                            btn.style.transform = 'scale(1)';
                            btn.style.backgroundColor = '#f6eedf';
                            btn.style.color = '#ff7477';
                            btn.style.borderColor = '#ff7477';
                            btn.style.boxShadow = '4px 4px 0 #e69597';
                        }
                    }
                });
            };

            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'lobby-btn'];

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 400px;">
                        <h2 class="text-shadows" style="font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 30px; text-align: center;">CENTRO POKÉMON</h2>
                        <button id="profile-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 10px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">PROFILO</button>
                        <button id="controls-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">COMANDI</button>
                        <button id="lobby-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">TORNA ALLA LOBBY</button>
                        <p style="color: #fff; margin-top: 40px; font-size: 1.2rem; font-family: 'Courier New'; font-weight: bold; text-align: center;">Premi ESC per tornare al gioco</p>
                    </div>`;
                updateSelection();
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;

                let controlsHtml = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">MOVIMENTO</h3>
                        <p style="margin: 0;"><strong>WASD</strong> o <strong>Frecce Direzionali</strong></p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">AZIONI</h3>
                        <p style="margin: 0;"><strong>Conferma:</strong> INVIO</p>
                        <p style="margin: 5px 0 0 0;"><strong>Annulla / Indietro:</strong> ESC</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">IN BATTAGLIA</h3>
                        <p style="margin: 0;"><strong>Statistiche:</strong> SHIFT</p>
                    </div>
                    <div>
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">GENERICI</h3>
                        <p style="margin: 0;"><strong>Mouse / Touch:</strong> Interfaccia UI e Dialoghi</p>
                    </div>
                `;

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 500px;">
                        <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">COMANDI</h2>
                        <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ffcc00; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: left; max-height: 50vh; overflow-y: auto;">
                            ${controlsHtml}
                        </div>
                        <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-size: 1.5rem; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                    </div>
                `;
            };

            renderMainPause();
            document.getElementById('game-container').appendChild(overlay);

            this.handlePauseKeyDown = (e) => {
                let key = e.key;
                if (!overlay.inSubMenu) {
                    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                        selectedIdx = (selectedIdx - 1 + currentButtons.length) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                        selectedIdx = (selectedIdx + 1) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'Enter' || key === ' ') {
                        let btn = document.getElementById(currentButtons[selectedIdx]);
                        if (btn) btn.click();
                    }
                } else if (overlay.inSubMenu) {
                    if (key === 'Enter' || key === ' ' || key === 'Escape' || key === 'Backspace') {
                        let btn = document.getElementById('back-pause-btn');
                        if (btn) btn.click();
                    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        let btnPrev = document.getElementById('prev-avatar');
                        if (btnPrev) btnPrev.click();
                    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        let btnNext = document.getElementById('next-avatar');
                        if (btnNext) btnNext.click();
                    }
                }
            };
            window.addEventListener('keydown', this.handlePauseKeyDown);

            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'lobby-btn') {
                    e.target.innerText = "USCITA...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) window.removeEventListener('keydown', this.handlePauseKeyDown);
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();
                    this.tornaAllaLobby();
                } else if (e.target.id === 'controls-btn') {
                    renderControls();
                } else if (e.target.id === 'profile-btn') {
                    overlay.inSubMenu = true;
                    let profilo = this.registry.get('playerProfile');
                    let winRate = profilo.partite_totali > 0 ? ((profilo.vittorie_totali / profilo.partite_totali) * 100).toFixed(1) : 0;
                    let box = document.getElementById('pause-box');
                    let avatarNum = profilo.avatar_sprite || 1;
                    let currentAvatarPath = avatarNum == 1 ? 'assets/avatar.png' : `assets/avatar${avatarNum}.png`;

                    if (box) {
                        box.innerHTML = `
                            <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">PROFILO</h2>
                            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ff7477; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: center;">
                                <p><strong>NOME:</strong> ${profilo.username || 'Sconosciuto'}</p>
                                <p><strong>VITTORIE:</strong> ${profilo.vittorie_totali || 0}</p>
                                <p><strong>PARTITE:</strong> ${profilo.partite_totali || 0}</p>
                                <p><strong>VITTORIE %:</strong> ${winRate}%</p>
                                <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 15px;">
                                    <button id="prev-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&lt;</button>
                                    <div style="width: 32px; height: 32px; overflow: hidden; position: relative; transform: scale(2); margin: 0 15px; image-rendering: pixelated;">
                                        <img id="profile-avatar" src="${currentAvatarPath}" style="position: absolute; top: 0; left: 0; width: 400%; height: 400%; max-width: none;">
                                    </div>
                                    <button id="next-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&gt;</button>
                                </div>
                            </div>
                            <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                        `;
                    }
                } else if (e.target.id === 'prev-avatar' || e.target.id === 'next-avatar') {
                    let profilo = this.registry.get('playerProfile');
                    const avatars = ['assets/avatar.png', 'assets/avatar2.png', 'assets/avatar3.png', 'assets/avatar4.png', 'assets/avatar5.png', 'assets/avatar6.png'];
                    let imgEl = document.getElementById('profile-avatar');
                    let idx = avatars.indexOf(imgEl.getAttribute('src'));
                    if (idx === -1) idx = 0;
                    idx = e.target.id === 'prev-avatar' ? (idx - 1 + avatars.length) % avatars.length : (idx + 1) % avatars.length;

                    let newAvatarPath = avatars[idx];
                    imgEl.src = newAvatarPath;
                    let numberToSave = idx + 1;
                    profilo.avatar_sprite = numberToSave;

                    supabaseClient.from('profilo').update({ avatar_sprite: numberToSave }).eq('id_profilo', profilo.id_profilo);

                    let textureKey = newAvatarPath.split('/').pop().replace('.png', '');
                    if (this.player) {
                        this.player.setTexture(textureKey);
                        this.textureKey = textureKey;

                        // Distrugge le vecchie animazioni e le ricrea con il nuovo spritesheet
                        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
                        ['down', 'left', 'right', 'up'].forEach((key, i) => {
                            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                        });
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }
}

// ==============================================================================
// PVP SCENE: Arena Lotta Giocatore vs Giocatore
// ==============================================================================
class PvPScene extends Phaser.Scene {
    constructor() { super({ key: 'PvPScene' }); }
    init(data) {
        this.myPlayerName = data.name;
        this.user = data.user;
    }

    create() {
        let profilo = this.registry.get('playerProfile');
        let avatarNum = profilo ? (profilo.avatar_sprite || 1) : 1;
        this.textureKey = avatarNum == 1 ? 'avatar' : `avatar${avatarNum}`;

        this.player = null;
        this.playerNameText = null;
        this.isMovingGrid = false;

        this.setupMap();
        this.setupAnimations();
        this.setupNetwork();

        this.keys = this.input.keyboard.addKeys(InputConfig);

        this.isPaused = false;
        this.isDialogActive = false;
        this.isTransitioning = false;
        this.pcOpen = false;

        this.events.on('shutdown', () => {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
        });
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'mapPvP' });

        // Stessa soluzione anti-corruzione grafica adottata nel CPK
        const tilesetA = map.addTilesetImage('a', 'tilesA');
        const tilesetD = map.addTilesetImage('d', 'tilesD');
        const tilesetE = map.addTilesetImage('e', 'tilesE');

        const allTilesets = [tilesetA, tilesetD, tilesetE];

        map.createLayer('Sfondo', allTilesets, 0, 0);
        map.createLayer('Erba', allTilesets, 0, 0);
        this.wallLayer = map.createLayer('Ostacoli', allTilesets, 0, 0);

        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        this.wallLayer.setCollisionByExclusion([-1]);

        this.zoneInterattive = [];
        const objLayer = map.getObjectLayer('Interazioni');
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                let zone = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0);
                zone.nomeInterazione = obj.name;
                this.zoneInterattive.push(zone);
            });
        }
    }

    setupNetwork() {
        this.otherPlayers = this.physics.add.group();
        this.socket = io('https://neomon-server.onrender.com');
        this.socket.emit('joinGame', this.myPlayerName); // Rimosso + " (PvP)"

        this.socket.on('currentPlayers', (players) => {
            Object.values(players).forEach(p => p.playerId === this.socket.id ? this.addPlayer(p) : this.addOtherPlayer(p));
        });
        this.socket.on('newPlayer', (p) => this.addOtherPlayer(p));
        this.socket.on('playerDisconnected', (id) => {
            this.otherPlayers.getChildren().forEach(op => {
                if (op.playerId === id) { op.nameText.destroy(); op.destroy(); }
            });
        });
        this.socket.on('playerMoved', (p) => {
            this.otherPlayers.getChildren().forEach(op => {
                if (op.playerId === p.playerId) {
                    op.setPosition(p.x, p.y);
                    op.nameText.setPosition(p.x, p.y - 15);
                    p.anim ? op.anims.play(p.anim, true) : op.anims.stop();
                }
            });
        });

        this.socket.on('challengeReceived', (id) => this.socket.emit('acceptChallenge', id));
        this.socket.on('opponentBusy', () => window.showBanner("Questo allenatore è già impegnato!"));

        this.socket.on('startPvP', (data) => {
            data.socket = this.socket;
            data.isWild = false;
            this.startEncounter(data, "SFIDA PVP!");
        });
    }

    setupAnimations() {
        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
        ['down', 'left', 'right', 'up'].forEach((key, i) => {
            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
        });
    }

    addPlayer(info) {
        let startX = this.mapWidth / 2;
        let startY = this.mapHeight / 2;

        if (this.zoneInterattive) {
            let startZone = this.zoneInterattive.find(z => z.nomeInterazione === 'Porta Inizio');
            if (startZone) {
                startX = startZone.x + (startZone.width || 16) / 2;
                startY = startZone.y + 32;
            }
        }

        this.player = this.physics.add.sprite(startX, startY, this.textureKey).setCollideWorldBounds(true);
        this.player.setScale(0.5);
        this.player.body.setSize(32, 32).setOffset(16, 32);
        this.player.setDepth(10);

        this.physics.add.collider(this.player, this.wallLayer);

        // Inizializzazione corretta del NameTag locale
        this.playerNameText = this.createNameTag(startX, startY, info.name);
        this.playerNameText.setDepth(10);

        this.cameras.main.startFollow(this.player, true).setZoom(4).setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true).setZoom(4.5);
    }

    addOtherPlayer(info) {
        let op = this.add.sprite(info.x, info.y, 'avatar');
        op.playerId = info.playerId;
        op.setScale(0.5); // Ridimensionamento sistemato
        op.setDepth(10);

        let colori = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8800'];
        let coloreCasuale = Phaser.Utils.Array.GetRandom(colori);

        op.nameText = this.createNameTag(info.x, info.y, info.name, coloreCasuale);
        op.nameText.setDepth(10);
        this.otherPlayers.add(op);
    }

    createNameTag(x, y, name, color = '#3E1E68') {
        return this.add.text(x, y - 15, name, {
            fontSize: '10px',
            fill: color,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL) && !this.isTransitioning && !this.pcOpen && !this.isDialogActive) {
            this.togglePauseMenu();
        }

        if (this.isTransitioning || !this.player || this.isPaused || this.pcOpen || this.isMovingGrid || this.isDialogActive) return;

        const TILE_SIZE = 16;
        let currentAnim = null;
        let dx = 0;
        let dy = 0;

        if (this.keys.LEFT.isDown || this.keys.A.isDown) { dx = -TILE_SIZE; currentAnim = 'left'; }
        else if (this.keys.RIGHT.isDown || this.keys.D.isDown) { dx = TILE_SIZE; currentAnim = 'right'; }
        else if (this.keys.UP.isDown || this.keys.W.isDown) { dy = -TILE_SIZE; currentAnim = 'up'; }
        else if (this.keys.DOWN.isDown || this.keys.S.isDown) { dy = TILE_SIZE; currentAnim = 'down'; }

        if (dx !== 0 || dy !== 0) {
            let targetX = this.player.x + dx;
            let targetY = this.player.y + dy;

            this.player.anims.play(currentAnim, true);

            let isOutOfBounds = targetX < 0 || targetX >= this.mapWidth || targetY < 0 || targetY >= this.mapHeight;
            let ostacolo = this.wallLayer.getTileAtWorldXY(targetX, targetY, true);
            let isWall = (ostacolo && ostacolo.index !== -1);

            if (!isWall && !isOutOfBounds) {
                this.isMovingGrid = true;
                if (this.socket) this.socket.emit('playerMovement', { x: targetX, y: targetY, anim: currentAnim });

                this.tweens.add({
                    targets: this.player,
                    x: targetX,
                    y: targetY,
                    duration: 250,
                    onUpdate: () => {
                        if (this.playerNameText) this.playerNameText.setPosition(this.player.x, this.player.y - 15);
                    },
                    onComplete: () => {
                        this.isMovingGrid = false;
                        this.player.anims.stop();

                        // Controllo porta d'uscita PvP
                        if (this.zoneInterattive && !this.isDialogActive && !this.isTransitioning) {
                            let interazioneCalpestata = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 20);
                            if (interazioneCalpestata && interazioneCalpestata.nomeInterazione === 'Porta Inizio') {
                                this.gestisciUscita();
                            }
                        }
                    }
                });
            } else {
                this.player.anims.stop();
            }
        } else {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CONFIRM) && !this.isTransitioning && !this.isDialogActive) {
            if (this.zoneInterattive) {
                let interazioneVicino = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 40);
                if (interazioneVicino) {
                    if (interazioneVicino.nomeInterazione === 'PC') {
                        this.player.anims.stop();
                        this.apriPC();
                        return;
                    } else if (interazioneVicino.nomeInterazione && interazioneVicino.nomeInterazione.includes('Cartello')) {
                        this.player.anims.stop();
                        this.leggiCartello();
                        return;
                    }
                }
            }

            if (this.otherPlayers && this.otherPlayers.getChildren) {
                let closest = this.otherPlayers.getChildren().find(op => Phaser.Math.Distance.Between(this.player.x, this.player.y, op.x, op.y) < 150);
                if (closest && this.socket) this.socket.emit('challengePlayer', closest.playerId);
            }
        }
    }

    gestisciUscita() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        this.createDialogUI();

        this.mostraTestiDialogo(["Vuoi tornare alla Lobby? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.tornaAllaLobby();
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                        this.player.y += 32; // Allontana di un passo
                        if (this.socket) this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, anim: 'up' });
                    });
                }
            });
        });
    }

    mostraSceltaSiNo(onChoice) {
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (!choiceContainer) {
            choiceContainer = document.createElement('div');
            choiceContainer.id = 'dialog-choice-container';
            choiceContainer.style.position = 'fixed';
            choiceContainer.style.bottom = '160px';
            choiceContainer.style.right = '5%';
            choiceContainer.style.transform = 'none';
            choiceContainer.style.width = 'auto';
            choiceContainer.style.minWidth = '120px';
            choiceContainer.style.backgroundColor = '#2b2b2b';
            choiceContainer.style.border = '4px solid #d05050';
            choiceContainer.style.boxSizing = 'border-box';
            choiceContainer.style.padding = '15px';
            choiceContainer.style.zIndex = '999999';
            choiceContainer.style.display = 'flex';
            choiceContainer.style.flexDirection = 'column';
            choiceContainer.style.gap = '15px';
            choiceContainer.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';
            let optSi = document.createElement('div'); optSi.id = 'dialog-opt-si'; optSi.style.color = '#ffffff'; optSi.style.fontFamily = '"Courier New", Courier, monospace'; optSi.style.fontSize = '26px'; optSi.style.fontWeight = 'bold'; optSi.style.textShadow = '2px 2px 0 #000';
            let optNo = document.createElement('div'); optNo.id = 'dialog-opt-no'; optNo.style.color = '#ffffff'; optNo.style.fontFamily = '"Courier New", Courier, monospace'; optNo.style.fontSize = '26px'; optNo.style.fontWeight = 'bold'; optNo.style.textShadow = '2px 2px 0 #000';
            choiceContainer.appendChild(optSi); choiceContainer.appendChild(optNo); document.body.appendChild(choiceContainer);
        }
        choiceContainer.style.display = 'flex';
        this.sceltaAttuale = 0;
        const aggiornaCursoreScelta = () => {
            let optSi = document.getElementById('dialog-opt-si'); let optNo = document.getElementById('dialog-opt-no');
            if (this.sceltaAttuale === 0) { optSi.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">SÌ</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">NO</span>`; }
            else { optSi.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">SÌ</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">NO</span>`; }
        };
        aggiornaCursoreScelta();
        const handleChoiceInput = (e) => {
            let key = e.key || (e.detail && e.detail.key);
            if (!key) return;
            if (key === 'ArrowUp' || key === 'w' || key === 'ArrowDown' || key === 's') { this.sceltaAttuale = this.sceltaAttuale === 0 ? 1 : 0; aggiornaCursoreScelta(); }
            else if (key === 'Enter' || key === ' ') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset(); onChoice(this.sceltaAttuale === 0 ? 'SI' : 'NO'); }
            else if (key === 'Escape' || key === 'Backspace') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset(); onChoice('NO'); }
        };
        setTimeout(() => { window.addEventListener('keydown', handleChoiceInput); window.addEventListener('dpad-input', handleChoiceInput); }, 100);
    }

    startEncounter(battleData, testo = "BATTAGLIA!") {
        this.isTransitioning = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%;">${testo}</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%;">${testo}</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;
            this.scene.pause();

            let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
            if (myDbTeam.length === 0) {
                alert("Non hai Pokémon in squadra! Visita il PC.");
                this.scene.resume('PvPScene');
                if (battleData.socket) battleData.socket.emit('setInBattle', false);
                return;
            }

            battleData.parentScene = 'PvPScene';
            this.scene.launch('BattleScene', battleData);
        }, 2000);
    }

    tornaAllaLobby() {
        this.isTransitioning = true;
        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;

            this.scene.stop('PvPScene');
            this.scene.start('WorldScene', { name: this.myPlayerName, user: this.user, vengoDa: 'Porta Centro' });
            this.scene.start('WorldScene', { name: this.myPlayerName, user: this.user, vengoDa: 'Porta PVP' });
        }, 1000);
    }

    togglePauseMenu() {
        if (this.isPaused) {
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu && existingMenu.inSubMenu) {
                existingMenu.renderMainPause();
                return;
            }
            this.isPaused = false;
            if (this.handlePauseKeyDown) {
                window.removeEventListener('keydown', this.handlePauseKeyDown);
                this.handlePauseKeyDown = null;
            }
            if (existingMenu) existingMenu.remove();
        } else {
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'modal-overlay';

            let selectedIdx = 0;
            let currentButtons = [];

            const updateSelection = () => {
                if (overlay.inSubMenu) return;
                currentButtons.forEach((btnId, idx) => {
                    let btn = document.getElementById(btnId);
                    if (btn) {
                        if (idx === selectedIdx) {
                            btn.style.transform = 'scale(1.05)';
                            btn.style.backgroundColor = '#4a3b5c';
                            btn.style.color = '#ffcc00';
                            btn.style.borderColor = '#ffcc00';
                            btn.style.boxShadow = '6px 6px 0 #ffcc00';
                        } else {
                            btn.style.transform = 'scale(1)';
                            btn.style.backgroundColor = '#f6eedf';
                            btn.style.color = '#ff7477';
                            btn.style.borderColor = '#ff7477';
                            btn.style.boxShadow = '4px 4px 0 #e69597';
                        }
                    }
                });
            };

            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'lobby-btn'];

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 400px;">
                        <h2 class="text-shadows" style="font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 30px; text-align: center;">ARENA PVP</h2>
                        <button id="profile-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 10px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">PROFILO</button>
                        <button id="controls-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">COMANDI</button>
                        <button id="lobby-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">TORNA ALLA LOBBY</button>
                        <p style="color: #fff; margin-top: 40px; font-size: 1.2rem; font-family: 'Courier New'; font-weight: bold; text-align: center;">Premi ESC per tornare al gioco</p>
                    </div>`;
                updateSelection();
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;

                let controlsHtml = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">MOVIMENTO</h3>
                        <p style="margin: 0;"><strong>WASD</strong> o <strong>Frecce Direzionali</strong></p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">AZIONI</h3>
                        <p style="margin: 0;"><strong>Conferma:</strong> INVIO</p>
                        <p style="margin: 5px 0 0 0;"><strong>Annulla / Indietro:</strong> ESC</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">IN BATTAGLIA</h3>
                        <p style="margin: 0;"><strong>Statistiche:</strong> SHIFT</p>
                    </div>
                    <div>
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">GENERICI</h3>
                        <p style="margin: 0;"><strong>Mouse / Touch:</strong> Interfaccia UI e Dialoghi</p>
                    </div>
                `;

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 500px;">
                        <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">COMANDI</h2>
                        <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ffcc00; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: left; max-height: 50vh; overflow-y: auto;">
                            ${controlsHtml}
                        </div>
                        <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-size: 1.5rem; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                    </div>
                `;
            };

            renderMainPause();
            document.getElementById('game-container').appendChild(overlay);

            this.handlePauseKeyDown = (e) => {
                let key = e.key;
                if (!overlay.inSubMenu) {
                    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                        selectedIdx = (selectedIdx - 1 + currentButtons.length) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                        selectedIdx = (selectedIdx + 1) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'Enter' || key === ' ') {
                        let btn = document.getElementById(currentButtons[selectedIdx]);
                        if (btn) btn.click();
                    }
                } else if (overlay.inSubMenu) {
                    if (key === 'Enter' || key === ' ' || key === 'Escape' || key === 'Backspace') {
                        let btn = document.getElementById('back-pause-btn');
                        if (btn) btn.click();
                    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        let btnPrev = document.getElementById('prev-avatar');
                        if (btnPrev) btnPrev.click();
                    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        let btnNext = document.getElementById('next-avatar');
                        if (btnNext) btnNext.click();
                    }
                }
            };
            window.addEventListener('keydown', this.handlePauseKeyDown);

            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'lobby-btn') {
                    e.target.innerText = "USCITA...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) window.removeEventListener('keydown', this.handlePauseKeyDown);
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();
                    this.tornaAllaLobby();
                } else if (e.target.id === 'controls-btn') {
                    renderControls();
                } else if (e.target.id === 'profile-btn') {
                    overlay.inSubMenu = true;
                    let profilo = this.registry.get('playerProfile');
                    let winRate = profilo.partite_totali > 0 ? ((profilo.vittorie_totali / profilo.partite_totali) * 100).toFixed(1) : 0;
                    let box = document.getElementById('pause-box');
                    let avatarNum = profilo.avatar_sprite || 1;
                    let currentAvatarPath = avatarNum == 1 ? 'assets/avatar.png' : `assets/avatar${avatarNum}.png`;

                    if (box) {
                        box.innerHTML = `
                            <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">PROFILO</h2>
                            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ff7477; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: center;">
                                <p><strong>NOME:</strong> ${profilo.username || 'Sconosciuto'}</p>
                                <p><strong>VITTORIE:</strong> ${profilo.vittorie_totali || 0}</p>
                                <p><strong>PARTITE:</strong> ${profilo.partite_totali || 0}</p>
                                <p><strong>VITTORIE %:</strong> ${winRate}%</p>
                                <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 15px;">
                                    <button id="prev-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&lt;</button>
                                    <div style="width: 32px; height: 32px; overflow: hidden; position: relative; transform: scale(2); margin: 0 15px; image-rendering: pixelated;">
                                        <img id="profile-avatar" src="${currentAvatarPath}" style="position: absolute; top: 0; left: 0; width: 400%; height: 400%; max-width: none;">
                                    </div>
                                    <button id="next-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&gt;</button>
                                </div>
                            </div>
                            <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                        `;
                    }
                } else if (e.target.id === 'prev-avatar' || e.target.id === 'next-avatar') {
                    let profilo = this.registry.get('playerProfile');
                    const avatars = ['assets/avatar.png', 'assets/avatar2.png', 'assets/avatar3.png', 'assets/avatar4.png', 'assets/avatar5.png', 'assets/avatar6.png'];
                    let imgEl = document.getElementById('profile-avatar');
                    let idx = avatars.indexOf(imgEl.getAttribute('src'));
                    if (idx === -1) idx = 0;
                    idx = e.target.id === 'prev-avatar' ? (idx - 1 + avatars.length) % avatars.length : (idx + 1) % avatars.length;

                    let newAvatarPath = avatars[idx];
                    imgEl.src = newAvatarPath;
                    let numberToSave = idx + 1;
                    profilo.avatar_sprite = numberToSave;

                    supabaseClient.from('profilo').update({ avatar_sprite: numberToSave }).eq('id_profilo', profilo.id_profilo);

                    let textureKey = newAvatarPath.split('/').pop().replace('.png', '');
                    if (this.player) {
                        this.player.setTexture(textureKey);
                        this.textureKey = textureKey;

                        // Distrugge le vecchie animazioni e le ricrea con il nuovo spritesheet
                        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
                        ['down', 'left', 'right', 'up'].forEach((key, i) => {
                            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                        });
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }
   createDialogUI() {
        let container = document.getElementById('dialog-ui-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dialog-ui-container';
            container.style.position = 'absolute';   /* Cambia da 'fixed' ad 'absolute' */
            container.style.bottom = '22vh';         /* Cambia da '20px' a '22vh' (così fluttua sopra i tasti) */
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.width = '95vw';
            container.style.maxWidth = '800px';
            container.style.height = 'auto';
            container.style.minHeight = '140px';
            container.style.backgroundColor = '#2b2b2b';
            container.style.border = '6px solid #d05050';
            container.style.boxSizing = 'border-box';
            container.style.padding = '20px 30px';
            container.style.zIndex = '999999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.justifyContent = 'flex-start';
            container.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';

            let textEl = document.createElement('div');
            textEl.id = 'dialog-ui-text';
            textEl.style.color = '#ffffff';
            textEl.style.fontFamily = '"Courier New", Courier, monospace';
            textEl.style.fontSize = '26px';
            textEl.style.fontWeight = 'bold';
            textEl.style.textShadow = '2px 2px 0 #000';
            textEl.style.lineHeight = '1.3';

            container.appendChild(textEl);

            // Cambia 'document.body' con 'document.getElementById('game-container')'
            document.getElementById('game-container').appendChild(container);
        }
        container.style.display = 'flex';
        document.getElementById('dialog-ui-text').innerText = '';
    }

    chiudiDialogo() {
        let container = document.getElementById('dialog-ui-container');
        if (container) container.style.display = 'none';
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (choiceContainer) choiceContainer.style.display = 'none';
    }

    mostraTestiDialogo(testi, onComplete) {
        let index = 0;
        let textEl = document.getElementById('dialog-ui-text');

        const mostraProssimo = () => {
            if (index < testi.length) {
                textEl.innerHTML = testi[index].replace(' ▼', '') + '<span style="color:#ffcc00;"> ▼</span>';
                index++;

                setTimeout(() => {
                    const handleEnter = (e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                            e.preventDefault(); window.removeEventListener('keydown', handleEnter);
                            if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset();
                            if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset();
                            mostraProssimo();
                        }
                    };
                    window.addEventListener('keydown', handleEnter);
                }, 100);
            } else {
                if (onComplete) onComplete();
            }
        };
        mostraProssimo();
    }

    leggiCartello() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.createDialogUI();

        this.mostraTestiDialogo([
            "BENVENUTO NELL'ARENA PVP!",
            "Qui puoi lottare con i tuoi amici o contro giocatori sconosciuti.",
            "Puoi utilizzare i PC ai lati della stanza per cambiare la tua squadra prima della lotta.",
            "Una volta pronto, avvicinati a un giocatore e premi INVIO!"
        ], () => {
            this.chiudiDialogo();
            this.time.delayedCall(100, () => { this.isDialogActive = false; });
        });
    }

    apriPC() {
        this.scene.manager.getScene('WorldScene').apriPC.call(this);
    }
}

// ==============================================================================
// 4. BATTLE SCENE: Il motore grafico della battaglia
// ==============================================================================
class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'BattleScene' }); }
    init(data) {
        this.isWild = data.isWild;
        this.isNPC = data.isNPC; // Leggiamo se è un allenatore controllato dal computer
        this.roomId = data.roomId;
        this.socket = data.socket;
        this.isForcedSwitch = false;
        this.parentScene = data.parentScene || 'WorldScene';
    }

    preload() {
        this.bgKey = `background_${Phaser.Math.Between(0, 11)}`;
        this.load.image(this.bgKey, `DB/Immagini/Sfondi/${this.bgKey}.png`);
        this.load.image('pokeball_lancio', 'assets/Pokeball Lancio.png');
        this.load.image('pokeball_scuoti', 'assets/Pokeball.png');
    }

    buildTeamData(dbTeam) {
        let pkmnDB = this.registry.get('pokemonDB');
        let moveDB = this.registry.get('moveDB');

        return dbTeam.map(dbPkmn => {
            let pData = pkmnDB[dbPkmn.id_specie];
            let mosseScelte = dbPkmn.mosse && dbPkmn.mosse.length > 0 ? dbPkmn.mosse : [...pData.mosse].sort(() => 0.5 - Math.random()).slice(0, 4);
            let baseHp = Math.floor(pData.statistiche.hp.base_stat * 1.5);

            return {
                nome: pData.nome,
                hp: baseHp, maxHp: baseHp, hpMax: baseHp, // DOPPIA SICUREZZA PER GLI HP!
                statistiche: {
                    attacco: pData.statistiche.attack.base_stat, difesa: pData.statistiche.defense.base_stat,
                    attaccoSpeciale: pData.statistiche['special-attack'].base_stat, difesaSpeciale: pData.statistiche['special-defense'].base_stat,
                    velocita: pData.statistiche.speed.base_stat
                },
                modificatori: {}, tipi: pData.tipi, livello: 50, stato: null,
                mosse: mosseScelte.map(mName => {
                    let nomeReal = typeof mName === 'object' ? mName.Nome : mName;
                    let mData = moveDB[nomeReal];
                    return mData ? { ...mData, ppAttuali: mData.PP, ppMassimi: mData.PP } : null;
                }).filter(m => m)
            };
        });
    }

    create() {
        let profilo = this.registry.get('playerProfile');
        let avatarNum = profilo ? (profilo.avatar_sprite || 1) : 1;
        this.textureKey = avatarNum == 1 ? 'avatar' : `avatar${avatarNum}`;
        this.pkmnDB = this.registry.get('pokemonDB');
        this.moveDB = this.registry.get('moveDB');

        this.keys = this.input.keyboard.addKeys(InputConfig);
        this.createStatsUI();

        this.myTeamData = this.buildTeamData(this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot));
        this.myActiveIdx = 0;

        if (this.isWild) {
            let pkmnNames = Object.keys(this.pkmnDB);

            if (this.isNPC) {
                this.oppTeamData = this.buildTeamData([
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) },
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) },
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) }
                ]);
            } else {
                let wildPkmn = Phaser.Utils.Array.GetRandom(pkmnNames);
                this.oppTeamData = this.buildTeamData([{ id_specie: wildPkmn }]);
            }

            this.oppActiveIdx = 0;
            this.startBattleLogic();
        } else {
            this.socket.off('pvpBothSelected');
            this.socket.on('pvpBothSelected', (selections) => {
                let oppId = Object.keys(selections).find(id => id !== this.socket.id) || this.socket.id;
                let oppData = selections[oppId];
                this.oppTeamData = oppData.team;
                this.oppActiveIdx = oppData.activeIdx;
                this.startBattleLogic();
            });

            this.socket.emit('pvpSelectPokemon', { roomId: this.roomId, team: this.myTeamData, activeIdx: 0 });
            this.showWaitingScreen();
        }
    }
    createStatsUI() {
        const html = `
            <div id="stats-overlay" style="display: none; position: absolute; top: 0; left: 0; width: 1000px; height: 665px; pointer-events: none; z-index: 1000;">
                <div id="enemy-stats-box" style="position: absolute; top: 90px; left: 300px; width: 330px; height: 110px; transform: translate(-50%, -50%); background: rgba(43,43,43,0.95); border: 4px solid #6874e8; border-radius: 8px; padding: 12px; color: white; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; box-sizing: border-box; z-index: 1001;"></div>
                <div id="player-stats-box" style="position: absolute; top: 450px; left: 770px; width: 330px; height: 110px; transform: translate(-50%, -50%); background: rgba(43,43,43,0.95); border: 4px solid #ff7477; border-radius: 8px; padding: 12px; color: white; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; box-sizing: border-box; z-index: 1001;"></div>
            </div>
        `;
        this.statsDom = this.add.dom(0, 0).createFromHTML(html).setOrigin(0, 0);
    }

    updateStatsUI() {
        const formatStat = (val) => (!val || val === 0) ? '-' : (val > 0 ? `<span style="color:#4caf50">+${val}</span>` : `<span style="color:#ff4444">${val}</span>`);
        const getMod = (mods, k1, k2) => mods ? (mods[k1] || mods[k2] || mods[k1.toLowerCase()] || 0) : 0;

        const getStatsHtml = (mods) => `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: left;">
                <div>ATK ${formatStat(getMod(mods, 'attacco', 'Attacco'))}</div>
                <div>S.ATK ${formatStat(getMod(mods, 'attaccoSpeciale', 'Attacco Speciale'))}</div>
                <div>ACC ${formatStat(getMod(mods, 'precisione', 'Precisione'))}</div>
                <div>DEF ${formatStat(getMod(mods, 'difesa', 'Difesa'))}</div>
                <div>S.DEF ${formatStat(getMod(mods, 'difesaSpeciale', 'Difesa Speciale'))}</div>
                <div>EVA ${formatStat(getMod(mods, 'elusione', 'Elusione'))}</div>
                <div style="grid-column: span 3; text-align: center;">SPD ${formatStat(getMod(mods, 'velocita', 'Velocità'))}</div>
            </div>
        `;

        document.getElementById('player-stats-box').innerHTML = getStatsHtml(this.myTeamData[this.myActiveIdx]?.modificatori || {});
        document.getElementById('enemy-stats-box').innerHTML = getStatsHtml(this.oppTeamData[this.oppActiveIdx]?.modificatori || {});
    }
    showWaitingScreen() {
        this.waitingDom = this.add.dom(500, 400).createFromHTML(`
            <div class="selection-overlay">
                <div class="selection-box">
                    <h2 class="selection-title">IN ATTESA DELL'AVVERSARIO...</h2>
                </div>
            </div>
        `);
    }

    startBattleLogic() {
        if (this.waitingDom) { this.waitingDom.destroy(); this.waitingDom = null; }

        if (this.isWild) {
            let p1 = { id: 'player', squadra: this.myTeamData, attivoIdx: this.myActiveIdx };
            let p2 = { id: 'bot', squadra: this.oppTeamData, attivoIdx: this.oppActiveIdx };
            this.partita = new gestionePartita(p1, p2);
            this.myTeamData = this.partita.p1.squadra;
        }

        let myActive = this.myTeamData[this.myActiveIdx];
        let oppActive = this.isWild ? this.partita.p2.squadra[this.oppActiveIdx] : this.oppTeamData[this.oppActiveIdx];

        this.pEntity = { name: myActive.nome, types: myActive.tipi, hp: myActive.hp, maxHp: myActive.hpMax, moves: myActive.mosse, alive: myActive.hp > 0 };
        this.eEntity = { name: oppActive.nome, types: oppActive.tipi, hp: oppActive.hp, maxHp: oppActive.hpMax, moves: oppActive.mosse, alive: oppActive.hp > 0 };

        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(1000, 665);

        let pSpriteUrl = this.pkmnDB[this.pEntity.name]?.sprite?.normal || '';
        let eSpriteUrl = this.pkmnDB[this.eEntity.name]?.sprite?.normal || '';
        // RIPRISTINATO LO SCALE DELLA BATTAGLIA PRINCIPALE
        this.pSprite = this.add.dom(250, 535).createFromHTML(`<img src="${pSpriteUrl}" style="transform: scale(2.5); image-rendering: pixelated;">`);
        this.eSprite = this.add.dom(750, 290).createFromHTML(`<img src="${eSpriteUrl}" style="transform: scale(2.2); image-rendering: pixelated;">`);

        // NUOVE UI BOX DOM
        this.eUI = this.createUIBox(300, 210, this.eEntity, false);
        this.pUI = this.createUIBox(770, 575, this.pEntity, true);

        this.add.rectangle(0, 665, 1000, 135, 0x2b2b2b).setOrigin(0, 0);
        this.add.rectangle(3, 668, 994, 129).setOrigin(0, 0).setStrokeStyle(6, 0xd05050);
        this.add.rectangle(6, 671, 988, 123).setOrigin(0, 0).setStrokeStyle(2, 0x555555);
        this.add.rectangle(590, 668, 6, 129, 0xd05050).setOrigin(0, 0);

        this.logText = this.add.text(30, 690, '', {
            fontSize: '26px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', wordWrap: { width: 530 }, lineSpacing: 8, shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true }
        });
        this.infoTipoLabel = this.add.text(610, 685, 'TIPO:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoTipoVal = this.add.text(700, 685, '---', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoCatLabel = this.add.text(610, 725, 'CAT:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoCatVal = this.add.text(700, 725, '---', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPotLabel = this.add.text(840, 685, 'POT:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPotVal = this.add.text(920, 685, '--', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPrecLabel = this.add.text(840, 725, 'PREC:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPrecVal = this.add.text(920, 725, '--', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPPLabel = this.add.text(840, 765, 'PP:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.infoPPVal = this.add.text(920, 765, '--/--', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold' });
        this.moveInfoUI = [this.infoTipoLabel, this.infoTipoVal, this.infoCatLabel, this.infoCatVal, this.infoPPLabel, this.infoPPVal, this.infoPotLabel, this.infoPotVal, this.infoPrecLabel, this.infoPrecVal]; this.createButtons();

        if (!this.isWild) {
            this.socket.off('resolveTurn');
            this.socket.on('resolveTurn', (data) => this.resolveTurn(data));
        }
        this.startTurn();
    }

    createUIBox(x, y, entity, isPlayer) {
        let pct = (entity.hp / entity.maxHp) * 100;
        let color = pct > 50 ? '#4caf50' : (pct > 20 ? '#ffeb3b' : '#f44336');

        // MAGIA: Se il box è del giocatore, iniettiamo il badge "TUO"
        let indicatorHTML = isPlayer ? `<div class="player-indicator">TU</div>` : '';

        const html = `
            <div class="battle-hp-box" id="${isPlayer ? 'player-hp-box' : 'enemy-hp-box'}" style="position: relative;">
                ${indicatorHTML}
                <div class="battle-status-label" style="position: absolute; top: -15px; left: 15px; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px; color: #fff; background-color: transparent;"></div>
                <div class="battle-pkmn-name">${entity.name}</div>
                <div class="hp-container" style="margin-top: 5px;">
                    <span class="hp-label">HP</span>
                    <div class="hp-bar-bg">
                        <div class="hp-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
                    </div>
                </div>
                <div class="battle-hp-text">${entity.hp}/${entity.maxHp}</div>
            </div>
        `;
        return this.add.dom(x, y).createFromHTML(html);
    }

    updateUI() {
        [{ dom: this.pUI, ent: this.pEntity }, { dom: this.eUI, ent: this.eEntity }].forEach(obj => {
            if (!obj.dom.node) return;
            const hpText = obj.dom.node.querySelector('.battle-hp-text');
            const bar = obj.dom.node.querySelector('.hp-bar-fill');
            const name = obj.dom.node.querySelector('.battle-pkmn-name');

            name.innerText = obj.ent.name.toUpperCase();
            hpText.innerText = `${obj.ent.hp}/${obj.ent.maxHp}`;
            let pct = (obj.ent.hp / obj.ent.maxHp) * 100;
            bar.style.width = `${pct}%`;
            bar.style.backgroundColor = pct > 50 ? '#4caf50' : (pct > 20 ? '#ffeb3b' : '#f44336');
        });
    }

    createButtons() {
        this.btns = [];
        this.selectedMoveIndex = 0;
        this.isInputActive = false;
        this.menuState = 'MAIN';

        for (let i = 0; i < 4; i++) {
            let bx = 40 + (i % 2) * 260;
            let by = 690 + Math.floor(i / 2) * 45;

            let b = this.add.text(bx, by, '', {
                fontSize: '24px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true }, padding: { x: 2, y: 5 }
            }).setInteractive()
                .on('pointerdown', () => { if (this.isInputActive) this.handleButtonClick(i); })
                .on('pointerover', () => { if (this.isInputActive) { this.selectedMoveIndex = i; this.updateMenuSelection(); } });

            b.setVisible(false);
            this.btns.push(b);
        }
    }

    updateMenuSelection() {
        if (this.menuState === 'MAIN') {
            const mainOptions = ['LOTTA', this.isWild ? 'POKÉBALL' : 'ZAINO', 'POKÉMON', 'FUGA'];
            this.btns.forEach((b, i) => {
                b.setVisible(true);
                b.setText((i === this.selectedMoveIndex ? "▶ " : "  ") + mainOptions[i]);
                b.setStyle({ fill: i === this.selectedMoveIndex ? '#ffcc00' : '#ffffff' });
            });
            this.moveInfoUI.forEach(element => element.setVisible(false));

        } else if (this.menuState === 'MOVES') {
            this.btns.forEach((b, i) => {
                let m = this.pEntity.moves[i];
                if (m) {
                    b.setVisible(true);
                    b.setText((i === this.selectedMoveIndex ? "▶ " : "  ") + m.Nome.toUpperCase());
                    b.setStyle({ fill: i === this.selectedMoveIndex ? '#ffcc00' : '#ffffff' });
                } else {
                    b.setVisible(false);
                }
            });

            let m = this.pEntity.moves[this.selectedMoveIndex];
            if (m) {
                this.infoTipoVal.setText(m.Tipo.toUpperCase()).setColor(this.getColorForType(m.Tipo));
                this.infoCatVal.setText(m.Categoria.toUpperCase()).setColor(m.Categoria === "Fisico" ? '#ff4444' : (m.Categoria === "Speciale" ? '#4444ff' : '#aaaaaa'));
                this.infoPPVal.setText(`${m.ppAttuali}/${m.ppMassimi}`).setColor(m.ppAttuali <= 0 ? '#ff4444' : '#ffffff');
                this.infoPPLabel.setText('PP:');
                this.infoPotLabel.setText('POT:');
                this.infoPrecLabel.setText('PREC:');

                this.infoPotVal.setText(m.Potenza > 0 ? m.Potenza : '--');
                this.infoPrecVal.setText(m.Precisione > 0 ? m.Precisione : '--');

                this.moveInfoUI.forEach(element => element.setVisible(true));
            } else {
                this.moveInfoUI.forEach(element => element.setVisible(false));
            }
        } else {
            this.moveInfoUI.forEach(element => element.setVisible(false));
        }
    }

    getColorForType(tipo) {
        const typeColors = { "Normale": "#A8A878", "Fuoco": "#F08030", "Acqua": "#6890F0", "Elettro": "#F8D030", "Erba": "#78C850", "Ghiaccio": "#98D8D8", "Lotta": "#C03028", "Veleno": "#A040A0", "Terra": "#E0C068", "Volante": "#A890F0", "Psico": "#F85888", "Coleottero": "#A8B820", "Roccia": "#B8A038", "Spettro": "#705898", "Drago": "#7038F8", "Buio": "#705848", "Acciaio": "#B8B8D0", "Folletto": "#EE99AC" };
        return typeColors[tipo] || "#777777";
    }


    update() {
        if (this.keys.STATS && this.keys.STATS.isDown && this.isInputActive && (this.menuState === 'MAIN' || this.menuState === 'MOVES')) {
            if (this.statsDom.node.querySelector('#stats-overlay').style.display === 'none') {
                this.updateStatsUI();
                this.statsDom.node.querySelector('#stats-overlay').style.display = 'block';
            }
        } else if (this.statsDom && this.statsDom.node) {
            this.statsDom.node.querySelector('#stats-overlay').style.display = 'none';
        }

        if (!this.isInputActive) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.LEFT) || Phaser.Input.Keyboard.JustDown(this.keys.A)) {
            if (this.selectedMoveIndex % 2 !== 0) this.selectedMoveIndex--;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) || Phaser.Input.Keyboard.JustDown(this.keys.D)) {
            if (this.selectedMoveIndex % 2 === 0) this.selectedMoveIndex++;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.W)) {
            if (this.selectedMoveIndex >= 2) this.selectedMoveIndex -= 2;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || Phaser.Input.Keyboard.JustDown(this.keys.S)) {
            if (this.selectedMoveIndex <= 1) this.selectedMoveIndex += 2;
            this.updateMenuSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CONFIRM)) {
            this.handleButtonClick(this.selectedMoveIndex);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL)) {
            if (this.menuState === 'MOVES') {
                this.menuState = 'MAIN';
                this.selectedMoveIndex = 0;
                this.updateMenuSelection();
            }
        }
    }

    startTurn() {
        this.logText.setVisible(false);
        this.isInputActive = true;
        this.menuState = 'MAIN';
        this.selectedMoveIndex = 0;

        if (this.pEntity.mossaForzata) {
            let forcedMoveName = this.pEntity.mossaForzata;
            let forcedMoveData = this.pEntity.moves.find(m => m && m.Nome === forcedMoveName);

            if (forcedMoveData && forcedMoveData.ppAttuali <= 0 && forcedMoveName !== "Ricarica") {
                this.pEntity.mossaForzata = null;
            } else {
                this.btns.forEach(b => b.setVisible(false));
                this.moveInfoUI.forEach(element => element.setVisible(false));
                this.isInputActive = false;
                this.time.delayedCall(1000, () => this.handleMoveClick(forcedMoveName));
                return;
            }
        }

        let haMosseDisponibili = this.pEntity.moves.some(m => m && m.ppAttuali > 0);
        if (!haMosseDisponibili) {
            this.pEntity.moves = [this.moveDB["Scontro"] || { Nome: "Scontro", Tipo: "Normale", Categoria: "Fisico", ppAttuali: 1, ppMassimi: 1 }];
            this.selectedMoveIndex = 0;
        }

        this.updateMenuSelection();
    }

    handleMoveClick(moveName) {
        let myMoveData = this.pEntity.moves.find(m => m.Nome === moveName);

        if (moveName !== "Ricarica" && moveName !== "Scontro" && myMoveData && myMoveData.ppAttuali !== undefined && myMoveData.ppAttuali <= 0) {
            let warningText = this.add.text(500, 400, "PP ESAURITI!", { fontSize: '40px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
            this.tweens.add({ targets: warningText, y: 350, alpha: 0, duration: 1500, onComplete: () => warningText.destroy() });
            return;
        }

        this.isInputActive = false;
        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));
        this.logText.setVisible(true);

        if (this.isWild) {
            let activeBot = this.partita.p2.squadra[this.partita.p2.attivoIdx];
            let activePlayer = this.partita.p1.squadra[this.partita.p1.attivoIdx]; // Serve per fargli leggere le tue stat!
            let mosseDisponibiliBot = activeBot.mosse.filter(m => m.ppAttuali > 0);
            let botMoveData;

            if (this.eEntity.mossaForzata) {
                botMoveData = activeBot.mosse.find(m => m && m.Nome === this.eEntity.mossaForzata);
                if (this.eEntity.mossaForzata === "Ricarica") {
                    botMoveData = { Nome: "Ricarica", Tipo: "Normale", Categoria: "Stato", Potenza: 0, Precisione: 100, CodiceFunzione: [] };
                } else if (botMoveData && botMoveData.ppAttuali <= 0) {
                    this.eEntity.mossaForzata = null;
                    // FIX: Anche nel caso in cui finisca i PP della mossa forzata, usa l'IA!
                    botMoveData = (mosseDisponibiliBot.length > 0) ? this.partita.scegliMossaBotIntelligente(activeBot, activePlayer, this.partita.p2, this.partita.p1) : this.moveDB["Scontro"];
                }
            } else if (mosseDisponibiliBot.length > 0) {
                // MAGIA: Chiamiamo l'IA!
                botMoveData = this.partita.scegliMossaBotIntelligente(activeBot, activePlayer, this.partita.p2, this.partita.p1);
            } else {
                botMoveData = this.moveDB["Scontro"];
            }

            if (!botMoveData) botMoveData = { Nome: "Scontro", Tipo: "Normale", Categoria: "Fisico" };
            if (!myMoveData) myMoveData = { Nome: moveName, Tipo: "Normale", Categoria: "Fisico" };

            let statoAggiornato = this.partita.processaTurno({ mossa: myMoveData }, { mossa: botMoveData });
            this.applicaStatoPartita(statoAggiornato, false);
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, moveName: moveName });
        }
    }

    handleButtonClick(index) {
        if (this.menuState === 'MAIN') {
            if (index === 0) {
                this.menuState = 'MOVES'; this.selectedMoveIndex = 0; this.updateMenuSelection();
            } else if (index === 1) {
                this.tentaCattura();
            } else if (index === 2) {
                this.openTeamModal();
            } else if (index === 3) {
                this.isInputActive = false; this.btns.forEach(b => b.setVisible(false));
                this.logText.setVisible(true);
                if (this.isWild) {
                    this.logText.setText("Sei fuggito con successo!");
                    this.time.delayedCall(1500, () => {
                        if (this.socket) this.socket.emit('setInBattle', false);
                        this.scene.stop(); this.scene.resume(this.parentScene);
                    });
                } else {
                    this.logText.setText("In attesa dell'avversario...");
                    this.socket.emit('pvpUseMove', { roomId: this.roomId, tipo: 'flee' });
                }
            }
        } else if (this.menuState === 'MOVES') {
            let m = this.pEntity.moves[index];
            if (m) this.handleMoveClick(m.Nome);
        }
    }
    tentaCattura() {
        this.isInputActive = false;
        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));
        this.logText.setVisible(true);

        if (!this.isWild || this.isNPC) {
            this.logText.setText("Non puoi catturare i Pokémon di un altro allenatore!");
            this.time.delayedCall(1500, () => this.startTurn());
            return;
        }

        // 1. Controllo immediato: se già posseduto, avvisa e torna al menu
        let myPokemonList = this.registry.get('userPokemon');
        let giaPosseduto = myPokemonList.some(p => p.id_specie === this.eEntity.name);

        if (giaPosseduto) {
            console.log(`Pokémon già presente: ${this.eEntity.name}`); // Scrive in console
            this.logText.setText("Hai già questo Pokémon nel PC! Scegli un'altra azione.");

            // Aspetta 2 secondi per far leggere il messaggio, poi riabilita il menu principale
            this.time.delayedCall(2000, () => {
                this.startTurn(); // Torna al menu principale (LOTTA, ZAINO, ecc.)
            });
            return;
        }

        // 2. Se non è posseduto, procedi col lancio grafico
        this.logText.setText("Lanci la Pokéball...");
        let ball = this.add.image(250, 600, 'pokeball_lancio').setScale(0.5);
        this.tweens.add({
            targets: ball,
            x: 750, y: 290,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                ball.destroy();
                this.avviaAnimazioneCattura();
            }
        });
    }
    avviaAnimazioneCattura() {
        let prob = this.calcolaProbabilitaCattura();
        let catturato = Phaser.Math.Between(1, 100) <= prob;

        // --- CORREZIONE: Fai sparire il Pokémon selvatico all'inizio dei rintocchi ---
        if (this.eSprite) {
            this.eSprite.setAlpha(0);
        }

        // 2. Pokéball sul terreno (quella per i rintocchi)
        let ball = this.add.image(750, 320, 'pokeball_scuoti').setScale(0.6);

        // Animazione rintocchi (3 volte)
        this.tweens.add({
            targets: ball,
            angle: 20, duration: 200, yoyo: true, repeat: 2,
            onComplete: () => {
                if (catturato) {
                    this.mostraSuccessoCattura(ball);
                } else {
                    // --- CORREZIONE: Se fallisce, il Pokémon riappare ---
                    if (this.eSprite) this.eSprite.setAlpha(1);
                    this.mostraFallimentoCattura(ball);
                }
            }
        });
    }
    mostraSuccessoCattura(ball) {
        this.logText.setText(`Preso! Hai catturato ${this.eEntity.name.toUpperCase()}! 🎉`);
        this.salvaPokemonCatturato(this.eEntity.name);

        // Brillio finale
        ball.setTint(0xffff00);
        this.time.delayedCall(2000, () => {
            this.registry.set('lastBattleResult', 'win');
            this.scene.stop();
            this.scene.resume(this.parentScene);
        });
    }
    mostraFallimentoCattura(ball) {
        this.logText.setText("Oh no! Il Pokémon si è liberato!");
        // Effetto uscita
        this.tweens.add({ targets: ball, alpha: 0, duration: 500, onComplete: () => ball.destroy() });

        this.time.delayedCall(1500, () => {
            // Turno del bot dopo il fallimento
            let activeBot = this.partita.p2.squadra[this.partita.p2.attivoIdx];
            let botMoveData = this.partita.scegliMossaBotIntelligente(activeBot, this.partita.p1.squadra[this.partita.p1.attivoIdx], this.partita.p2, this.partita.p1);
            let stato = this.partita.processaTurno({ mossa: { Nome: "Fallita" } }, { mossa: botMoveData });
            this.applicaStatoPartita(stato, false);
        });
    }
    calcolaProbabilitaCattura() {
        let base = 20; // Probabilità base
        let bonus = 0;

        // Bonus Vita (HP)
        let hpPct = (this.eEntity.hp / this.eEntity.maxHp) * 100;
        if (hpPct <= 25) bonus += 30;      // Sotto 25% +30%
        else if (hpPct <= 50) bonus += 15; // Sotto 50% +15%

        // Bonus Stato
        if (this.eEntity.stato) {
            bonus += 15; // +15% se ha uno stato alterato (Sonno, Paralisi, ecc.)
        }

        let probTotale = Math.min(base + bonus, 90); // Massimo 90% per non renderlo sicuro al 100%
        return probTotale;
    }

    async salvaPokemonCatturato(nomeSpecie) {
        try {
            let myPokemonList = this.registry.get('userPokemon');
            let inSquadraCount = myPokemonList.filter(p => p.in_squadra).length;

            let mettiInSquadra = inSquadraCount < 3;
            let posSlot = mettiInSquadra ? inSquadraCount + 1 : null;

            let nuovoPkmn = {
                id_specie: nomeSpecie,
                id_profilo_proprietario: this.registry.get('playerProfile').id_profilo,
                in_squadra: mettiInSquadra,
                posizione_slot: posSlot
            };

            const { data, error } = await supabaseClient.from('pokemon').insert([nuovoPkmn]).select();

            if (!error && data && data.length > 0) {
                myPokemonList.push(data[0]);
                this.registry.set('userPokemon', myPokemonList);
            }
        } catch (err) {
            console.error("Errore durante il salvataggio del Pokémon:", err);
        }
    }
    resolveTurn(turnData) {
        this.applicaStatoPartita(turnData.stato, turnData.inverti);
    }

    applicaStatoPartita(stato, inverti) {
        this.invertiLogs = inverti;
        this.currentTurn = stato.turno;
        let p1Data = inverti ? stato.p2 : stato.p1;
        let p2Data = inverti ? stato.p1 : stato.p2;

        this.myActiveIdx = p1Data.attivoIdx;

        p1Data.squadra.forEach((p, i) => {
            if (this.myTeamData[i]) {
                this.myTeamData[i].hp = p.hp;
                this.myTeamData[i].modificatori = p.modificatori;
            }
        });
        if (this.oppTeamData) {
            p2Data.squadra.forEach((p, i) => {
                if (this.oppTeamData[i]) {
                    this.oppTeamData[i].hp = p.hp;
                    this.oppTeamData[i].modificatori = p.modificatori;
                }
            });
        }

        // NUOVO CODICE CORAZZATO
        if (this.myTeamData && this.myTeamData[this.myActiveIdx]) {
            this.myTeamData[this.myActiveIdx].mosse = [...(p1Data.mosse || [])];
        }
        if (this.oppTeamData && this.oppTeamData[p2Data.attivoIdx]) {
            this.oppTeamData[p2Data.attivoIdx].mosse = [...(p2Data.mosse || [])];
        }

        // FIX CRASH 1: Aggiorniamo tramite DOM updateUI() invece di cercare il vecchio setText di Phaser
        if (p1Data.nome !== this.pEntity.name) {
            let myNewActive = this.myTeamData[this.myActiveIdx];
            this.pEntity = { name: myNewActive.nome, types: myNewActive.tipi, hp: myNewActive.hp, maxHp: myNewActive.maxHp, moves: myNewActive.mosse, alive: myNewActive.hp > 0 };
            if (this.pSprite.node) this.pSprite.node.querySelector('img').src = this.pkmnDB[myNewActive.nome].sprite.normal;
            this.updateUI();
            this.updateStatusOverlay(true, null);
        }

        if (p2Data.nome !== this.eEntity.name) {
            let oppNewActive = this.oppTeamData[p2Data.attivoIdx];
            this.eEntity = { name: oppNewActive.nome, types: oppNewActive.tipi, hp: oppNewActive.hp, maxHp: oppNewActive.maxHp, moves: oppNewActive.mosse, alive: oppNewActive.hp > 0 };
            if (this.eSprite.node) this.eSprite.node.querySelector('img').src = this.pkmnDB[oppNewActive.nome].sprite.normal;
            this.updateUI();
            this.updateStatusOverlay(false, null);
        }

        this.pEntity.mossaForzata = p1Data.mossaForzata;
        this.eEntity.mossaForzata = p2Data.mossaForzata;

        if (p1Data.trasformato && this.pSprite.node) this.pSprite.node.querySelector('img').src = this.pkmnDB[this.eEntity.name].sprite.normal;
        if (p2Data.trasformato && this.eSprite.node) this.eSprite.node.querySelector('img').src = this.pkmnDB[this.pEntity.name].sprite.normal;

        let iAmDead = p1Data.hp <= 0;
        let oppIsDead = p2Data.hp <= 0;
        this.mostraLogsSequenziali(stato.logs, () => {
            this.updateUI();

            if (stato.finito) {
                this.time.delayedCall(1500, async () => {
                    let ioSconfitto = p1Data.sconfitto !== undefined ? p1Data.sconfitto : p1Data.squadra.every(p => p.hp <= 0);
                    let oppSconfitto = p2Data.sconfitto !== undefined ? p2Data.sconfitto : p2Data.squadra.every(p => p.hp <= 0);

                    let esito = '';
                    if (!ioSconfitto && oppSconfitto) {
                        this.logText.setText('HAI VINTO! 🎉');
                        esito = 'win';
                    } else if (ioSconfitto && !oppSconfitto) {
                        this.logText.setText('HAI PERSO... 💀');
                        esito = 'lose';
                    } else {
                        this.logText.setText('PAREGGIO! ⚖️');
                        esito = 'draw';
                    }

                    this.registry.set('lastBattleResult', esito);

                    // AGGIORNAMENTO STATISTICHE NEL DB DOPO LA PARTITA (SOLO PVP)
                    if (!this.isWild) {
                        try {
                            let profilo = this.registry.get('playerProfile');
                            if (profilo) {
                                // CODICE NUOVO CORRETTO
                                profilo.partite_totali = (profilo.partite_totali || 0) + 1;
                                if (esito === 'win') profilo.vittorie_totali = (profilo.vittorie_totali || 0) + 1;
                                await supabaseClient.from('profilo').update({
                                    partite_totali: profilo.partite_totali,
                                    vittorie_totali: profilo.vittorie_totali
                                }).eq('id_profilo', profilo.id_profilo);
                                this.registry.set('playerProfile', profilo);
                            }
                        } catch (e) {
                            console.error("Errore salvataggio statistiche fine partita:", e);
                        }
                    }

                    let loserSprite = (esito === 'lose') ? this.pSprite : this.eSprite;
                    let fadeTweens = esito === 'draw' ? [this.pSprite, this.eSprite] : [loserSprite];

                    this.tweens.add({
                        targets: fadeTweens, y: '+=100', alpha: 0, duration: 1000,
                        onComplete: () => {
                            if (this.socket) this.socket.emit('setInBattle', false);
                            this.scene.stop(); this.scene.resume(this.parentScene);
                        }
                    });
                });
            } else if (iAmDead) {
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));

                // CONTROLLA SE HAI ALTRI POKEMON IN SQUADRA
                let altriDisponibili = this.myTeamData.some((p, idx) => p.hp > 0 && idx !== this.myActiveIdx);

                if (altriDisponibili) {
                    this.logText.setText(`${this.pEntity.name} è esausto! Scegli il sostituto!`);
                    this.time.delayedCall(1500, () => this.forceSwitchMenu());
                } else {
                    // Solo qui la run fallisce davvero
                    this.logText.setText("Tutti i tuoi Pokémon sono esausti! Sei tornato alla base.");
                    this.time.delayedCall(2000, () => {
                        this.registry.set('lastBattleResult', 'lose');
                        this.scene.stop();
                        this.scene.resume(this.parentScene);
                    });
                }
            } else if (oppIsDead) {
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));

                if (this.isWild) {
                    this.logText.setText(`${p2Data.nome} è esausto!`);
                    this.time.delayedCall(1500, () => {
                        let nextBotIdx = this.partita.p2.squadra.findIndex(p => p.hp > 0);
                        if (nextBotIdx !== -1) {
                            this.partita.p2.attivoIdx = nextBotIdx;
                            let nuovoPk = this.partita.p2.squadra[nextBotIdx];
                            this.partita.logs = [`L'avversario manda in campo ${nuovoPk.nome}! `];
                            let nuovoStato = this.partita.ottieniStatoAggiornato();
                            this.applicaStatoPartita(nuovoStato, false);
                        } else {
                            this.startTurn();
                        }
                    });
                } else {
                    this.logText.setText("L'avversario sta scegliendo chi mandare in campo...");
                }
            } else {
                this.startTurn();
            }
        });
    }

    forceSwitchMenu() {
        this.isInputActive = false;
        this.isForcedSwitch = true;
        this.openTeamModal();
    }

    mostraLogsSequenziali(logs, onComplete) {
        if (!logs || logs.length === 0) { if (onComplete) onComplete(); return; }
        let index = 0; let ultimoAttaccanteEraPlayer = null;

        let mostraProssimo = () => {
            if (index < logs.length) {
                let logObj = logs[index];
                let riga = typeof logObj === 'object' ? logObj.testo : logObj;

                if (typeof logObj === 'object') {
                    this.pEntity.hp = this.invertiLogs ? logObj.p2Hp : logObj.p1Hp;
                    this.eEntity.hp = this.invertiLogs ? logObj.p1Hp : logObj.p2Hp;
                    this.updateUI();
                }

                let targetHp = null;
                if (typeof riga === 'string' && riga.includes("|HP:")) {
                    let parts = riga.split("|HP:");
                    riga = parts[0]; targetHp = parseInt(parts[1]);
                }

                this.logText.setText(riga);
                let isPlayerTarget = riga.includes(this.pEntity.name);
                let isEnemyTarget = riga.includes(this.eEntity.name);

                if (riga.includes(" usa ")) {
                    ultimoAttaccanteEraPlayer = riga.includes(this.pEntity.name);
                    this.playDash(ultimoAttaccanteEraPlayer);
                }

                if (riga.includes("Inflitti") || riga.includes("efficace") || riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("recupera") || riga.includes("rigenera") || riga.includes("contraccolpo")) {
                    let targetEnt = isPlayerTarget ? this.pEntity : (isEnemyTarget ? this.eEntity : null);
                    if (targetEnt && targetHp !== null) targetEnt.hp = targetHp;
                    this.updateUI(targetEnt);

                    if (riga.includes("Inflitti") || riga.includes("efficace")) { if (ultimoAttaccanteEraPlayer !== null) this.playDamage(!ultimoAttaccanteEraPlayer); }
                    else if (riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("contraccolpo")) { this.playDamage(isPlayerTarget); }
                }

                if (riga.includes("aumenta")) this.playStatAnim(isPlayerTarget, true);
                else if (riga.includes("diminuisce")) this.playStatAnim(isPlayerTarget, false);

                if (riga.includes("stato di")) {
                    let stato = riga.split("stato di ")[1].replace("!", "").trim();
                    this.updateStatusOverlay(isPlayerTarget, stato);
                } else if (riga.includes("addormentato per la sonnolenza")) this.updateStatusOverlay(isPlayerTarget, "Sonno");
                else if (riga.includes("si è svegliato") || riga.includes("si è scongelato") || riga.includes("curato dal suo problema di stato")) this.updateStatusOverlay(isPlayerTarget, null);

                if ((riga.includes("confuso") || riga.includes("Confusione")) && !riga.includes("non è più confuso")) this.playConfusion(isPlayerTarget);
                if (riga.includes("intrappolato") || riga.includes("Legatutto") || riga.includes("Parassiseme")) this.playTrap(isPlayerTarget);

                index++;
                this.time.delayedCall(1500, mostraProssimo);
            } else {
                this.updateUI();
                if (onComplete) onComplete();
            }
        };
        mostraProssimo();
    }

    playDash(isPlayer) { let sprite = isPlayer ? this.pSprite : this.eSprite; let dist = isPlayer ? 60 : -60; this.tweens.add({ targets: sprite, x: sprite.x + dist, duration: 100, yoyo: true, ease: 'Power2' }); }
    playDamage(isPlayer) { let sprite = isPlayer ? this.pSprite : this.eSprite; this.tweens.add({ targets: sprite, alpha: 0.5, x: sprite.x + (isPlayer ? 5 : -5), duration: 50, yoyo: true, repeat: 5, onComplete: () => sprite.alpha = 1 }); }
    playStatAnim(isPlayer, isUp) { let x = isPlayer ? 250 : 750; let y = isPlayer ? 550 : 280; let color = isUp ? '#00FF00' : '#FF0000'; let label = isUp ? '↑ STATS' : '↓ STATS'; let t = this.add.text(x, y, label, { fontSize: '32px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5); this.tweens.add({ targets: t, y: y - 100, alpha: 0, duration: 1500, onComplete: () => t.destroy() }); }
    updateStatusOverlay(isPlayer, stato) {
        let ui = isPlayer ? this.pUI : this.eUI;
        if (!ui || !ui.node) return;

        let statusLabel = ui.node.querySelector('.battle-status-label');
        if (!statusLabel) return;

        if (!stato) {
            statusLabel.innerText = '';
            statusLabel.style.backgroundColor = 'transparent';
            return;
        }

        const colori = { 'Scottatura': '#f08030', 'Paralisi': '#f8d030', 'Sonno': '#8c888c', 'Avvelenamento': '#a040a0', 'Iperavvelenamento': '#a040a0', 'Congelamento': '#98d8d8' };
        statusLabel.innerText = stato.toUpperCase();
        statusLabel.style.backgroundColor = colori[stato] || '#777';
    }
    playConfusion(isPlayer) { let x = isPlayer ? 250 : 750; let y = isPlayer ? 470 : 200; let d1 = this.add.text(x - 30, y, '🦆', { fontSize: '30px' }).setOrigin(0.5); let d2 = this.add.text(x + 30, y, '🦆', { fontSize: '30px' }).setOrigin(0.5); this.tweens.add({ targets: [d1, d2], angle: 360, duration: 1000, repeat: 1, onComplete: () => { d1.destroy(); d2.destroy(); } }); }
    playTrap(isPlayer) { let targetX = isPlayer ? 250 : 750; let targetY = isPlayer ? 550 : 280; let trap = this.add.text(targetX, targetY, '🔗', { fontSize: '100px' }).setOrigin(0.5); this.tweens.add({ targets: trap, scale: { from: 2, to: 1 }, alpha: { from: 1, to: 0 }, duration: 1500, onComplete: () => trap.destroy() }); }

    openTeamModal() {
        this.isInputActive = false;
        this.modalSelection = 0;
        this.currentView = 'list';
        this.summaryPage = 0;

        let teamData = this.myTeamData;

        const html = `
            <div class="pkmn-modal-content">
                    <div id="modal-list-view" style="display: flex; flex-direction: column; width: 100%; flex: 1; overflow: hidden;">
                        <div class="pkmn-modal-header" style="margin-bottom: 25px;">SQUADRA POKÉMON</div> <div class="pokemon-list" id="pkmn-list-container" style="display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box; overflow-y: auto; overflow-x: hidden; flex: 1;"></div>
                    </div>

                    <div id="modal-summary-view" class="summary-view" style="display: none; flex-direction: column; width: 100%; flex: 1; overflow: hidden;">
                        <div class="pkmn-modal-header" id="summary-page-indicator" style="cursor: pointer; padding: 5px 0; margin-bottom: 25px;">◀ INFO E STATISTICHE ▶</div>
                        
                        <div class="summary-layout" style="display: flex; gap: 20px; flex: 1; overflow: hidden;">
                            <div class="summary-left" style="flex: 1; text-align: center; border-right: 4px dashed var(--color-quaternary); display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
                               <div class="pkmn-name" id="summary-name" style="margin-bottom: 10px; font-size: 1.8rem; flex-shrink: 0;">NOME</div>
                            <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 140px;">
                               <img id="summary-sprite" src="" style="width: 240px; height: 240px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.5));">
                            </div>
                            <div class="summary-types" id="summary-types" style="display: flex; justify-content: center; gap: 10px; margin-top: 10px; margin-bottom: 15px; flex-shrink: 0;"></div>
                            
                            <div class="move-description-box" id="summary-move-desc" style="display: none; width: 100%; height: 130px; flex-shrink: 0;">
                                <div id="desc-text" style="flex: 1; text-align: left; font-size: 1.1rem; overflow-y: auto; padding-right: 5px; line-height: 1.3;">Seleziona una mossa...</div>
                                <div style="display: flex; justify-content: space-between; border-top: 2px dashed #ff7477; padding-top: 8px; margin-top: 8px; font-weight: bold; color: #ffcc00; font-size: 1.1rem;">
                                    <div>POT: <span id="desc-pot" style="color:#fff;">--</span></div>
                                    <div>PREC: <span id="desc-prec" style="color:#fff;">--</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="summary-right" style="flex: 1.5; padding-left: 5px; display: flex; flex-direction: column; overflow: hidden;">
                            <div id="summary-page-0" class="stats-grid" style="flex: 1; align-content: center;"></div>
                            
                            <div id="summary-page-1" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
                                <div id="moves-list-container" class="moves-scroll-area"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        // MAGIA: Creiamo il div nativo HTML e lo ancoriamo allo schermo bypassando Phaser!
        let tempDiv = document.createElement('div');
        tempDiv.className = 'pkmn-modal-overlay';
        tempDiv.innerHTML = html;
        this.teamModalDom = tempDiv;
        document.getElementById('game-container').appendChild(this.teamModalDom);

        this.populateTeamList(teamData);
        this.setupModalNavigation(teamData);
    }

    populateTeamList(teamData) {
        let container = document.getElementById('pkmn-list-container');
        if (!container) return;

        let listHTML = '';
        teamData.forEach((pkmn, index) => {
            let localData = (this.pkmnDB && this.pkmnDB[pkmn.nome]) ? this.pkmnDB[pkmn.nome] : null;
            let spriteUrl = pkmn.sprite?.normal || localData?.sprite?.normal || '';
            let hpPercent = (pkmn.hp / pkmn.maxHp) * 100;
            let hpColor = hpPercent > 50 ? '#4caf50' : (hpPercent > 20 ? '#ffeb3b' : '#f44336');

            listHTML += `
                <div class="pokemon-item" data-index="${index}">
                    <img src="${spriteUrl}" style="width: 85px; height: 85px; display: block; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.5));">
                    <div class="pkmn-info">
                        <div class="pkmn-name-line">
                            <span class="pkmn-name">${pkmn.nome.toUpperCase()} ${index === (this.myActiveIdx || 0) ? '★' : ''}</span>
                        </div>
                        <div class="hp-container">
                            <span class="hp-label">HP</span>
                            <div class="hp-bar-bg"><div class="hp-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div></div>
                        </div>
                        <div class="pkmn-hp-text">${pkmn.hp}/${pkmn.maxHp}</div>
                    </div>
                    <div class="inline-actions" id="actions-${index}">
                        <div class="action-btn-inline">SOSTITUISCI</div>
                        <div class="action-btn-inline">SUMMARY</div>
                        <div class="action-btn-inline">INDIETRO</div>
                    </div>
                </div>`;
        });
        container.innerHTML = listHTML;
        this.updateModalVisuals();
    }
    openSummary(pkmn) {
        this.currentView = 'summary'; this.summaryPage = 0; this.moveSelectionIdx = 0;
        document.getElementById('modal-list-view').style.display = 'none';
        document.getElementById('modal-summary-view').style.display = 'flex';

        let localData = (this.pkmnDB && this.pkmnDB[pkmn.nome]) ? this.pkmnDB[pkmn.nome] : null;
        document.getElementById('summary-name').innerText = pkmn.nome.toUpperCase();
        document.getElementById('summary-sprite').src = pkmn.sprite?.normal || localData?.sprite?.normal || '';
        document.getElementById('summary-types').innerHTML = (pkmn.tipi || localData?.tipi || []).map(t => `<div class="badge" style="background-color: ${this.getColorForType(t)}">${t.toUpperCase()}</div>`).join('');

        let stats = pkmn.statistiche || (localData ? { attacco: localData.statistiche.attack.base_stat, difesa: localData.statistiche.defense.base_stat, attaccoSpeciale: localData.statistiche['special-attack'].base_stat, difesaSpeciale: localData.statistiche['special-defense'].base_stat, velocita: localData.statistiche.speed.base_stat } : {});
        document.getElementById('summary-page-0').innerHTML = `
            <div class="stat-row"><span class="stat-label">HP </span><span class="stat-value">${pkmn.hp}/${pkmn.maxHp}</span></div>
            <div class="stat-row"><span class="stat-label">ATTACCO </span><span class="stat-value">${stats.attacco || 0}</span></div>
            <div class="stat-row"><span class="stat-label">DIFESA </span><span class="stat-value">${stats.difesa || 0}</span></div>
            <div class="stat-row"><span class="stat-label">ATT. SP. </span><span class="stat-value">${stats.attaccoSpeciale || 0}</span></div>
            <div class="stat-row"><span class="stat-label">DIF. SP. </span><span class="stat-value">${stats.difesaSpeciale || 0}</span></div>
            <div class="stat-row"><span class="stat-label">VELOCITÀ </span><span class="stat-value">${stats.velocita || 0}</span></div>
        `;

        let mosseRaw = pkmn.mosse && pkmn.mosse.length > 0 ? pkmn.mosse : (localData?.mosse || []);
        let movesHtml = ``;

        mosseRaw.forEach((mRaw, i) => {
            let nomeMossa = typeof mRaw === 'object' ? mRaw.Nome : mRaw;
            const m = this.moveDB[nomeMossa] || { Nome: nomeMossa, Tipo: '???', PP: '--', Potenza: '--', Precisione: '--', Descrizione: 'Nessuna descrizione.' };
            const catColor = m.Categoria === "Fisico" ? '#ff7477' : (m.Categoria === "Speciale" ? '#6874e8' : '#aaaaaa');

            // FIX: Usa i PP attuali dell'oggetto mRaw, altrimenti usa quelli base del DB
            let ppAtt = mRaw.ppAttuali !== undefined ? mRaw.ppAttuali : m.PP;
            let ppMax = mRaw.ppMassimi !== undefined ? mRaw.ppMassimi : m.PP;

            movesHtml += `
            <div class="move-entry" id="move-item-${i}" data-desc="${m.Descrizione || 'Nessuna descrizione.'}" data-pot="${m.Potenza > 0 ? m.Potenza : '--'}" data-prec="${m.Precisione > 0 ? m.Precisione : '--'}">
                <div class="move-name-line"><span>${String(m.Nome).toUpperCase()}</span><span>PP ${ppAtt}/${ppMax}</span></div>
                <div class="move-summary-badges"><span class="badge" style="background:${this.getColorForType(m.Tipo)}">${String(m.Tipo).toUpperCase()}</span><span class="badge" style="background:${catColor}">${(m.Categoria || '???').toUpperCase()}</span></div>
            </div>`;
        });

        document.getElementById('moves-list-container').innerHTML = movesHtml;
        this.updateSummaryPage();
        this.updateModalVisuals();
    }
    setupModalNavigation(teamData) {
        // [Tutto il blocco modalKeyListener rimane invariato, omettilo se vuoi, ma lo riscrivo qui per sicurezza]
        this.modalKeyListener = (event) => {
            if (this.isInputActive) return;
            const key = event.key;
            if (this.currentView === 'list') {
                let max = document.querySelectorAll('.pokemon-item').length;
                if (max > 0) {
                    if (key === 'ArrowDown' || key === 's') { this.modalSelection = (this.modalSelection + 1) % max; this.updateModalVisuals(); }
                    if (key === 'ArrowUp' || key === 'w') { this.modalSelection = (this.modalSelection - 1 + max) % max; this.updateModalVisuals(); }
                }
            } else if (this.currentView === 'inline-actions') {
                let max = 3;
                if (key === 'ArrowDown' || key === 's') { this.actionSelectionIdx = (this.actionSelectionIdx + 1) % max; this.updateModalVisuals(); }
                if (key === 'ArrowUp' || key === 'w') { this.actionSelectionIdx = (this.actionSelectionIdx - 1 + max) % max; this.updateModalVisuals(); }
            } else if (this.currentView === 'summary') {
                if (this.summaryPage === 1) {
                    let numMoves = document.querySelectorAll('.move-entry').length;
                    if (numMoves > 0) {
                        if (key === 'ArrowDown' || key === 's') { this.moveSelectionIdx = Math.min(numMoves - 1, this.moveSelectionIdx + 1); this.updateModalVisuals(); }
                        if (key === 'ArrowUp' || key === 'w') { this.moveSelectionIdx = Math.max(0, this.moveSelectionIdx - 1); this.updateModalVisuals(); }
                    }
                }
                if (key === 'ArrowRight' || key === 'd' || key === 'ArrowLeft' || key === 'a') {
                    this.summaryPage = this.summaryPage === 0 ? 1 : 0;
                    this.moveSelectionIdx = 0;
                    this.updateSummaryPage();
                    this.updateModalVisuals();
                }
            }

            if (key === 'Enter' || key === ' ') this.confirmModalSelection(teamData);
            if (key === 'Escape' || key === 'Backspace') {
                if (this.currentView === 'inline-actions') { this.currentView = 'list'; this.updateModalVisuals(); }
                else if (this.currentView === 'summary') this.cancelModalSelection();
                else this.cancelModalSelection(true);
            }
        };

        window.addEventListener('keydown', this.modalKeyListener);

        // USIAMO ADDEVENTLISTENER NATIVO (Non il .addListener di Phaser!)
        this.teamModalDom.addEventListener('click', (e) => {
            if (e.target.id === 'summary-page-indicator') {
                this.summaryPage = this.summaryPage === 0 ? 1 : 0; this.updateSummaryPage(); this.updateModalVisuals(); return;
            }

            let moveItem = e.target.closest('.move-entry');
            if (moveItem && this.currentView === 'summary' && this.summaryPage === 1) {
                let idx = Array.from(moveItem.parentNode.children).indexOf(moveItem);
                this.moveSelectionIdx = idx;
                this.updateModalVisuals();
                return;
            }

            let item = e.target.closest('.pokemon-item');
            if (item && this.currentView === 'list') {
                this.modalSelection = parseInt(item.dataset.index); this.confirmModalSelection(teamData); return;
            }
            if (e.target.classList.contains('action-btn-inline')) {
                let actionText = e.target.innerText.trim();
                let parentItem = e.target.closest('.pokemon-item');
                this.modalSelection = parseInt(parentItem.dataset.index);

                if (actionText === 'SOSTITUISCI') this.executeSwitch(this.modalSelection);
                else if (actionText === 'SUMMARY') this.openSummary(teamData[this.modalSelection]);
                else if (actionText === 'INDIETRO') { this.currentView = 'list'; this.updateModalVisuals(); }
                return;
            }
            if (e.target.id === 'btn-back-to-action') this.cancelModalSelection();
        });
    }

    updateModalVisuals() {
        document.querySelectorAll('.move-entry').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.pokemon-item, .action-btn, .move-entry').forEach(el => el.classList.remove('selected'));

        if (this.currentView === 'list' || this.currentView === 'inline-actions') {
            document.querySelectorAll('.pokemon-item').forEach((el, index) => {
                el.classList.remove('selected', 'show-actions');
                el.querySelectorAll('.action-btn-inline').forEach(btn => btn.classList.remove('selected'));

                if (index === this.modalSelection) {
                    el.classList.add('selected');
                    if (this.currentView === 'inline-actions') {
                        el.classList.add('show-actions');
                        let btns = el.querySelectorAll('.action-btn-inline');
                        if (btns[this.actionSelectionIdx]) btns[this.actionSelectionIdx].classList.add('selected');
                    }
                }
            });
        } else if (this.currentView === 'summary' && this.summaryPage === 1) {
            const moves = document.querySelectorAll('.move-entry');
            if (moves[this.moveSelectionIdx]) {
                let activeMove = moves[this.moveSelectionIdx];
                activeMove.classList.add('selected');
                activeMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Aggiornamento pulito del Box Descrizione senza distruggere i tag
                document.getElementById('desc-text').innerText = activeMove.getAttribute('data-desc');
                document.getElementById('desc-pot').innerText = activeMove.getAttribute('data-pot');
                document.getElementById('desc-prec').innerText = activeMove.getAttribute('data-prec');
            }
        }
    }

    confirmModalSelection(teamData) {
        if (this.currentView === 'list') {
            this.currentView = 'inline-actions';
            this.actionSelectionIdx = 0;
            this.updateModalVisuals();
        } else if (this.currentView === 'inline-actions') {
            if (this.actionSelectionIdx === 0) {
                this.executeSwitch(this.modalSelection);
            } else if (this.actionSelectionIdx === 1) {
                this.openSummary(teamData[this.modalSelection]);
            } else if (this.actionSelectionIdx === 2) {
                // FIX: Permette di tornare liberamente alla lista dei Pokémon
                // senza far scattare falsi allarmi del banner!
                this.currentView = 'list';
                this.updateModalVisuals();
            }
        }
    }

    cancelModalSelection(forceClose = false) {
        if (forceClose && this.isForcedSwitch) {
            window.showBanner("Devi scegliere un sostituto!");
            return;
        }

        if (forceClose) {
            window.removeEventListener('keydown', this.modalKeyListener);
            if (this.teamModalDom) {
                this.teamModalDom.remove(); // NATIVO: .remove() invece di .destroy()
                this.teamModalDom = null;
            }
            this.isInputActive = true;
            if (typeof this.updateMenuSelection === 'function') this.updateMenuSelection();
        } else {
            this.currentView = 'inline-actions';
            document.getElementById('modal-summary-view').style.display = 'none';
            document.getElementById('modal-list-view').style.display = 'block';
            this.updateModalVisuals();
        }
    }

    updateSummaryPage() {
        let ind = document.getElementById('summary-page-indicator');
        ind.innerText = this.summaryPage === 0 ? '◀ INFO E STATISTICHE ▶' : '◀ MOSSE ▶';
        document.getElementById('summary-page-0').style.display = this.summaryPage === 0 ? 'grid' : 'none';
        document.getElementById('summary-page-1').style.display = this.summaryPage === 1 ? 'flex' : 'none';
        document.getElementById('summary-move-desc').style.display = this.summaryPage === 1 ? 'flex' : 'none';
    }

    executeSwitch(index) {
        let pkmn = this.myTeamData[index];
        let activeIdx = this.myActiveIdx !== undefined ? this.myActiveIdx : 0;

        if (pkmn.hp <= 0) {
            window.showBanner("Questo Pokémon è esausto!");
            return;
        }

        if (index === activeIdx && !this.isForcedSwitch) {
            this.cancelModalSelection(true);
            this.isInputActive = false; this.btns.forEach(b => b.setVisible(false)); this.logText.setVisible(true);
            this.logText.setText(`${this.pEntity.name.toUpperCase()} è già in campo!`);
            this.time.delayedCall(1500, () => this.startTurn());
            return;
        }

        if (this.teamModalDom) {
            this.teamModalDom.remove(); // NATIVO: .remove() invece di .destroy()
            this.teamModalDom = null;
        }
        window.removeEventListener('keydown', this.modalKeyListener);
        this.btns.forEach(b => b.setVisible(false)); this.logText.setVisible(true);

        const switchAction = { tipo: 'switch', nuovoIdx: index };

        let wasForced = this.isForcedSwitch;
        this.isForcedSwitch = false;

        if (wasForced) {
            if (this.isWild) {
                this.partita.p1.attivoIdx = index;
                let nuovoPk = this.partita.p1.squadra[index];
                this.partita.logs = [`Vai, ${nuovoPk.nome}! `];
                let nuovoStato = this.partita.ottieniStatoAggiornato();
                this.applicaStatoPartita(nuovoStato, false);
            } else {
                this.logText.setText("Mando in campo...");
                this.socket.emit('pvpUseMove', { roomId: this.roomId, tipo: 'forced_switch', nuovoIdx: index });
            }
            return;
        }

        if (this.isWild) {
            let activeBot = this.partita.p2.squadra[this.partita.p2.attivoIdx];

            // IL SEGRETO È QUI: Il bot deve valutare i danni sul Pokémon che STA ENTRANDO (usando "index")
            let playerTarget = this.partita.p1.squadra[index];

            // Facciamo ragionare l'algoritmo intelligente
            let botMoveData = this.partita.scegliMossaBotIntelligente(activeBot, playerTarget, this.partita.p2, this.partita.p1);

            // Creiamo l'azione finale del bot
            let botAction = { mossa: botMoveData };

            // Processiamo il turno: tu fai lo switch, lui ti attacca!
            let stato = this.partita.processaTurno(switchAction, botAction);
            this.applicaStatoPartita(stato, false);
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, ...switchAction });
        }
    }
}

// ==============================================================================
// 5. PVE SCENE: Mappa per la modalità offline / avventura
// ==============================================================================
class PVEScene extends Phaser.Scene {
    constructor() { super({ key: 'PVEScene' }); }

    init(data) {
        this.myPlayerName = data.name;
        this.user = data.user;
        this.currentLevel = data.level || 1;
        this.maxLevel = 2; // Numero totale di mappe PVE
    }

    create() {
        let profilo = this.registry.get('playerProfile');
        let avatarNum = profilo ? (profilo.avatar_sprite || 1) : 1;
        this.textureKey = avatarNum == 1 ? 'avatar' : `avatar${avatarNum}`;

        this.player = null;
        this.npcInSfida = null;
        this.npcs = null;
        this.isMovingGrid = false;

        this.setupMap();
        this.setupNPCs();

        let startX = 100;
        let startY = 100;
        if (this.zoneInterattive) {
            let startZone = this.zoneInterattive.find(z => z.nomeInterazione === 'Porta Inizio');
            if (startZone) {
                startX = startZone.x + 8;
                startY = startZone.y - 32;
            }
        }
        this.setupPlayer(startX, startY);

        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
        ['down', 'left', 'right', 'up'].forEach((key, i) => {
            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
        });

        this.keys = this.input.keyboard.addKeys(InputConfig);

        this.isPaused = false;
        this.isDialogActive = false;
        this.canEncounter = true;
        this.isTransitioning = false;

        this.events.on('resume', () => {
            this.keys.LEFT.reset(); this.keys.RIGHT.reset();
            this.keys.UP.reset(); this.keys.DOWN.reset();
            this.keys.A.reset(); this.keys.D.reset();
            this.keys.W.reset(); this.keys.S.reset();
            this.canEncounter = false;
            setTimeout(() => { this.canEncounter = true; }, 1500);

            let lastResult = this.registry.get('lastBattleResult');
            this.registry.set('lastBattleResult', null);

            if (lastResult === 'lose') {
                this.isDialogActive = true;
                this.player.body.setVelocity(0);
                this.player.anims.stop();
                this.createDialogUI();
                this.mostraTestiDialogo(["I tuoi Pokémon sono esausti...", "Hai perso la run! Tornerai alla Lobby. ▼"], () => {
                    this.chiudiDialogo();
                    this.tornaAllaLobby(false);
                });
                return;
            }

            if (this.npcInSfida) {
                if (lastResult === 'win') {
                    this.npcInSfida.isDefeated = true;
                    this.npcInSfida.setTint(0x888888);
                }
                this.npcInSfida = null;
            }
        });
    }

    setupMap() {
        let mapKey = this.currentLevel === 1 ? 'mapPVE' : `mapPVE${this.currentLevel}`;
        const map = this.make.tilemap({ key: mapKey });

        const tilesetA = map.addTilesetImage('a', 'tilesA', 16, 16, 1, 1);
        const tilesetE = map.addTilesetImage('e', 'tilesE', 16, 16, 0, 0);
        const tilesetC = map.addTilesetImage('c', 'tilesC', 16, 16, 1, 1);
        const tilesetD = map.addTilesetImage('d', 'tilesD', 16, 16, 0, 0);

        const allTilesets = [tilesetA, tilesetC, tilesetD, tilesetE];

        map.createLayer('Sfondo', allTilesets, 0, 0);
        this.wallLayer = map.createLayer('Ostacoli', allTilesets, 0, 0);
        this.grassLayer = map.createLayer('Erba', allTilesets, 0, 0);

        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        this.wallLayer.setCollisionByExclusion([-1]);

        this.zoneInterattive = [];
        const objLayer = map.getObjectLayer('Interazioni');
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                let zone = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0);
                zone.nomeInterazione = obj.name;
                this.zoneInterattive.push(zone);
            });
        }
    }

    setupNPCs() {
        this.npcs = this.physics.add.group();

        let npcPositions = [];
        if (this.currentLevel === 1) {
            npcPositions = [{ x: 120, y: 350 }, { x: 180, y: 200 }, { x: 120, y: 100 }];
        } else if (this.currentLevel === 2) {
            npcPositions = [{ x: 150, y: 300 }, { x: 100, y: 200 }, { x: 180, y: 100 }]; // Modifica qui le coordinate della mappa 2
        }

        npcPositions.forEach((pos, index) => {
            let npc = this.physics.add.sprite(pos.x, pos.y, 'allenatore').setScale(1).setImmovable(true);
            npc.npcId = index;
            npc.isDefeated = false;
            this.physics.add.collider(npc, this.wallLayer);
            this.npcs.add(npc);
        });
    }

    setupPlayer(startX, startY) {
        this.player = this.physics.add.sprite(startX, startY, this.textureKey).setCollideWorldBounds(true);
        this.player.setScale(0.5);
        this.player.body.setSize(32, 32).setOffset(16, 32);

        this.physics.add.collider(this.player, this.wallLayer);
        this.cameras.main.startFollow(this.player, true).setZoom(4).setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL) && !this.isTransitioning && !this.isDialogActive) {
            this.togglePauseMenu();
        }

        if (this.isTransitioning || !this.player || this.isPaused || this.isMovingGrid || this.isDialogActive) return;

        const TILE_SIZE = 16;
        let currentAnim = null;
        let dx = 0; let dy = 0;

        if (this.keys.LEFT.isDown || this.keys.A.isDown) { dx = -TILE_SIZE; currentAnim = 'left'; }
        else if (this.keys.RIGHT.isDown || this.keys.D.isDown) { dx = TILE_SIZE; currentAnim = 'right'; }
        else if (this.keys.UP.isDown || this.keys.W.isDown) { dy = -TILE_SIZE; currentAnim = 'up'; }
        else if (this.keys.DOWN.isDown || this.keys.S.isDown) { dy = TILE_SIZE; currentAnim = 'down'; }

        if (dx !== 0 || dy !== 0) {
            let targetX = this.player.x + dx;
            let targetY = this.player.y + dy;

            this.player.anims.play(currentAnim, true);

            let isOutOfBounds = targetX < 0 || targetX >= this.mapWidth || targetY < 0 || targetY >= this.mapHeight;
            let ostacolo = this.wallLayer.getTileAtWorldXY(targetX, targetY, true);
            let isWall = (ostacolo && ostacolo.index !== -1);
            let isNpc = false;

            if (this.npcs) {
                this.npcs.getChildren().forEach(n => {
                    if (Phaser.Math.Distance.Between(targetX, targetY, n.x, n.y) < 16) isNpc = true;
                });
            }

            if (!isWall && !isNpc && !isOutOfBounds) {
                this.isMovingGrid = true;
                this.tweens.add({
                    targets: this.player, x: targetX, y: targetY, duration: 250,
                    onComplete: () => {
                        this.isMovingGrid = false;
                        this.player.anims.stop();

                        let grassTile = this.grassLayer.getTileAtWorldXY(targetX, targetY, true);
                        if (this.canEncounter && grassTile && grassTile.index !== -1) {
                            if (Phaser.Math.Between(1, 100) <= 10) this.startPVEEncounter();
                            this.canEncounter = false;
                            this.time.delayedCall(250, () => this.canEncounter = true);
                        }

                        if (this.zoneInterattive && !this.isDialogActive && !this.isTransitioning) {
                            let interazioneCalpestata = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 20);
                            if (interazioneCalpestata) {
                                if (interazioneCalpestata.nomeInterazione === 'Porta Fine') {
                                    let tuttiSconfitti = true;
                                    if (this.npcs) {
                                        this.npcs.getChildren().forEach(n => { if (!n.isDefeated) tuttiSconfitti = false; });
                                    }
                                    if (tuttiSconfitti) {
                                        if (this.currentLevel < this.maxLevel) {
                                            this.isDialogActive = true;
                                            this.createDialogUI();
                                            this.mostraTestiDialogo(["Hai sconfitto tutti!", "Passare al livello successivo? ▼"], () => {
                                                this.mostraSceltaSiNo((scelta) => {
                                                    this.chiudiDialogo();
                                                    if (scelta === 'SI') {
                                                        this.passaAlProssimoLivello();
                                                    } else {
                                                        this.isMovingGrid = true;
                                                        this.tweens.add({ targets: this.player, x: this.player.x - dx, y: this.player.y - dy, duration: 250, onComplete: () => { this.isMovingGrid = false; this.isDialogActive = false; } });
                                                    }
                                                });
                                            });
                                        } else {
                                            this.isDialogActive = true;
                                            this.createDialogUI();
                                            this.mostraTestiDialogo(["COMPLIMENTI!", "Hai superato tutte le sfide PvE!", "Torni alla Lobby da vero Campione. ▼"], () => {
                                                this.chiudiDialogo();
                                                this.tornaAllaLobby(true);
                                            });
                                        }
                                    } else {
                                        this.isDialogActive = true;
                                        this.createDialogUI();
                                        this.mostraTestiDialogo(["Devi sconfiggere tutti gli allenatori", "prima di poter uscire da qui! ▼"], () => {
                                            this.chiudiDialogo();
                                            this.isMovingGrid = true;
                                            this.tweens.add({ targets: this.player, x: this.player.x - dx, y: this.player.y - dy, duration: 250, onComplete: () => { this.isMovingGrid = false; this.isDialogActive = false; } });
                                        });
                                    }
                                } else if (interazioneCalpestata.nomeInterazione === 'Porta Inizio') {
                                    this.gestisciUscitaPVE();
                                }
                            }
                        }
                    }
                });
            } else {
                this.player.anims.stop();
            }
        } else {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.CONFIRM) && !this.isTransitioning && !this.isDialogActive) {
            let interactionHandled = false;
            if (this.npcs) {
                let npcVicino = this.npcs.getChildren().find(n => Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y) < 50);
                if (npcVicino) {
                    this.player.anims.stop();
                    this.gestisciDialogoNPC(npcVicino);
                    interactionHandled = true;
                }
            }

            if (!interactionHandled && this.zoneInterattive) {
                let interazioneVicino = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x + (z.width || 0) / 2, z.y + (z.height || 0) / 2) < 40);
                if (interazioneVicino && interazioneVicino.nomeInterazione && interazioneVicino.nomeInterazione.includes('Cartello')) {
                    this.player.anims.stop();
                    this.leggiCartello();
                }
            }
        }
    }

    passaAlProssimoLivello() {
        this.isTransitioning = true;
        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">CARICAMENTO LIVELLO ${this.currentLevel + 1}...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">CARICAMENTO LIVELLO ${this.currentLevel + 1}...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.scene.restart({ name: this.myPlayerName, user: this.user, level: this.currentLevel + 1 });
        }, 1500);
    }

    startPVEEncounter(isNPC = false) {
        this.isTransitioning = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%';
        overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';
        overlay.style.pointerEvents = 'none'; overlay.style.zIndex = '9999';

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%;">${isNPC ? 'SFIDA ALLENATORE!' : 'POKÉMON SELVATICO!'}</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%;">${isNPC ? 'SFIDA ALLENATORE!' : 'POKÉMON SELVATICO!'}</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;
            this.scene.pause();

            let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
            if (myDbTeam.length === 0) {
                window.showBanner("Non hai Pokémon in squadra! Torna indietro.");
                this.scene.resume('PVEScene');
                return;
            }
            this.scene.launch('BattleScene', { isWild: true, isNPC: isNPC, parentScene: 'PVEScene' });
        }, 2000);
    }

    gestisciDialogoNPC(npc) {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.createDialogUI();

        if (npc.isDefeated) {
            this.mostraTestiDialogo(["Mh, mi hai già battuto...", "Sei davvero in gamba! ▼"], () => {
                this.chiudiDialogo();
                this.time.delayedCall(100, () => { this.isDialogActive = false; });
            });
        } else {
            this.mostraTestiDialogo(["Ehi tu! Sei pronto a farti stracciare?", "Vuoi sfidarmi ora? ▼"], () => {
                this.mostraSceltaSiNo((scelta) => {
                    this.chiudiDialogo();
                    if (scelta === 'SI') {
                        this.npcInSfida = npc;
                        this.startPVEEncounter(true);
                    } else {
                        this.mostraTestiDialogo(["Tsk, fifone! ▼"], () => {
                            this.chiudiDialogo();
                            this.time.delayedCall(100, () => { this.isDialogActive = false; });
                        });
                    }
                });
            });
        }
    }

    gestisciUscitaPVE() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();
        this.createDialogUI();

        this.mostraTestiDialogo(["Sei vicino all'uscita.", "Vuoi salvare i progressi e tornare alla Lobby? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.tornaAllaLobby(true);
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                    });
                }
            });
        });
    }

    async tornaAllaLobby(salvaRun = false) {
        this.isTransitioning = true;
        let overlay = document.createElement('div');
        overlay.style.position = 'absolute'; overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%'; overlay.style.backgroundColor = '#000';
        overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center'; overlay.style.zIndex = '9999';
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 7vw; text-align: center; max-width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        try {
            let profilo = this.registry.get('playerProfile');
            let mappaDaSalvare = salvaRun ? `mappa_pve_${this.currentLevel}` : 'mappa_base';

            const { error } = await supabaseClient.from('profilo').update({ id_mappa: mappaDaSalvare }).eq('id_profilo', profilo.id_profilo);
            if (!error) profilo.id_mappa = mappaDaSalvare;

            let myDbTeam = this.registry.get('userPokemon');
            let allUpdates = myDbTeam.map(p => ({
                id_pokemon: p.id_pokemon, id_specie: p.id_specie, id_profilo_proprietario: p.id_profilo_proprietario, in_squadra: p.in_squadra, posizione_slot: p.posizione_slot
            }));
            await supabaseClient.from('pokemon').upsert(allUpdates);
        } catch (err) {
            console.error("Errore salvataggio:", err);
        }

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.scene.stop('PVEScene');
            this.scene.start('WorldScene', { name: this.myPlayerName, user: this.user, vengoDa: 'Porta PVE' });
        }, 1000);
    }

    togglePauseMenu() {
        if (this.isPaused) {
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu && existingMenu.inSubMenu) {
                existingMenu.renderMainPause();
                return;
            }
            this.isPaused = false;
            if (this.handlePauseKeyDown) {
                window.removeEventListener('keydown', this.handlePauseKeyDown);
                this.handlePauseKeyDown = null;
            }
            if (existingMenu) existingMenu.remove();
        } else {
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'modal-overlay';

            let selectedIdx = 0;
            let currentButtons = [];

            const updateSelection = () => {
                if (overlay.inSubMenu) return;
                currentButtons.forEach((btnId, idx) => {
                    let btn = document.getElementById(btnId);
                    if (btn) {
                        if (idx === selectedIdx) {
                            btn.style.transform = 'scale(1.05)';
                            btn.style.backgroundColor = '#4a3b5c';
                            btn.style.color = '#ffcc00';
                            btn.style.borderColor = '#ffcc00';
                            btn.style.boxShadow = '6px 6px 0 #ffcc00';
                        } else {
                            btn.style.transform = 'scale(1)';
                            btn.style.backgroundColor = '#f6eedf';
                            btn.style.color = '#ff7477';
                            btn.style.borderColor = '#ff7477';
                            btn.style.boxShadow = '4px 4px 0 #e69597';
                        }
                    }
                });
            };

            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'lobby-btn'];

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 400px;">
                        <h2 class="text-shadows" style="font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 30px; text-align: center;">MENU PAUSA PVE</h2>
                        <button id="profile-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 10px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">PROFILO</button>
                        <button id="controls-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">COMANDI</button>
                        <button id="lobby-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: all 0.1s;">TORNA ALLA LOBBY</button>
                        <p style="color: #fff; margin-top: 40px; font-size: 1.2rem; font-family: 'Courier New'; font-weight: bold; text-align: center;">Premi ESC per tornare al gioco</p>
                    </div>`;
                updateSelection();
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;

                let controlsHtml = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">MOVIMENTO</h3>
                        <p style="margin: 0;"><strong>WASD</strong> o <strong>Frecce Direzionali</strong></p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">AZIONI</h3>
                        <p style="margin: 0;"><strong>Conferma:</strong> INVIO</p>
                        <p style="margin: 5px 0 0 0;"><strong>Annulla / Indietro:</strong> ESC</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">IN BATTAGLIA</h3>
                        <p style="margin: 0;"><strong>Statistiche:</strong> SHIFT</p>
                    </div>
                    <div>
                        <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.3rem;">GENERICI</h3>
                        <p style="margin: 0;"><strong>Mouse / Touch:</strong> Interfaccia UI e Dialoghi</p>
                    </div>
                `;

                overlay.innerHTML = `
                    <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; max-width: 500px;">
                        <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">COMANDI</h2>
                        <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ffcc00; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: left; max-height: 50vh; overflow-y: auto;">
                            ${controlsHtml}
                        </div>
                        <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-size: 1.5rem; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                    </div>
                `;
            };

            renderMainPause();
            document.getElementById('game-container').appendChild(overlay);

            this.handlePauseKeyDown = (e) => {
                let key = e.key;
                if (!overlay.inSubMenu) {
                    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                        selectedIdx = (selectedIdx - 1 + currentButtons.length) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                        selectedIdx = (selectedIdx + 1) % currentButtons.length;
                        updateSelection();
                    } else if (key === 'Enter' || key === ' ') {
                        let btn = document.getElementById(currentButtons[selectedIdx]);
                        if (btn) btn.click();
                    }
                } else if (overlay.inSubMenu) {
                    if (key === 'Enter' || key === ' ' || key === 'Escape' || key === 'Backspace') {
                        let btn = document.getElementById('back-pause-btn');
                        if (btn) btn.click();
                    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        let btnPrev = document.getElementById('prev-avatar');
                        if (btnPrev) btnPrev.click();
                    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        let btnNext = document.getElementById('next-avatar');
                        if (btnNext) btnNext.click();
                    }
                }
            };
            window.addEventListener('keydown', this.handlePauseKeyDown);

            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'lobby-btn') {
                    e.target.innerText = "USCITA...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) window.removeEventListener('keydown', this.handlePauseKeyDown);
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();
                    this.tornaAllaLobby(true);
                } else if (e.target.id === 'controls-btn') {
                    renderControls();
                } else if (e.target.id === 'profile-btn') {
                    overlay.inSubMenu = true;
                    let profilo = this.registry.get('playerProfile');
                    let winRate = profilo.partite_totali > 0 ? ((profilo.vittorie_totali / profilo.partite_totali) * 100).toFixed(1) : 0;
                    let box = document.getElementById('pause-box');
                    let avatarNum = profilo.avatar_sprite || 1;
                    let currentAvatarPath = avatarNum == 1 ? 'assets/avatar.png' : `assets/avatar${avatarNum}.png`;

                    if (box) {
                        box.innerHTML = `
                            <h2 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; text-align: center;">PROFILO</h2>
                            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 2px solid #ff7477; width: 85%; color: #fff; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: center;">
                                <p><strong>NOME:</strong> ${profilo.username || 'Sconosciuto'}</p>
                                <p><strong>VITTORIE:</strong> ${profilo.vittorie_totali || 0}</p>
                                <p><strong>PARTITE:</strong> ${profilo.partite_totali || 0}</p>
                                <p><strong>VITTORIE %:</strong> ${winRate}%</p>
                                <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 15px;">
                                    <button id="prev-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&lt;</button>
                                    <div style="width: 32px; height: 32px; overflow: hidden; position: relative; transform: scale(2); margin: 0 15px; image-rendering: pixelated;">
                                        <img id="profile-avatar" src="${currentAvatarPath}" style="position: absolute; top: 0; left: 0; width: 400%; height: 400%; max-width: none;">
                                    </div>
                                    <button id="next-avatar" style="padding: 5px 15px; cursor: pointer; font-weight: bold;">&gt;</button>
                                </div>
                            </div>
                            <button id="back-pause-btn" style="width: 100%; max-width: 280px; box-sizing: border-box; padding: 15px; margin-top: 30px; font-weight: bold; background-color: #4a3b5c; color: #ffcc00; border: 4px solid #ffcc00; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #ffcc00; transform: scale(1.05);">INDIETRO</button>
                        `;
                    }
                } else if (e.target.id === 'prev-avatar' || e.target.id === 'next-avatar') {
                    let profilo = this.registry.get('playerProfile');
                    const avatars = ['assets/avatar.png', 'assets/avatar2.png', 'assets/avatar3.png', 'assets/avatar4.png', 'assets/avatar5.png', 'assets/avatar6.png'];
                    let imgEl = document.getElementById('profile-avatar');
                    let idx = avatars.indexOf(imgEl.getAttribute('src'));
                    if (idx === -1) idx = 0;
                    idx = e.target.id === 'prev-avatar' ? (idx - 1 + avatars.length) % avatars.length : (idx + 1) % avatars.length;

                    let newAvatarPath = avatars[idx];
                    imgEl.src = newAvatarPath;
                    let numberToSave = idx + 1;
                    profilo.avatar_sprite = numberToSave;

                    supabaseClient.from('profilo').update({ avatar_sprite: numberToSave }).eq('id_profilo', profilo.id_profilo);

                    let textureKey = newAvatarPath.split('/').pop().replace('.png', '');
                    if (this.player) {
                        this.player.setTexture(textureKey);
                        this.textureKey = textureKey;
                        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
                        ['down', 'left', 'right', 'up'].forEach((key, i) => {
                            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                        });
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }

    createDialogUI() {
        let container = document.getElementById('dialog-ui-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dialog-ui-container';
            container.style.position = 'absolute';   /* Cambia da 'fixed' ad 'absolute' */
            container.style.bottom = '22vh';         /* Cambia da '20px' a '22vh' (così fluttua sopra i tasti) */
            container.style.left = '50%'; container.style.transform = 'translateX(-50%)';
            container.style.width = '95vw'; container.style.maxWidth = '800px'; container.style.height = 'auto'; container.style.minHeight = '140px';
            container.style.backgroundColor = '#2b2b2b'; container.style.border = '6px solid #d05050';
            container.style.boxSizing = 'border-box'; container.style.padding = '20px 30px'; container.style.zIndex = '999999';
            container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.justifyContent = 'flex-start'; container.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';
            let textEl = document.createElement('div');
            textEl.id = 'dialog-ui-text'; textEl.style.color = '#ffffff'; textEl.style.fontFamily = '"Courier New", Courier, monospace'; textEl.style.fontSize = '26px'; textEl.style.fontWeight = 'bold'; textEl.style.textShadow = '2px 2px 0 #000'; textEl.style.lineHeight = '1.3';
            container.appendChild(textEl);

            // Cambia 'document.body' con 'document.getElementById('game-container')'
            document.getElementById('game-container').appendChild(container);
        }
        container.style.display = 'flex';
        document.getElementById('dialog-ui-text').innerText = '';
    }

    chiudiDialogo() {
        let container = document.getElementById('dialog-ui-container');
        if (container) container.style.display = 'none';
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (choiceContainer) choiceContainer.style.display = 'none';
    }

    mostraTestiDialogo(testi, onComplete) {
        let index = 0;
        let textEl = document.getElementById('dialog-ui-text');
        const mostraProssimo = () => {
            if (index < testi.length) {
                textEl.innerHTML = testi[index].replace(' ▼', '') + '<span style="color:#ffcc00;"> ▼</span>';
                index++;
                setTimeout(() => {
                    const handleEnter = (e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                            e.preventDefault(); window.removeEventListener('keydown', handleEnter); if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset(); mostraProssimo();
                            if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset();
                        }
                    };
                    window.addEventListener('keydown', handleEnter);
                }, 100);
            } else { if (onComplete) onComplete(); }
        };
        mostraProssimo();
    }

    mostraSceltaSiNo(onChoice) {
        let choiceContainer = document.getElementById('dialog-choice-container');
        if (!choiceContainer) {
            choiceContainer = document.createElement('div');
            choiceContainer.id = 'dialog-choice-container'; choiceContainer.style.position = 'fixed'; choiceContainer.style.bottom = '160px'; choiceContainer.style.right = '5%';
            choiceContainer.style.transform = 'none'; choiceContainer.style.width = 'auto'; choiceContainer.style.minWidth = '120px'; choiceContainer.style.backgroundColor = '#2b2b2b';
            choiceContainer.style.border = '4px solid #d05050'; choiceContainer.style.boxSizing = 'border-box'; choiceContainer.style.padding = '15px';
            choiceContainer.style.zIndex = '999999'; choiceContainer.style.display = 'flex'; choiceContainer.style.flexDirection = 'column'; choiceContainer.style.gap = '15px'; choiceContainer.style.boxShadow = '0px 10px 20px rgba(0,0,0,0.8)';
            let optSi = document.createElement('div'); optSi.id = 'dialog-opt-si'; optSi.style.color = '#ffffff'; optSi.style.fontFamily = '"Courier New", Courier, monospace'; optSi.style.fontSize = '26px'; optSi.style.fontWeight = 'bold'; optSi.style.textShadow = '2px 2px 0 #000';
            let optNo = document.createElement('div'); optNo.id = 'dialog-opt-no'; optNo.style.color = '#ffffff'; optNo.style.fontFamily = '"Courier New", Courier, monospace'; optNo.style.fontSize = '26px'; optNo.style.fontWeight = 'bold'; optNo.style.textShadow = '2px 2px 0 #000';
            choiceContainer.appendChild(optSi); choiceContainer.appendChild(optNo); document.body.appendChild(choiceContainer);
        }
        choiceContainer.style.display = 'flex';
        this.sceltaAttuale = 0;
        const aggiornaCursoreScelta = () => {
            let optSi = document.getElementById('dialog-opt-si'); let optNo = document.getElementById('dialog-opt-no');
            if (this.sceltaAttuale === 0) { optSi.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">SÌ</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">NO</span>`; }
            else { optSi.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">SÌ</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▶</span><span style="color: #ffcc00;">NO</span>`; }
        };
        aggiornaCursoreScelta();
        const handleChoiceInput = (e) => {
            let key = e.key || (e.detail && e.detail.key);
            if (!key) return;
            if (key === 'ArrowUp' || key === 'w' || key === 'ArrowDown' || key === 's') { this.sceltaAttuale = this.sceltaAttuale === 0 ? 1 : 0; aggiornaCursoreScelta(); }
            else if (key === 'Enter' || key === ' ') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CONFIRM) this.keys.CONFIRM.reset(); onChoice(this.sceltaAttuale === 0 ? 'SI' : 'NO'); }
            else if (key === 'Escape' || key === 'Backspace') { if (e.preventDefault) e.preventDefault(); window.removeEventListener('keydown', handleChoiceInput); window.removeEventListener('dpad-input', handleChoiceInput); if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset(); onChoice('NO'); }
        };
        setTimeout(() => { window.addEventListener('keydown', handleChoiceInput); window.addEventListener('dpad-input', handleChoiceInput); }, 100);
    }

    leggiCartello() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.createDialogUI();
        this.mostraTestiDialogo(["BENVENUTO NELLA MODALITÀ PVE!", `Sei nel livello ${this.currentLevel}.`, "Esplora l'erba alta o sfida gli allenatori.", "Trova l'uscita alla fine del percorso! ▼"], () => {
            this.chiudiDialogo();
            this.time.delayedCall(100, () => { this.isDialogActive = false; });
        });
    }
}

// ==============================================================================
// PARTE 3: CONFIGURAZIONE PHASER
// ==============================================================================
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1000, height: 800 },
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    dom: { createContainer: true },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: [BootScene, LoginScene, StarterScene, WorldScene, PVEScene, CPKScene, PvPScene, BattleScene]
};
new Phaser.Game(config);

// ==============================================================================
// GESTIONE CONTROLLI MOBILE
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const simulateKey = (keyName) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, code: keyName, bubbles: true, cancelable: true }));
        window.dispatchEvent(new CustomEvent('dpad-input', { detail: { key: keyName } })); // Scatena l'evento per le modali
        setTimeout(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, code: keyName, bubbles: true, cancelable: true }));
        }, 50); // Mantiene il tasto premuto per 50ms per farlo intercettare a Phaser
    };

    const bindMobileButton = (id, keyName) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                simulateKey(keyName);
            }, { passive: false });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                simulateKey(keyName);
            });
        }
    };

    bindMobileButton('btn-up', 'ArrowUp');
    bindMobileButton('btn-down', 'ArrowDown');
    bindMobileButton('btn-left', 'ArrowLeft');
    bindMobileButton('btn-right', 'ArrowRight');
    bindMobileButton('btn-enter', 'Enter');  // Tasto A
    bindMobileButton('btn-esc', 'Escape');   // Tasto B (Annulla / Esci)
    bindMobileButton('btn-menu', 'Escape');  // Tasto Menu (Usa Esc per la pausa)
});
