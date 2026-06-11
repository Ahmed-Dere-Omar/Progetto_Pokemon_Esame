// src/scenes/PvPScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { InputConfig } from '../tasti_input.js';

export default class PvPScene extends Phaser.Scene {
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
        // --- FIX DEL VOLUME AL RITORNO DALLA BATTAGLIA (PvP e CPK) ---
        this.events.on('resume', () => {
            this.keys.LEFT.reset(); this.keys.RIGHT.reset();
            this.keys.UP.reset(); this.keys.DOWN.reset();
            this.keys.A.reset(); this.keys.D.reset();
            this.keys.W.reset(); this.keys.S.reset();

            let ms = this.registry.get('musicState');
            let ls = this.registry.get('lobbySound');
            if (ms && ls) {
                ls.setVolume(ms.volume);
                if (ms.isPlaying && !ls.isPlaying) ls.play();
            }
        });
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'mapPvP' });

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

        const serverUrl = 'http://localhost:8081';

        this.socket = window.io(serverUrl);
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
                    // 1. Aggiorniamo subito l'aspetto e l'animazione
                    if (p.avatar && op.texture.key !== p.avatar) op.setTexture(p.avatar);
                    p.anim ? op.anims.play(p.anim, true) : op.anims.stop();

                    // 2. INTERPOLAZIONE: Invece di teletrasportare (setPosition), 
                    // creiamo un movimento fluido che dura quanto il movimento originale (250ms)
                    this.tweens.add({
                        targets: op,
                        x: p.x,
                        y: p.y,
                        duration: 250, // Sincronizzato con il tempo di movimento locale
                        onUpdate: () => {
                            // Aggiorna il nome in tempo reale mentre il giocatore scivola
                            if (op.nameText) op.nameText.setPosition(op.x, op.y - 15);
                        }
                    });
                }
            });
        });

        this.socket.on('challengeReceived', (id) => {
            if (this.pcOpen || this.isDialogActive || this.isTransitioning) {
                // Sei occupato: ignoriamo la sfida così non si corrompono i dati del PC
                return;
            }
            this.socket.emit('acceptChallenge', id);
        });

        this.socket.on('opponentBusy', () => window.showBanner("La persona è in battaglia o occupata e non può essere sfidata ora."));

        this.socket.on('startPvP', (data) => {
            // FIX 2: Se sei nel menu di pausa, chiudilo forzatamente prima di lottare!
            if (this.isPaused) {
                this.isPaused = false;
                if (this.handlePauseKeyDown) {
                    window.removeEventListener('keydown', this.handlePauseKeyDown);
                    this.handlePauseKeyDown = null;
                }
                let existingMenu = document.getElementById('pause-menu-overlay');
                if (existingMenu) existingMenu.remove();
            }

            data.socket = this.socket;
            data.isWild = false;
            this.startEncounter(data, "SFIDA PVP!");
        });
    }

    setupAnimations() {
        const avatars = ['avatar', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];
        avatars.forEach(tex => {
            ['down', 'left', 'right', 'up'].forEach((key, i) => {
                let animKey = tex + '_' + key;
                if (!this.anims.exists(animKey)) {
                    this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(tex, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                }
            });
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

        this.playerNameText = this.createNameTag(startX, startY, info.name);
        this.playerNameText.setDepth(10);

        this.cameras.main.startFollow(this.player, true).setZoom(4.5).setBounds(0, 0, this.mapWidth, this.mapHeight);

        // Forza l'invio dell'avatar al server appena il giocatore spawna
        if (this.socket) {
            this.socket.emit('playerMovement', {
                x: this.player.x,
                y: this.player.y,
                anim: 'down',
                avatar: this.textureKey
            });
        }
    }

    addOtherPlayer(info) {
        let tex = info.avatar || 'avatar';
        let op = this.add.sprite(info.x, info.y, tex);
        op.playerId = info.playerId;
        op.setScale(0.5);
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
        if (Phaser.Input.Keyboard.JustDown(this.keys.CANCEL) && !this.isTransitioning && !this.pcOpen && !this.isDialogActive && !this.isPaused) {
            this.togglePauseMenu();
        }

        if (this.isTransitioning || !this.player || this.isPaused || this.pcOpen || this.isMovingGrid || this.isDialogActive) return;

        const TILE_SIZE = 16;
        let currentAnim = null;
        let dx = 0;
        let dy = 0;

        if (this.keys.LEFT.isDown || this.keys.A.isDown) { dx = -TILE_SIZE; currentAnim = this.textureKey + '_left'; }
        else if (this.keys.RIGHT.isDown || this.keys.D.isDown) { dx = TILE_SIZE; currentAnim = this.textureKey + '_right'; }
        else if (this.keys.UP.isDown || this.keys.W.isDown) { dy = -TILE_SIZE; currentAnim = this.textureKey + '_up'; }
        else if (this.keys.DOWN.isDown || this.keys.S.isDown) { dy = TILE_SIZE; currentAnim = this.textureKey + '_down'; }

        if (dx !== 0 || dy !== 0) {
            let targetX = this.player.x + dx;
            let targetY = this.player.y + dy;

            this.player.anims.play(currentAnim, true);

            let isOutOfBounds = targetX < 0 || targetX >= this.mapWidth || targetY < 0 || targetY >= this.mapHeight;
            let ostacolo = this.wallLayer.getTileAtWorldXY(targetX, targetY, true);
            let isWall = (ostacolo && ostacolo.index !== -1);

            if (!isWall && !isOutOfBounds) {
                this.isMovingGrid = true;
                if (this.socket) this.socket.emit('playerMovement', { x: targetX, y: targetY, anim: currentAnim, avatar: this.textureKey });

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
                        this.player.y += 32;
                        if (this.socket) this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, anim: 'up', avatar: this.textureKey });
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
            let isMobile = window.innerWidth <= 1024;
            choiceContainer.style.bottom = isMobile ? 'calc(22vh + 165px)' : '180px';
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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; width: 100%; max-width: 100vw; padding: 0 20px; box-sizing: border-box; font-size: clamp(1rem, 5vw, 3rem); text-align: center; line-height: 1.4; word-wrap: break-word; word-break: break-word; white-space: normal;">${testo}</h1>`;
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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; width: 100%; max-width: 100vw; padding: 0 20px; box-sizing: border-box; font-size: clamp(1rem, 5vw, 3rem); text-align: center; line-height: 1.4; word-wrap: break-word; word-break: break-word; white-space: normal; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;

            this.scene.stop('PvPScene');
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

            // Svuota la memoria del tasto!
            if (this.keys && this.keys.CANCEL) this.keys.CANCEL.reset();

            if (this.handlePauseKeyDown) {
                window.removeEventListener('keydown', this.handlePauseKeyDown);
                window.removeEventListener('dpad-input', this.handlePauseKeyDown); // Spegne il pad
                this.handlePauseKeyDown = null;
            }
            if (existingMenu) existingMenu.remove();
        } else {
            this.isPaused = true;
            this.player.body.setVelocity(0);
            this.player.anims.stop();

            let overlay = document.createElement('div');
            overlay.id = 'pause-menu-overlay';
            overlay.className = 'pause-overlay';

            // 1. IL TRUCCO DELLE IMMAGINI: Le creiamo una volta sola e non le cancelliamo più!
            overlay.innerHTML = `
                <div class="pause-bg-stack">
                    <div class="pause-bg-layer active-bg" id="bg-menu" style="background-image: url('assets/img_menu1.png');"></div>
                    <div class="pause-bg-layer" id="bg-profile" style="background-image: url('assets/img_menu2.png');"></div>
                    <div class="pause-bg-layer" id="bg-controls" style="background-image: url('assets/img_menu3.png');"></div>
                    <div class="pause-bg-layer" id="bg-music" style="background-image: url('assets/img_menu4.png');"></div>
                </div>
                <div class="pause-card" id="pause-box"></div>
            `;
            document.getElementById('game-container').appendChild(overlay);

            let selectedIdx = 0;
            let currentButtons = [];

            const updateSelection = () => {
                if (overlay.inSubMenu) return;
                currentButtons.forEach((btnId, idx) => {
                    let btn = document.getElementById(btnId);
                    if (btn) {
                        if (idx === selectedIdx) btn.classList.add('selected');
                        else btn.classList.remove('selected');
                    }
                });
            };

            const setBgLayer = (activeId) => {
                ['bg-menu', 'bg-profile', 'bg-controls', 'bg-music'].forEach(id => {
                    let el = document.getElementById(id);
                    if (el) el.classList.remove('active-bg');
                });
                let activeEl = document.getElementById(activeId);
                if (activeEl) activeEl.classList.add('active-bg');
            };

            // 2. RENDER MAIN PAUSE ora aggiorna SOLO i bottoni, attivando fluidamente la transition
            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'music-btn', 'lobby-btn']; // <-- LOBBY BTN

                let box = document.getElementById('pause-box');
                if (box) {
                    box.innerHTML = `
                        <h2 class="pause-title">CENTRO PVP NEOMON</h2>
                        <button id="profile-btn" class="pause-btn"><span class="pause-btn-icon"></span>PROFILO</button>
                        <button id="controls-btn" class="pause-btn"><span class="pause-btn-icon"></span>COMANDI</button>
                        <button id="music-btn" class="pause-btn"><span class="pause-btn-icon"></span>MUSICA</button>
                        <button id="lobby-btn" class="pause-btn"><span class="pause-btn-icon"></span>TORNA ALLA LOBBY</button> 
                        <p class="pause-footer">// PREMI ESC PER TORNARE AL GIOCO</p>
                    `;
                }
                updateSelection();
                setBgLayer('bg-menu'); // Forza la transizione al menu base
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;
                let box = document.getElementById('pause-box');
                if (box) {
                    box.innerHTML = `
                        <h2 class="pause-title">COMANDI</h2>
                        <div class="pause-info-panel">
                            <div class="info-section">
                                <h3>MOVIMENTO</h3>
                                <p><strong>PC:</strong> WASD / Frecce</p>
                                <p><strong>Mobile:</strong> D-Pad (▲▼◀▶)</p>
                            </div>
                            <div class="info-section">
                                <h3>AZIONI</h3>
                                <p><strong>PC:</strong> INVIO (A) / ESC (B)</p>
                                <p><strong>Mobile:</strong> Pulsante A / B</p>
                            </div>
                            <div class="info-section">
                                <h3>IN BATTAGLIA</h3>
                                <p><strong>PC:</strong> SHIFT (Stats)</p>
                                <p><strong>Mobile:</strong> Pulsante SHIFT</p>
                            </div>
                            <div class="info-section">
                                <h3>MENU PAUSA</h3>
                                <p><strong>PC:</strong> ESC (Apri/Chiudi)</p>
                                <p><strong>Mobile:</strong> ☰ MENU (Pausa)</p>
                            </div>
                            <div class="info-section">
                                <h3>GENERICI</h3>
                                <p><strong>PC & Mobile:</strong> Mouse / Touch per UI e dialoghi</p>
                            </div>
                        </div>
                        <button id="back-pause-btn" class="pause-back-btn">INDIETRO</button>
                    `;
                }
            };

            const renderMusicMenu = () => {
                overlay.inSubMenu = true;
                let lobbyTracks = this.registry.get('lobbyTracks') || [];
                let musicState = this.registry.get('musicState') || { currentTrackIndex: 0, volume: 0.5, isPlaying: false, isLooping: false };
                let currentTrack = lobbyTracks[musicState.currentTrackIndex] || { name: 'Nessuna traccia' };
                let lobbySound = this.registry.get('lobbySound');
                let isActuallyPlaying = lobbySound && lobbySound.isPlaying;

                let box = document.getElementById('pause-box');
                if (box) {
                    box.innerHTML = `
                        <h2 class="pause-title">MUSICA</h2>
                        <div class="music-player-card">
                            <div class="music-track-label">IN RIPRODUZIONE</div>
                            <div class="music-track-name" id="music-track-name">${currentTrack.name}</div>
                            <div class="music-controls">
                                <button class="music-btn" id="music-loop" style="${musicState.isLooping ? 'color: var(--ab-cyan); border-color: var(--ab-cyan); box-shadow: 0 0 10px rgba(0,240,255,0.3);' : ''}">🔁</button>
                                <button class="music-btn" id="music-prev">⏮</button>
                                <button class="music-btn music-btn-play" id="music-play">${isActuallyPlaying ? '⏸' : '▶'}</button>
                                <button class="music-btn" id="music-next">⏭</button>
                            </div>
                            <div class="music-volume-wrap">
                                <span class="music-volume-icon">🔉</span>
                                <input type="range" min="0" max="100" value="${Math.round(musicState.volume * 100)}" class="music-volume-slider" id="music-volume">
                                <span class="music-volume-val" id="music-vol-val">${Math.round(musicState.volume * 100)}%</span>
                            </div>
                        </div>
                        <button id="back-pause-btn" class="pause-back-btn">INDIETRO</button>
                    `;

                    let volSlider = document.getElementById('music-volume');
                    if (volSlider) {
                        volSlider.addEventListener('input', (ev) => {
                            let val = parseInt(ev.target.value) / 100;
                            let ms = this.registry.get('musicState');
                            ms.volume = val;
                            let ls = this.registry.get('lobbySound');
                            if (ls) ls.setVolume(val);
                            let volLabel = document.getElementById('music-vol-val');
                            if (volLabel) volLabel.innerText = Math.round(val * 100) + '%';
                        });

                        volSlider.addEventListener('change', async (ev) => {
                            let val = parseInt(ev.target.value) / 100;
                            let profilo = this.registry.get('playerProfile');
                            profilo.volume = val;

                            const { error } = await supabaseClient.from('profilo')
                                .update({ volume: val })
                                .eq('id_profilo', profilo.id_profilo);

                            if (error) console.error("Errore salvataggio volume DB:", error);
                        });
                    }
                }
            };

            const switchTrack = (direction) => {
                let lobbyTracks = this.registry.get('lobbyTracks') || [];
                let musicState = this.registry.get('musicState');
                let lobbySound = this.registry.get('lobbySound');
                if (!lobbyTracks.length) return;

                if (lobbySound) { lobbySound.stop(); lobbySound.destroy(); }

                musicState.currentTrackIndex = (musicState.currentTrackIndex + direction + lobbyTracks.length) % lobbyTracks.length;
                let track = lobbyTracks[musicState.currentTrackIndex];

                let newSound = this.sound.add(track.key, { loop: musicState.isLooping, volume: musicState.volume });

                newSound.on('complete', () => {
                    let ms = this.registry.get('musicState');
                    let lt = this.registry.get('lobbyTracks');
                    ms.currentTrackIndex = (ms.currentTrackIndex + 1) % lt.length;
                    switchTrack(0);
                });
                newSound.play();
                musicState.isPlaying = true;
                this.registry.set('lobbySound', newSound);

                let nameEl = document.getElementById('music-track-name');
                if (nameEl) nameEl.innerText = track.name;
                let playBtn = document.getElementById('music-play');
                if (playBtn) playBtn.innerText = '⏸';
            };

            // Inizializza il menu base al primo avvio
            renderMainPause();

            this.handlePauseKeyDown = (e) => {
                let key = e.key || (e.detail && e.detail.key);
                if (!key) return;

                // Anti-skip per il joystick
                if (!this.lastPauseNavTime) this.lastPauseNavTime = 0;
                if (Date.now() - this.lastPauseNavTime < 150) return;
                this.lastPauseNavTime = Date.now();

                // Tasto DELETE/ESC/BACKSPACE per chiudere o tornare indietro
                if (key === 'Escape' || key === 'Backspace' || key === 'Delete') {
                    if (overlay.inSubMenu) {
                        let btn = document.getElementById('back-pause-btn');
                        if (btn) btn.click();
                    } else {
                        this.togglePauseMenu(); // Chiude tutto il menu!
                    }
                    return;
                }

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
                    // Cliccare il bottone INDIETRO
                    if (key === 'Enter' || key === ' ') {
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
            window.addEventListener('dpad-input', this.handlePauseKeyDown); // PAD MOBILE

            overlay.addEventListener('click', async (e) => {
                if (e.target.id === 'lobby-btn') {
                    e.target.innerText = "USCITA...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) {
                        window.removeEventListener('keydown', this.handlePauseKeyDown);
                        window.removeEventListener('dpad-input', this.handlePauseKeyDown);
                    }
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();
                    this.tornaAllaLobby(); // <-- Richiama la funzione di uscita del Centro!
                } else if (e.target.id === 'controls-btn') {
                    setBgLayer('bg-controls');
                    renderControls();
                } else if (e.target.id === 'music-btn') {
                    setBgLayer('bg-music');
                    renderMusicMenu();
                } else if (e.target.id === 'music-loop') {
                    let ms = this.registry.get('musicState');
                    ms.isLooping = !ms.isLooping;

                    let ls = this.registry.get('lobbySound');
                    if (ls) ls.setLoop(ms.isLooping);

                    if (ms.isLooping) {
                        e.target.style.color = 'var(--ab-cyan)';
                        e.target.style.borderColor = 'var(--ab-cyan)';
                        e.target.style.boxShadow = '0 0 10px rgba(0,240,255,0.3)';
                    } else {
                        e.target.style.color = 'var(--ab-paper)';
                        e.target.style.borderColor = 'var(--ab-border)';
                        e.target.style.boxShadow = 'none';
                    }
                } else if (e.target.id === 'music-play') {
                    let lobbySound = this.registry.get('lobbySound');
                    let musicState = this.registry.get('musicState');
                    if (lobbySound) {
                        if (lobbySound.isPlaying) {
                            lobbySound.pause();
                            musicState.isPlaying = false;
                            e.target.innerText = '▶';
                        } else {
                            lobbySound.resume();
                            musicState.isPlaying = true;
                            e.target.innerText = '⏸';
                        }
                    } else {
                        this.inizializzaMusicaLobby();
                        e.target.innerText = '⏸';
                    }
                } else if (e.target.id === 'music-prev') {
                    switchTrack(-1);
                } else if (e.target.id === 'music-next') {
                    switchTrack(1);
                } else if (e.target.id === 'profile-btn') {
                    setBgLayer('bg-profile');
                    overlay.inSubMenu = true;
                    let profilo = this.registry.get('playerProfile');
                    let winRate = profilo.partite_totali > 0 ? ((profilo.vittorie_totali / profilo.partite_totali) * 100).toFixed(1) : 0;
                    let box = document.getElementById('pause-box');
                    let avatarNum = profilo.avatar_sprite || 1;
                    let currentAvatarPath = avatarNum == 1 ? 'assets/avatar.png' : `assets/avatar${avatarNum}.png`;

                    if (box) {
                        box.innerHTML = `
                            <h2 class="pause-title">PROFILO</h2>
                            <div class="pause-profile-panel">
                                <p><strong>NOME:</strong> ${profilo.username || 'Sconosciuto'}</p>
                                <p><strong>VITTORIE:</strong> ${profilo.vittorie_totali || 0}</p>
                                <p><strong>PARTITE:</strong> ${profilo.partite_totali || 0}</p>
                                <p><strong>VITTORIE %:</strong> ${winRate}%</p>
                                <div class="avatar-selector">
                                    <button id="prev-avatar" class="avatar-nav-btn">&lt;</button>
                                    <div style="width: 32px; height: 32px; overflow: hidden; position: relative; transform: scale(2); margin: 0 15px; image-rendering: pixelated;">
                                        <img id="profile-avatar" src="${currentAvatarPath}" style="position: absolute; top: 0; left: 0; width: 400%; height: 400%; max-width: none;">
                                    </div>
                                    <button id="next-avatar" class="avatar-nav-btn">&gt;</button>
                                </div>
                            </div>
                            <button id="back-pause-btn" class="pause-back-btn">INDIETRO</button>
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

                    const { error } = await supabaseClient.from('profilo')
                        .update({ avatar_sprite: numberToSave })
                        .eq('id_profilo', profilo.id_profilo);

                    if (error) {
                        console.error("Errore Supabase Avatar:", error);
                        window.showBanner("Errore nel salvataggio dell'avatar!");
                    }

                    let textureKey = newAvatarPath.split('/').pop().replace('.png', '');
                    if (this.player) {
                        this.player.setTexture(textureKey);
                        this.textureKey = textureKey;

                        ['down', 'left', 'right', 'up'].forEach(key => { if (this.anims.exists(key)) this.anims.remove(key); });
                        ['down', 'left', 'right', 'up'].forEach((key, i) => {
                            this.anims.create({ key, frames: this.anims.generateFrameNumbers(this.textureKey, { start: i * 4, end: i * 4 + 3 }), frameRate: 10, repeat: -1 });
                        });
                        if (this.socket) {
                            this.socket.emit('playerMovement', {
                                x: this.player.x,
                                y: this.player.y,
                                anim: 'down',
                                avatar: this.textureKey
                            });
                        }
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause(); // Questo ora lancia in automatico la transizione inversa!
                }
            });
        }
    }
    createDialogUI() {
        let container = document.getElementById('dialog-ui-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dialog-ui-container';
            container.style.position = 'absolute';
            let isMobile = window.innerWidth <= 1024;
            container.style.bottom = isMobile ? '22vh' : '20px';
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
