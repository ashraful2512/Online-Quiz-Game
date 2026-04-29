const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { getRandomQuestions, getRandomQuestionsByDifficulty, AVAILABLE_CATEGORIES } = require("./questions");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory store
const rooms = {}; // roomId -> room object
const players = {}; // socketId -> { name, roomId }

const QUESTION_TIME = 15; // seconds per question
const POINTS_BASE = 100;
const BONUS_MAX = 50;
const QUESTION_COUNT = 10; // Changed from 8 to 10

// Game Modes Configuration
const GAME_MODES = {
  classic: {
    name: "Classic",
    description: "Mixed difficulty with standard scoring",
    questionCount: 10,
    timer: 15,
    speedBonusMultiplier: 1,
    difficultyDistribution: { easy: 5, medium: 3, hard: 2 },
    scoring: "standard",
    icon: "🎯"
  },
  speedrun: {
    name: "Speed Run",
    description: "Fast-paced with extra speed bonuses",
    questionCount: 8,
    timer: 10,
    speedBonusMultiplier: 2,
    difficultyDistribution: { medium: 8 }, // All medium difficulty
    scoring: "speed",
    icon: "⚡"
  },
  survival: {
    name: "Survival",
    description: "Elimination mode - wrong answers eliminate players",
    questionCount: 12,
    timer: 20,
    speedBonusMultiplier: 0.5,
    difficultyDistribution: { easy: 4, medium: 4, hard: 4 },
    scoring: "elimination",
    icon: "🛡️"
  },
  category: {
    name: "Category Master",
    description: "Focus on a single category",
    questionCount: 12,
    timer: 15,
    speedBonusMultiplier: 1,
    difficultyDistribution: null, // Use category difficulty
    scoring: "standard",
    icon: "🎨"
  }
};

function createRoom(hostName, hostSocketId, gameMode = 'classic', categoryId = null) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const modeConfig = GAME_MODES[gameMode] || GAME_MODES.classic;
  
  rooms[roomId] = {
    id: roomId,
    host: hostSocketId,
    hostName,
    players: {},
    status: "waiting", // waiting | countdown | playing | results
    gameMode: gameMode,
    modeConfig: modeConfig,
    questions: [],
    currentQuestion: 0,
    questionTimer: null,
    questionStartTime: null,
    answers: {}, // questionIndex -> { socketId -> answerIndex }
    categoryId: categoryId, // Store selected category
    eliminatedPlayers: new Set(), // For survival mode
  };
  return roomId;
}

function getPublicRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return null;
  return {
    id: room.id,
    hostName: room.hostName,
    status: room.status,
    playerCount: Object.keys(room.players).length,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      answered: p.answered,
    })),
    currentQuestion: room.currentQuestion,
    totalQuestions: room.questions.length,
  };
}

function getLeaderboard(room) {
  return Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, id: p.id }));
}

function startQuestion(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const q = room.questions[room.currentQuestion];
  room.questionStartTime = Date.now();
  room.answers[room.currentQuestion] = {};

  // Reset answered state
  Object.values(room.players).forEach((p) => (p.answered = false));

  io.to(roomId).emit("question", {
    index: room.currentQuestion,
    total: room.questions.length,
    question: q.question,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty || 'medium',
    points: q.points || POINTS_BASE,
    difficultyColor: q.difficultyColor || '#ffd700',
    timeLimit: room.modeConfig.timer,
    gameMode: room.gameMode,
    modeConfig: room.modeConfig,
  });

  // Auto-advance after timer
  room.questionTimer = setTimeout(() => {
    revealAnswer(roomId);
  }, room.modeConfig.timer * 1000);
}

