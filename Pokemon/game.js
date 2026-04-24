// ==============================================================================
// PARTE 1: CLASSI E UTILITY GLOBALI (Il "Motore" del gioco)
// ==============================================================================

class PokemonEntity {
    constructor(name, dbData) {
        this.name = dbData.nome;
        this.types = dbData.tipi;
        this.stats = {
            hp: Math.floor(dbData.statistiche.hp.base_stat * 1.5),
            attack: dbData.statistiche.attack.base_stat,
            defense: dbData.statistiche.defense.base_stat,
            spAttack: dbData.statistiche['special-attack'].base_stat,
            spDefense: dbData.statistiche['special-defense'].base_stat,
            speed: dbData.statistiche.speed.base_stat
        };
        this.maxHp = this.stats.hp;
        this.hp = this.maxHp;
        let mosseMischiate = [...dbData.mosse].sort(() => 0.5 - Math.random());
        this.moves = mosseMischiate.slice(0, 4);
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

// 2. LOGIN SCENE: Solo UI HTML
class LoginScene extends Phaser.Scene {
    constructor() { super({ key: 'LoginScene' }); }
    create() {
        const html = `
            <div id="login-container">
                <h1 class="text-shadows" style="font-size: 5rem; margin-bottom: 0;">POKEMON</h1>
                <h2 style="font-size: 2rem; letter-spacing: 10px; margin-top: 0; color: #fff;">MULTIPLAYER</h2>
                <input type="text" id="username-input" placeholder="IL TUO NOME..." maxlength="10" autocomplete="off" style="margin-top: 20px;">
                <button id="start-btn" style="margin-top: 10px;">INIZIA AVVENTURA</button>
            </div>`;
        let dom = this.add.dom(500, 400).createFromHTML(html);

        dom.addListener('click').on('click', (e) => {
            if (e.target.id === 'start-btn') {
                let name = dom.getChildByID('username-input').value.trim().toUpperCase();
                if (name !== '') {
                    dom.destroy();
                    this.scene.start('WorldScene', { name: name });
                }
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
        this.socket.on('disconnect', (id) => {
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
        if (this.isTransitioning || !this.player) return;

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
            let distToNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
            if (distToNpc < 50) {
                this.player.anims.stop();
                this.startEncounter({ isWild: true, socket: this.socket }, "SFIDA CONTRO NPC!");
                return;
            }

            let closest = this.otherPlayers.getChildren().find(op => Phaser.Math.Distance.Between(this.player.x, this.player.y, op.x, op.y) < 150);
            if (closest) this.socket.emit('challengePlayer', closest.playerId);
        }
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
            this.moveDB = this.registry.get('moveDB');
            this.pEntity = new PokemonEntity(this.pName, this.pkmnDB[this.pName]);
            this.eEntity = new PokemonEntity(this.eName, this.pkmnDB[this.eName]);
    
            // FIX: Trasformiamo subito le mosse da stringhe a oggetti completi con i PP!
            let initMoves = (entity) => {
                entity.moves = entity.moves.map(mName => {
                    let mData = this.moveDB[mName] || Object.values(this.moveDB).find(m => m.Nome.toLowerCase() === mName.toLowerCase());
                    return mData ? { ...mData, ppAttuali: mData.PP, ppMassimi: mData.PP } : null;
                }).filter(m => m);
            };
            initMoves(this.pEntity);
            initMoves(this.eEntity);
    
        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(1000, 665);
        this.pSprite = this.add.dom(250, 500).createFromHTML(`<img src="${this.pkmnDB[this.pName].sprite?.normal}" style="transform: scale(2.5); image-rendering: pixelated;">`);
        this.eSprite = this.add.dom(750, 230).createFromHTML(`<img src="${this.pkmnDB[this.eName].sprite?.normal}" style="transform: scale(2.2); image-rendering: pixelated;">`);

        this.pUI = this.createUIBox(100, 360, this.pEntity);
        this.eUI = this.createUIBox(600, 100, this.eEntity);

        // ==========================================
        // NUOVO LOG "STILE GBA RETRÒ" (Fighissimo)
        // ==========================================

        // 1. Sfondo scuro principale che riempie il fondo (da Y:665 a 800)
        this.add.rectangle(0, 665, 1000, 135, 0x2b2b2b).setOrigin(0, 0);

        // 2. Bordo principale (rosso/arancio stile gioco originale)
        this.add.rectangle(3, 668, 994, 129).setOrigin(0, 0).setStrokeStyle(6, 0xd05050);

        // 3. Bordo interno sottile per dare profondità 3D
        this.add.rectangle(6, 671, 988, 123).setOrigin(0, 0).setStrokeStyle(2, 0x555555);

        // 4. Divisorio verticale tra le frasi e i bottoni
        this.add.rectangle(590, 668, 6, 129, 0xd05050).setOrigin(0, 0);

        // 5. Testo del log formattato come i veri giochi
        this.logText = this.add.text(30, 690, '', {
            fontSize: '26px',
            fill: '#ffffff',
            fontFamily: '"Courier New", Courier, monospace',
            fontStyle: 'bold',
            wordWrap: { width: 530 },
            lineSpacing: 8,
            // L'ombra nera dietro le scritte bianche è il tocco magico
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        });

        // --- UI INFO MOSSA (A Destra del divisorio) ---
        this.infoTipoLabel = this.add.text(610, 685, 'TIPO:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoTipoVal = this.add.text(700, 685, 'NORMALE', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });

        this.infoCatLabel = this.add.text(610, 725, 'CAT.:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoCatVal = this.add.text(700, 725, 'FISICO', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });

        this.infoPPLabel = this.add.text(610, 765, 'PP:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPPVal = this.add.text(700, 765, '15/15', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });

        this.infoPotLabel = this.add.text(840, 765, 'POT:', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });
        this.infoPotVal = this.add.text(910, 765, '90', { fontSize: '22px', fill: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true } });

        // Mettiamo tutto in un array per poterli nascondere/mostrare facilmente
        this.moveInfoUI = [this.infoTipoLabel, this.infoTipoVal, this.infoCatLabel, this.infoCatVal, this.infoPPLabel, this.infoPPVal, this.infoPotLabel, this.infoPotVal];
        
        this.createButtons();

        if (this.isWild) {
            let creaSquadra = (id, entity) => ({
                id: id,
                squadra: [{
                    nome: entity.name,
                    hp: entity.hp,
                    hpMax: entity.maxHp,
                    statistiche: {
                        attacco: entity.stats.attack,
                        difesa: entity.stats.defense,
                        attaccoSpeciale: entity.stats.spAttack,
                        difesaSpeciale: entity.stats.spDefense,
                        velocita: entity.stats.speed
                    },
                    modificatori: {},
                    tipi: entity.types,
                    livello: 50,
                    stato: null,
                    // FIX: Passiamo direttamente le mosse che sono GIA' oggetti completi!
                    mosse: [...entity.moves]
                }],
                attivoIdx: 0
            });
            let p1 = creaSquadra('player', this.pEntity);
            let p2 = creaSquadra('bot', this.eEntity);
            this.partita = new gestionePartita(p1, p2);
        }

        if (!this.isWild) {
            this.socket.off('resolveTurn');
            this.socket.on('resolveTurn', (data) => this.resolveTurn(data));
        }
        this.startTurn();
    }

    createUIBox(x, y, entity) {
        // Salviamo il riferimento al testo del nome per posizionarci sopra lo stato
        let nameTxt = this.add.text(x, y, entity.name.toUpperCase(), {
            fontSize: '24px', fill: '#000', fontStyle: 'bold', backgroundColor: '#fff8'
        });
        let hpTxt = this.add.text(x, y + 30, `HP: ${entity.hp}/${entity.maxHp}`, {
            fontSize: '20px', fill: '#000', backgroundColor: '#fff8'
        });
        this.add.rectangle(x, y + 60, 200, 15, 0x555555).setOrigin(0, 0);
        let bar = this.add.rectangle(x, y + 60, 200, 15, 0x00ff00).setOrigin(0, 0);

        // Aggiungiamo nameText al ritorno per usarlo dopo
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

        this.moveKeys = this.input.keyboard.createCursorKeys();
        this.confirmKey = this.input.keyboard.addKey('ENTER');

        for (let i = 0; i < 4; i++) {
            // SPOSTATI A SINISTRA! (Dove normalmente c'è il log)
            let bx = 40 + (i % 2) * 260; 
            let by = 690 + Math.floor(i / 2) * 45;

            let b = this.add.text(bx, by, '', {
                fontSize: '24px', // Ora che hanno spazio a sinistra possiamo farli grandi
                fill: '#ffffff',
                fontFamily: '"Courier New", Courier, monospace',
                fontStyle: 'bold',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true },
                padding: { x: 2, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => { 
                if (this.isInputActive && this.pEntity.moves[i]) this.handleMoveClick(this.pEntity.moves[i].Nome); 
            })
            .on('pointerover', () => {
                if (this.isInputActive && this.pEntity.moves[i]) {
                    this.selectedMoveIndex = i;
                    this.updateMoveSelection();
                }
            });

            b.setVisible(false); // Partono invisibili
            this.btns.push(b);
        }
    }
    updateMoveSelection() {
        // Aggiorna i cursori e i colori base dei bottoni
        this.btns.forEach((b, i) => {
            let m = this.pEntity.moves[i];
            if (m) {
                let moveName = m.Nome.toUpperCase();
                if (i === this.selectedMoveIndex) {
                    b.setText("▶ " + moveName);
                    b.setStyle({ fill: '#ffcc00' }); // Giallo evidenziato
                } else {
                    b.setText("  " + moveName);
                    b.setStyle({ fill: '#ffffff' }); // Bianco normale
                }
            }
        });

        // Aggiornamento Pannello Info Destra (Tipo, PP, ecc.)
        let m = this.pEntity.moves[this.selectedMoveIndex];
        if (m) {
            this.infoTipoVal.setText(m.Tipo.toUpperCase()).setColor(this.getColorForType(m.Tipo));
            this.infoCatVal.setText(m.Categoria.toUpperCase()).setColor(m.Categoria === "Fisico" ? '#ff4444' : (m.Categoria === "Speciale" ? '#4444ff' : '#aaaaaa'));
            this.infoPPVal.setText(`${m.ppAttuali}/${m.ppMassimi}`).setColor('#ffffff');
            this.infoPotVal.setText(m.Potenza > 0 ? m.Potenza : '-').setColor('#ffffff');
        }
    }

    // Funzione helper per i colori
    getColorForType(tipo) {
        const colori = {
            'Normale': '#A8A878', 'Fuoco': '#F08030', 'Acqua': '#6890F0', 'Elettro': '#F8D030',
            'Erba': '#78C850', 'Ghiaccio': '#98D8D8', 'Lotta': '#C03028', 'Veleno': '#A040A0',
            'Terra': '#E0C068', 'Volante': '#A890F0', 'Psico': '#F85888', 'Coleottero': '#A8B820',
            'Roccia': '#B8A038', 'Spettro': '#705898', 'Drago': '#7038F8', 'Buio': '#705848',
            'Acciaio': '#B8B8D0', 'Folletto': '#EE99AC'
        };
        return colori[tipo] || '#ffffff';
    }
    update() {
        if (!this.isInputActive) return;

        if (Phaser.Input.Keyboard.JustDown(this.moveKeys.left)) {
            if (this.selectedMoveIndex % 2 !== 0) this.selectedMoveIndex--;
            this.updateMoveSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.right)) {
            if (this.selectedMoveIndex % 2 === 0) this.selectedMoveIndex++;
            this.updateMoveSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.up)) {
            if (this.selectedMoveIndex >= 2) this.selectedMoveIndex -= 2;
            this.updateMoveSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.moveKeys.down)) {
            if (this.selectedMoveIndex <= 1) this.selectedMoveIndex += 2;
            this.updateMoveSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
            this.handleMoveClick(this.pEntity.moves[this.selectedMoveIndex].Nome);
        }
    }
    startTurn() {
        this.logText.setVisible(false);
        this.isInputActive = true;

        // 1. PRIMA aggiorniamo i testi e i colori delle mosse
        this.updateMoveSelection();

        // 2. POI mostriamo i bottoni (solo se esiste la mossa corrispondente in quell'indice)
        this.btns.forEach((b, i) => { 
            if (this.pEntity.moves[i]) b.setVisible(true); 
        });
        
        // 3. Mostriamo le statistiche laterali
        this.moveInfoUI.forEach(element => element.setVisible(true));
    }

    handleMoveClick(moveName) {
        this.isInputActive = false;

        // Nascondi le mosse e le info, e rimostra il log text!
        this.btns.forEach(b => b.setVisible(false));
        this.moveInfoUI.forEach(element => element.setVisible(false));
        this.logText.setVisible(true);

        if (this.isWild) {
            // FIX: Peschiamo le mosse direttamente dagli oggetti della squadra!
            let myMoveData = this.pEntity.moves.find(m => m.Nome === moveName);
            let botMoveData = Phaser.Utils.Array.GetRandom(this.eEntity.moves);

            let statoAggiornato = this.partita.processaTurno({ mossa: myMoveData }, { mossa: botMoveData });
            this.applicaStatoPartita(statoAggiornato, false);
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, moveName });
        }
    }

    resolveTurn(turnData) {
        this.applicaStatoPartita(turnData.stato, turnData.inverti);
    }

    applicaStatoPartita(stato, inverti) {
        // Aggiorniamo il numero del turno ricevuto dal server
        this.currentTurn = stato.turno;
        let p1Data = inverti ? stato.p2 : stato.p1;
        // Aggiorniamo le mosse (che ora sono oggetti completi)
        this.pEntity.moves = [...p1Data.mosse];
        let p2Data = inverti ? stato.p1 : stato.p2;

        this.pEntity.hp = p1Data.hp;
        this.eEntity.hp = p2Data.hp;
        if (this.pEntity.hp <= 0) this.pEntity.alive = false;
        if (this.eEntity.hp <= 0) this.eEntity.alive = false;

        this.mostraLogsSequenziali(stato.logs, () => {
            this.updateUI();
            if (stato.finito || !this.pEntity.alive || !this.eEntity.alive) {
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
                let riga = logs[index];
                this.logText.setText(riga);

                let isPlayerTarget = riga.includes(this.pEntity.name);
                let isEnemyTarget = riga.includes(this.eEntity.name);

                if (riga.includes(" usa ")) {
                    ultimoAttaccanteEraPlayer = riga.includes(this.pEntity.name);
                    this.playDash(ultimoAttaccanteEraPlayer);
                }

                if (riga.includes("Inflitti") || riga.includes("efficace") || riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("recupera") || riga.includes("rigenera") || riga.includes("contraccolpo")) {
                    this.updateUI();
                    if (riga.includes("Inflitti") || riga.includes("efficace")) {
                        if (ultimoAttaccanteEraPlayer !== null) {
                            this.playDamage(!ultimoAttaccanteEraPlayer);
                        }
                    } else if (riga.includes("subisce danni") || riga.includes("rubano energia") || riga.includes("contraccolpo")) {
                        this.playDamage(isPlayerTarget);
                    }
                }

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
            // Posizioniamo lo stato sopra il nome (y - 25)
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
    scene: [BootScene, LoginScene, WorldScene, SelectionScene, BattleScene]
};
new Phaser.Game(config);