// src/scenes/LoginScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { isTouchDevice, multiTabChannel, showBanner } from '../utils/helpers.js';

export default class LoginScene extends Phaser.Scene {
    constructor() { super({ key: 'LoginScene' }); }

    create() {
        let mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) mobileControls.style.display = 'none';
        this.input.keyboard.clearCaptures();
        this.isLoginMode = true;
        this.isStarting = false;
        this.authEventBlocked = false;
        this.isWaitingForReset = false;

        const html = `
            <div id="login-container">
                <h1 class="text-shadows" style="font-size: 5rem; margin-bottom: 0;">NEOMON</h1>
                <p class="login-subtitle">Multiplayer</p>
                
                <div class="login-card" id="form-box">
                    <div class="login-input-wrapper" id="username-wrapper" style="display: none;">
                        <input type="text" id="username-input" class="login-input" placeholder="NICKNAME..." autocomplete="off">
                    </div>
                    
                    <div class="login-input-wrapper">
                        <input type="email" id="email-input" class="login-input" placeholder="EMAIL..." autocomplete="off">
                    </div>
                    
                    <div class="login-input-wrapper">
                        <input type="password" id="password-input" class="login-input" placeholder="PASSWORD...">
                    </div>
                    
                    <p id="forgot-btn" class="login-forgot">Hai dimenticato la password?</p>

                    <button id="main-btn" class="login-btn-primary">ACCEDI</button>
                    
                    <button id="google-btn" class="login-btn-google">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"> ACCEDI CON GOOGLE
                    </button>

                    <p id="toggle-mode" class="login-toggle">Nuovo allenatore? Registrati</p>
                    
                    <p id="auth-msg" class="login-msg"></p>
                </div>
            </div>`;

        let dom = this.add.dom(500, 400).createFromHTML(html);

