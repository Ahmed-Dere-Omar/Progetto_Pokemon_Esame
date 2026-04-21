const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

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
        battleRooms[roomId] = { p1: challengerId, p2: socket.id, selections: {}, moves: {} };
        
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
            io.to(room.p1).emit('pvpBothSelected', room.selections);
            io.to(room.p2).emit('pvpBothSelected', room.selections);
        }
    });

    socket.on('pvpUseMove', (data) => {
        let room = battleRooms[data.roomId];
        if (!room) return;

        room.moves[socket.id] = data.moveName;
        
        if (Object.keys(room.moves).length === 2) {
            let randoms = {};
            // Generiamo RNG lato server per evitare desincronizzazioni!
            [room.p1, room.p2].forEach(pid => {
                randoms[pid] = { acc: Math.random(), crit: Math.random() };
            });

            let turnData = { moves: room.moves, randoms: randoms };
            io.to(room.p1).emit('resolveTurn', turnData);
            io.to(room.p2).emit('resolveTurn', turnData);
            room.moves = {}; // Reset turno
        }
    });
});

server.listen(8081, () => console.log('Server online su porta 8081'));