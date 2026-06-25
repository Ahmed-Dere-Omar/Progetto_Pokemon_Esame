// src/scenes/BootScene.js

export default class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // --- GRAFICA BARRA DI CARICAMENTO STILE PERSONA ---
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        let loadingText = this.add.text(width / 2, height / 2 - 50, 'CARICAMENTO ASSET E MUSICA...', {
            fontFamily: '"Courier New", Courier, monospace', fontSize: '28px', fill: '#FF2A6D', fontStyle: 'bold', textShadow: '2px 2px 0px #000'
        }).setOrigin(0.5);

        let percentText = this.add.text(width / 2, height / 2 + 10, '0%', {
            fontFamily: '"Courier New", Courier, monospace', fontSize: '24px', fill: '#00F0FF', fontStyle: 'bold'
        }).setOrigin(0.5);

        let progressBox = this.add.graphics();
        let progressBar = this.add.graphics();

        // Bordo box caricamento
        progressBox.fillStyle(0x0B0C10, 0.8);
        progressBox.lineStyle(4, 0x1e293b);
        progressBox.fillRect(width / 2 - 160, height / 2 + 50, 320, 24);
        progressBox.strokeRect(width / 2 - 160, height / 2 + 50, 320, 24);

        // Aggiorna la barra man mano che scarica
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x00F0FF, 1);
            progressBar.fillRect(width / 2 - 156, height / 2 + 54, 312 * value, 16);
        });

        // Distruggi la grafica appena ha finito, prima di passare alla LoginScene
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        // ----------------------------------------------------
        this.load.json('pokemonDB', '../shared/data/DB_pokemon.json');
        this.load.json('moveDB', '../shared/data/DB_mosse.json');

        this.load.tilemapTiledJSON('map', 'assets/mappa.tmj');
        this.load.tilemapTiledJSON('mapPVE', 'assets/mappaPVE.tmj');
        this.load.tilemapTiledJSON('mapPVE2', 'assets/mappaPVE2.tmj');
        this.load.tilemapTiledJSON('mapPvP', 'assets/mappaPvP.tmj');
        this.load.tilemapTiledJSON('mapCPK', 'assets/mappaCPK.tmj');
        this.load.image('tilesA', 'assets/a.png');
        this.load.image('tilesE', 'assets/e.png');
        this.load.image('tilesC', 'assets/c.png');
        this.load.image('tilesD', 'assets/d.png');
        this.load.spritesheet('avatar', 'assets/avatar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar2', 'assets/avatar2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar3', 'assets/avatar3.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar4', 'assets/avatar4.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar5', 'assets/avatar5.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('avatar6', 'assets/avatar6.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('allenatore', 'assets/npc.png');
        this.load.image('nurse', 'assets/nurse.png');

        // === OBIETTIVO 5: Musica Lobby ===
        this.load.audio('lobby_0', encodeURI('assets/musica_lobby/Pokemon BlackWhite Music - Pokemon Center.mp3'));
        this.load.audio('lobby_1', encodeURI('assets/musica_lobby/Pokemon Center (Night) - Pokémon Diamond & Pearl.mp3'));
        this.load.audio('lobby_2', encodeURI('assets/musica_lobby/Littleroot Town.mp3'));
        this.load.audio('lobby_3', encodeURI("assets/musica_lobby/Flower Garden Yoshi's Island.mp3"));
        this.load.audio('lobby_4', encodeURI('assets/musica_lobby/Beneath the Mask.mp3'));
        this.load.audio('lobby_5', encodeURI('assets/musica_lobby/I Follow Rivers (The Magician Remix).mp3'));
        this.load.audio('lobby_6', encodeURI('assets/musica_lobby/Janice STFU.mp3'));

        // === OBIETTIVO 5: Musica Battaglia ===
        this.load.audio('battle_0', 'assets/musica_battaglia/Gym_BW.mp3');
        this.load.audio('battle_1', 'assets/musica_battaglia/Gym_DP.mp3');
        this.load.audio('battle_2', 'assets/musica_battaglia/Gym_GB.mp3');
        this.load.audio('battle_3', 'assets/musica_battaglia/Gym_JC.mp3');
        this.load.audio('battle_4', 'assets/musica_battaglia/Gym_JGS.mp3');
    }

    create() {
        let pDB = {};
        this.cache.json.get('pokemonDB').forEach(p => pDB[p.nome] = p);
        this.registry.set('pokemonDB', pDB);

        let mDB = {};
        this.cache.json.get('moveDB').forEach(m => mDB[m.Nome] = m);
        this.registry.set('moveDB', mDB);

        // === OBIETTIVO 5: Registry tracce musicali ===
        this.registry.set('lobbyTracks', [

            { key: 'lobby_0', name: 'Pokémon Center (BW)' },
            { key: 'lobby_1', name: 'Pokémon Center Night (DP)' },
            { key: 'lobby_2', name: "Littleroot Town" },
            { key: 'lobby_3', name: "Flower Garden Yoshi's Island" },
            { key: 'lobby_4', name: 'Beneath the Mask' },
            { key: 'lobby_5', name: 'I Follow Rivers (The Magician Remix)' },
            { key: 'lobby_6', name: 'Janice STFU' }

        ]);

        this.registry.set('battleTracks', [
            { key: 'battle_0', name: 'Gym (BW)' },
            { key: 'battle_1', name: 'Gym (DP)' },
            { key: 'battle_2', name: 'Gym (GB)' },
            { key: 'battle_3', name: 'Gym (JC)' },
            { key: 'battle_4', name: 'Gym (JGS)' }
        ]);

        // Initialize music state in registry
        this.registry.set('musicState', {
            currentTrackIndex: 0,
            volume: 0.5,
            isPlaying: false
        });

        this.scene.start('LoginScene');
    }
}
