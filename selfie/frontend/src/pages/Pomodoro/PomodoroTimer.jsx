import React, { useState, useEffect, useRef } from "react";
import "./Pomodoro.css";

const PomodoroTimer = ({ studyDuration, breakDuration, cycles }) => {
  const [secondsLeft, setSecondsLeft] = useState(studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  const sendNotification = (msg) => {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(msg);
    } else {
      alert(msg);
    }
  };

  useEffect(() => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const toggleTimer = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(isStudyTime ? studyDuration * 60 : breakDuration * 60);
  };

  const nextTime = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (isStudyTime) {
      setIsStudyTime(false);
      setSecondsLeft(breakDuration * 60);
      sendNotification("⏸️ Pausa iniziata!");
    } else {
      if (currentCycle < cycles) {
        setIsStudyTime(true);
        setCurrentCycle((prev) => prev + 1);
        setSecondsLeft(studyDuration * 60);
        sendNotification(`🧠 Inizio ciclo ${currentCycle + 1}`);
      } else {
        sendNotification("🎉 Tutti i cicli completati!");
        setIsComplete(true);
      }
    }
  };

  const restartCycle = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsStudyTime(true);
    setSecondsLeft(studyDuration * 60);
    sendNotification(`🔁 Ricominciato ciclo ${currentCycle}`);
  };

  const finishCycle = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (currentCycle < cycles) {
      setCurrentCycle((prev) => prev + 1);
      setIsStudyTime(true);
      setSecondsLeft(studyDuration * 60);
      sendNotification(`✅ Passato al ciclo ${currentCycle + 1}`);
    } else {
      sendNotification("🎉 Tutti i cicli completati!");
      setIsComplete(true);
    }
  };

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      clearInterval(intervalRef.current);
      setIsRunning(false);

      if (isStudyTime) {
        setIsStudyTime(false);
        setSecondsLeft(breakDuration * 60);
        sendNotification("⏸️ Pausa iniziata!");
      } else {
        if (currentCycle < cycles) {
          setIsStudyTime(true);
          setCurrentCycle((prev) => prev + 1);
          setSecondsLeft(studyDuration * 60);
          sendNotification(`🧠 Inizio ciclo ${currentCycle + 1}`);
        } else {
          sendNotification("🎉 Tutti i cicli completati!");
          setIsComplete(true);
        }
      }
    }
  }, [secondsLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pomodoro-timer mb-4 p-3 shadow rounded">
      <h5>{isStudyTime ? "🧠 Studio" : "☕ Pausa"} – Ciclo {currentCycle}/{cycles}</h5>

      {/* ANIMAZIONI */}
      {isRunning && (
        isStudyTime ? (
          <div className="study-animation"></div>
        ) : (
          <div className="break-animation"></div>
        )
      )}

      {/* ANIMAZIONE FINALE */}
      {isComplete && (
        <div className="completion-animation my-3">🎉 Fine sessione!</div>
      )}

      {/* TIMER */}
      <h1 className="display-3 my-3">{formatTime(secondsLeft)}</h1>

      {/* BARRA PROGRESSO */}
      <div className="progress my-3" style={{ height: "15px" }}>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={{
            width: `${(currentCycle / cycles) * 100}%`
          }}
          aria-valuenow={(currentCycle / cycles) * 100}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      {/* PULSANTI */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
        <button className="btn btn-success" onClick={toggleTimer}>
         {isRunning ? "Pausa" : "Start"}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer}>
         Reset
        </button>
        <button className="btn btn-warning" onClick={nextTime}>
         ⏭ Prossimo tempo
        </button>
        <button className="btn btn-info" onClick={restartCycle}>
         🔁 Ricomincia ciclo
        </button>
        <button className="btn btn-danger" onClick={finishCycle}>
         ✅ Termina ciclo
        </button>
      </div>

    </div>
  );
};

export default PomodoroTimer;
