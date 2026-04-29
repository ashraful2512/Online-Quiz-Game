import React from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { useGame } from "./hooks/useGame";
import HomeScreen from "./components/HomeScreen";
import Lobby from "./components/Lobby";
import Countdown from "./components/Countdown";
import QuestionScreen from "./components/QuestionScreen";
import QuestionResult from "./components/QuestionResult";
import GameOver from "./components/GameOver";
import Notification from "./components/Notification";
import LoadingSpinner from "./components/LoadingSpinner";
import "./App.css";

function Game() {
  const { socket, connected } = useSocket();
  const {
    phase, roomId, playerName, isHost, roomData, question,
    timeLeft, selectedAnswer, feedback, questionResult, leaderboard,
    winner, countdown, answeredCount, notification, isLoading,
    createRoom, joinRoom, startGame, submitAnswer, restartGame, leaveRoom,
  } = useGame(socket);

  return (
    <div className="app">
      <div className="app-bg" />
      <div className="app-grid" />

      {/* Connection indicator */}
      <div className={`connection-dot ${connected ? "online" : "offline"}`}>
        <span />{connected ? "Connected" : "Reconnecting..."}
      </div>

      <Notification message={notification} />

      <div className="container">
        {isLoading ? (
          <LoadingSpinner message="Loading questions..." />
        ) : (
          <>
            {phase === "home" && (
              <HomeScreen onCreate={createRoom} onJoin={joinRoom} />
            )}
            {phase === "lobby" && (
              <Lobby
                roomId={roomId}
                isHost={isHost}
                roomData={roomData}
                playerName={playerName}
                onStart={startGame}
                onLeave={leaveRoom}
              />
            )}
            {phase === "countdown" && <Countdown count={countdown} />}
            {phase === "playing" && (
              <QuestionScreen
                question={question}
                timeLeft={timeLeft}
                selectedAnswer={selectedAnswer}
                feedback={feedback}
                answeredCount={answeredCount}
                onAnswer={submitAnswer}
              />
            )}
            {phase === "result" && (
              <QuestionResult
                result={questionResult}
                leaderboard={leaderboard}
                question={question}
              />
            )}
            {phase === "gameover" && (
              <GameOver
                leaderboard={leaderboard}
                winner={winner}
                playerName={playerName}
                isHost={isHost}
                onRestart={restartGame}
                onLeave={leaveRoom}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <Game />
    </SocketProvider>
  );
}
