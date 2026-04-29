# ⚡ Quiz Arena — Real-Time Multiplayer Quiz Game

A full-stack real-time multiplayer quiz battle game built with **Socket.io**, **Node.js**, and **React**.

##  Live Demo

**Play Now:** [https://ashraful2512.github.io/Online-Quiz-Game/](https://ashraful2512.github.io/Online-Quiz-Game/)

**Backend API:** [https://online-quiz-game-uttq.onrender.com](https://online-quiz-game-uttq.onrender.com)

> **Quick Start:** Open the live demo in multiple browser tabs to test multiplayer functionality!

## 🚀 Features

| Feature | Details |
|---|---|
| 🏠 Room System | Create or join rooms with a 6-character code |
| ⚡ Real-Time | Socket.io WebSocket communication |
| ⏱️ Timer | 15-second countdown per question |
| 🎯 Speed Bonus | Faster answers = more points (up to 150 pts) |
| 🏆 Live Leaderboard | Updates after every question |
| 👥 Multi-Player | Up to 8 players per room |
| 🎲 Question Bank | 12 questions, 8 random per game |
| 👑 Host Controls | Start game, play again |
| 🔄 Restart | Host can start a new round |
| 📋 Room Codes | Easy shareable 6-letter codes |

---

## 📁 Project Structure

```
quiz-arena/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── questions.js      # Question bank
│   └── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js               # Main app + routing
│   │   ├── App.css              # All styles
│   │   ├── index.js             # Entry point
│   │   ├── context/
│   │   │   └── SocketContext.js # Socket.io React context
│   │   ├── hooks/
│   │   │   └── useGame.js       # Central game state hook
│   │   └── components/
│   │       ├── HomeScreen.js    # Create/Join room UI
│   │       ├── Lobby.js         # Waiting room
│   │       ├── Countdown.js     # 3-2-1 countdown
│   │       ├── QuestionScreen.js# Question + options + timer
│   │       ├── QuestionResult.js# Per-round results
│   │       ├── GameOver.js      # Final leaderboard
│   │       └── Notification.js  # Toast notifications
│   └── package.json
└── package.json
```

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js v16+
- npm

### 1. Install dependencies

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Start the server

```bash
cd server
npm run dev       # with nodemon (auto-reload)
# or
npm start         # production
```

Server runs on **http://localhost:3001**

### 3. Start the client

```bash
cd client
npm start
```

Client runs on **http://localhost:3000**

---

## 🎮 How to Play

1. **Open** `http://localhost:3000` in your browser
2. **Create a Room** — Enter your name → click "Create Battle Room"
3. **Share the Room Code** — Give the 6-letter code to friends
4. **Friends Join** — They enter the code on the Join tab
5. **Host Starts** — Click "Start Battle" when everyone is ready
6. **Answer Fast** — 15 seconds per question. Speed = bonus points!
7. **View Results** — Leaderboard shown after each question
8. **Winner Crowned** — Final standings shown at the end
9. **Play Again** — Host can restart without leaving the room

---

## 🔌 Socket.io Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `createRoom` | `{ playerName }` | Create a new room |
| `joinRoom` | `{ playerName, roomId }` | Join existing room |
| `startGame` | `{ roomId }` | Host starts the game |
| `submitAnswer` | `{ roomId, answerIndex }` | Player submits answer |
| `restartGame` | `{ roomId }` | Host restarts |
| `leaveRoom` | `{ roomId }` | Player leaves |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `roomUpdate` | room data | Room state changed |
| `playerJoined` | `{ name }` | New player joined |
| `playerLeft` | `{ name }` | Player left |
| `gameStarting` | `{ countdown }` | Game about to start |
| `question` | question data | New question |
| `answerFeedback` | `{ correct, points }` | Your answer result |
| `playerAnswered` | counts | Someone answered |
| `questionResult` | results + leaderboard | Round over |
| `gameOver` | leaderboard + winner | Game finished |
| `gameRestart` | — | Host restarted |

---

## 🏆 Scoring System

```
Base Points:    100 pts for correct answer
Speed Bonus:    0–50 pts (based on how fast you answer)
Wrong Answer:   0 pts
Max per Q:      150 pts
```

---

## 🛠️ Extending the Game

### Add more questions
Edit `server/questions.js` — add objects with this shape:
```js
{
  id: 13,
  question: "Your question here?",
  options: ["A", "B", "C", "D"],
  answer: 0,        // index of correct option (0-3)
  category: "Tech",
}
```

### Change game settings
In `server/index.js`:
```js
const QUESTION_TIME = 15;  // seconds per question
const POINTS_BASE = 100;   // base points for correct answer
const BONUS_MAX = 50;      // max speed bonus
```
In `server/questions.js`:
```js
getRandomQuestions(8)  // change 8 to more/fewer questions
```

### Change max players
In `server/index.js`, find:
```js
if (Object.keys(room.players).length >= 8)
```
Change `8` to your desired limit.

---

## 🌐 Deploying

### Server (Railway / Render / Fly.io)
- Set `PORT` environment variable
- Deploy `server/` directory
- Update client's socket URL

### Client (Vercel / Netlify)
- Update socket URL in `SocketContext.js`:
  ```js
  const socket = io("https://your-server.railway.app", ...)
  ```
- Run `npm run build` in `client/`
- Deploy the `build/` folder

---

## 📦 Tech Stack

- **Backend**: Node.js, Express, Socket.io, uuid
- **Frontend**: React 18, Socket.io-client
- **Styling**: Pure CSS (custom properties, animations)
- **Fonts**: Bebas Neue, Rajdhani, Share Tech Mono
