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
// PARTE 1: CLASSI E UTILITY GLOBALI (Il "Motore" del gioco)
// ==============================================================================

class PokemonEntity {
    constructor(name, dbData, moveDB) {
        this.name = dbData.nome;
        this.types = dbData.tipi;
        this.stats = {
            hp: Math.floor(dbData.statistiche.hp.base_stat * 1.5),
            attacco: dbData.statistiche.attack.base_stat,
            difesa: dbData.statistiche.defense.base_stat,
            attaccoSpeciale: dbData.statistiche['special-attack'].base_stat,
            difesaSpeciale: dbData.statistiche['special-defense'].base_stat,
            velocita: dbData.statistiche.speed.base_stat
        };
        this.maxHp = this.stats.hp;
        this.hp = this.maxHp;
        let mosseMischiate = [...dbData.mosse]
            .sort(() => 0.5 - Math.random())
            .slice(0, 4)
            .map(mName => {
                let mData = moveDB[mName] || Object.values(moveDB).find(m => m.Nome.toLowerCase() === mName.toLowerCase());
                return mData ? { ...mData, ppAttuali: mData.PP, ppMassimi: mData.PP } : null;
            })
            .filter(m => m);
        this.moves = mosseMischiate;
        this.alive = true;
        this.sprites = dbData.sprite;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp === 0) this.alive = false;
    }
}

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
        this.socket.on('opponentBusy', () => alert("Questo allenatore è occupato!"));

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
        if (Phaser.Input.Keyboard.JustDown(this.escKey) && !this.isTransitioning) {
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
                this.startEncounter({ isWild: true, socket: this.socket }, "SFIDA CONTRO NPC!");
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

        // 1. SCARICHIAMO I POKEMON AGGIORNATI DAL DB
        let profilo = this.registry.get('playerProfile');
        const { data: myPokemon, error } = await supabaseClient
            .from('pokemon')
            .select('*')
            .eq('id_profilo_proprietario', profilo.id_profilo);

        if (error) {
            console.error("Errore lettura PC:", error);
            this.pcOpen = false;
            return;
        }

        let squadra = myPokemon.filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
        let box = myPokemon.filter(p => !p.in_squadra);
        let pkmnDB = this.registry.get('pokemonDB');

        // 2. CREIAMO IL LAYOUT IN PURO HTML (Bypassando la telecamera di Phaser!)
        let overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1000px; box-sizing: border-box; padding: 20px; position: relative;">
                <h1 class="text-shadows" style="font-size: 3rem; margin-bottom: 20px; color: #b5d6d6;">SISTEMA MEMORIA POKÉMON</h1>
                
                <div style="display: flex; width: 100%; max-width: 900px; height: 500px; gap: 20px; justify-content: center;">
                    <div style="flex: 1; background: var(--battle-panel); border: 4px solid var(--color-secondary); border-radius: 8px; padding: 15px; display: flex; flex-direction: column;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; font-family: 'Courier New';">SQUADRA (Max 3)</h2>
                        <div id="pc-squadra" style="display: flex; flex-direction: column; gap: 15px; flex: 1;"></div>
                    </div>

                    <div style="flex: 2; background: var(--battle-panel); border: 4px solid var(--battle-border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column;">
                        <h2 style="color: var(--battle-accent); text-align: center; margin-top: 0; font-family: 'Courier New';">BOX (Clicca per spostare)</h2>
                        <div id="pc-box" style="display: flex; flex-wrap: wrap; gap: 15px; overflow-y: auto; align-content: flex-start; padding: 10px;"></div>
                    </div>
                </div>

                <div style="margin-top: 30px; display: flex; gap: 30px;">
                    <button id="pc-save-btn" style="padding: 15px 30px; font-size: 1.3rem; font-weight: bold; font-family: 'Courier New'; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597; transition: transform 0.1s;">SALVA MODIFICHE</button>
                    <button id="pc-cancel-btn" style="padding: 15px 30px; font-size: 1.3rem; font-weight: bold; font-family: 'Courier New'; background-color: #3d2b4f; color: #fff; border: 4px solid #fff; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #000; transition: transform 0.1s;">CHIUDI</button>
                </div>
            </div>
        `;

        document.getElementById('game-container').appendChild(overlay);

        let style = document.createElement('style');
        style.id = 'pc-styles';
        style.innerHTML = `
            .pc-slot { transition: transform 0.1s, border-color 0.1s; }
            .pc-slot:hover { transform: translateY(-3px) scale(1.02); border-color: var(--battle-accent) !important; background-color: #4a3b5c !important; }
            #pc-box::-webkit-scrollbar { width: 8px; }
            #pc-box::-webkit-scrollbar-thumb { background: var(--color-secondary); border-radius: 4px; }
        `;
        document.head.appendChild(style);

        // FUNZIONE BANNER ANIMATO
        const showBanner = (testo, isError = true) => {
            let old = document.getElementById('pc-banner');
            if (old) old.remove();

            let banner = document.createElement('div');
            banner.id = 'pc-banner';
            banner.style.position = 'absolute';
            banner.style.top = '20px';
            banner.style.left = '50%';
            banner.style.transform = 'translateX(-50%) translateY(-20px)';
            banner.style.backgroundColor = isError ? '#ff7477' : '#4caf50'; // Rosso errore, Verde successo
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

            overlay.appendChild(banner);

            // Animazione Entrata
            setTimeout(() => {
                banner.style.transform = 'translateX(-50%) translateY(0)';
                banner.style.opacity = '1';
            }, 10);

            // Animazione Uscita
            setTimeout(() => {
                banner.style.opacity = '0';
                banner.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => banner.remove(), 300);
            }, 2500);
        };

        // 3. FUNZIONE DI RE-RENDER
        const renderPC = () => {
            let sqHtml = '';
            squadra.forEach(p => {
                let sprite = pkmnDB[p.id_specie]?.sprite?.normal || '';
                sqHtml += `
                    <div class="pc-slot" data-id="${p.id_pokemon}" data-from="squadra" style="border: 3px dashed var(--battle-accent); border-radius: 8px; background: #3d2b4f; padding: 10px; display: flex; align-items: center; gap: 15px; cursor: pointer; box-shadow: 2px 2px 0 var(--battle-shadow);">
                        <img src="${sprite}" style="width: 70px; height: 70px; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 #000);">
                        <span style="color: white; font-weight: bold; font-family: 'Courier New'; font-size: 1.3rem;">${p.id_specie.toUpperCase()}</span>
                    </div>
                `;
            });
            for (let i = squadra.length; i < 3; i++) {
                sqHtml += `<div style="border: 3px dashed #555; border-radius: 8px; background: #222; padding: 10px; height: 70px; display: flex; align-items: center; justify-content: center; color: #777; font-family: 'Courier New'; font-size: 1.2rem;">SLOT VUOTO</div>`;
            }
            document.getElementById('pc-squadra').innerHTML = sqHtml;

            let bxHtml = '';
            box.forEach(p => {
                let sprite = pkmnDB[p.id_specie]?.sprite?.normal || '';
                bxHtml += `
                    <div class="pc-slot" data-id="${p.id_pokemon}" data-from="box" style="border: 3px solid #555; border-radius: 8px; background: #222; padding: 10px; cursor: pointer; text-align: center; width: 100px; box-shadow: 2px 2px 0 var(--battle-shadow);">
                        <img src="${sprite}" style="width: 60px; height: 60px; image-rendering: pixelated; margin: 0 auto; filter: drop-shadow(2px 2px 0 #000);">
                        <div style="color: white; font-size: 0.9rem; font-family: 'Courier New'; font-weight: bold; margin-top: 5px;">${p.id_specie.toUpperCase()}</div>
                    </div>
                `;
            });
            document.getElementById('pc-box').innerHTML = bxHtml;
        };

        renderPC();

        // 4. GESTIONE CLICK E SALVATAGGIO 
        overlay.addEventListener('click', async (e) => {
            let slot = e.target.closest('.pc-slot');

            if (slot) {
                let id = slot.getAttribute('data-id');
                let from = slot.getAttribute('data-from');

                if (from === 'squadra') {
                    if (squadra.length <= 1) {
                        showBanner("Attenzione: Non puoi viaggiare senza Pokémon!");
                        return;
                    }
                    let idx = squadra.findIndex(p => p.id_pokemon === id);
                    box.push(squadra.splice(idx, 1)[0]);
                } else {
                    if (squadra.length >= 3) {
                        showBanner("Attenzione: La tua squadra è già piena! (Max 3)");
                        return;
                    }
                    let idx = box.findIndex(p => p.id_pokemon === id);
                    squadra.push(box.splice(idx, 1)[0]);
                }
                renderPC();
                return;
            }

            if (e.target.id === 'pc-cancel-btn') {
                overlay.remove();
                document.getElementById('pc-styles').remove();
                this.pcOpen = false;
            }

            if (e.target.id === 'pc-save-btn') {
                e.target.innerText = "SALVATAGGIO...";
                e.target.style.backgroundColor = "#ffcc00";

                squadra.forEach((p, index) => {
                    p.in_squadra = true;
                    p.posizione_slot = index + 1;
                });
                box.forEach(p => {
                    p.in_squadra = false;
                    p.posizione_slot = null;
                });

                let allUpdates = [...squadra, ...box].map(p => ({
                    id_pokemon: p.id_pokemon,
                    id_specie: p.id_specie,
                    id_profilo_proprietario: p.id_profilo_proprietario,
                    in_squadra: p.in_squadra,
                    posizione_slot: p.posizione_slot
                }));

                const { error } = await supabaseClient.from('pokemon').upsert(allUpdates);

                if (error) {
                    console.error("Errore salvataggio PC:", error);
                    showBanner("Errore di rete durante il salvataggio!");
                    e.target.innerText = "SALVA MODIFICHE";
                    e.target.style.backgroundColor = "#f6eedf";
                } else {
                    this.registry.set('userPokemon', [...squadra, ...box]);
                    showBanner("Squadra salvata con successo!", false); // False = Verde!

                    // Chiude il PC dopo 1 secondo così l'utente fa in tempo a leggere il successo
                    setTimeout(() => {
                        if (document.body.contains(overlay)) {
                            overlay.remove();
                            document.getElementById('pc-styles').remove();
                            this.pcOpen = false;
                        }
                    }, 1200);
                }
            }
        });
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
            this.scene.launch('SelectionScene', battleData);
        });
    }
}

// 4. SELECTION SCENE: Scegli il Pokemon
class SelectionScene extends Phaser.Scene {
    constructor() { super({ key: 'SelectionScene' }); }
    init(data) {
        this.roomId = data.roomId;
        this.socket = data.socket;
        this.isWild = data.isWild;
        this.isLaunching = false;
    }
    create() {
        if (this.socket) this.socket.emit('setInBattle', true);

        let pkmnNames = Object.keys(this.registry.get('pokemonDB'));
        let options = [Phaser.Utils.Array.GetRandom(pkmnNames), Phaser.Utils.Array.GetRandom(pkmnNames), Phaser.Utils.Array.GetRandom(pkmnNames)];

        if (!this.isWild) {
            this.socket.off('pvpBothSelected');
            this.socket.on('pvpBothSelected', (selections) => {
                if (this.isLaunching) return;
                this.isLaunching = true;
                let myChoice = selections[this.socket.id];
                let oppChoice = Object.values(selections).find(n => n !== myChoice) || myChoice;
                this.launchBattle(myChoice, oppChoice);
            });
        }

        const html = `
            <div class="selection-overlay">
                <div class="selection-box" id="sel-box">
                    <h2 class="selection-title">CHI MANDI IN CAMPO?</h2>
                    ${options.map(p => `<button class="pkmn-btn" data-pkmn="${p}">${p.toUpperCase()}</button>`).join('')}
                </div>
            </div>`;

        let dom = this.add.dom(500, 400).createFromHTML(html);
        dom.addListener('click').on('click', (e) => {
            if (e.target.classList.contains('pkmn-btn')) {
                let chosen = e.target.getAttribute('data-pkmn');
                if (this.isWild) {
                    this.launchBattle(chosen, Phaser.Utils.Array.GetRandom(pkmnNames));
                } else {
                    document.getElementById('sel-box').innerHTML = `<h2 class="selection-title">IN ATTESA...</h2>`;
                    this.socket.emit('pvpSelectPokemon', { roomId: this.roomId, pkmnName: chosen });
                }
            }
        });
    }

    launchBattle(myPkmn, oppPkmn) {
        this.scene.stop();
        this.scene.launch('BattleScene', {
            playerPkmn: myPkmn, enemyPkmn: oppPkmn,
            roomId: this.roomId, socket: this.socket, isWild: this.isWild
        });
    }
}

// 5. BATTLE SCENE: Il motore grafico della battaglia
class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'BattleScene' }); }
    init(data) {
        this.pName = data.playerPkmn; this.eName = data.enemyPkmn;
        this.isWild = data.isWild; this.roomId = data.roomId; this.socket = data.socket;
    }

    preload() {
        this.pkmnDB = this.registry.get('pokemonDB');
        let pData = this.pkmnDB[this.pName];
        let eData = this.pkmnDB[this.eName];
        let pSpriteUrl = pData.sprite?.normal;
        let eSpriteUrl = eData.sprite?.normal;

        this.bgKey = `background_${Phaser.Math.Between(0, 11)}`;
        if (pSpriteUrl) this.load.image(this.pName, pSpriteUrl);
        if (eSpriteUrl) this.load.image(this.eName, eSpriteUrl);
        this.load.image(this.bgKey, `DB/Immagini/Sfondi/${this.bgKey}.png`);
    }

    create() {
        this.currentTurn = 1;

        // FIX: Puliamo la memoria dalla battaglia precedente!
        this.myTeamData = null;
        this.myActiveIdx = 0;

        this.moveDB = this.registry.get('moveDB');
        this.pEntity = new PokemonEntity(this.pName, this.pkmnDB[this.pName], this.moveDB);
        this.eEntity = new PokemonEntity(this.eName, this.pkmnDB[this.eName], this.moveDB);

        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(1000, 665);
        this.pSprite = this.add.dom(250, 500).createFromHTML(`<img src="${this.pkmnDB[this.pName].sprite?.normal}" style="transform: scale(2.5); image-rendering: pixelated;">`);
        this.eSprite = this.add.dom(750, 230).createFromHTML(`<img src="${this.pkmnDB[this.eName].sprite?.normal}" style="transform: scale(2.2); image-rendering: pixelated;">`);

        this.pUI = this.createUIBox(100, 360, this.pEntity);
        this.eUI = this.createUIBox(600, 100, this.eEntity);

        this.add.rectangle(0, 665, 1000, 135, 0x2b2b2b).setOrigin(0, 0);
        this.add.rectangle(3, 668, 994, 129).setOrigin(0, 0).setStrokeStyle(6, 0xd05050);
        this.add.rectangle(6, 671, 988, 123).setOrigin(0, 0).setStrokeStyle(2, 0x555555);
        this.add.rectangle(590, 668, 6, 129, 0xd05050).setOrigin(0, 0);

        this.logText = this.add.text(30, 690, '', {
            fontSize: '26px',
            fill: '#ffffff',
            fontFamily: '"Courier New", Courier, monospace',
            fontStyle: 'bold',
            wordWrap: { width: 530 },
            lineSpacing: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
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

        if (this.isWild) {
            let pkmnNames = Object.keys(this.pkmnDB);
            let creaSquadra = (id, mainEntity, extraCount) => {
                let team = [];
                team.push({
                    nome: mainEntity.name, hp: mainEntity.hp, hpMax: mainEntity.maxHp, statistiche: { ...mainEntity.stats },
                    modificatori: {}, tipi: mainEntity.types, livello: 50, stato: null,
                    mosse: mainEntity.moves.map(m => ({ ...m }))
                });

                for (let i = 0; i < extraCount; i++) {
                    let randomPkmnData = this.pkmnDB[Phaser.Utils.Array.GetRandom(pkmnNames)];
                    let newPkmnEntity = new PokemonEntity(randomPkmnData.nome, randomPkmnData, this.moveDB);
                    team.push({
                        nome: newPkmnEntity.name, hp: newPkmnEntity.hp, hpMax: newPkmnEntity.maxHp, statistiche: { ...newPkmnEntity.stats },
                        modificatori: {}, tipi: newPkmnEntity.types, livello: 50, stato: null,
                        mosse: newPkmnEntity.moves.map(m => ({ ...m }))
                    });
                }

                return { id: id, squadra: team, attivoIdx: 0 };
            };

            let p1 = creaSquadra('player', this.pEntity, 3);
            let p2 = creaSquadra('bot', this.eEntity, 2);
            this.partita = new gestionePartita(p1, p2);

            // FIX: Nelle lotte PvE, salviamo subito la squadra al turno 1 così puoi fare switch!
            this.myTeamData = this.partita.p1.squadra;
        }

        if (!this.isWild) {
            this.socket.off('resolveTurn');
            this.socket.on('resolveTurn', (data) => this.resolveTurn(data));
        }
        this.startTurn();
    }

    createUIBox(x, y, entity) {
        let nameTxt = this.add.text(x, y, entity.name.toUpperCase(), {
            fontSize: '24px', fill: '#000', fontStyle: 'bold', backgroundColor: '#fff8'
        });
        let hpTxt = this.add.text(x, y + 30, `HP: ${entity.hp}/${entity.maxHp}`, {
            fontSize: '20px', fill: '#000', backgroundColor: '#fff8'
        });
        this.add.rectangle(x, y + 60, 200, 15, 0x555555).setOrigin(0, 0);
        let bar = this.add.rectangle(x, y + 60, 200, 15, 0x00ff00).setOrigin(0, 0);

        return { nameText: nameTxt, text: hpTxt, bar: bar };
    }

    updateUI() {
        [{ ui: this.pUI, ent: this.pEntity }, { ui: this.eUI, ent: this.eEntity }].forEach(obj => {
            obj.ui.text.setText(`HP: ${obj.ent.hp}/${obj.ent.maxHp}`);
            let pct = obj.ent.hp / obj.ent.maxHp;
            obj.ui.bar.width = 200 * pct;
            obj.ui.bar.fillColor = pct > 0.5 ? 0x00ff00 : (pct > 0.2 ? 0xffff00 : 0xff0000);
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
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: '"Courier New", Courier, monospace',
                fontStyle: 'bold',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true },
                padding: { x: 2, y: 5 }
            })
                .setInteractive()
                .on('pointerdown', () => {
                    if (this.isInputActive) this.handleButtonClick(i);
                })
                .on('pointerover', () => {
                    if (this.isInputActive) {
                        this.selectedMoveIndex = i;
                        this.updateMenuSelection();
                    }
                });

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
        const typeColors = {
            "Normale": "#A8A878", "Fuoco": "#F08030", "Acqua": "#6890F0",
            "Elettro": "#F8D030", "Erba": "#78C850", "Ghiaccio": "#98D8D8",
            "Lotta": "#C03028", "Veleno": "#A040A0", "Terra": "#E0C068",
            "Volante": "#A890F0", "Psico": "#F85888", "Coleottero": "#A8B820",
            "Roccia": "#B8A038", "Spettro": "#705898", "Drago": "#7038F8",
            "Buio": "#705848", "Acciaio": "#B8B8D0", "Folletto": "#EE99AC"
        };
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

        // GESTIONE MOSSE FORZATE O RICARICA
        if (this.pEntity.mossaForzata) {
            let forcedMoveName = this.pEntity.mossaForzata;
            let forcedMoveData = this.pEntity.moves.find(m => m && m.Nome === forcedMoveName);

            if (forcedMoveData && forcedMoveData.ppAttuali <= 0 && forcedMoveName !== "Ricarica") {
                this.pEntity.mossaForzata = null;
            } else {
                this.btns.forEach(b => b.setVisible(false));
                this.moveInfoUI.forEach(element => element.setVisible(false));
                this.isInputActive = false;

                // Ritardo cosmetico, poi lanciamo l'attacco in automatico
                this.time.delayedCall(1000, () => {
                    this.handleMoveClick(forcedMoveName);
                });
                return;
            }
        }

        // GESTIONE FINE PP (SCONTRO)
        let haMosseDisponibili = this.pEntity.moves.some(m => m && m.ppAttuali > 0);
        if (!haMosseDisponibili) {
            // FIX: Assicurati che "Scontro" esista nel moveDB del client e passagli i dati minimi!
            this.pEntity.moves = [this.moveDB["Scontro"] || { Nome: "Scontro", Tipo: "Normale", Categoria: "Fisico", ppAttuali: 1, ppMassimi: 1 }];
            this.selectedMoveIndex = 0;
        }

        this.updateMenuSelection();
    }

    handleMoveClick(moveName) {
        let myMoveData = this.pEntity.moves.find(m => m.Nome === moveName);

        // Controllo PP esauriti per mosse normali
        if (moveName !== "Ricarica" && moveName !== "Scontro" && myMoveData && myMoveData.ppAttuali !== undefined && myMoveData.ppAttuali <= 0) {
            let warningText = this.add.text(500, 400, "PP ESAURITI!", {
                fontSize: '40px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            this.tweens.add({
                targets: warningText, y: 350, alpha: 0, duration: 1500, onComplete: () => warningText.destroy()
            });
            return;
        }

        this.isInputActive = false;

        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));
        this.logText.setVisible(true);

        if (this.isWild) {
            // ... (logica bot invariata)
            let mosseDisponibiliBot = this.eEntity.moves.filter(m => m.ppAttuali > 0);
            let botMoveData;

            if (this.eEntity.mossaForzata) {
                botMoveData = this.eEntity.moves.find(m => m && m.Nome === this.eEntity.mossaForzata);
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

            // Fallback per sicurezza su botMoveData se per caso "Scontro" o la mossa fallisce a caricarsi
            if (!botMoveData) botMoveData = { Nome: "Scontro", Tipo: "Normale", Categoria: "Fisico" };
            if (!myMoveData) myMoveData = { Nome: moveName, Tipo: "Normale", Categoria: "Fisico" };

            let statoAggiornato = this.partita.processaTurno({ mossa: myMoveData }, { mossa: botMoveData });
            this.applicaStatoPartita(statoAggiornato, false);
        } else {
            // FIX: Assicurati di inviare SEMPRE un messaggio al server!
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, moveName: moveName });
        }
    }

    handleButtonClick(index) {
        if (this.menuState === 'MAIN') {
            if (index === 0) { // LOTTA
                this.menuState = 'MOVES';
                this.selectedMoveIndex = 0;
                this.updateMenuSelection();
            } else if (index === 1) { // ZAINO / POKÉBALL
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));
                this.logText.setVisible(true);
                this.logText.setText("Non puoi catturare i Pokémon altrui!");
                this.time.delayedCall(1500, () => this.startTurn());
            } else if (index === 2) { // POKÉMON (Menu Squadra)
                this.openTeamModal(); // Apre il nostro nuovo modal HTML
            } else if (index === 3) { // FUGA
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));
                this.logText.setVisible(true);
                if (this.isWild) {
                    this.logText.setText("Sei fuggito con successo!");
                    this.time.delayedCall(1500, () => {
                        if (this.socket) this.socket.emit('setInBattle', false);
                        this.scene.stop();
                        this.scene.resume('WorldScene');
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
        this.invertiLogs = inverti; // Ci serve per il parsing dei log
        this.currentTurn = stato.turno;
        let p1Data = inverti ? stato.p2 : stato.p1;
        let p2Data = inverti ? stato.p1 : stato.p2;

        this.myActiveIdx = p1Data.attivoIdx;
        this.myTeamData = p1Data.squadra;

        if (p1Data.nome !== this.pEntity.name) {
            this.pEntity = new PokemonEntity(p1Data.nome, this.pkmnDB[p1Data.nome], this.moveDB);
            if (this.pSprite.node) this.pSprite.node.querySelector('img').src = this.pkmnDB[p1Data.nome].sprite.normal;
            this.pUI.nameText.setText(p1Data.nome.toUpperCase());
            this.updateStatusOverlay(true, null);
        }

        if (p2Data.nome !== this.eEntity.name) {
            this.eEntity = new PokemonEntity(p2Data.nome, this.pkmnDB[p2Data.nome], this.moveDB);
            if (this.eSprite.node) this.eSprite.node.querySelector('img').src = this.pkmnDB[p2Data.nome].sprite.normal;
            this.eUI.nameText.setText(p2Data.nome.toUpperCase());
            this.updateStatusOverlay(false, null);
        }

        this.pEntity.moves = [...p1Data.mosse];
        this.pEntity.mossaForzata = p1Data.mossaForzata;
        this.eEntity.mossaForzata = p2Data.mossaForzata;

        if (p1Data.hp <= 0) this.pEntity.alive = false;
        if (p2Data.hp <= 0) this.eEntity.alive = false;

        if (p1Data.trasformato && this.pSprite.node) {
            this.pSprite.node.querySelector('img').src = this.pkmnDB[this.eEntity.name].sprite.normal;
        }
        if (p2Data.trasformato && this.eSprite.node) {
            this.eSprite.node.querySelector('img').src = this.pkmnDB[this.pEntity.name].sprite.normal;
        }

        this.mostraLogsSequenziali(stato.logs, () => {
            this.updateUI();
            if (stato.finito || !this.pEntity.alive || !this.eEntity.alive) {
                // ... (animazioni di sconfitta/vittoria) ...
                this.time.delayedCall(1500, () => {
                    this.logText.setText(!this.pEntity.alive ? 'HAI PERSO... 💀' : 'HAI VINTO! 🎉');
                    let loserSprite = !this.pEntity.alive ? this.pSprite : this.eSprite;
                    this.tweens.add({
                        targets: loserSprite,
                        y: loserSprite.y + 100,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            if (this.socket) this.socket.emit('setInBattle', false);
                            this.scene.stop(); this.scene.resume('WorldScene');
                        }
                    });
                });
            } else {
                this.startTurn();
            }
        });
    }

    mostraLogsSequenziali(logs, onComplete) {
        if (!logs || logs.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        let index = 0;
        let ultimoAttaccanteEraPlayer = null;

        let mostraProssimo = () => {
            if (index < logs.length) {
                let logObj = logs[index];

                // 1. GESTIONE POLIMORFICA DEL LOG (Stringa o Oggetto con HP)
                // Se il log è un oggetto {testo, p1Hp, p2Hp}, estraiamo i dati
                let riga = typeof logObj === 'object' ? logObj.testo : logObj;

                // 2. SINCRONIZZAZIONE HP IN TEMPO REALE
                // Se abbiamo i dati HP salvati in questo log, aggiorniamo le entità prima di mostrare il testo
                if (typeof logObj === 'object') {
                    this.pEntity.hp = this.invertiLogs ? logObj.p2Hp : logObj.p1Hp;
                    this.eEntity.hp = this.invertiLogs ? logObj.p1Hp : logObj.p2Hp;
                    // Aggiorniamo subito la grafica per riflettere lo stato esatto di questo log
                    this.updateUI();
                }

                // 3. PARSING VECCHIO STILE (Fallback per log con stringa |HP:)
                let targetHp = null;
                if (typeof riga === 'string' && riga.includes("|HP:")) {
                    let parts = riga.split("|HP:");
                    riga = parts[0];
                    targetHp = parseInt(parts[1]);
                }

                this.logText.setText(riga);

                let isPlayerTarget = riga.includes(this.pEntity.name);
                let isEnemyTarget = riga.includes(this.eEntity.name);

                // Gestione animazione attacco (Dash)
                if (riga.includes(" usa ")) {
                    ultimoAttaccanteEraPlayer = riga.includes(this.pEntity.name);
                    this.playDash(ultimoAttaccanteEraPlayer);
                }

                // Gestione calo HP e animazione danno
                if (riga.includes("Inflitti") || riga.includes("efficace") || riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("recupera") || riga.includes("rigenera") || riga.includes("contraccolpo")) {

                    let targetEnt = isPlayerTarget ? this.pEntity : (isEnemyTarget ? this.eEntity : null);

                    // Se stiamo usando il vecchio sistema |HP:, aggiorniamo qui
                    if (targetEnt && targetHp !== null) {
                        targetEnt.hp = targetHp;
                    }

                    this.updateUI(targetEnt);

                    if (riga.includes("Inflitti") || riga.includes("efficace")) {
                        if (ultimoAttaccanteEraPlayer !== null) {
                            this.playDamage(!ultimoAttaccanteEraPlayer);
                        }
                    } else if (riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("contraccolpo")) {
                        this.playDamage(isPlayerTarget);
                    }
                }

                // --- ANIMAZIONI STATISTICHE E STATO ---
                if (riga.includes("aumenta")) {
                    this.playStatAnim(isPlayerTarget, true);
                } else if (riga.includes("diminuisce")) {
                    this.playStatAnim(isPlayerTarget, false);
                }

                if (riga.includes("stato di")) {
                    let stato = riga.split("stato di ")[1].replace("!", "").trim();
                    this.updateStatusOverlay(isPlayerTarget, stato);
                } else if (riga.includes("addormentato per la sonnolenza")) {
                    this.updateStatusOverlay(isPlayerTarget, "Sonno");
                } else if (riga.includes("si è svegliato") || riga.includes("si è scongelato") || riga.includes("curato dal suo problema di stato")) {
                    this.updateStatusOverlay(isPlayerTarget, null);
                }

                if ((riga.includes("confuso") || riga.includes("Confusione")) && !riga.includes("non è più confuso")) {
                    this.playConfusion(isPlayerTarget);
                }

                if (riga.includes("intrappolato") || riga.includes("Legatutto") || riga.includes("Parassiseme")) {
                    this.playTrap(isPlayerTarget);
                }

                index++;
                this.time.delayedCall(1500, mostraProssimo);
            } else {
                // Fine dei log: assicuriamoci che l'interfaccia sia sincronizzata al 100%
                this.updateUI();
                if (onComplete) onComplete();
            }
        };
        mostraProssimo();
    }

    playDash(isPlayer) {
        let sprite = isPlayer ? this.pSprite : this.eSprite;
        let dist = isPlayer ? 60 : -60;
        this.tweens.add({ targets: sprite, x: sprite.x + dist, duration: 100, yoyo: true, ease: 'Power2' });
    }

    playDamage(isPlayer) {
        let sprite = isPlayer ? this.pSprite : this.eSprite;
        this.tweens.add({ targets: sprite, alpha: 0.5, x: sprite.x + (isPlayer ? 5 : -5), duration: 50, yoyo: true, repeat: 5, onComplete: () => sprite.alpha = 1 });
    }

    playStatAnim(isPlayer, isUp) {
        let x = isPlayer ? 250 : 750;
        let y = isPlayer ? 500 : 230;
        let color = isUp ? '#00FF00' : '#FF0000';
        let label = isUp ? '↑ STATS' : '↓ STATS';
        let t = this.add.text(x, y, label, { fontSize: '32px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 100, alpha: 0, duration: 1500, onComplete: () => t.destroy() });
    }

    playOverlayTesto(isPlayer, testo, colore) {
        let targetX = isPlayer ? 250 : 750;
        let targetY = isPlayer ? 500 : 230;
        let txt = this.add.text(targetX, targetY, testo, { fontSize: '40px', fill: colore, fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: targetY - 80, scale: 1.2, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
    }

    updateStatusOverlay(isPlayer, stato) {
        let ui = isPlayer ? this.pUI : this.eUI;
        if (!ui.statusLabel) {
            ui.statusLabel = this.add.text(ui.nameText.x, ui.nameText.y - 25, '', {
                fontSize: '16px', fontStyle: 'bold', padding: { x: 4, y: 2 }
            });
        }
        if (!stato) {
            ui.statusLabel.setText('');
            ui.statusLabel.setBackgroundColor('transparent');
            return;
        }
        const colori = {
            'Scottatura': '#f08030', 'Paralisi': '#f8d030', 'Sonno': '#8c888c',
            'Avvelenamento': '#a040a0', 'Iperavvelenamento': '#a040a0', 'Congelamento': '#98d8d8'
        };
        ui.statusLabel.setText(stato.toUpperCase()).setBackgroundColor(colori[stato] || '#777');
    }

    playConfusion(isPlayer) {
        let x = isPlayer ? 250 : 750;
        let y = isPlayer ? 420 : 150;
        let d1 = this.add.text(x - 30, y, '🦆', { fontSize: '30px' }).setOrigin(0.5);
        let d2 = this.add.text(x + 30, y, '🦆', { fontSize: '30px' }).setOrigin(0.5);
        this.tweens.add({ targets: [d1, d2], angle: 360, duration: 1000, repeat: 1, onComplete: () => { d1.destroy(); d2.destroy(); } });
    }

    playTrap(isPlayer) {
        let targetX = isPlayer ? 250 : 750;
        let targetY = isPlayer ? 500 : 230;
        let trap = this.add.text(targetX, targetY, '🔗', { fontSize: '100px' }).setOrigin(0.5);
        this.tweens.add({ targets: trap, scale: { from: 2, to: 1 }, alpha: { from: 1, to: 0 }, duration: 1500, onComplete: () => trap.destroy() });
    }
    openTeamModal() {
        this.isInputActive = false;
        this.modalSelection = 0;
        this.currentView = 'list';
        this.summaryPage = 0;

        let teamData = this.myTeamData || (this.partita ? this.partita.p1.squadra : [this.pEntity]);

        const html = `
                        <div class="modal-overlay" id="team-modal">
                            <div class="modal-content">
                                <div id="modal-list-view" style="display: block; width: 100%;">
                                    <div class="modal-header">SQUADRA POKÉMON</div>
                                    <div class="pokemon-list" id="pkmn-list-container"></div>
                                </div>

                                <div id="modal-summary-view" class="summary-view" style="display: none; width: 100%;">
                                    <div class="modal-header" style="font-size: 1.5rem;" id="summary-page-indicator">◀ INFO E STATISTICHE ▶</div>
                                    <div class="summary-layout" style="display: flex; gap: 20px; width: 100%;">
                                        <div class="summary-left" style="flex: 1; text-align: center; border-right: 4px dashed var(--color-quaternary);">
                                            <div class="pkmn-name" id="summary-name" style="margin-bottom: 10px;">NOME</div>
                                            <img id="summary-sprite" src="" style="width: 160px; height: 160px; image-rendering: pixelated;">
                                            <div class="summary-types" id="summary-types" style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;"></div>
                                        </div>
                                        <div class="summary-right" style="flex: 1.5; padding-left: 10px;">
                                            <div id="summary-page-0" class="stats-grid"></div>
                                            <div id="summary-page-1" class="moves-grid" style="display: none;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

        this.teamModalDom = this.add.dom(500, 400).createFromHTML(html);
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

            let hp = pkmn.hp;
            let maxHp = pkmn.maxHp || pkmn.hpMax || (localData ? localData.statistiche.hp.base_stat : 100);
            let hpPercent = (hp / maxHp) * 100;
            let hpColor = hpPercent > 50 ? '#4caf50' : (hpPercent > 20 ? '#ffeb3b' : '#f44336');

            listHTML += `
                        <div class="pokemon-item" data-index="${index}">
                            <img src="${spriteUrl}" style="width: 70px; height: 70px; display: block; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.5));">
                            <div class="pkmn-info">
                                <div class="pkmn-name-line">
                                    <span class="pkmn-name">${pkmn.nome.toUpperCase()} ${index === (this.myActiveIdx || 0) ? '★' : ''}</span>
                                </div>
                                <div class="hp-container">
                                    <span class="hp-label">HP</span>
                                    <div class="hp-bar-bg"><div class="hp-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div></div>
                                </div>
                                <div class="pkmn-hp-text">${hp}/${maxHp}</div>
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
    setupModalNavigation(teamData) {
        this.modalKeyListener = (event) => {
            if (this.isInputActive) return;
            const key = event.key;

            if (this.currentView === 'list') {
                let max = document.querySelectorAll('.pokemon-item').length;
                if (max > 0) {
                    if (key === 'ArrowDown' || key === 's') {
                        this.modalSelection = (this.modalSelection + 1) % max;
                        this.updateModalVisuals();
                    }
                    if (key === 'ArrowUp' || key === 'w') {
                        this.modalSelection = (this.modalSelection - 1 + max) % max;
                        this.updateModalVisuals();
                    }
                }
            }

            // 2. MENU AZIONI (Sostituisci, Summary, Indietro)
            else if (this.currentView === 'inline-actions') {
                let max = 3; // 3 bottoni (Sostituisci, Summary, Indietro)
                if (key === 'ArrowDown' || key === 's') {
                    this.actionSelectionIdx = (this.actionSelectionIdx + 1) % max;
                    this.updateModalVisuals();
                }
                if (key === 'ArrowUp' || key === 'w') {
                    this.actionSelectionIdx = (this.actionSelectionIdx - 1 + max) % max;
                    this.updateModalVisuals();
                }
            }

            // 3. MENU SUMMARY (Pagine e Mosse)
            else if (this.currentView === 'summary') {
                if (this.summaryPage === 1) { // Pagina Mosse
                    let numMoves = document.querySelectorAll('.move-entry').length;
                    if (numMoves > 0) {
                        if (key === 'ArrowDown' || key === 's') {
                            this.moveSelectionIdx = (this.moveSelectionIdx + 1) % numMoves;
                            this.updateModalVisuals();
                        }
                        if (key === 'ArrowUp' || key === 'w') {
                            this.moveSelectionIdx = (this.moveSelectionIdx - 1 + numMoves) % numMoves;
                            this.updateModalVisuals();
                        }
                    }
                }
                // Cambio Pagina con Destra/Sinistra
                if (key === 'ArrowRight' || key === 'd' || key === 'ArrowLeft' || key === 'a') {
                    this.summaryPage = this.summaryPage === 0 ? 1 : 0;
                    this.updateSummaryPage();
                    this.updateModalVisuals();
                }
            }

            // Conferma (Enter)
            if (key === 'Enter' || key === ' ') {
                this.confirmModalSelection(teamData);
            }

            // Indietro (Esc / Backspace)
            if (key === 'Escape' || key === 'Backspace') {
                if (this.currentView === 'inline-actions') {
                    this.currentView = 'list';
                    this.updateModalVisuals();
                } else if (this.currentView === 'summary') {
                    this.cancelModalSelection(); // Torna alla lista
                } else {
                    this.cancelModalSelection(true); // Chiude tutto
                }
            }
        };

        window.addEventListener('keydown', this.modalKeyListener);

        // Supporto Click Mouse
        this.teamModalDom.addListener('click').on('click', (e) => {
            // 1. Click sull'header per switchare le pagine (Statistiche <-> Mosse)
            if (e.target.id === 'summary-page-indicator') {
                this.summaryPage = this.summaryPage === 0 ? 1 : 0;
                this.updateSummaryPage();
                this.updateModalVisuals();
                return;
            }

            // 2. Click su un Pokémon nella lista per aprire i bottoni inline
            let item = e.target.closest('.pokemon-item');
            if (item && this.currentView === 'list') {
                this.modalSelection = parseInt(item.dataset.index);
                this.confirmModalSelection(teamData);
                return;
            }

            // 3. Click sui bottoni inline
            if (e.target.classList.contains('action-btn-inline')) {
                let actionText = e.target.innerText.trim();
                let parentItem = e.target.closest('.pokemon-item');
                this.modalSelection = parseInt(parentItem.dataset.index);

                if (actionText === 'SOSTITUISCI') {
                    this.executeSwitch(this.modalSelection);
                } else if (actionText === 'SUMMARY') {
                    this.openSummary(teamData[this.modalSelection]);
                } else if (actionText === 'INDIETRO') {
                    this.currentView = 'list';
                    this.updateModalVisuals();
                }
                return;
            }

            // 4. Bottone Indietro nel Summary
            if (e.target.id === 'btn-back-to-action') {
                this.cancelModalSelection();
            }
        });
    }
    updateModalVisuals() {
        // 1. Pulizia totale: togliamo 'selected' da ogni possibile elemento
        document.querySelectorAll('.move-entry').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.pokemon-item, .action-btn, .move-entry').forEach(el => {
            el.classList.remove('selected');
        });
        if (this.currentView === 'list' || this.currentView === 'inline-actions') {
            document.querySelectorAll('.pokemon-item').forEach((el, index) => {
                el.classList.remove('selected', 'show-actions');
                el.querySelectorAll('.action-btn-inline').forEach(btn => btn.classList.remove('selected'));

                if (index === this.modalSelection) {
                    el.classList.add('selected');

                    if (this.currentView === 'inline-actions') {
                        el.classList.add('show-actions');
                        let btns = el.querySelectorAll('.action-btn-inline');
                        if (btns[this.actionSelectionIdx]) {
                            btns[this.actionSelectionIdx].classList.add('selected');
                        }
                    }
                }
            });
        }

        // Logica per il SUMMARY (Mosse)
        else if (this.currentView === 'summary' && this.summaryPage === 1) {
            const moves = document.querySelectorAll('.move-entry');
            if (moves[this.moveSelectionIdx]) {
                moves[this.moveSelectionIdx].classList.add('selected');
                // Aggiorna box descrizione (già implementato prima)
                const desc = moves[this.moveSelectionIdx].getAttribute('data-desc');
                const pot = moves[this.moveSelectionIdx].getAttribute('data-pot');
                const prec = moves[this.moveSelectionIdx].getAttribute('data-prec');
                const descBox = document.getElementById('summary-move-desc');
                if (descBox) {
                    descBox.innerHTML = `
                    <div style="flex: 1; padding-right: 15px;">${desc}</div>
                    <div style="width: 120px; text-align: right; border-left: 2px dashed #ff7477; padding-left: 15px; font-size: 1rem; color: #fff;">
                        <div style="margin-bottom: 5px; color: #ffcc00;">POT: <span style="color:#fff;">${pot}</span></div>
                        <div style="color: #ffcc00;">PREC: <span style="color:#fff;">${prec}</span></div>
                    </div>
                `;
                }
            }
        }
    }

    confirmModalSelection(teamData) {
        const items = document.querySelectorAll('.pokemon-item');

        if (this.currentView === 'list') {
            this.currentView = 'inline-actions';
            this.actionSelectionIdx = 0;
            this.updateModalVisuals();
        }
        else if (this.currentView === 'inline-actions') {
            if (this.actionSelectionIdx === 0) { // SOSTITUISCI
                this.executeSwitch(this.modalSelection);
            } else if (this.actionSelectionIdx === 1) { // SUMMARY
                this.openSummary(teamData[this.modalSelection]);
            } else if (this.actionSelectionIdx === 2) { // INDIETRO
                this.currentView = 'list';
                this.updateModalVisuals();
            }
        }
        this.updateModalVisuals();
    }
    cancelModalSelection(forceClose = false) {
        if (forceClose) {
            window.removeEventListener('keydown', this.modalKeyListener);
            if (this.teamModalDom) {
                this.teamModalDom.destroy();
                this.teamModalDom = null;
            }
            this.isInputActive = true;
            if (typeof this.updateMenuSelection === 'function') this.updateMenuSelection();
        } else {
            // Torna alla lista con i bottoni inline aperti
            this.currentView = 'inline-actions';
            document.getElementById('modal-summary-view').style.display = 'none';
            document.getElementById('modal-list-view').style.display = 'block';
            this.updateModalVisuals();
        }
    }

    openSummary(pkmn) {
        this.currentView = 'summary';
        this.summaryPage = 0;
        this.moveSelectionIdx = 0;

        // MODIFICA CRITICA: Nascondiamo la lista, non il vecchio action-view
        document.getElementById('modal-list-view').style.display = 'none';
        document.getElementById('modal-summary-view').style.display = 'flex';

        let localData = (this.pkmnDB && this.pkmnDB[pkmn.nome]) ? this.pkmnDB[pkmn.nome] : null;
        document.getElementById('summary-name').innerText = pkmn.nome.toUpperCase();
        document.getElementById('summary-sprite').src = pkmn.sprite?.normal || localData?.sprite?.normal || '';

        document.getElementById('summary-types').innerHTML = (pkmn.tipi || localData?.tipi || []).map(t =>
            `<div class="type-badge" style="background-color: ${this.getColorForType(t)}">${t.toUpperCase()}</div>`
        ).join('');

        let maxHp = pkmn.maxHp || pkmn.hpMax || (localData ? localData.statistiche.hp.base_stat : 100);
        let stats = pkmn.statistiche || (localData ? {
            attacco: localData.statistiche.attack.base_stat,
            difesa: localData.statistiche.defense.base_stat,
            attaccoSpeciale: localData.statistiche['special-attack'].base_stat,
            difesaSpeciale: localData.statistiche['special-defense'].base_stat,
            velocita: localData.statistiche.speed.base_stat
        } : {});

        document.getElementById('summary-page-0').innerHTML = `
            <div class="stat-row"><span class="stat-label">HP </span><span class="stat-value">${pkmn.hp}/${maxHp}</span></div>
            <div class="stat-row"><span class="stat-label">ATTACCO </span><span class="stat-value">${stats.attacco || 0}</span></div>
            <div class="stat-row"><span class="stat-label">DIFESA </span><span class="stat-value">${stats.difesa || 0}</span></div>
            <div class="stat-row"><span class="stat-label">ATT. SP. </span><span class="stat-value">${stats.attaccoSpeciale || 0}</span></div>
            <div class="stat-row"><span class="stat-label">DIF. SP. </span><span class="stat-value">${stats.difesaSpeciale || 0}</span></div>
            <div class="stat-row"><span class="stat-label">VELOCITÀ </span><span class="stat-value">${stats.velocita || 0}</span></div>
        `;

        let mosseRaw = pkmn.mosse || localData?.mosse || [];
        let movesHtml = `<div class="moves-grid" style="width: 100%;">`;
        mosseRaw.slice(0, 4).forEach((mRaw, i) => {
            let nomeMossa = typeof mRaw === 'object' ? mRaw.Nome : mRaw;
            const m = this.moveDB[nomeMossa] || { Nome: nomeMossa, Tipo: '???', PP: '--', Potenza: '--', Precisione: '--', Descrizione: 'Nessuna descrizione.' };
            const catColor = m.Categoria === "Fisico" ? '#ff7477' : (m.Categoria === "Speciale" ? '#6874e8' : '#aaaaaa');

            movesHtml += `
            <div class="move-entry" id="move-item-${i}" data-desc="${m.Descrizione}" data-pot="${m.Potenza > 0 ? m.Potenza : '--'}" data-prec="${m.Precisione > 0 ? m.Precisione : '--'}">
                <div class="move-name-line">
                    <span>${String(m.Nome).toUpperCase()}</span>
                    <span>PP ${m.PP}/${m.PP}</span>
                </div>
                <div class="move-summary-badges">
                    <span class="badge" style="background:${this.getColorForType(m.Tipo)}">${String(m.Tipo).toUpperCase()}</span>
                    <span class="badge" style="background:${catColor}">${(m.Categoria || '???').toUpperCase()}</span>
                </div>
            </div>`;
        });
        movesHtml += `</div><div class="move-description-box" id="summary-move-desc">Seleziona una mossa...</div>`;

        document.getElementById('summary-page-1').innerHTML = movesHtml;

        this.updateSummaryPage();
        this.updateModalVisuals();
    }
    updateSummaryPage() {
        let ind = document.getElementById('summary-page-indicator');
        ind.innerText = this.summaryPage === 0 ? '◀ INFO E STATISTICHE ▶' : '◀ MOSSE ▶';

        // Correzione dei display: page-0 è grid, page-1 è flex (per accomodare moves-grid e la description-box in colonna)
        document.getElementById('summary-page-0').style.display = this.summaryPage === 0 ? 'grid' : 'none';
        document.getElementById('summary-page-1').style.display = this.summaryPage === 1 ? 'flex' : 'none';

        if (this.summaryPage === 1) {
            document.getElementById('summary-page-1').style.flexDirection = 'column';
        }
    }

    executeSwitch(index) {
        let activeIdx = this.myActiveIdx !== undefined ? this.myActiveIdx : 0;

        // SE IL POKEMON È GIÀ IN CAMPO
        if (index === activeIdx) {
            // 1. Chiudiamo la UI del team
            if (this.teamModalDom) {
                this.teamModalDom.destroy();
                this.teamModalDom = null;
            }
            window.removeEventListener('keydown', this.modalKeyListener);

            // 2. Nascondiamo i bottoni del menu e blocchiamo l'input
            this.isInputActive = false;
            this.btns.forEach(b => b.setVisible(false));

            // 3. Mostriamo il messaggio di errore
            this.logText.setVisible(true);
            this.logText.setText(`${this.pEntity.name.toUpperCase()} è già in campo!`);

            // 4. Aspettiamo 1.5 secondi e ricarichiamo il menu in automatico!
            this.time.delayedCall(1500, () => this.startTurn());
            return;
        }

        // SE IL CAMBIO È VALIDO (Procediamo normalmente)
        if (this.teamModalDom) {
            this.teamModalDom.destroy();
            this.teamModalDom = null;
        }
        window.removeEventListener('keydown', this.modalKeyListener);
        this.btns.forEach(b => b.setVisible(false));
        this.logText.setVisible(true);

        const switchAction = { tipo: 'switch', nuovoIdx: index };

        if (this.isWild) {
            let botMoves = this.eEntity.moves.filter(m => m.ppAttuali > 0);
            let botMove = botMoves.length > 0 ? Phaser.Utils.Array.GetRandom(botMoves) : (this.moveDB["Scontro"] || { Nome: "Scontro" });
            let stato = this.partita.processaTurno(switchAction, { mossa: botMove });
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
    scene: [BootScene, LoginScene, StarterScene, WorldScene, SelectionScene, BattleScene]
};
new Phaser.Game(config);