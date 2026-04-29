import { useState, useEffect, useCallback, useRef } from "react";

export function useGame(socket) {
  const [phase, setPhase] = useState("home"); // home | lobby | countdown | playing | result | gameover
  const [roomId, setRoomId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct, points }
  const [questionResult, setQuestionResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [answeredCount, setAnsweredCount] = useState({ answered: 0, total: 0 });
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("roomUpdate", (data) => setRoomData(data));

    socket.on("playerJoined", ({ name }) => notify(`${name} joined the room!`));
    socket.on("playerLeft", ({ name }) => notify(`${name} left the room`));

    socket.on("gameStarting", ({ countdown: c }) => {
      setIsLoading(false);
      setPhase("countdown");
      setCountdown(c);
      let count = c;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) clearInterval(interval);
      }, 1000);
    });

    socket.on("question", (q) => {
      setIsLoading(false);
      setPhase("playing");
      setQuestion(q);
      setSelectedAnswer(null);
      setFeedback(null);
      setQuestionResult(null);
      setAnsweredCount({ answered: 0, total: 0 });
      setTimeLeft(q.timeLimit);

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    });

    socket.on("answerFeedback", (fb) => setFeedback(fb));

    socket.on("playerAnswered", ({ answeredCount: ans, totalPlayers }) => {
      setAnsweredCount({ answered: ans, total: totalPlayers });
    });

    socket.on("questionResult", (data) => {
      clearInterval(timerRef.current);
      setQuestionResult(data);
      setLeaderboard(data.leaderboard);
      setPhase("result");
    });

    socket.on("gameOver", ({ leaderboard: lb, winner: w }) => {
      setLeaderboard(lb);
      setWinner(w);
      setPhase("gameover");
    });

    socket.on("gameRestart", () => {
      setPhase("lobby");
      setQuestion(null);
      setFeedback(null);
      setQuestionResult(null);
      setLeaderboard([]);
      setWinner(null);
      setSelectedAnswer(null);
    });

    return () => {
      socket.off("roomUpdate");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("gameStarting");
      socket.off("question");
      socket.off("answerFeedback");
      socket.off("playerAnswered");
      socket.off("questionResult");
      socket.off("gameOver");
      socket.off("gameRestart");
      clearInterval(timerRef.current);
    };
  }, [socket]);

  const createRoom = useCallback((name, gameMode = 'classic', categoryId = null) => {
    if (!socket || !name.trim()) return;
    socket.emit("createRoom", { playerName: name, gameMode, categoryId }, ({ success, roomId, error }) => {
      if (success) {
        setPlayerName(name);
        setRoomId(roomId);
        setIsHost(true);
        setPhase("lobby");
      } else {
        notify(error || "Failed to create room");
      }
    });
  }, [socket]);

  const joinRoom = useCallback((name, rid) => {
    if (!socket || !name.trim() || !rid.trim()) return;
    socket.emit("joinRoom", { playerName: name, roomId: rid.toUpperCase() }, ({ success, error }) => {
      if (success) {
        setPlayerName(name);
        setRoomId(rid.toUpperCase());
        setIsHost(false);
        setPhase("lobby");
      } else {
        notify(error || "Failed to join room");
      }
    });
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket || !roomId) return;
    setIsLoading(true);
    socket.emit("startGame", { roomId }, (res) => {
      if (res && !res.success) {
        setIsLoading(false);
        notify(res.error);
      }
    });
  }, [socket, roomId]);

  const submitAnswer = useCallback((answerIndex) => {
    if (!socket || !roomId || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    socket.emit("submitAnswer", { roomId, answerIndex });
  }, [socket, roomId, selectedAnswer]);

  const restartGame = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("restartGame", { roomId });
  }, [socket, roomId]);

  const leaveRoom = useCallback(() => {
    if (socket && roomId) socket.emit("leaveRoom", { roomId });
    setPhase("home");
    setRoomId(null);
    setRoomData(null);
    setIsHost(false);
    setQuestion(null);
    setLeaderboard([]);
    setWinner(null);
  }, [socket, roomId]);

  return {
    phase, roomId, playerName, isHost, roomData, question, timeLeft,
    selectedAnswer, feedback, questionResult, leaderboard, winner,
    countdown, answeredCount, notification, isLoading,
    createRoom, joinRoom, startGame, submitAnswer, restartGame, leaveRoom,
  };
}
