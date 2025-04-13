import React, { useState, useEffect, useRef } from "react";
//import "./Pomodoro.css"; // qui poi ci mettiamo le animazioni

const PomodoroTimer = ({
  studyDuration = 30, // minuti
  breakDuration = 5,  // minuti
  cycles = 5,         // numero di cicli totali
}) => {
  const [secondsLeft, setSecondsLeft] = useState(studyDuration * 60);  //tempo rimasto in secondi
  const [isRunning, setIsRunning] = useState(false);
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(1);

  const intervalRef = useRef(null);

  // Avvia o ferma il timer
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

  // Reset timer
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(isStudyTime ? studyDuration * 60 : breakDuration * 60);
  };

  // Quando il timer arriva a 0
  useEffect(() => {
    if (secondsLeft === 0) {
      clearInterval(intervalRef.current);
      setIsRunning(false);

      if (isStudyTime) {
        // Passa alla pausa
        setIsStudyTime(false);
        setSecondsLeft(breakDuration * 60);
      } else {
        // Fine pausa → prossimo ciclo
        if (currentCycle < cycles) {
          setIsStudyTime(true);
          setSecondsLeft(studyDuration * 60);
          setCurrentCycle(currentCycle + 1);
        } else {
          alert("🎉 Cicli completati!");
        }
      }
    }
  }, [secondsLeft]);

  // Formattazione tempo
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pomodoro-timer text-center p-4">
      <h4 className="mb-2">
        {isStudyTime ? "🧠 Studio" : "☕ Pausa"} – Ciclo {currentCycle}/{cycles}
      </h4>

      <div className={`timer-display ${isStudyTime ? "study" : "break"}`}>
        <h1>{formatTime(secondsLeft)}</h1>
      </div>

      <div className="btn-group mt-3">
        <button className="btn btn-success" onClick={toggleTimer}>
          {isRunning ? "Pausa" : "Start"}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;