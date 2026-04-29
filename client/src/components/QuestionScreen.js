import React from "react";

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_COLORS = ["opt-blue", "opt-red", "opt-yellow", "opt-green"];

export default function QuestionScreen({
  question, timeLeft, selectedAnswer, feedback, answeredCount, onAnswer,
}) {
  if (!question) return null;

  const progress = (timeLeft / question.timeLimit) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="question-screen">
      {/* Header */}
      <div className="q-header">
        <div className="q-meta">
          <span className="q-category">{question.category}</span>
          <span className="q-progress">Q{question.index + 1}/{question.total}</span>
          {question.difficulty && (
            <span 
              className="difficulty-badge" 
              style={{ 
                backgroundColor: question.difficultyColor,
                color: '#000',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                animation: 'badgeGlow 2s ease-in-out infinite'
              }}
            >
              {question.difficulty}
            </span>
          )}
          {question.points && (
            <span className="points-badge" style={{
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: '1px solid #ffd700',
              animation: 'pointsPulse 1s ease-out'
            }}>
              {question.points} pts
            </span>
          )}
        </div>
        <div className={`timer-wrapper ${isUrgent ? "urgent" : ""}`}>
          <div className="timer-bar" style={{ 
            width: `${progress}%`,
            transition: isUrgent ? 'width 0.1s linear' : 'width 1s linear'
          }} />
          <span className="timer-num" style={{
            animation: isUrgent ? 'timerUrgent 0.5s infinite' : 'none'
          }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Answered count */}
      {answeredCount.total > 0 && (
        <div className="answered-bar">
          <span>{answeredCount.answered}/{answeredCount.total} answered</span>
          <div className="answered-dots">
            {Array.from({ length: answeredCount.total }).map((_, i) => (
              <div key={i} className={`dot ${i < answeredCount.answered ? "filled" : ""}`} />
            ))}
          </div>
        </div>
      )}

      {/* Question */}
      <div className="question-card">
        <p className="question-text">{question.question}</p>
      </div>

      {/* Options */}
      <div className="options-grid">
        {question.options.map((opt, i) => {
          let cls = `option-btn ${OPTION_COLORS[i]}`;
          let isCorrect = i === question.answer;
          let isSelected = i === selectedAnswer;
          
          if (selectedAnswer !== null) {
            if (isCorrect) {
              cls += " correct-answer"; // Always show correct answer in green
            } else if (isSelected) {
              cls += " wrong-answer"; // Show selected wrong answer in red
            } else {
              cls += " dimmed"; // Dim other options
            }
          }
          
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onAnswer(i)}
              disabled={selectedAnswer !== null}
            >
              <span className="opt-label">{OPTION_LABELS[i]}</span>
              <span className="opt-text">{opt}</span>
              {selectedAnswer !== null && isCorrect && (
                <span className="answer-indicator correct">✓</span>
              )}
              {selectedAnswer !== null && isSelected && !isCorrect && (
                <span className="answer-indicator wrong">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback-banner ${feedback.correct ? "correct" : "wrong"}`}>
          {feedback.correct
            ? `✅ Correct! +${feedback.points} points (${feedback.difficulty} - ${feedback.basePoints} base + speed bonus)`
            : `❌ Wrong answer! (${feedback.difficulty} - ${feedback.basePoints} pts missed)`}
        </div>
      )}

      {selectedAnswer === null && timeLeft === 0 && (
        <div className="feedback-banner wrong">⏰ Time's up!</div>
      )}
    </div>
  );
}