        setTimeout(() => {
            ['email-input', 'password-input', 'username-input'].forEach(id => {
                let el = dom.getChildByID(id);
                if (el) {
                    el.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            let mainBtn = dom.getChildByID('main-btn');
                            if (mainBtn) mainBtn.click();
                        }
                    });
                }
            });
        }, 100);

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

            if (e.target.id === 'forgot-btn') {
                this.apriModaleForgot(dom);
                return;
            }

            if (e.target.id === 'google-btn' || e.target.parentElement.id === 'google-btn') {
                this.isWaitingForReset = false;
                msgLabel.innerText = "Reindirizzamento a Google...";
                await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
                return;
            }

            if (e.target.id === 'toggle-mode') {
                this.isWaitingForReset = false;
                this.isLoginMode = !this.isLoginMode;
                dom.getChildByID('username-wrapper').style.display = this.isLoginMode ? 'none' : 'block';
                dom.getChildByID('forgot-btn').style.display = this.isLoginMode ? 'block' : 'none';

                let btn = dom.getChildByID('main-btn');
                btn.innerText = this.isLoginMode ? 'ACCEDI' : 'REGISTRATI';
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
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: emailInput, password: password, options: { data: { username: username } }
                    });

                    if (error) {
                        msgLabel.innerText = "Errore: " + error.message;
                    } else {
                        if (data.session) {
                            msgLabel.innerText = "Registrazione OK! Accesso in corso...";
                            this.mostraTestoCaricamento();
                            this.avviaGioco(data.session.user, dom);
                        } else {
                            msgLabel.innerText = "Account creato! Clicca il link nella tua email.";
                            dom.getChildByID('toggle-mode').click();
                        }
                    }
                } else {
                    const { error } = await supabaseClient.auth.signInWithPassword({ email: emailInput, password: password });
                    if (error) {
                        if (error.message.includes('Email not confirmed')) {
                            msgLabel.innerText = "Devi confermare l'email! Controlla la posta.";
                        } else {
                            msgLabel.innerText = "Errore: Credenziali errate.";
                        }
                    }
                }
            }
        });
    }

    apriModaleForgot(dom) {
        let existing = document.getElementById('forgot-modal-root');
        if (existing) existing.remove();

        let modalOverlay = document.createElement('div');
        modalOverlay.id = 'forgot-modal-root';
        modalOverlay.className = 'forgot-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="forgot-modal-card">
                <button class="forgot-modal-close" id="forgot-close-btn">✕</button>
                <div class="forgot-modal-title">Recupera Password</div>
                <div class="forgot-modal-desc">Inserisci la tua email e ti invieremo un link per reimpostare la password.</div>
                <div class="login-input-wrapper" style="width: 100%;">
                    <input type="email" id="forgot-email-input" class="login-input" placeholder="LA TUA EMAIL..." autocomplete="off">
                </div>
                <button id="forgot-send-btn" class="forgot-modal-btn">RICEVI LINK</button>
                <p id="forgot-msg" class="forgot-modal-msg"></p>
            </div>
        `;

        document.getElementById('game-container').appendChild(modalOverlay);

        let forgotEmailEl = document.getElementById('forgot-email-input');
        if (forgotEmailEl) {
            forgotEmailEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('forgot-send-btn').click();
                }
            });
            forgotEmailEl.focus();
        }

        document.getElementById('forgot-close-btn').addEventListener('click', () => {
            modalOverlay.remove();
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        });

        document.getElementById('forgot-send-btn').addEventListener('click', async () => {
            let emailVal = document.getElementById('forgot-email-input').value.trim();
            let msgEl = document.getElementById('forgot-msg');
            let sendBtn = document.getElementById('forgot-send-btn');

            if (!emailVal) { msgEl.innerText = "Inserisci la tua email!"; return; }
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(emailVal)) { msgEl.innerText = "Formato email non valido!"; return; }

            this.isWaitingForReset = true;
            msgEl.innerText = "Verifica account...";
            sendBtn.disabled = true;

            const { error } = await supabaseClient.auth.resetPasswordForEmail(emailVal);

            if (error) {
                if (error.message.includes('rate limit')) msgEl.innerText = "Troppi tentativi. Riprova tra un'ora!";
                else if (error.message.includes('not found') || error.message.includes('User not')) msgEl.innerText = "Nessun allenatore trovato con questa email.";
                else msgEl.innerText = "Errore: " + error.message;
            } else {
                msgEl.innerText = "Se l'email esiste, riceverai un link a breve!";
            }
            setTimeout(() => { sendBtn.disabled = false; }, 3000);
        });
    }

    mostraTestoCaricamento() {
        let container = document.getElementById('login-container');
        if (container) {
            container.innerHTML = `
                <h1 class="text-shadows" style="font-size: 5rem; margin-bottom: 0;">NEOMON</h1>
                <p class="login-subtitle" style="margin-bottom: 30px;">Multiplayer</p>
                <p style="font-family: 'Outfit', 'Courier New', monospace; font-size: 1.1rem; color: var(--ab-cyan); font-weight: 800; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,240,255,0.3);">ACCESSO IN CORSO...</p>
            `;
        }
    }

    mostraSchermataRecupero(dom) {
        let container = document.getElementById('login-container');
        container.innerHTML = `
            <h1 class="text-shadows" style="font-size: 4rem; margin-bottom: 0;">RECUPERO</h1>
            <p class="login-subtitle" style="margin-bottom: 20px;">Password</p>
            <div class="login-card" style="margin-top: 10px;">
                <p style="font-family: 'Outfit', 'Courier New', monospace; font-size: 0.92rem; color: var(--ab-text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;">NUOVA PASSWORD:</p>
                <div class="login-input-wrapper" style="width: 100%;">
                    <input type="password" id="new-password-input" class="login-input" placeholder="NUOVA PASSWORD..." autocomplete="off">
                </div>
                <button id="save-pwd-btn" class="login-btn-primary" style="margin-top: 15px;">SALVA</button>
                <p id="pwd-msg" class="login-msg"></p>
            </div>
        `;

        let newPwdInput = document.getElementById('new-password-input');
        if (newPwdInput) {
            newPwdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('save-pwd-btn').click();
                }
            });
        }

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

                window.history.replaceState(null, null, window.location.pathname);
                window.isRecoveryLink = false;

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

        let profiloUtente = null;
        for (let i = 0; i < 5; i++) {
            const { data: profile } = await supabaseClient.from('profilo').select('*').eq('id_utente', user.id).single();
            if (profile) { profiloUtente = profile; break; }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!profiloUtente) {
            showBanner("Errore nel caricamento del profilo. Riprova.");
            return;
        }
        
        this.registry.set('playerProfile', profiloUtente);

        // --- INIZIALIZZAZIONE VOLUME DA DATABASE ---
        let dbVolume = profiloUtente.volume !== undefined ? profiloUtente.volume : 0.5;
        this.registry.set('musicState', { 
            currentTrackIndex: 0, 
            volume: dbVolume, 
            isPlaying: false,
            isLooping: false // Stato del Loop impostato di base su false
        });

        let { data: myPokemon } = await supabaseClient
            .from('pokemon')
            .select('*')
            .eq('id_profilo_proprietario', profiloUtente.id_profilo)
            .order('posizione_slot', { ascending: true });

        let isNewPlayer = (!myPokemon || myPokemon.length === 0);

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

        let haNickname = profiloUtente.username && profiloUtente.username.trim() !== "";
        let isGoogle = user.app_metadata && user.app_metadata.provider === 'google';

        if (!haNickname || (isNewPlayer && isGoogle)) {
            this.mostraSceltaNickname(user, profiloUtente, myPokemon, dom, isNewPlayer);
        } else {
            let nomeFinal = profiloUtente.username.toUpperCase();

            if (isTouchDevice() || window.innerWidth <= 1024) {
                let controls = document.getElementById('mobile-controls');
                if (controls) controls.style.display = 'flex';
            }

            setTimeout(() => {
                if (dom) dom.destroy();
                if (isNewPlayer) {
                    this.scene.start('StarterScene', { name: nomeFinal, user: user, starters: myPokemon });
                } else {
                    this.scene.start('WorldScene', { name: nomeFinal, user: user });
                }
            }, 200);
        }
    }

    async mostraSceltaNickname(user, profilo, pkmnList, dom, isNewPlayer) {
        if (dom) dom.destroy();

        let currentName = (profilo.username && profilo.username.trim() !== "") ? profilo.username : "";

        let nameHtml = `
            <div id="login-container">
                <h1 class="text-shadows" style="font-size: 3rem; margin-bottom: 0;">BENVENUTO!</h1>
                <p class="login-subtitle" style="margin-bottom: 15px;">Allenatore</p>
                <div class="login-card">
                    <p style="font-family: 'Outfit', 'Courier New', monospace; font-size: 0.92rem; color: var(--ab-text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;">SCEGLI IL TUO NICKNAME:</p>
                    <div class="login-input-wrapper" style="width: 100%;">
                        <input type="text" id="new-username" class="login-input" value="${currentName}" placeholder="NICKNAME...">
                    </div>
                    <button id="save-name-btn" class="login-btn-primary">CONFERMA</button>
                    <p id="name-msg" class="login-msg"></p>
                </div>
            </div>`;

        let nameDom = this.add.dom(500, 400).createFromHTML(nameHtml);

        setTimeout(() => {
            let nameInput = nameDom.getChildByID('new-username');
            if (nameInput) {
                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        let saveBtn = nameDom.getChildByID('save-name-btn');
                        if (saveBtn) saveBtn.click();
                    }
                });
            }
        }, 100);

        nameDom.addListener('click').on('click', async (e) => {
            if (e.target.id === 'save-name-btn') {
                let newName = nameDom.getChildByID('new-username').value.trim();
                if (!newName) {
                    nameDom.getChildByID('name-msg').innerText = "Devi inserire un nome!";
                    return;
                }

                nameDom.getChildByID('name-msg').innerText = "Verifica nome in corso...";

                const { error } = await supabaseClient.from('profilo').update({ username: newName }).eq('id_profilo', profilo.id_profilo);

                if (error) {
                    nameDom.getChildByID('name-msg').innerText = "Nome già in uso, scegline un altro!";
                } else {
                    profilo.username = newName;
                    this.registry.set('playerProfile', profilo);
                    nameDom.destroy();

                    if (isTouchDevice() || window.innerWidth <= 1024) {
                        let controls = document.getElementById('mobile-controls');
                        if (controls) controls.style.display = 'flex';
                    }

                    if (isNewPlayer) {
                        this.scene.start('StarterScene', { name: newName.toUpperCase(), user: user, starters: pkmnList });
                    } else {
                        this.scene.start('WorldScene', { name: newName.toUpperCase(), user: user });
                    }
                }
            }
        });
    }
}