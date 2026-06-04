// src/scenes/WorldScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { InputConfig } from '../tasti_input.js';

export default class WorldScene extends Phaser.Scene {
    constructor() { super({ key: 'WorldScene' }); }
    init(data) {
        this.myPlayerName = data.name;
        this.vengoDa = data.vengoDa;
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
        this.setupAnimations();
        this.setupNPCs();
        this.setupPlayer();

        this.keys = this.input.keyboard.addKeys(InputConfig);
        this.isPaused = false;
        this.pauseMenuDom = null;
        this.pcOpen = false;
        this.isDialogActive = false;

        this.canEncounter = true;
        this.isTransitioning = false;

        this.inizializzaMusicaLobby();

        this.events.on('resume', () => {
            this.keys.LEFT.reset(); this.keys.RIGHT.reset();
            this.keys.UP.reset(); this.keys.DOWN.reset();
            this.keys.A.reset(); this.keys.D.reset();
            this.keys.W.reset(); this.keys.S.reset();
            this.canEncounter = false;
            setTimeout(() => { this.canEncounter = true; }, 1500);
            this.registry.set('lastBattleResult', null);

            // --- FIX DEL VOLUME AL RITORNO DALLA BATTAGLIA ---
            let ms = this.registry.get('musicState');
            let ls = this.registry.get('lobbySound');
            if (ms && ls) {
                ls.setVolume(ms.volume);
                if (ms.isPlaying && !ls.isPlaying) ls.play();
            }
        });
    }

    setupMap() {
        const map = this.make.tilemap({ key: 'map' });

        const tilesetA = map.addTilesetImage('a', 'tilesA', 16, 16, 1, 1);
        const tilesetB = map.addTilesetImage('e', 'tilesE', 16, 16, 0, 0);
        const tilesetC = map.addTilesetImage('c', 'tilesC', 16, 16, 1, 1);
        const tilesetD = map.addTilesetImage('d', 'tilesD', 16, 16, 1, 1);

        const allTilesets = [tilesetA, tilesetB, tilesetC, tilesetD];

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
            let profilo = this.registry.get('playerProfile');
            let hasSave = false;
            let savedLevel = 1;

            const { data, error } = await supabaseClient.from('profilo').select('id_mappa').eq('id_profilo', profilo.id_profilo).single();
            if (error) {
                console.warn("Nessun salvataggio trovato o colonna mancante sul DB:", error.message);
            } else if (data && data.id_mappa && data.id_mappa.startsWith('mappa_pve')) {
                hasSave = true;
                let parts = data.id_mappa.split('_');
                if (parts.length === 3) savedLevel = parseInt(parts[2]) || 1;
            }

            this.createDialogUI();

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
            choiceContainer.style.bottom = '180px';
            choiceContainer.style.left = '65%';
            choiceContainer.style.transform = 'translateX(-50%)';
            choiceContainer.style.right = 'auto';
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
            "Vuoi testare le tue abilità con una battaglia tutorial?"
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

        this.mostraTestiDialogo(["Vuoi entrare nell'Arena PvP?"], () => {
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
            this.scene.start('PVEScene', { name: this.myPlayerName, user: this.registry.get('playerProfile'), level: levelToLoad });
        }, 1000);
    }

