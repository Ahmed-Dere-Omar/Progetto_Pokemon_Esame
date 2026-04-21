// ==============================================================================
// PARTE 1: CLASSI E UTILITY GLOBALI (Il "Motore" del gioco)
// ==============================================================================

class PokemonEntity {
    constructor(name, dbData) {
        this.name = dbData.nome;
        this.types = dbData.tipi;
        this.stats = {
            hp: dbData.statistiche.hp.base_stat,
            attack: dbData.statistiche.attack.base_stat,
            defense: dbData.statistiche.defense.base_stat,
            spAttack: dbData.statistiche['special-attack'].base_stat,
            spDefense: dbData.statistiche['special-defense'].base_stat,
            speed: dbData.statistiche.speed.base_stat
        };
        this.maxHp = this.stats.hp;
        this.hp = this.maxHp;
        this.moves = dbData.mosse.slice(0, 4);
        this.alive = true;
        this.sprites = dbData.sprite; // Ora punta a 'sprite', non 'sprites'
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp === 0) this.alive = false;
    }
}

// MOTORE DI DANNO GLOBALE: Separato dalla grafica!
const BattleEngine = {
    calcolaDanno: function (attPkmn, defPkmn, moveName, moveDB, randoms) {
        let move = moveDB[moveName];
        if (!move) return { damage: 0, msg: "Mossa sconosciuta!" };

        let hitRoll = randoms ? (randoms.acc * 100) : Phaser.Math.Between(1, 100);
        if (move.Precisione && hitRoll > move.Precisione) {
            return { damage: 0, msg: `${attPkmn.name.toUpperCase()} fallisce!` };
        }

        let isPhys = move.Categoria === "Fisico";
        let att = isPhys ? attPkmn.stats.attack : attPkmn.stats.spAttack;
        let dif = isPhys ? defPkmn.stats.defense : defPkmn.stats.spDefense;
        let base_dmg = ((move.Potenza * (att / dif)) / 2) + 2;

        let stab = attPkmn.types.includes(move.Tipo) ? 1.5 : 1.0;
        
        // Efficacia fissa a 1.0 senza la tabella dei tipi
        let effectiveness = 1.0; 

        let critRoll = randoms ? randoms.crit : Math.random();
        let crit = critRoll < 0.1 ? 1.5 : 1.0;

        let total_dmg = Math.floor(base_dmg * stab * effectiveness * crit);

        let msg = `${attPkmn.name.toUpperCase()} usa ${moveName.toUpperCase()}!\nDanno: ${total_dmg}.`;
        if (total_dmg >= defPkmn.hp) msg += `\n${defPkmn.name.toUpperCase()} è K.O.!`;

        return { damage: total_dmg, msg: msg };
    }
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
        // Rimosso typeDB!

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

        // AGGIUNGI QUESTO: Creiamo i personaggi non giocanti
        this.setupNPCs();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');

        this.canEncounter = true;
        this.isTransitioning = false;

        // Reset post-battaglia
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
        // Creiamo l'NPC usando la chiave 'allenatore'
        this.npc = this.physics.add.sprite(300, 200, 'allenatore');

        // FONDAMENTALE: L'immagine originale è 900x586, la riduciamo al 10%!
        // this.npc.setScale(0.2);

        // Diciamo alla fisica di ricalcolare i bordi delle collisioni dopo averlo rimpicciolito
        this.npc.body.updateFromGameObject();

        // Evitiamo che venga spinto in giro dal giocatore
        this.npc.setCollideWorldBounds(true);
        this.npc.setImmovable(true);
        this.physics.add.collider(this.npc, this.wallLayer);

        // Aggiungiamo l'etichetta del nome sopra la sua testa
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

        // PvP Network
        this.socket.on('challengeReceived', (id) => this.socket.emit('acceptChallenge', id));
        this.socket.on('opponentBusy', () => alert("Questo allenatore è occupato!"));

        // Passa il socket e isWild al pacchetto della battaglia
        this.socket.on('startPvP', (data) => {
            data.socket = this.socket;
            data.isWild = false;
            // Aggiunto il testo per il PvP
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

        // Network Emit
        if (isMoving) {
            let px = this.player.x;
            let py = this.player.y;
            if (this.player.oldP && (px !== this.player.oldP.x || py !== this.player.oldP.y)) {
                this.socket.emit('playerMovement', { x: px, y: py, anim: currentAnim });
            }
            this.player.oldP = { x: px, y: py };
        }

        // Erba Alta (WILD)
        if (isMoving && this.canEncounter && this.grassLayer.getTileAtWorldXY(this.player.x, this.player.y, true)?.index !== -1) {
            if (Phaser.Math.Between(1, 100) <= 5) {
                // Aggiunto il testo per i selvatici
                this.startEncounter({ isWild: true, socket: this.socket }, "POKÉMON SELVATICO!");
            }
            this.canEncounter = false;
            this.time.delayedCall(250, () => this.canEncounter = true);
        }

        // Sfida PvP o Interazione NPC (ENTER)
        if (Phaser.Input.Keyboard.JustDown(this.enterKey) && !this.isTransitioning) {

            // 1. Controlliamo se siamo vicini all'NPC
            let distToNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);

            if (distToNpc < 50) {
                this.player.anims.stop();

                // LANCIA LA BATTAGLIA CONTRO L'NPC!
                // Gli passiamo isWild: true perché lo controlla il computer, e un testo personalizzato
                this.startEncounter({ isWild: true, socket: this.socket }, "SFIDA CONTRO NPC!");

                return; // Ferma il codice qui
            }

            // 2. Se non siamo vicini all'NPC, cerchiamo un giocatore per il PvP
            let closest = this.otherPlayers.getChildren().find(op => Phaser.Math.Distance.Between(this.player.x, this.player.y, op.x, op.y) < 150);
            if (closest) this.socket.emit('challengePlayer', closest.playerId);
        }
    }

    startEncounter(battleData, testo = "BATTAGLIA!") {
        this.isTransitioning = true;
        this.player.body.setVelocity(0);
        this.player.anims.stop();

        // creiamo un vero livello HTML "sopra" al gioco!
        let overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.pointerEvents = 'none'; // Non blocca il mouse
        overlay.style.zIndex = '9999'; // È in primissimo piano

        // Cerca questa riga nel tuo startEncounter e aggiungi font-size: 8rem; (o il numero che preferisci)
        overlay.innerHTML = `<h1 class="text-shadows" style="margin: 0; font-size: 4rem;">${testo}</h1>`;

        // La "appiccichiamo" fisicamente sopra al contenitore del gioco
        document.getElementById('game-container').appendChild(overlay);

        this.time.delayedCall(2000, () => {
            // Dopo 2 secondi, eliminiamo l'overlay HTML pulendo lo schermo
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
        this.pkmnDB = this.registry.get('pokemonDB'); // Usa registry!

        let pData = this.pkmnDB[this.pName];
        let eData = this.pkmnDB[this.eName];

        // Prendiamo l'URL "normal" dai nuovi DB
        let pSpriteUrl = pData.sprite?.normal;
        let eSpriteUrl = eData.sprite?.normal;

        this.bgKey = `background_${Phaser.Math.Between(0, 11)}`;

        // Phaser scarica l'immagine direttamente dal link web!
        if (pSpriteUrl) this.load.image(this.pName, pSpriteUrl);
        if (eSpriteUrl) this.load.image(this.eName, eSpriteUrl);

        this.load.image(this.bgKey, `DB/Immagini/Sfondi/${this.bgKey}.png`);
    }

    create() {
        this.moveDB = this.registry.get('moveDB');

        this.pEntity = new PokemonEntity(this.pName, this.pkmnDB[this.pName]);
        this.eEntity = new PokemonEntity(this.eName, this.pkmnDB[this.eName]);

        // SFONDO
        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(1000, 800);

        // --- POKEMON (ABBASSATI) ---
        // Player: da 500 a 580 | Enemy: da 250 a 320
        this.pSprite = this.add.dom(250, 500).createFromHTML(`<img src="${this.pkmnDB[this.pName].sprite?.normal}" style="transform: scale(2.5); image-rendering: pixelated;">`);
        this.eSprite = this.add.dom(750, 230).createFromHTML(`<img src="${this.pkmnDB[this.eName].sprite?.normal}" style="transform: scale(2.2); image-rendering: pixelated;">`);

        // --- UI BOX (ABBASSATI) ---
        // Player UI: da 560 a 630 | Enemy UI: da 80 a 160
        this.pUI = this.createUIBox(100, 360, this.pEntity);
        this.eUI = this.createUIBox(600, 100, this.eEntity);

        // --- BLOCCO LOG E MOSSE (ABBASSATO AL LIMITE) ---
        // Rettangolo di fondo: centrato a 730 (quasi sul bordo)
        this.add.rectangle(500, 730, 950, 130, 0xffffff).setStrokeStyle(4, 0x000000);

        // Testo del log: spostato a 685
        this.logText = this.add.text(70, 685, '', {
            fontSize: '22px',
            fill: '#000',
            fontStyle: 'bold',
            wordWrap: { width: 500 }
        });

        this.createButtons();

        if (!this.isWild) {
            this.socket.off('resolveTurn');
            this.socket.on('resolveTurn', (data) => this.resolveTurn(data));
        }
        this.startTurn();
    }

    createUIBox(x, y, entity) {
        // Testo nome e HP
        this.add.text(x, y, entity.name.toUpperCase(), { fontSize: '24px', fill: '#000', fontStyle: 'bold', backgroundColor: '#fff8' });
        let txt = this.add.text(x, y + 30, `HP: ${entity.hp}/${entity.maxHp}`, { fontSize: '20px', fill: '#000', backgroundColor: '#fff8' });

        // Barre della vita
        this.add.rectangle(x, y + 60, 200, 15, 0x555555).setOrigin(0, 0);
        let bar = this.add.rectangle(x, y + 60, 200, 15, 0x00ff00).setOrigin(0, 0);
        return { text: txt, bar: bar };
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
        this.pEntity.moves.forEach((m, i) => {
            // Posizionamento bottoni: griglia 2x2 spostata verso il basso (Y: 685 e 730)
            let bx = 600 + (i % 2) * 190;
            let by = 685 + Math.floor(i / 2) * 45;

            let b = this.add.text(bx, by, m.toUpperCase(), {
                fontSize: '18px',
                fill: '#fff',
                backgroundColor: '#333',
                padding: { x: 12, y: 6 },
                fixedWidth: 170,
                align: 'center'
            })
                .setInteractive()
                .on('pointerdown', () => this.handleMoveClick(m));

            this.btns.push(b);
        });
    }

    startTurn() {
        this.logText.setText(`Cosa deve fare ${this.pName.toUpperCase()}?`);
        this.btns.forEach(b => b.setInteractive());
    }

    handleMoveClick(moveName) {
        this.btns.forEach(b => b.disableInteractive());

        if (this.isWild) {
            let myAction = { att: this.pEntity, def: this.eEntity, move: moveName };
            let botAction = { att: this.eEntity, def: this.pEntity, move: Phaser.Utils.Array.GetRandom(this.eEntity.moves) };

            // Il player attacca sempre per primo contro il bot in questa logica semplificata
            this.executeAction(myAction, () => {
                if (this.eEntity.alive) {
                    this.executeAction(botAction, () => {
                        if (this.pEntity.alive) this.startTurn();
                    });
                }
            });
        } else {
            this.logText.setText("In attesa dell'avversario...");
            this.socket.emit('pvpUseMove', { roomId: this.roomId, moveName });
        }
    }

    resolveTurn(turnData) {
        let myMove = turnData.moves[this.socket.id];
        let oppId = Object.keys(turnData.moves).find(id => id !== this.socket.id);

        let iGoFirst = (this.pEntity.stats.speed > this.eEntity.stats.speed) ||
            (this.pEntity.stats.speed === this.eEntity.stats.speed && this.socket.id < oppId);

        let myAction = { att: this.pEntity, def: this.eEntity, move: myMove, rng: turnData.randoms[this.socket.id] };
        let oppAction = { att: this.eEntity, def: this.pEntity, move: turnData.moves[oppId], rng: turnData.randoms[oppId] };

        this.executeAction(iGoFirst ? myAction : oppAction, () => {
            if ((iGoFirst ? this.eEntity : this.pEntity).alive) {
                this.executeAction(iGoFirst ? oppAction : myAction, () => {
                    if (this.pEntity.alive && this.eEntity.alive) this.startTurn();
                });
            }
        });
    }

    executeAction(action, onComplete) {
        // Capiamo chi sta attaccando e chi si difende per muovere gli sprite giusti
        let isPlayerAttacking = (action.att === this.pEntity);
        let attackerSprite = isPlayerAttacking ? this.pSprite : this.eSprite;
        let defenderSprite = isPlayerAttacking ? this.eSprite : this.pSprite;

        // Direzione dello scatto (il player va verso destra +50, il nemico verso sinistra -50)
        let dashX = isPlayerAttacking ? 50 : -50;
        let dashY = isPlayerAttacking ? -30 : 30;

        // 1. ANIMAZIONE ATTACCO (Scatto in avanti)
        this.tweens.add({
            targets: attackerSprite,
            x: attackerSprite.x + dashX,
            y: attackerSprite.y + dashY,
            duration: 150,
            yoyo: true, // Torna subito indietro
            ease: 'Power2',
            onComplete: () => {

                // 2. CALCOLO DEL DANNO (Appena il colpo va a segno)
                let res = BattleEngine.calcolaDanno(action.att, action.def, action.move, this.moveDB, action.rng);
                action.def.takeDamage(res.damage);
                this.updateUI();
                this.logText.setText(res.msg);

                // 3. ANIMAZIONE DANNO (Se il colpo non ha fallito)
                if (res.damage > 0) {
                    // Non potendo usare setTint sulle GIF HTML, le facciamo lampeggiare!
                    this.tweens.add({
                        targets: defenderSprite,
                        alpha: 0.2, // Diventa quasi trasparente
                        x: defenderSprite.x + (isPlayerAttacking ? 10 : -10), // Trema
                        duration: 50,
                        yoyo: true,
                        repeat: 3 // Trema 3 volte
                    });
                }

                // Controllo KO e fine turno
                if (!action.def.alive) {
                    this.time.delayedCall(2000, () => {
                        this.logText.setText(action.def === this.eEntity ? 'HAI VINTO! 🎉' : 'HAI PERSO... 💀');

                        // Il Pokémon sconfitto cade verso il basso e scompare
                        this.tweens.add({
                            targets: defenderSprite,
                            y: defenderSprite.y + 100,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => {
                                if (this.socket) this.socket.emit('setInBattle', false);
                                this.scene.stop(); this.scene.resume('WorldScene');
                            }
                        });
                    });
                } else {
                    this.time.delayedCall(2000, onComplete);
                }
            }
        });
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