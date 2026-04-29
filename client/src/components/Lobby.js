import React from "react";

const AVATARS = ["🦊", "🐺", "🦁", "🐯", "🦅", "🐉", "🤖", "👾"];

export default function Lobby({ roomId, isHost, roomData, playerName, onStart, onLeave }) {
  const players = roomData?.players || [];
  const canStart = isHost && players.length >= 1;

  return (
    <div className="lobby">
      <button className="btn-back" onClick={onLeave}>← Leave</button>

      <div className="room-header">
        <div className="room-tag">WAITING ROOM</div>
        <div className="room-code-display">
          <span className="room-label">Room Code</span>
          <span className="room-code">{roomId}</span>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(roomId)}
          >
            📋 Copy
          </button>
        </div>
        <div className="game-mode-info">
          <div className="mode-title">GAME MODE</div>
          <div className="mode-details">
            {roomData?.modeConfig?.icon} {roomData?.modeConfig?.name}: {roomData?.modeConfig?.description}
          </div>
          <div className="mode-specs">
            <span className="spec-item">{roomData?.modeConfig?.questionCount} Questions</span>
            <span className="spec-item">{roomData?.modeConfig?.timer}s Timer</span>
            {roomData?.modeConfig?.speedBonusMultiplier !== 1 && (
              <span className="spec-item">{roomData?.modeConfig?.speedBonusMultiplier}x Speed Bonus</span>
            )}
          </div>
          {roomData?.gameMode === 'classic' && (
            <div className="mode-points">
              <span className="point-badge easy">Easy: 100pts</span>
              <span className="point-badge medium">Medium: 150pts</span>
              <span className="point-badge hard">Hard: 200pts</span>
            </div>
          )}
          {roomData?.gameMode === 'speedrun' && (
            <div className="mode-points">
              <span className="point-badge medium">Medium: 150pts</span>
              <span className="point-badge speed">2x Speed Bonus!</span>
            </div>
          )}
          {roomData?.gameMode === 'survival' && (
            <div className="mode-points">
              <span className="point-badge danger">Elimination Mode</span>
              <span className="point-badge medium">Wrong Answers = Out!</span>
            </div>
          )}
          {roomData?.gameMode === 'category' && (
            <div className="mode-points">
              <span className="point-badge category">Category Master</span>
              <span className="point-badge medium">12 Questions</span>
            </div>
          )}
        </div>
        {isHost && <div className="host-badge">👑 You are the host</div>}
      </div>

      <div className="players-section">
        <h3 className="section-title">
          Players <span className="player-count">{players.length}/8</span>
        </h3>
        <div className="players-grid">
          {players.map((p, i) => (
            <div key={p.id} className={`player-card ${p.name === playerName ? "self" : ""}`}>
              <div className="player-avatar">{AVATARS[i % AVATARS.length]}</div>
              <div className="player-info">
                <span className="player-name">{p.name}</span>
                {p.name === playerName && <span className="you-badge">YOU</span>}
              </div>
              {roomData?.players?.[0]?.id === p.id && <span className="host-icon">👑</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar">?</div>
              <span className="waiting-text">Waiting...</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-footer">
        {isHost ? (
          <>
            <p className="host-hint">
              {canStart ? "Ready to start the battle!" : "Wait for players to join..."}
            </p>
            <button
              className="btn btn-primary btn-large"
              onClick={onStart}
              disabled={!canStart}
            >
              ⚡ Start Battle ({players.length} player{players.length !== 1 ? "s" : ""})
            </button>
          </>
        ) : (
          <div className="waiting-host">
            <div className="pulse-dot" />
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
