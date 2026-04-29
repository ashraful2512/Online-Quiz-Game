import React from "react";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function QuestionResult({ result, leaderboard, question }) {
  if (!result) return null;

  return (
    <div className="result-screen">
      <div className="result-header">
        <h2>Round Results</h2>
        <p className="correct-answer-label">
          Correct answer: <strong>{question?.options?.[result.correctAnswer]}</strong>
        </p>
      </div>

      <div className="leaderboard-live">
        <h3>🏆 Leaderboard</h3>
        <div className="leaderboard-list">
          {leaderboard.map((p, i) => (
            <div key={p.id} className={`lb-row ${i === 0 ? "leader" : ""}`}>
              <span className="lb-rank">{MEDALS[i] || `#${p.rank}`}</span>
              <span className="lb-name">{p.name}</span>
              <span className="lb-score">{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="next-hint">Next question coming up...</div>
    </div>
  );
}
