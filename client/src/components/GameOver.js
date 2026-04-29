import React from "react";

const MEDALS = ["🥇", "🥈", "🥉"];
const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bcb"];

export default function GameOver({ leaderboard, winner, playerName, isHost, onRestart, onLeave }) {
  const myRank = leaderboard.findIndex((p) => p.name === playerName) + 1;
  const myScore = leaderboard.find((p) => p.name === playerName)?.score || 0;
  const isWinner = winner?.name === playerName;

  return (
    <div className="gameover-screen">
      {/* Winner spotlight */}
      <div className="winner-spotlight">
        <div className="crown-emoji">👑</div>
        <div className="winner-name">{winner?.name}</div>
        <div className="winner-score">{winner?.score?.toLocaleString()} pts</div>
        <div className="winner-label">CHAMPION</div>
      </div>

      {isWinner && (
        <div className="you-won-banner">🎉 YOU WON! 🎉</div>
      )}

      {/* Your result */}
      <div className="my-result">
        <span>You finished</span>
        <span className="my-rank">#{myRank}</span>
        <span>with {myScore.toLocaleString()} pts</span>
      </div>

      {/* Full leaderboard */}
      <div className="final-leaderboard">
        <h3>Final Standings</h3>
        <div className="leaderboard-list">
          {leaderboard.map((p, i) => (
            <div key={p.id} className={`lb-row ${p.name === playerName ? "self" : ""} ${i === 0 ? "leader" : ""}`}>
              <span className="lb-rank">{MEDALS[i] || `#${p.rank}`}</span>
              <span className="lb-name">{p.name}{p.name === playerName ? " (You)" : ""}</span>
              <span className="lb-score">{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gameover-actions">
        {isHost && (
          <button className="btn btn-primary" onClick={onRestart}>
            🔄 Play Again
          </button>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>
          🚪 Leave Room
        </button>
      </div>
    </div>
  );
}