function revealAnswer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTimeout(room.questionTimer);

  const q = room.questions[room.currentQuestion];
  const answersForQ = room.answers[room.currentQuestion] || {};

  // Calculate results for this question
  const questionResults = Object.values(room.players).map((p) => ({
    name: p.name,
    answered: answersForQ[p.id] !== undefined,
    correct: answersForQ[p.id] === q.answer,
    score: p.score,
  }));

  io.to(roomId).emit("questionResult", {
    correctAnswer: q.answer,
    results: questionResults,
    leaderboard: getLeaderboard(room),
  });

  // Move to next question or end game
  setTimeout(() => {
    room.currentQuestion++;
    if (room.currentQuestion < room.questions.length) {
      startQuestion(roomId);
    } else {
      endGame(roomId);
    }
  }, 6000); // Increased from 4s to 6s to give more time to see feedback
}

function endGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.status = "results";

  io.to(roomId).emit("gameOver", {
    leaderboard: getLeaderboard(room),
    winner: getLeaderboard(room)[0] || null,
  });
}

// REST endpoint to list open rooms
app.get("/rooms", (req, res) => {
  const openRooms = Object.values(rooms)
    .filter((r) => r.status === "waiting")
    .map((r) => ({
      id: r.id,
      hostName: r.hostName,
      playerCount: Object.keys(r.players).length,
    }));
  res.json(openRooms);
});

// REST endpoint to get available categories
app.get("/categories", (req, res) => {
  res.json(AVAILABLE_CATEGORIES);
});

// REST endpoint to get available game modes
app.get("/gamemodes", (req, res) => {
  res.json(Object.entries(GAME_MODES).map(([key, config]) => ({
    id: key,
    ...config
  })));
});

