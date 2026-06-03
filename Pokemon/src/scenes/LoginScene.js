// src/scenes/LoginScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { isTouchDevice, multiTabChannel, showBanner } from '../utils/helpers.js';

export default class LoginScene extends Phaser.Scene {
    constructor() { super({ key: 'LoginScene' }); }

    create() {
        this.isLoginMode = true;
        this.isStarting = false;
        this.authEventBlocked = false;
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
                if (!emailInput) { msgLabel.innerText = "Inserisci l'email qui sopra per recuperarla!"; return; }
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(emailInput)) { msgLabel.innerText = "Formato email non valido!"; return; }

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
                <h2 style="font-size: 1.5rem; color: #fff; font-family: 'Courier New'; text-align: center;">Scegli il tuo Nickname da Allenatore:</h2>
                <input type="text" id="new-username" value="${currentName}" placeholder="NICKNAME..." style="width: 300px; padding: 15px; font-size: 1.2rem; font-family: 'Courier New', monospace; font-weight: bold; text-align: center; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; outline: none; margin-top: 20px;">
                <button id="save-name-btn" style="width: 338px; padding: 15px; margin-top: 20px; font-size: 1.5rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 4px 4px 0 #e69597;">CONFERMA</button>
                <p id="name-msg" style="color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 10px;"></p>
            </div>`;

        let nameDom = this.add.dom(500, 400).createFromHTML(nameHtml);

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
