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
            io.emit('playerDisconnected', socket.id);
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

            let creaSquadra = (pData, extraCount) => {
                let createPkmn = (data) => {
                    let mosseRandom = [...data.mosse].sort(() => 0.5 - Math.random()).slice(0, 4);
                    let baseHp = Math.floor(data.statistiche.hp.base_stat * 1.5);
                    return {
                        nome: data.nome,
                        hp: baseHp,
                        hpMax: baseHp,
                        statistiche: {
                            attacco: data.statistiche.attack.base_stat,
                            difesa: data.statistiche.defense.base_stat,
                            attaccoSpeciale: data.statistiche['special-attack'].base_stat,
                            difesaSpeciale: data.statistiche['special-defense'].base_stat,
                            velocita: data.statistiche.speed.base_stat
                        },
                        modificatori: {},
                        tipi: data.tipi,
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
                    };
                };

                let team = [createPkmn(pData)];
                let pkmnNames = Object.keys(pkmnDB);

                // Aggiunge Pokémon extra casuali
                for (let i = 0; i < extraCount; i++) {
                    let randomName = pkmnNames[Math.floor(Math.random() * pkmnNames.length)];
                    team.push(createPkmn(pkmnDB[randomName]));
                }

                return team;
            };

            let player1 = { id: room.p1, squadra: creaSquadra(p1Data, 3), attivoIdx: 0 }; // Team di 4
            let player2 = { id: room.p2, squadra: creaSquadra(p2Data, 3), attivoIdx: 0 }; // Team di 4

            room.partitaObj = new gestionePartita(player1, player2);

            io.to(room.p1).emit('pvpBothSelected', room.selections);
            io.to(room.p2).emit('pvpBothSelected', room.selections);
        }
    });

    socket.on('pvpUseMove', (data) => {
        let room = battleRooms[data.roomId];
        if (!room || !room.partitaObj) return;

        // Salviamo l'intero oggetto data (che contiene tipo: 'switch' o moveName)
        room.moves[socket.id] = data;

        if (Object.keys(room.moves).length === 2) {
            let rawP1 = room.moves[room.p1];
            let rawP2 = room.moves[room.p2];

            // Trasformiamo i dati grezzi in azioni comprensibili per gestione_partita
            let azioneP1 = rawP1.tipo === 'switch' ? rawP1 : { mossa: moveDB[rawP1.moveName] };
            let azioneP2 = rawP2.tipo === 'switch' ? rawP2 : { mossa: moveDB[rawP2.moveName] };

            let statoAggiornato = room.partitaObj.processaTurno(azioneP1, azioneP2);

            io.to(room.p1).emit('resolveTurn', { stato: statoAggiornato, inverti: false });
            io.to(room.p2).emit('resolveTurn', { stato: statoAggiornato, inverti: true });

            room.moves = {}; // Reset per il prossimo turno
        }
    });
});

server.listen(8081, () => console.log('Server online su porta 8081'));