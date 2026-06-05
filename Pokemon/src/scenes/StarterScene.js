// src/scenes/StarterScene.js

export default class StarterScene extends Phaser.Scene {
    constructor() { super({ key: 'StarterScene' }); }

    init(data) {
        this.user = data.user;
        this.playerName = data.name;
        this.starters = data.starters || [];
    }

    create() {
        const pkmnDB = this.registry.get('pokemonDB');

        let html = `
            <div style="background-color: #0B0C10; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1000px; height: 800px; box-sizing: border-box;">
                <h1 class="text-shadows" style="font-size: 3.5rem; margin-bottom: 20px;">PACCHETTO BENVENUTO!</h1>
                <h2 style="color: #fff; font-family: 'Courier New'; margin-bottom: 40px; text-align: center;">Ecco i tuoi primi compagni di avventura:</h2>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 50px;">
        `;

        this.starters.forEach(p => {
            let pData = pkmnDB[p.id_specie];
            let sprite = pData?.sprite?.normal || '';
            html += `
                <div style="background: var(--battle-panel); border: 4px solid var(--color-secondary); border-radius: 12px; padding: 20px; text-align: center; width: 180px; box-shadow: 6px 6px 0 var(--battle-shadow-heavy);">
                    <img src="${sprite}" style="width: 130px; height: 130px; image-rendering: pixelated; filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.5));">
                    <h2 style="color: var(--battle-accent); font-family: 'Courier New'; margin-top: 15px; font-size: 1.2rem;">${p.id_specie.toUpperCase()}</h2>
                </div>
            `;
        });

        html += `
                </div>
                <button id="start-adventure-btn" style="padding: 20px 50px; font-size: 1.8rem; font-family: 'Courier New', monospace; font-weight: bold; background-color: #f6eedf; color: #ff7477; border: 4px solid #ff7477; border-radius: 8px; cursor: pointer; box-shadow: 6px 6px 0 #e69597;">INIZIA L'AVVENTURA!</button>
            </div>
        `;

        let dom = this.add.dom(500, 400).createFromHTML(html);

        dom.addListener('click').on('click', (e) => {
            if (e.target.id === 'start-adventure-btn') {
                dom.destroy();
                this.scene.start('WorldScene', { name: this.playerName, user: this.user });
            }
        });
    }
}
