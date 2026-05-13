// 1. INIZIALIZZA SUPABASE
const supabaseUrl = 'https://zlmjvbtmzkphkdfspcht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbWp2YnRtemtwaGtkZnNwY2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDA4NDUsImV4cCI6MjA5MjMxNjg0NX0.j6aRmC3tTrFiZj62WrEmSKkuICoBHagFzKS3b8_adeM';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==============================================================================
// TRUCCO GLOBALE ANTI-RACE CONDITION
// Memorizziamo SE QUESTA SPECIFICA SCHEDA è quella aperta dalla mail.
// ==============================================================================
window.isRecoveryLink = window.location.href.includes('type=recovery');
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
// PARTE 2: SCENE DI PHASER
// ==============================================================================

// 1. BOOT SCENE: Carica i file e mappa i DB
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.load.json('pokemonDB', 'DB/DB_pokemon.json');
        this.load.json('moveDB', 'DB/DB_mosse.json');

        this.load.tilemapTiledJSON('map', 'assets/mappa.tmj');
        this.load.image('tiles', 'assets/tileset.png');
        this.load.spritesheet('player', 'assets/avatar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('allenatore', 'assets/aaron.png');
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

        // 3. REINDIRIZZAMENTO
        if (isNewPlayer) {
            // Se è nuovo, gli mostriamo cosa ha ricevuto
            if (dom) dom.destroy();
            this.scene.start('StarterScene', { name: nomeFinal, user: user, starters: myPokemon });
        } else {
            // Se è vecchio, dritto in mappa
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
        this.starters = data.starters; // Riceviamo i 3 pokemon creati nel login
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
    init(data) { this.myPlayerName = data.name; }

    create() {
        this.setupMap();
        this.setupAnimations();
        this.setupNetwork();
        this.setupNPCs();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');

        // NUOVO: Aggiungiamo il tasto ESC e il controllo della pausa
        this.escKey = this.input.keyboard.addKey('ESC');
        this.isPaused = false;
        this.pauseMenuDom = null;
        this.pcOpen = false;

        this.canEncounter = true;
        this.isTransitioning = false;

        this.events.on('resume', () => {
            this.cursors.left.reset(); this.cursors.right.reset();
            this.cursors.up.reset(); this.cursors.down.reset();
            this.canEncounter = false;
            this.time.delayedCall(1500, () => this.canEncounter = true);
        });
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'map' });
        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;
        const tileset = map.addTilesetImage('tileset', 'tiles');

        map.createLayer('Sfondo', tileset, 0, 0);
        this.wallLayer = map.createLayer('Ostacoli', tileset, 0, 0);
        this.grassLayer = map.createLayer('Erba', tileset, 0, 0);

        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.wallLayer.setCollisionByExclusion([-1]);

        // NUOVO: Lettura del livello "Interazioni" da Tiled
        this.zoneInterattive = [];
        const objLayer = map.getObjectLayer('Interazioni');
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                if (obj.name === 'PC') {
                    // Creiamo una "Zona" invisibile al centro del rettangolo disegnato su Tiled
                    let pcZone = this.add.zone(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
                    pcZone.nomeInterazione = 'PC';
                    this.zoneInterattive.push(pcZone);

                    // (Opzionale) Aggiunge un testino volante per farti capire dov'è il PC
                    this.add.text(pcZone.x, pcZone.y - 20, "PC", { fontSize: '10px', fill: '#0f0', backgroundColor: '#000' }).setOrigin(0.5);
                }
            });
        }
    }

    setupNPCs() {
        this.npc = this.physics.add.sprite(300, 200, 'allenatore');
        this.npc.body.updateFromGameObject();
        this.npc.setCollideWorldBounds(true);
        this.npc.setImmovable(true);
        this.physics.add.collider(this.npc, this.wallLayer);

        this.add.text(this.npc.x, this.npc.y - 40, "NPC", {
            fontSize: '12px', fill: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 }
        }).setOrigin(0.5, 1);
    }

    setupNetwork() {
        this.otherPlayers = this.physics.add.group();
        this.socket = io();
        this.socket.emit('joinGame', this.myPlayerName);

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
                    op.nameText.setPosition(p.x, p.y - 35);
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
        if (!this.anims.exists('down')) {
            ['down', 'left', 'right', 'up'].forEach((key, i) => {
                this.anims.create({ key, frames: this.anims.generateFrameNumbers('player', { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
            });
        }
    }

    addPlayer(info) {
        this.player = this.physics.add.sprite(info.x, info.y, 'player').setCollideWorldBounds(true);
        this.player.body.setSize(24, 30).setOffset(20, 34);
        this.physics.add.collider(this.player, this.wallLayer);
        this.physics.add.collider(this.player, this.npc);
        this.playerNameText = this.createNameTag(info.x, info.y, info.name);
        this.cameras.main.startFollow(this.player).setZoom(1.7).setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    addOtherPlayer(info) {
        let op = this.add.sprite(info.x, info.y, 'player');
        op.playerId = info.playerId;
        op.nameText = this.createNameTag(info.x, info.y, info.name);
        this.otherPlayers.add(op);
    }

    createNameTag(x, y, name) {
        return this.add.text(x, y - 35, name, { fontSize: '12px', fill: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5, 1);
    }

    update() {
        // NUOVO: Controllo del tasto ESC per aprire/chiudere il menu
        if (Phaser.Input.Keyboard.JustDown(this.escKey) && !this.isTransitioning && !this.pcOpen) {
            this.togglePauseMenu();
        }

        // FIX: Se il gioco è in transizione, non c'è il player, o siamo in PAUSA, blocca tutto!
        if (this.isTransitioning || !this.player || this.isPaused || this.pcOpen) return;

        const speed = 160;
        let isMoving = false;
        let currentAnim = null;

        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown) { this.player.body.setVelocityX(-speed); currentAnim = 'left'; isMoving = true; }
        else if (this.cursors.right.isDown) { this.player.body.setVelocityX(speed); currentAnim = 'right'; isMoving = true; }
        else if (this.cursors.up.isDown) { this.player.body.setVelocityY(-speed); currentAnim = 'up'; isMoving = true; }
        else if (this.cursors.down.isDown) { this.player.body.setVelocityY(speed); currentAnim = 'down'; isMoving = true; }

        isMoving ? this.player.anims.play(currentAnim, true) : this.player.anims.stop();
        this.player.body.velocity.normalize().scale(speed);
        this.playerNameText.setPosition(this.player.x, this.player.y - 35);

        if (isMoving) {
            let px = this.player.x;
            let py = this.player.y;
            if (this.player.oldP && (px !== this.player.oldP.x || py !== this.player.oldP.y)) {
                this.socket.emit('playerMovement', { x: px, y: py, anim: currentAnim });
            }
            this.player.oldP = { x: px, y: py };
        }

        if (isMoving && this.canEncounter && this.grassLayer.getTileAtWorldXY(this.player.x, this.player.y, true)?.index !== -1) {
            if (Phaser.Math.Between(1, 100) <= 5) {
                this.startEncounter({ isWild: true, socket: this.socket }, "POKÉMON SELVATICO!");
            }
            this.canEncounter = false;
            this.time.delayedCall(250, () => this.canEncounter = true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) && !this.isTransitioning) {

            // 1. Controllo Oggetti (PC)
            if (this.zoneInterattive) {
                let pcVicino = this.zoneInterattive.find(z => Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x, z.y) < 50);
                if (pcVicino && pcVicino.nomeInterazione === 'PC') {
                    this.player.anims.stop();
                    this.apriPC();
                    return;
                }
            }

            // 2. Controllo NPC
            let distToNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
            if (distToNpc < 50) {
                this.player.anims.stop();
                // AGGIUNTO isNPC: true per distinguerlo dall'erba alta!
                this.startEncounter({ isWild: true, isNPC: true, socket: this.socket }, "SFIDA CONTRO NPC!");
                return;
            }

            // 3. Controllo Multiplayer
            let closest = this.otherPlayers.getChildren().find(op => Phaser.Math.Distance.Between(this.player.x, this.player.y, op.x, op.y) < 150);
            if (closest) this.socket.emit('challengePlayer', closest.playerId);
        }
    }
    togglePauseMenu() {
        if (this.isPaused) {
            // Se è in pausa, distruggiamo il div HTML e riprendiamo il gioco
            this.isPaused = false;
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu) existingMenu.remove();
        } else {
            // Attiva la pausa e ferma il giocatore
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            // Creiamo il contenitore HTML bypassando Phaser
            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'modal-overlay'; // Usiamo lo stesso magico blur del PC!

            overlay.innerHTML = `
                <div class="selection-box" id="pause-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <h2 class="text-shadows" style="font-size: 4rem; margin-bottom: 30px;">MENU PAUSA</h2>
                    
                    <button id="logout-btn" style="width: 300px; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: transform 0.1s;">ESCI DAL GIOCO</button>
                    
                    <p style="color: #fff; margin-top: 40px; font-size: 1.2rem; font-family: 'Courier New'; font-weight: bold;">Premi ESC per tornare al gioco</p>
                </div>`;

            // Lo incolliamo fisicamente sopra al canvas di gioco
            document.getElementById('game-container').appendChild(overlay);

            // Gestiamo il click nativo sul tasto ESCI
            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'logout-btn') {
                    e.target.innerText = "USCITA IN CORSO...";

                    // Disconnette l'utente da Supabase
                    await supabaseClient.auth.signOut();

                    // Riavvia l'intera pagina pulendo tutto
                    window.location.reload();
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
            <div class="pkmn-modal-content" style="width: 1250px !important; height: 760px !important; max-height: 760px !important;">
                <div class="pkmn-modal-header" style="margin-bottom: 15px;">SISTEMA MEMORIA POKÉMON</div>
                
                <div id="pc-main-view" style="display: flex; gap: 20px; flex: 1; overflow: hidden;">
                    <div style="flex: 1; display: flex; flex-direction: column; background: var(--battle-panel); border: 4px solid var(--color-secondary); border-radius: 8px; padding: 15px;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; flex-shrink: 0;">SQUADRA</h2>
                        <div id="pc-squadra" style="display: flex; flex-direction: column; gap: 15px; flex: 1; align-content: start; padding: 10px; overflow: hidden !important;"></div>
                    </div>

                    <div style="flex: 2.2; background: var(--battle-panel); border: 4px solid var(--battle-border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; overflow: hidden !important;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; flex-shrink: 0;">BOX DATI</h2>
                        <div id="pc-box" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; flex: 1; align-content: start; padding: 10px; overflow: hidden !important;"></div>
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
            
            /* FIX 2: Larghezza 92% e margin auto. Questo dà al quadratino lo spazio vitale ai lati per "gonfiarsi" senza toccare il bordo del box squadra! */
            .pc-sq-slot { width: 92% !important; margin: 0 auto; background: #3d2b4f; border: 3px dashed #555; border-radius: 8px; height: 100px; display: flex; align-items: center; padding: 0 15px; gap: 15px; box-shadow: 2px 2px 0 var(--battle-shadow); } 
            
            .pc-grid-slot.selected, .pc-sq-slot.selected { border-color: var(--battle-accent) !important; background-color: #4a3b5c !important; transform: scale(1.05); box-shadow: 0 0 10px var(--battle-accent); z-index: 10; }
            .pc-action-btn { background: var(--battle-panel); border: 2px solid var(--battle-border); color: #fff; padding: 10px; font-weight: bold; cursor: pointer; }
            .pc-action-btn.selected { border-color: var(--battle-accent); color: var(--battle-accent); background: #3d2b4f; transform: translateX(-5px); box-shadow: 4px 4px 0 var(--battle-accent); }
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
                    statsEl.innerHTML = `HP: ${maxHp}<br>ATK: ${pData.statistiche.attack.base_stat}<br>DEF: ${pData.statistiche.defense.base_stat}<br>VEL: ${pData.statistiche.speed.base_stat}`;
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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 4rem;">${testo}</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        this.time.delayedCall(2000, () => {
            overlay.remove();
            this.isTransitioning = false;
            this.scene.pause();

            let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
            if (myDbTeam.length === 0) {
                alert("Non hai Pokémon in squadra! Visita il PC.");
                this.scene.resume('WorldScene');
                if (battleData.socket) battleData.socket.emit('setInBattle', false);
                return;
            }

            // Bypassiamo SelectionScene e andiamo dritti alla lotta!
            this.scene.launch('BattleScene', battleData);
        });
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
    }

    preload() {
        this.bgKey = `background_${Phaser.Math.Between(0, 11)}`;
        this.load.image(this.bgKey, `DB/Immagini/Sfondi/${this.bgKey}.png`);
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
        this.currentTurn = 1;
        this.moveDB = this.registry.get('moveDB');
        this.pkmnDB = this.registry.get('pokemonDB');

        let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
        this.myTeamData = this.buildTeamData(myDbTeam);
        this.myActiveIdx = 0; // Si parte sempre col primo!

        if (this.socket) this.socket.emit('setInBattle', true);

        if (this.isWild) {
            let pkmnNames = Object.keys(this.pkmnDB);

            if (this.isNPC) {
                // SQUADRA NPC 3vs3 (Generiamo 3 selvatici a caso)
                this.oppTeamData = this.buildTeamData([
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) },
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) },
                    { id_specie: Phaser.Utils.Array.GetRandom(pkmnNames) }
                ]);
            } else {
                // POKEMON SELVATICO SINGOLO (3vs1)
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

        this.infoTipoLabel = this.add.text(610, 685, 'TIPO:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoTipoVal = this.add.text(700, 685, 'NORMALE', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoCatLabel = this.add.text(610, 725, 'CAT.:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoCatVal = this.add.text(700, 725, 'FISICO', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPPLabel = this.add.text(610, 765, 'PP:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPPVal = this.add.text(700, 765, '15/15', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPotLabel = this.add.text(840, 765, 'POT:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPotVal = this.add.text(910, 765, '90', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });

        this.moveInfoUI = [this.infoTipoLabel, this.infoTipoVal, this.infoCatLabel, this.infoCatVal, this.infoPPLabel, this.infoPPVal, this.infoPotLabel, this.infoPotVal];
        this.createButtons();

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

        this.moveKeys = this.input.keyboard.createCursorKeys();
        this.confirmKey = this.input.keyboard.addKey('ENTER');
        this.cancelKey = this.input.keyboard.addKey('BACKSPACE');

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
                this.infoPotVal.setText(m.Potenza > 0 ? m.Potenza : '-').setColor('#ffffff');
                this.moveInfoUI.forEach(element => element.setVisible(true));
            } else {
                this.moveInfoUI.forEach(element => element.setVisible(false));
            }
        }
    }

    getColorForType(tipo) {
        const typeColors = { "Normale": "#A8A878", "Fuoco": "#F08030", "Acqua": "#6890F0", "Elettro": "#F8D030", "Erba": "#78C850", "Ghiaccio": "#98D8D8", "Lotta": "#C03028", "Veleno": "#A040A0", "Terra": "#E0C068", "Volante": "#A890F0", "Psico": "#F85888", "Coleottero": "#A8B820", "Roccia": "#B8A038", "Spettro": "#705898", "Drago": "#7038F8", "Buio": "#705848", "Acciaio": "#B8B8D0", "Folletto": "#EE99AC" };
        return typeColors[tipo] || "#777777";
    }

    update() {
        if (!this.isInputActive) return;

        if (Phaser.Input.Keyboard.JustDown(this.moveKeys.left)) {
            if (this.selectedMoveIndex % 2 !== 0) this.selectedMoveIndex--;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.right)) {
            if (this.selectedMoveIndex % 2 === 0) this.selectedMoveIndex++;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.up)) {
            if (this.selectedMoveIndex >= 2) this.selectedMoveIndex -= 2;
            this.updateMenuSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.down)) {
            if (this.selectedMoveIndex <= 1) this.selectedMoveIndex += 2;
            this.updateMenuSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
            this.handleButtonClick(this.selectedMoveIndex);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cancelKey)) {
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
            let mosseDisponibiliBot = activeBot.mosse.filter(m => m.ppAttuali > 0);
            let botMoveData;

            if (this.eEntity.mossaForzata) {
                botMoveData = activeBot.mosse.find(m => m && m.Nome === this.eEntity.mossaForzata);
                if (this.eEntity.mossaForzata === "Ricarica") {
                    botMoveData = { Nome: "Ricarica", Tipo: "Normale", Categoria: "Stato", Potenza: 0, Precisione: 100, CodiceFunzione: [] };
                } else if (botMoveData && botMoveData.ppAttuali <= 0) {
                    this.eEntity.mossaForzata = null;
                    botMoveData = (mosseDisponibiliBot.length > 0) ? Phaser.Utils.Array.GetRandom(mosseDisponibiliBot) : this.moveDB["Scontro"];
                }
            } else if (mosseDisponibiliBot.length > 0) {
                botMoveData = Phaser.Utils.Array.GetRandom(mosseDisponibiliBot);
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
                this.isInputActive = false; this.btns.forEach(b => b.setVisible(false));
                this.logText.setVisible(true); this.logText.setText("Non puoi catturare i Pokémon altrui!");
                this.time.delayedCall(1500, () => this.startTurn());
            } else if (index === 2) {
                this.openTeamModal();
            } else if (index === 3) {
                this.isInputActive = false; this.btns.forEach(b => b.setVisible(false));
                this.logText.setVisible(true);
                if (this.isWild) {
                    this.logText.setText("Sei fuggito con successo!");
                    this.time.delayedCall(1500, () => {
                        if (this.socket) this.socket.emit('setInBattle', false);
                        this.scene.stop(); this.scene.resume('WorldScene');
                    });
                } else {
                    this.logText.setText("Non puoi fuggire da una lotta tra allenatori!");
                    this.time.delayedCall(1500, () => this.startTurn());
                }
            }
        } else if (this.menuState === 'MOVES') {
            let m = this.pEntity.moves[index];
            if (m) this.handleMoveClick(m.Nome);
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
            if (this.myTeamData[i]) this.myTeamData[i].hp = p.hp;
        });
        if (this.oppTeamData) {
            p2Data.squadra.forEach((p, i) => {
                if (this.oppTeamData[i]) this.oppTeamData[i].hp = p.hp;
            });
        }

        this.myTeamData[this.myActiveIdx].mosse = [...p1Data.mosse];
        if (this.oppTeamData) this.oppTeamData[p2Data.attivoIdx].mosse = [...p2Data.mosse];

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
                this.time.delayedCall(1500, () => {
                    let vinto = p1Data.squadra.some(p => p.hp > 0);
                    this.logText.setText(vinto ? 'HAI VINTO! 🎉' : 'HAI PERSO... 💀');
                    let loserSprite = vinto ? this.eSprite : this.pSprite;
                    this.tweens.add({
                        targets: loserSprite, y: loserSprite.y + 100, alpha: 0, duration: 1000,
                        onComplete: () => {
                            if (this.socket) this.socket.emit('setInBattle', false);
                            this.scene.stop(); this.scene.resume('WorldScene');
                        }
                    });
                });
            } else if (iAmDead) {
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));
                this.logText.setText(`${p1Data.nome} è esausto! Scegli un sostituto!`);
                this.time.delayedCall(1500, () => this.forceSwitchMenu());
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
                        <div class="pkmn-modal-header" style="margin-bottom: 25px;">SQUADRA POKÉMON</div> <div class="pokemon-list" id="pkmn-list-container" style="overflow-y: auto; overflow-x: hidden; flex: 1;"></div>
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
            let botMoves = activeBot.mosse.filter(m => m.ppAttuali > 0);
            let botAction = { mossa: botMoves.length > 0 ? Phaser.Utils.Array.GetRandom(botMoves) : this.moveDB["Scontro"] };

            let stato = this.partita.processaTurno(switchAction, botAction);
            this.applicaStatoPartita(stato, false);
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, ...switchAction });
        }
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
    dom: { createContainer: true },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: [BootScene, LoginScene, StarterScene, WorldScene, BattleScene]
};
new Phaser.Game(config);