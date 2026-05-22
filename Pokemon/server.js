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
        for (let roomId in battleRooms) {
            let room = battleRooms[roomId];
            if (room.p1 === socket.id || room.p2 === socket.id) {
                let winnerId = (room.p1 === socket.id) ? room.p2 : room.p1;
                let statoForfait = {
                    finito: true,
                    logs: ["L'avversario si è disconnesso o è fuggito! Hai vinto a tavolino!"],
                    p1: { sconfitto: room.p1 === socket.id, squadra: [] },
                    p2: { sconfitto: room.p2 === socket.id, squadra: [] }
                };
                io.to(winnerId).emit('resolveTurn', { stato: statoForfait, inverti: winnerId === room.p2 });
                delete battleRooms[roomId];
            }
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
    // 3. MOTORE DI LOTTA PVP (Basato su Squadre Reali)
    // ==========================================
    socket.on('pvpSelectPokemon', (data) => {
        let room = battleRooms[data.roomId];
        if (!room) return;

        // Il client ci manda l'intera squadra già costruita e formattata!
        room.selections[socket.id] = { team: data.team, activeIdx: data.activeIdx };

        if (Object.keys(room.selections).length === 2) {
            let p1Data = room.selections[room.p1];
            let p2Data = room.selections[room.p2];

            let player1 = { id: room.p1, squadra: p1Data.team, attivoIdx: p1Data.activeIdx };
            let player2 = { id: room.p2, squadra: p2Data.team, attivoIdx: p2Data.activeIdx };

            room.partitaObj = new gestionePartita(player1, player2);

            io.to(room.p1).emit('pvpBothSelected', room.selections);
            io.to(room.p2).emit('pvpBothSelected', room.selections);
        }
    });

    socket.on('pvpUseMove', (data) => {
        let room = battleRooms[data.roomId];
        if (!room || !room.partitaObj) return;

        // Se è uno switch forzato (dopo un KO), si esegue SUBITO gratis senza aspettare l'avversario!
        if (data.tipo === 'forced_switch') {
            let player = socket.id === room.p1 ? room.partitaObj.p1 : room.partitaObj.p2;
            player.attivoIdx = data.nuovoIdx;

            let nuovoPk = player.squadra[player.attivoIdx];
            room.partitaObj.logs = [`L'allenatore manda in campo ${nuovoPk.nome}! `];

            let statoAggiornato = room.partitaObj.ottieniStatoAggiornato();
            io.to(room.p1).emit('resolveTurn', { stato: statoAggiornato, inverti: false });
            io.to(room.p2).emit('resolveTurn', { stato: statoAggiornato, inverti: true });
            return;
        }

        room.moves[socket.id] = data;

        if (Object.keys(room.moves).length === 2) {
            let rawP1 = room.moves[room.p1];
            let rawP2 = room.moves[room.p2];

            let buildAzione = (raw) => {
                if (raw.tipo === 'switch') return raw;
                if (raw.tipo === 'flee') return raw;
                return { mossa: moveDB[raw.moveName] || moveDB["Scontro"] };
            };

            let azioneP1 = buildAzione(rawP1);
            let azioneP2 = buildAzione(rawP2);

            let statoAggiornato = room.partitaObj.processaTurno(azioneP1, azioneP2);

            io.to(room.p1).emit('resolveTurn', { stato: statoAggiornato, inverti: false });
            io.to(room.p2).emit('resolveTurn', { stato: statoAggiornato, inverti: true });

            room.moves = {};
        }
    });
});

server.listen(8081, () => console.log('Server online su porta 8081'));