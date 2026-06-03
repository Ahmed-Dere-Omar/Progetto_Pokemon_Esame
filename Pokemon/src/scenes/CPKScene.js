// src/scenes/CPKScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { InputConfig } from '../tasti_input.js';

export default class CPKScene extends Phaser.Scene {
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

        // Zoom aumentato a 6.5 specifico per riempire il canvas nelle stanze interne
        this.cameras.main.startFollow(this.player, true).setZoom(6.5).setBounds(0, 0, this.mapWidth, this.mapHeight);
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
            // --- NUOVO CONTROLLO RESPONSIVE ---
            let isMobile = window.innerWidth <= 1024;
            container.style.bottom = isMobile ? '22vh' : '20px';
            // ----------------------------------
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
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }
}