    inizializzaMusicaLobby() {
        try {
            let lobbyTracks = this.registry.get('lobbyTracks');
            let musicState = this.registry.get('musicState');
            if (!lobbyTracks || lobbyTracks.length === 0) return;

            let existingSound = this.registry.get('lobbySound');
            if (existingSound && !existingSound.pendingRemove) {
                if (!existingSound.isPlaying && !existingSound.isPaused) {
                    existingSound.play();
                    musicState.isPlaying = true;
                }
                return;
            }

            let trackIdx = musicState.currentTrackIndex || 0;
            let track = lobbyTracks[trackIdx];
            // Applica il loop dal db se presente
            let sound = this.sound.add(track.key, { loop: musicState.isLooping, volume: musicState.volume });

            sound.on('complete', () => {
                let ms = this.registry.get('musicState');
                let lt = this.registry.get('lobbyTracks');
                ms.currentTrackIndex = (ms.currentTrackIndex + 1) % lt.length;
                let nextTrack = lt[ms.currentTrackIndex];
                let newSound = this.sound.add(nextTrack.key, { loop: ms.isLooping, volume: ms.volume });
                newSound.on('complete', sound._events.complete.fn);
                newSound.play();
                this.registry.set('lobbySound', newSound);
            });

            sound.play();
            musicState.isPlaying = true;
            this.registry.set('lobbySound', sound);
        } catch (e) {
            console.warn('Errore inizializzazione musica lobby:', e);
        }
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
            overlay.className = 'pause-overlay';

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

            const renderMainPause = () => {
                overlay.inSubMenu = false;
                selectedIdx = 0;
                currentButtons = ['profile-btn', 'controls-btn', 'music-btn', 'logout-btn'];

                let box = document.getElementById('pause-box');
                if (box) {
                    box.innerHTML = `
                        <h2 class="pause-title">MENU PAUSA</h2>
                        <button id="profile-btn" class="pause-btn"><span class="pause-btn-icon"></span>PROFILO</button>
                        <button id="controls-btn" class="pause-btn"><span class="pause-btn-icon"></span>COMANDI</button>
                        <button id="music-btn" class="pause-btn"><span class="pause-btn-icon"></span>MUSICA</button>
                        <button id="logout-btn" class="pause-btn"><span class="pause-btn-icon"></span>ESCI DAL GIOCO</button>
                        <p class="pause-footer">// PREMI ESC PER TORNARE AL GIOCO</p>
                    `;
                }
                updateSelection();
                setBgLayer('bg-menu');
            };

            overlay.renderMainPause = renderMainPause;

            const renderControls = () => {
                overlay.inSubMenu = true;
                let box = document.getElementById('pause-box');
                if (box) {
                    box.innerHTML = `
                        <h2 class="pause-title">COMANDI</h2>
                        <div class="pause-info-panel">
                            <div class="info-section"><h3>MOVIMENTO</h3><p><strong>WASD</strong> o <strong>Frecce Direzionali</strong></p></div>
                            <div class="info-section"><h3>AZIONI</h3><p><strong>Conferma:</strong> INVIO</p><p><strong>Annulla / Indietro:</strong> ESC</p></div>
                            <div class="info-section"><h3>IN BATTAGLIA</h3><p><strong>Statistiche:</strong> SHIFT</p></div>
                            <div class="info-section"><h3>GENERICI</h3><p><strong>Mouse / Touch:</strong> Interfaccia UI e Dialoghi</p></div>
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

            renderMainPause();

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
                    if (key === 'Enter' || key === ' ' || key === 'Backspace') {
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

                    // 1. Disconnette da Supabase
                    await supabaseClient.auth.signOut();

                    // 2. Spegne la musica
                    let ls = this.registry.get('lobbySound');
                    if (ls) { ls.stop(); ls.destroy(); }

                    // 3. Rimuove il menu
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();

                    // 4. Pulisce la memoria del giocatore corrente e torna al Login Istananeamente!
                    this.registry.set('playerProfile', null);
                    this.registry.set('userPokemon', null);

                    this.scene.stop(); // Ferma la scena corrente
                    this.scene.start('LoginScene'); // Torna al login in 0.1 secondi
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
                    }
                } else if (e.target.id === 'back-pause-btn') {
                    renderMainPause();
                }
            });
        }
    }

    // ... METODI APRI PC E BATTLES NON TOCCATI ...
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
            
            .pc-grid-box { grid-template-columns: repeat(6, 1fr); }

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

            battleData.parentScene = 'WorldScene';
            this.scene.launch('BattleScene', battleData);
        }, 2000);
    }
}