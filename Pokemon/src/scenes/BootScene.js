// src/scenes/BootScene.js

export default class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
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
