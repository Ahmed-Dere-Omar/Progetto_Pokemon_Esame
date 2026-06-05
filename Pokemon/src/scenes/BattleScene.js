// src/scenes/BattleScene.js
import { supabaseClient } from '../services/supabaseAuth.js';
import { InputConfig } from '../tasti_input.js';

// Serve l'accesso globale alla logica di battaglia: assumiamo che gestione_partita.js
// esporti o definisca a livello globale la classe `gestionePartita`.
// Altrimenti andrebbe importata qui.

export default class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'BattleScene' }); }
    init(data) {
        this.isWild = data.isWild;
        this.isNPC = data.isNPC;
        this.roomId = data.roomId;
        this.socket = data.socket;
        this.isForcedSwitch = false;
        this.parentScene = data.parentScene || 'WorldScene';
    }

    preload() {
        this.bgKey = `background_${Phaser.Math.Between(0, 11)}`;
        this.load.image(this.bgKey, `assets/Immagini/Sfondi/${this.bgKey}.png`);
        this.load.image('pokeball_lancio', 'assets/Pokeball Lancio.png');
        this.load.image('pokeball_scuoti', 'assets/Pokeball.png');
    }

    avviaMusicaBattaglia() {
        try {
            // 1. Fade out rapido e pausa della musica della lobby
            let lobbySound = this.registry.get('lobbySound');
            if (lobbySound && lobbySound.isPlaying) {
                this.tweens.add({
                    targets: lobbySound,
                    volume: 0,
                    duration: 200,
                    onComplete: () => { lobbySound.pause(); }
                });
            }

            // 2. Avvia la musica della battaglia usando ESATTAMENTE il volume salvato nel DB
            let battleTracks = this.registry.get('battleTracks');
            if (battleTracks && battleTracks.length > 0) {
                let randomIdx = Phaser.Math.Between(0, battleTracks.length - 1);
                let track = battleTracks[randomIdx];

                // Peschiamo la variabile aggiornata dal database
                let musicState = this.registry.get('musicState');
                let volumeDb = musicState ? musicState.volume : 0.5;

                this.battleMusic = this.sound.add(track.key, { loop: true, volume: volumeDb });
                this.battleMusic.play();
            }
        } catch (e) {
            console.warn('Errore avvio musica battaglia:', e);
        }
    }

    fermaEripristinaMusica() {
        try {
            // Ferma e distruggi definitivamente la musica di battaglia
            if (this.battleMusic) {
                this.battleMusic.stop();
                this.battleMusic.destroy();
                this.battleMusic = null;
            }

            // Mettiamo il volume della lobby a zero per azzerare conflitti.
            // Sarà il nuovo comando "ls.setVolume(ms.volume)" che abbiamo iniettato 
            // nell'evento 'resume' delle mappe a far ripartire l'audio al volume perfetto!
            let lobbySound = this.registry.get('lobbySound');
            if (lobbySound) {
                lobbySound.setVolume(0);
            }
        } catch (e) {
            console.warn('Errore ripristino musica lobby:', e);
        }
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

        // === OBIETTIVO 5: Pausa musica lobby e avvia musica battaglia ===
        this.avviaMusicaBattaglia();

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
            this.partita = new window.gestionePartita(p1, p2); // Utilizzo la classe importata/globale
            this.partita.isWild = this.isWild && !this.isNPC;
            this.myTeamData = this.partita.p1.squadra;
        }

        let myActive = this.myTeamData[this.myActiveIdx];
        let oppActive = this.isWild ? this.partita.p2.squadra[this.oppActiveIdx] : this.oppTeamData[this.oppActiveIdx];

        this.pEntity = { name: myActive.nome, types: myActive.tipi, hp: myActive.hp, maxHp: myActive.hpMax, moves: myActive.mosse, alive: myActive.hp > 0 };
        this.eEntity = { name: oppActive.nome, types: oppActive.tipi, hp: oppActive.hp, maxHp: oppActive.hpMax, moves: oppActive.mosse, alive: oppActive.hp > 0 };

        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(1000, 665);

        let pSpriteUrl = this.pkmnDB[this.pEntity.name]?.sprite?.normal || '';
        let eSpriteUrl = this.pkmnDB[this.eEntity.name]?.sprite?.normal || '';

        this.pSprite = this.add.dom(250, 535).createFromHTML(`<img src="${pSpriteUrl}" style="transform: scale(2.5); image-rendering: pixelated;">`);
        this.eSprite = this.add.dom(750, 290).createFromHTML(`<img src="${eSpriteUrl}" style="transform: scale(2.2); image-rendering: pixelated;">`);

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

            // ---> ASCOLTATORE PER IL FORFEIT <---
            this.socket.off('opponentDisconnected');
            this.socket.on('opponentDisconnected', () => this.vittoriaPerForfeit());
        }
        this.startTurn();
    }
    vittoriaPerForfeit() {
        this.isInputActive = false;
        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));

        // Se si disconnette mentre stiamo ancora scegliendo i Pokémon, chiude il popup di attesa
        if (this.waitingDom) {
            this.waitingDom.destroy();
            this.waitingDom = null;
        }

        this.logText.setVisible(true);
        this.logText.setText("L'avversario si è disconnesso o è fuggito! VITTORIA A TAVOLINO! 🎉");

        this.time.delayedCall(2500, async () => {
            this.registry.set('lastBattleResult', 'win');

            try {
                let profilo = this.registry.get('playerProfile');
                if (profilo) {
                    profilo.partite_totali = (profilo.partite_totali || 0) + 1;
                    profilo.vittorie_totali = (profilo.vittorie_totali || 0) + 1;
                    await supabaseClient.from('profilo').update({
                        partite_totali: profilo.partite_totali,
                        vittorie_totali: profilo.vittorie_totali
                    }).eq('id_profilo', profilo.id_profilo);
                    this.registry.set('playerProfile', profilo);
                }
            } catch (e) {
                console.error("Errore salvataggio statistiche forfeit:", e);
            }

            // Finta animazione di morte per il Pokémon nemico in campo (se c'è)
            if (this.eSprite) {
                this.tweens.add({
                    targets: this.eSprite, y: '+=100', alpha: 0, duration: 1000,
                    onComplete: () => {
                        if (this.socket) this.socket.emit('setInBattle', false);
                        this.fermaEripristinaMusica();
                        this.scene.stop();
                        this.scene.resume(this.parentScene);
                    }
                });
            } else {
                if (this.socket) this.socket.emit('setInBattle', false);
                this.fermaEripristinaMusica();
                this.scene.stop();
                this.scene.resume(this.parentScene);
            }
        });
    }
    createUIBox(x, y, entity, isPlayer) {
        let pct = (entity.hp / entity.maxHp) * 100;
        let color = pct > 50 ? '#4caf50' : (pct > 20 ? '#ffeb3b' : '#f44336');

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

        if (this.menuState === 'MOVES') {
            this.lastUsedMoveIndex = this.selectedMoveIndex;
        }
        this.isInputActive = false;
        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));
        this.logText.setVisible(true);

        if (this.isWild) {
            let activeBot = this.partita.p2.squadra[this.partita.p2.attivoIdx];
            let activePlayer = this.partita.p1.squadra[this.partita.p1.attivoIdx];
            let mosseDisponibiliBot = activeBot.mosse.filter(m => m.ppAttuali > 0);
            let botMoveData;

            if (this.eEntity.mossaForzata) {
                botMoveData = activeBot.mosse.find(m => m && m.Nome === this.eEntity.mossaForzata);
                if (this.eEntity.mossaForzata === "Ricarica") {
                    botMoveData = { Nome: "Ricarica", Tipo: "Normale", Categoria: "Stato", Potenza: 0, Precisione: 100, CodiceFunzione: [] };
                } else if (botMoveData && botMoveData.ppAttuali <= 0) {
                    this.eEntity.mossaForzata = null;
                    botMoveData = (mosseDisponibiliBot.length > 0) ? this.partita.scegliMossaBotIntelligente(activeBot, activePlayer, this.partita.p2, this.partita.p1) : this.moveDB["Scontro"];
                }
            } else if (mosseDisponibiliBot.length > 0) {
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
                this.menuState = 'MOVES';
                if (this.lastUsedMoveIndex !== undefined && this.lastUsedMoveIndex < this.pEntity.moves.length && this.pEntity.moves[this.lastUsedMoveIndex]) {
                    this.selectedMoveIndex = this.lastUsedMoveIndex;
                } else {
                    this.selectedMoveIndex = 0;
                }
                this.updateMenuSelection();
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
                        this.fermaEripristinaMusica(); this.scene.stop(); this.scene.resume(this.parentScene);
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

        let myPokemonList = this.registry.get('userPokemon');
        let giaPosseduto = myPokemonList.some(p => p.id_specie === this.eEntity.name);

        if (giaPosseduto) {
            this.logText.setText("Hai già questo Pokémon nel PC! Scegli un'altra azione.");
            this.time.delayedCall(2000, () => {
                this.startTurn();
            });
            return;
        }

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

        if (this.eSprite) {
            this.eSprite.setAlpha(0);
        }

        let ball = this.add.image(750, 320, 'pokeball_scuoti').setScale(0.6);

        this.tweens.add({
            targets: ball,
            angle: 20, duration: 200, yoyo: true, repeat: 2,
            onComplete: () => {
                if (catturato) {
                    this.mostraSuccessoCattura(ball);
                } else {
                    if (this.eSprite) this.eSprite.setAlpha(1);
                    this.mostraFallimentoCattura(ball);
                }
            }
        });
    }

    mostraSuccessoCattura(ball) {
        this.logText.setText(`Preso! Hai catturato ${this.eEntity.name.toUpperCase()}! 🎉`);
        this.salvaPokemonCatturato(this.eEntity.name);

        ball.setTint(0xffff00);
        this.time.delayedCall(2000, () => {
            this.registry.set('lastBattleResult', 'win');
            this.fermaEripristinaMusica();
            this.scene.stop();
            this.scene.resume(this.parentScene);
        });
    }

    mostraFallimentoCattura(ball) {
        this.logText.setText("Oh no! Il Pokémon si è liberato!");
        this.tweens.add({ targets: ball, alpha: 0, duration: 500, onComplete: () => ball.destroy() });

        this.time.delayedCall(1500, () => {
            let activeBot = this.partita.p2.squadra[this.partita.p2.attivoIdx];
            let botMoveData = this.partita.scegliMossaBotIntelligente(activeBot, this.partita.p1.squadra[this.partita.p1.attivoIdx], this.partita.p2, this.partita.p1);
            let stato = this.partita.processaTurno({ tipo: 'item' }, { mossa: botMoveData });
            this.applicaStatoPartita(stato, false);
        });
    }

    calcolaProbabilitaCattura() {
        let base = 20;
        let bonus = 0;

        let hpPct = (this.eEntity.hp / this.eEntity.maxHp) * 100;
        if (hpPct <= 25) bonus += 30;
        else if (hpPct <= 50) bonus += 15;

        if (this.eEntity.stato) {
            bonus += 15;
        }

        let probTotale = Math.min(base + bonus, 90);
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

        // 1. FIX: SALVIAMO I VECCHI HP PRIMA CHE VENGANO SOVRASCRITTI DAL NUOVO TURNO!
        let oldMyActiveHp = (this.myTeamData && this.myTeamData[p1Data.attivoIdx]) ? this.myTeamData[p1Data.attivoIdx].hp : p1Data.squadra[p1Data.attivoIdx].hp;
        let oldOppActiveHp = (this.oppTeamData && this.oppTeamData[p2Data.attivoIdx]) ? this.oppTeamData[p2Data.attivoIdx].hp : p2Data.squadra[p2Data.attivoIdx].hp;

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

        if (this.myTeamData && this.myTeamData[this.myActiveIdx]) {
            this.myTeamData[this.myActiveIdx].mosse = [...(p1Data.mosse || [])];
        }
        if (this.oppTeamData && this.oppTeamData[p2Data.attivoIdx]) {
            this.oppTeamData[p2Data.attivoIdx].mosse = [...(p2Data.mosse || [])];
        }

        // 2. FIX: Inizializza l'interfaccia con i vecchi HP salvati (oldMyActiveHp)
        if (p1Data.nome !== this.pEntity.name) {
            let myNewActive = this.myTeamData[this.myActiveIdx];
            this.pEntity = { name: myNewActive.nome, types: myNewActive.tipi, hp: oldMyActiveHp, maxHp: myNewActive.maxHp, moves: myNewActive.mosse, alive: oldMyActiveHp > 0 };
            if (this.pSprite.node) this.pSprite.node.querySelector('img').src = this.pkmnDB[myNewActive.nome].sprite.normal;
            this.updateUI();
            this.updateStatusOverlay(true, null);
        }

        // 3. FIX: Idem per il nemico (oldOppActiveHp)
        if (p2Data.nome !== this.eEntity.name) {
            let oppNewActive = this.oppTeamData[p2Data.attivoIdx];
            this.eEntity = { name: oppNewActive.nome, types: oppNewActive.tipi, hp: oldOppActiveHp, maxHp: oppNewActive.maxHp, moves: oppNewActive.mosse, alive: oldOppActiveHp > 0 };
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

                    if (!this.isWild) {
                        try {
                            let profilo = this.registry.get('playerProfile');
                            if (profilo) {
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
                            this.fermaEripristinaMusica(); this.scene.stop(); this.scene.resume(this.parentScene);
                        }
                    });
                });
            } else if (iAmDead) {
                this.isInputActive = false;
                this.btns.forEach(b => b.setVisible(false));

                let altriDisponibili = this.myTeamData.some((p, idx) => p.hp > 0 && idx !== this.myActiveIdx);

                if (altriDisponibili) {
                    this.logText.setText(`${this.pEntity.name} è esausto! Scegli il sostituto!`);
                    this.time.delayedCall(1500, () => this.forceSwitchMenu());
                } else {
                    this.logText.setText("Tutti i tuoi Pokémon sono esausti! Sei tornato alla base.");
                    this.time.delayedCall(2000, () => {
                        this.registry.set('lastBattleResult', 'lose');
                        this.fermaEripristinaMusica();
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

                let targetLato = null;
                let targetHp = null;

                if (typeof riga === 'string') {
                    let parts = riga.split('|');
                    riga = parts[0];
                    for (let i = 1; i < parts.length; i++) {
                        if (parts[i].startsWith('LATO:')) {
                            targetLato = parseInt(parts[i].substring(5));
                        } else if (parts[i].startsWith('HP:')) {
                            targetHp = parseInt(parts[i].substring(3));
                        }
                    }
                }

                this.logText.setText(riga);

                let isPlayerTarget = false;
                let isEnemyTarget = false;
                if (targetLato !== null) {
                    isPlayerTarget = this.invertiLogs ? (targetLato === 2) : (targetLato === 1);
                    isEnemyTarget = this.invertiLogs ? (targetLato === 1) : (targetLato === 2);
                } else {
                    isPlayerTarget = riga.includes(this.pEntity.name);
                    isEnemyTarget = riga.includes(this.eEntity.name);
                }

                if (riga.includes(" usa ")) {
                    if (targetLato !== null) {
                        ultimoAttaccanteEraPlayer = this.invertiLogs ? (targetLato === 2) : (targetLato === 1);
                    } else {
                        ultimoAttaccanteEraPlayer = riga.includes(this.pEntity.name);
                    }
                    this.playDash(ultimoAttaccanteEraPlayer);
                }

                if (riga.includes("Inflitti") || riga.includes("efficace") || riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("recupera") || riga.includes("rigenera") || riga.includes("contraccolpo") || riga.includes("Perde ") || riga.includes("colpito da")) {
                    let targetEnt = isPlayerTarget ? this.pEntity : (isEnemyTarget ? this.eEntity : null);
                    if (targetEnt && targetHp !== null) targetEnt.hp = targetHp;
                    this.updateUI(targetEnt);

                    if (riga.includes("Inflitti") || riga.includes("efficace")) {
                        if (ultimoAttaccanteEraPlayer !== null) this.playDamage(!ultimoAttaccanteEraPlayer);
                    }
                    else if (riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("contraccolpo") || riga.includes("Perde ") || riga.includes("colpito da")) {
                        this.playDamage(isPlayerTarget);
                    }
                }

                if (riga.includes("aumenta")) this.playStatAnim(isPlayerTarget, true);
                else if (riga.includes("diminuisce")) this.playStatAnim(isPlayerTarget, false);

                if (riga.includes("stato di")) {
                    let stato = riga.split("stato di ")[1].replace("!", "").trim();
                    this.updateStatusOverlay(isPlayerTarget, stato);
                } else if (riga.includes("addormentato per la sonnolenza")) this.updateStatusOverlay(isPlayerTarget, "Sonno");
                else if (riga.includes("si è svegliato") || riga.includes("si è scongelato") || riga.includes("curato dal suo problema di stato")) this.updateStatusOverlay(isPlayerTarget, null);

                if ((riga.includes("confuso") || riga.includes("Confusione")) && !riga.includes("non è più confuso")) this.playConfusion(isPlayerTarget);

                if (riga.includes("Parassiseme") || riga.includes("semi rubano")) {
                    this.playSeeds(isPlayerTarget);
                } else if (riga.includes("intrappolato") || riga.includes("Legatutto") || riga.includes("pietre appuntite") || riga.includes("fielepunte")) {
                    this.playTrap(isPlayerTarget);
                }

                index++;
                this.time.delayedCall(1500, mostraProssimo);
            } else {
                this.updateUI();
                if (onComplete) onComplete();
            }
        };
        mostraProssimo();
    }

    playSeeds(isPlayer) {
        let targetX = isPlayer ? 250 : 750;
        let targetY = isPlayer ? 550 : 280;
        let seed = this.add.text(targetX, targetY, '🌱', { fontSize: '100px' }).setOrigin(0.5);
        this.tweens.add({
            targets: seed,
            scale: { from: 0.1, to: 1.2 },
            alpha: { from: 0, to: 1 },
            duration: 1000,
            yoyo: true,
            onComplete: () => seed.destroy()
        });
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
                this.teamModalDom.remove();
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
            this.teamModalDom.remove();
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
            let playerTarget = this.partita.p1.squadra[index];
            let botMoveData = this.partita.scegliMossaBotIntelligente(activeBot, playerTarget, this.partita.p2, this.partita.p1);
            let botAction = { mossa: botMoveData };
            let stato = this.partita.processaTurno(switchAction, botAction);
            this.applicaStatoPartita(stato, false);
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, ...switchAction });
        }
    }
}