// Socket.io
io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // Create room
  socket.on("createRoom", ({ playerName, gameMode = 'classic', categoryId }, callback) => {
    const roomId = createRoom(playerName, socket.id, gameMode, categoryId);
    const room = rooms[roomId];

    players[socket.id] = { name: playerName, roomId };
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      score: 0,
      answered: false,
      eliminated: false, // For survival mode
    };

    socket.join(roomId);
    callback({ success: true, roomId });
    io.to(roomId).emit("roomUpdate", getPublicRoom(roomId));
    
    const categoryName = categoryId ? 
      AVAILABLE_CATEGORIES.find(c => c.id === categoryId)?.name || 'Unknown' : 
      'All Categories';
    console.log(`Room created: ${roomId} by ${playerName} (Mode: ${room.modeConfig.name}, Category: ${categoryName})`);
  });

  // Join room
  socket.on("joinRoom", ({ playerName, roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, error: "Room not found" });
    if (room.status !== "waiting")
      return callback({ success: false, error: "Game already started" });
    if (Object.keys(room.players).length >= 8)
      return callback({ success: false, error: "Room is full (max 8)" });

    players[socket.id] = { name: playerName, roomId };
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      score: 0,
      answered: false,
    };

    socket.join(roomId);
    callback({ success: true, roomId });
    io.to(roomId).emit("roomUpdate", getPublicRoom(roomId));
    io.to(roomId).emit("playerJoined", { name: playerName });
    console.log(`${playerName} joined room ${roomId}`);
  });

  // Start game (host only)
  socket.on("startGame", async ({ roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false, error: "Room not found" });
    if (room.host !== socket.id)
      return callback?.({ success: false, error: "Only host can start" });
    if (Object.keys(room.players).length < 1)
      return callback?.({ success: false, error: "Need at least 1 player" });

    try {
      const modeConfig = room.modeConfig;
      
      // Fetch questions based on game mode
      let questions;
      if (room.gameMode === 'category' && room.categoryId) {
        // Category Master mode - use specific category
        questions = await getRandomQuestions(modeConfig.questionCount, room.categoryId);
      } else if (room.gameMode === 'speedrun') {
        // Speed Run mode - all medium difficulty
        questions = await getRandomQuestionsByDifficulty(modeConfig.difficultyDistribution);
      } else if (room.gameMode === 'survival') {
        // Survival mode - mixed difficulty
        questions = await getRandomQuestionsByDifficulty(modeConfig.difficultyDistribution);
      } else {
        // Classic mode - mixed difficulty
        questions = await getRandomQuestions(modeConfig.questionCount, room.categoryId);
      }
      
      room.questions = questions;
      room.currentQuestion = 0;
      room.status = "countdown";

      io.to(roomId).emit("gameStarting", { 
        countdown: 3,
        gameMode: room.gameMode,
        modeConfig: modeConfig
      });

      setTimeout(() => {
        room.status = "playing";
        startQuestion(roomId);
      }, 3000);

      callback?.({ success: true });
    } catch (error) {
      console.error("Error starting game:", error);
      callback?.({ success: false, error: "Failed to load questions" });
    }
  });

  // Submit answer
  socket.on("submitAnswer", ({ roomId, answerIndex }) => {
    const room = rooms[roomId];
    if (!room || room.status !== "playing") return;

    const player = room.players[socket.id];
    if (!player || player.answered) return;

    const qIndex = room.currentQuestion;
    if (room.answers[qIndex] === undefined) return;
    if (room.answers[qIndex][socket.id] !== undefined) return; // already answered

    player.answered = true;
    room.answers[qIndex][socket.id] = answerIndex;

    const q = room.questions[room.currentQuestion];
    const elapsed = (Date.now() - room.questionStartTime) / 1000;
    const basePoints = q.points || POINTS_BASE;
    const timeBonus = Math.max(0, BONUS_MAX * room.modeConfig.speedBonusMultiplier * (1 - elapsed / room.modeConfig.timer));

    if (answerIndex === q.answer) {
      const points = Math.round(basePoints + timeBonus);
      player.score += points;
      socket.emit("answerFeedback", { correct: true, points, basePoints, difficulty: q.difficulty || 'medium' });
      
      // Survival mode: eliminate players on wrong answers
      if (room.gameMode === 'survival') {
        // Player survives this round
        player.eliminated = false;
      }
    } else {
      socket.emit("answerFeedback", { correct: false, points: 0, basePoints, difficulty: q.difficulty || 'medium' });
      
      // Survival mode: eliminate players on wrong answers
      if (room.gameMode === 'survival') {
        player.eliminated = true;
        room.eliminatedPlayers.add(socket.id);
        socket.emit("eliminated", { reason: "wrong_answer" });
        io.to(room.id).emit("playerEliminated", { 
          playerId: socket.id, 
          playerName: player.name 
        });
      }
    }

    // Update answered status to all
    io.to(roomId).emit("playerAnswered", {
      playerId: socket.id,
      answeredCount: Object.values(room.players).filter((p) => p.answered).length,
      totalPlayers: Object.keys(room.players).length,
    });

    // If everyone answered, reveal early
    const allAnswered = Object.values(room.players).every((p) => p.answered);
    if (allAnswered) {
      clearTimeout(room.questionTimer);
      revealAnswer(roomId);
    }
  });

  // Restart game (host)
  socket.on("restartGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.host !== socket.id) return;

    room.status = "waiting";
    room.currentQuestion = 0;
    room.questions = [];
    room.answers = {};
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.answered = false;
    });

    io.to(roomId).emit("roomUpdate", getPublicRoom(roomId));
    io.to(roomId).emit("gameRestart");
  });

  // Leave / disconnect
  socket.on("leaveRoom", ({ roomId }) => handleLeave(socket, roomId));

  socket.on("disconnect", () => {
    const p = players[socket.id];
    if (p) handleLeave(socket, p.roomId);
    console.log(`[-] Disconnected: ${socket.id}`);
  });

  function handleLeave(socket, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    const playerName = room.players[socket.id]?.name;
    delete room.players[socket.id];
    delete players[socket.id];
    socket.leave(roomId);

    if (Object.keys(room.players).length === 0) {
      // Clean up empty room
      clearTimeout(room.questionTimer);
      delete rooms[roomId];
      console.log(`Room ${roomId} deleted (empty)`);
      return;
    }

    // If host left, assign new host
    if (room.host === socket.id) {
      room.host = Object.keys(room.players)[0];
      room.hostName = room.players[room.host].name;
    }

    io.to(roomId).emit("playerLeft", { name: playerName });
    io.to(roomId).emit("roomUpdate", getPublicRoom(roomId));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Quiz server running on port ${PORT}`));
