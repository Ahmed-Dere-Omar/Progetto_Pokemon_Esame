const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

const gestionePartita = require('./gestione_partita.js');

const moveDBArray = JSON.parse(fs.readFileSync(__dirname + '/DB/DB_mosse.json', 'utf8'));
const moveDB = {};
moveDBArray.forEach(m => moveDB[m.Nome] = m);

// Aggiungiamo Scontro fittizia per quando finiscono i PP anche sul server
moveDB["Scontro"] = {
    Nome: "Scontro",
    Tipo: "Normale",
    Categoria: "Fisico",
    Potenza: 50,
    Precisione: 100,
    PP: 1,
    ppAttuali: 1,
    ppMassimi: 1,
    Bersaglio: "AltroVicino",
    CodiceFunzione: [
        { NomeFunzione: "DannoContraccolpo", Parametri: { Percentuale: 25, Su: "PSMassimi" } }
    ],
    Flags: ["Contatto"]
};

const pkmnDBArray = JSON.parse(fs.readFileSync(__dirname + '/DB/DB_pokemon.json', 'utf8'));
const pkmnDB = {};
pkmnDBArray.forEach(p => pkmnDB[p.nome] = p);

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(__dirname + '/game.html'));

// --- DATABASE DEL SERVER ---
const players = {};
const battleRooms = {};

io.on('connection', (socket) => {
    console.log(`Connessione stabilita: ${socket.id}`);

    // ==========================================
    // 1. GESTIONE GIOCATORI E MAPPA
    // ==========================================
    socket.on('joinGame', (playerName) => {
        players[socket.id] = {
            playerId: socket.id,
            name: playerName,
            x: 100, y: 100, anim: 'down',
            inBattle: false
        };
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('disconnect', socket.id);
        }
    });

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].anim = data.anim;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // ==========================================
    // 2. MATCHMAKING PVP E STATO BATTAGLIA
    // ==========================================
    socket.on('setInBattle', (status) => {
        if (players[socket.id]) players[socket.id].inBattle = status;
    });

    socket.on('challengePlayer', (targetId) => {
        if (players[targetId] && players[targetId].inBattle) {
            socket.emit('opponentBusy');
        } else {
            io.to(targetId).emit('challengeReceived', socket.id);
        }
    });

    socket.on('acceptChallenge', (challengerId) => {
        let roomId = `battle_${challengerId}_${socket.id}`;
        battleRooms[roomId] = { 
            p1: challengerId, 
            p2: socket.id, 
            selections: {}, 
            moves: {},
            partitaObj: null 
        };
        
        io.to(challengerId).emit('startPvP', { roomId, isPlayerOne: true });
        io.to(socket.id).emit('startPvP', { roomId, isPlayerOne: false });
    });

    // ==========================================
    // 3. MOTORE DI LOTTA PVP
    // ==========================================
    socket.on('pvpSelectPokemon', (data) => {
        let room = battleRooms[data.roomId];
        if (!room) return;

        room.selections[socket.id] = data.pkmnName;
        
        if (Object.keys(room.selections).length === 2) {
            // Crea i due giocatori usando il database del server
            let p1Name = room.selections[room.p1];
            let p2Name = room.selections[room.p2];
            let p1Data = pkmnDB[p1Name];
            let p2Data = pkmnDB[p2Name];
            
            let creaSquadra = (pData) => {
                let mosseRandom = [...pData.mosse].sort(() => 0.5 - Math.random()).slice(0, 4);
                let baseHp = Math.floor(pData.statistiche.hp.base_stat * 1.5);
                return [{
                    nome: pData.nome,
                    hp: baseHp,
                    hpMax: baseHp,
                    statistiche: {
                        attacco: pData.statistiche.attack.base_stat,
                        difesa: pData.statistiche.defense.base_stat,
                        attaccoSpeciale: pData.statistiche['special-attack'].base_stat,
                        difesaSpeciale: pData.statistiche['special-defense'].base_stat,
                        velocita: pData.statistiche.speed.base_stat
                    },
                    modificatori: {},
                    tipi: pData.tipi,
                    livello: 50,
                    stato: null,
                    mosse: mosseRandom.map(mName => {
                        let mData = moveDB[mName];
                        if (!mData) return null;
                        return {
                            ...mData,
                            ppAttuali: mData.PP, // Inizializza i PP dal DB
                            ppMassimi: mData.PP
                        };
                    }).filter(m => m)
                }];
            };

            let player1 = { id: room.p1, squadra: creaSquadra(p1Data), attivoIdx: 0 };
            let player2 = { id: room.p2, squadra: creaSquadra(p2Data), attivoIdx: 0 };
            
            room.partitaObj = new gestionePartita(player1, player2);
            
            io.to(room.p1).emit('pvpBothSelected', room.selections);
            io.to(room.p2).emit('pvpBothSelected', room.selections);
        }
    });

    socket.on('pvpUseMove', (data) => {
        let room = battleRooms[data.roomId];
        if (!room || !room.partitaObj) return;

        room.moves[socket.id] = data.moveName;
        
        if (Object.keys(room.moves).length === 2) {
            let azioneP1 = { mossa: moveDB[room.moves[room.p1]] };
            let azioneP2 = { mossa: moveDB[room.moves[room.p2]] };
            
            let statoAggiornato = room.partitaObj.processaTurno(azioneP1, azioneP2);
            
            io.to(room.p1).emit('resolveTurn', { stato: statoAggiornato, inverti: false });
            io.to(room.p2).emit('resolveTurn', { stato: statoAggiornato, inverti: true });
            
            room.moves = {}; // Reset turno
        }
    });
});

server.listen(8081, () => console.log('Server online su porta 8081'));