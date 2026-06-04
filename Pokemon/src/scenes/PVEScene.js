// src/scenes/PVEScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { InputConfig } from '../tasti_input.js';

export default class PVEScene extends Phaser.Scene {
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
                this.mostraTestiDialogo(["I tuoi PokÃ©mon sono esausti...", "Hai perso la run! Tornerai alla Lobby. ▼"], () => {
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
            // --- FIX DEL VOLUME AL RITORNO DALLA BATTAGLIA (PVEScene) ---
            let ms = this.registry.get('musicState');
            let ls = this.registry.get('lobbySound');
            if (ms && ls) {
                ls.setVolume(ms.volume);
                if (ms.isPlaying && !ls.isPlaying) ls.play();
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
            npcPositions = [{ x: 150, y: 300 }, { x: 100, y: 200 }, { x: 180, y: 100 }];
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
        let nextLevel = this.currentLevel + 1;
        let mappaDaSalvare = `mappa_pve_${nextLevel}`;

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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">CARICAMENTO LIVELLO ${nextLevel}...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        try {
            let profilo = this.registry.get('playerProfile');
            supabaseClient.from('profilo').update({ id_mappa: mappaDaSalvare }).eq('id_profilo', profilo.id_profilo).then(({ error }) => {
                if (!error) profilo.id_mappa = mappaDaSalvare;
            });
        } catch (e) { }

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.scene.start('PVEScene', { name: this.myPlayerName, user: this.user, level: nextLevel });
        }, 1000);
    }

    gestisciDialogoNPC(npc) {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.createDialogUI();

        if (npc.isDefeated) {
            this.mostraTestiDialogo(["Sei troppo forte per me!", "Vai avanti. ▼"], () => {
                this.chiudiDialogo();
                this.time.delayedCall(100, () => { this.isDialogActive = false; });
            });
        } else {
            this.mostraTestiDialogo(["Ehi tu!", "Non passerai mai di qui senza battermi. ▼", "Vuoi lottare? ▼"], () => {
                this.mostraSceltaSiNo((scelta) => {
                    this.chiudiDialogo();
                    if (scelta === 'SI') {
                        this.npcInSfida = npc;
                        this.startEncounter({ isWild: true, isNPC: true }, "ALLENATORE SFIDA!");
                    } else {
                        this.time.delayedCall(100, () => { this.isDialogActive = false; });
                    }
                });
            });
        }
    }

    startPVEEncounter() {
        this.startEncounter({ isWild: true, isNPC: false }, "POKÉMON SELVATICO!");
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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%;">${testo}</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;
            this.isDialogActive = false;
            this.scene.pause();

            let myDbTeam = this.registry.get('userPokemon').filter(p => p.in_squadra).sort((a, b) => a.posizione_slot - b.posizione_slot);
            if (myDbTeam.length === 0) {
                alert("Non hai PokÃ©mon in squadra! Visita il PC.");
                this.scene.resume('PVEScene');
                return;
            }

            battleData.parentScene = 'PVEScene';
            this.scene.launch('BattleScene', battleData);
        }, 2000);
    }

    gestisciUscitaPVE() {
        if (this.isDialogActive) return;
        this.isDialogActive = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        this.createDialogUI();

        this.mostraTestiDialogo(["Se esci, il tuo progresso PvE verrà  salvato qui.", "Vuoi tornare alla Lobby? ▼"], () => {
            this.mostraSceltaSiNo((scelta) => {
                this.chiudiDialogo();
                if (scelta === 'SI') {
                    this.tornaAllaLobby(false);
                } else {
                    this.time.delayedCall(100, () => {
                        this.isDialogActive = false;
                        this.player.y += 32;
                    });
                }
            });
        });
    }

    async tornaAllaLobby(vittoriaFinale = false) {
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

        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); text-align: center; width: 90%; color: #fff;">TORNO ALLA LOBBY...</h1>`;
        document.getElementById('game-container').appendChild(overlay);

        try {
            let profilo = this.registry.get('playerProfile');
            if (vittoriaFinale || this.registry.get('lastBattleResult') === 'lose') {
                const { error } = await supabaseClient.from('profilo').update({ id_mappa: null }).eq('id_profilo', profilo.id_profilo);
                if (!error) profilo.id_mappa = null;
            }
        } catch (e) {
            console.error("Errore pulizia salvataggio PVE:", e);
        }

        setTimeout(() => {
            if (overlay) overlay.remove();
            this.isTransitioning = false;

            this.scene.stop('PVEScene');
            this.scene.start('WorldScene', { name: this.myPlayerName, user: this.user, vengoDa: 'Porta PVE' });
        }, 1000);
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
            if (this.sceltaAttuale === 0) { optSi.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▼</span><span style="color: #ffcc00;">SI</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">NO</span>`; }
            else { optSi.innerHTML = `<span style="display:inline-block; width: 25px;"></span><span style="color: #ffffff;">SI</span>`; optNo.innerHTML = `<span style="display:inline-block; width: 25px; color: #ffcc00;">▼</span><span style="color: #ffcc00;">NO</span>`; }
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

        this.mostraTestiDialogo([
            "MODALITA' PVE: Sconfiggi gli allenatori ed esplora!",
            "Fai attenzione all'erba alta."
        ], () => {
            this.chiudiDialogo();
            this.time.delayedCall(100, () => { this.isDialogActive = false; });
        });
    }

    togglePauseMenu() {
        if (this.isPaused) {
            let existingMenu = document.getElementById('pause-menu-overlay');
            if (existingMenu && existingMenu.inSubMenu) {
                // Se premo ESC nel sottomenu, Phaser chiama questa funzione.
                // Invece di chiudere, torniamo al menu principale!
                existingMenu.renderMainPause();
                return;
            }
            // Se non sono in un sottomenu, chiudo tutto.
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
                        <h2 class="pause-title">PVE NEOMON</h2>
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

            // Inizializza il menu base al primo avvio
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
                    // 3. TOLTO 'Escape' DA QUI. Adesso i conflitti di sistema non esistono più!
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
                if (e.target.id === 'lobby-btn') {
                    e.target.innerText = "USCITA...";
                    this.isPaused = false;
                    if (this.handlePauseKeyDown) window.removeEventListener('keydown', this.handlePauseKeyDown);
                    let existingMenu = document.getElementById('pause-menu-overlay');
                    if (existingMenu) existingMenu.remove();
                    this.gestisciUscitaPVE(); // <-- Richiama la modale PVE per la conferma salvataggio!
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
                    renderMainPause(); // Questo ora lancia in automatico la transizione inversa!
                }
            });
        }
    }
}

