import React, { useState, useEffect } from "react";

export default function HomeScreen({ onCreate, onJoin }) {
  const [tab, setTab] = useState("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gameModes, setGameModes] = useState([]);
  const [selectedGameMode, setSelectedGameMode] = useState("classic");

  useEffect(() => {
    // Fetch available categories
    fetch("https://online-quiz-game-uttq.onrender.com/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => console.error("Failed to fetch categories:", err));

    // Fetch available game modes
    fetch("https://online-quiz-game-uttq.onrender.com/gamemodes")
      .then((res) => res.json())
      .then((data) => {
        setGameModes(data);
      })
      .catch((err) => console.error("Failed to fetch game modes:", err));
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (name.trim()) onCreate(name.trim(), selectedGameMode, selectedCategory ? parseInt(selectedCategory) : null);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim() && roomCode.trim()) onJoin(name.trim(), roomCode.trim());
  };

  return (
    <div className="home-screen">
      <div className="hero">
        <div className="hero-badge">LIVE QUIZ</div>
        <h1 className="hero-title">
          <span className="title-main">QUIZ</span>
          <span className="title-sub">ARENA</span>
        </h1>
        <p className="hero-desc">Battle your friends in real-time trivia combat</p>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">1,350</span>
            <span className="stat-label">Max Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">10</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">8</span>
            <span className="stat-label">Players</span>
          </div>
        </div>
      </div>

      <div className="card form-card">
        <div className="tab-bar">
          <button className={`tab-btn ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
            Create Room
          </button>
          <button className={`tab-btn ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>
            Join Room
          </button>
        </div>

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="form">
            <div className="field">
              <label>Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Game Mode</label>
              <div className="game-modes-grid">
                {gameModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`game-mode-card ${selectedGameMode === mode.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGameMode(mode.id)}
                  >
                    <div className="mode-icon">{mode.icon}</div>
                    <div className="mode-info">
                      <div className="mode-name">{mode.name}</div>
                      <div className="mode-desc">{mode.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(selectedGameMode === 'category') && (
              <div className="field">
                <label>Category (Required for Category Master)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(selectedGameMode === 'classic') && (
              <div className="field">
                <label>Category (Optional)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories (Mixed Difficulty)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              <span>⚡</span> Create Battle Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="form">
            <div className="field">
              <label>Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
              />
            </div>
            <div className="field">
              <label>Room Code</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-letter code..."
                maxLength={6}
                className="code-input"
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={!name.trim() || !roomCode.trim()}>
              <span>🎯</span> Join Battle
            </button>
          </form>
        )}
      </div>

      <div className="features">
        <div className="feature-item">
          <div className="feature-icon">⚡</div>
          <div className="feature-content">
            <h4>Speed Bonus</h4>
            <p>Answer faster for extra points</p>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🏆</div>
          <div className="feature-content">
            <h4>Live Leaderboard</h4>
            <p>Real-time score tracking</p>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🎯</div>
          <div className="feature-content">
            <h4>Mixed Difficulty</h4>
            <p>Easy, Medium & Hard questions</p>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">👥</div>
          <div className="feature-content">
            <h4>Multiplayer Battles</h4>
            <p>Up to 8 players per room</p>
          </div>
        </div>
      </div>
    </div>
  );
}
