import React, { useState, useEffect, useRef } from "react";
import "./PomodoroPage.css";
import api from "../../utils/api"; // shared axios instance with JWT
import { jwtDecode } from "jwt-decode";

/**
 * Props:
 * - studyDuration (min)
 * - breakDuration (min)
 * - cycles (count)
 * - eventId? (string) -> if provided, runtime state will be PATCHed to the event
 */
const PomodoroTimer = ({ studyDuration, breakDuration, cycles, eventId = null }) => {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(1); // 1-based for UI
  const [isComplete, setIsComplete] = useState(false);

  // intervals
  const tickRef = useRef(null);
  const autosaveRef = useRef(null);

  // reset when plan changes
  useEffect(() => {
    clearInterval(tickRef.current);
    clearInterval(autosaveRef.current);
    setSecondsLeft(studyDuration * 60);
    setIsRunning(false);
    setIsStudyTime(true);
    setCurrentCycle(1);
    setIsComplete(false);
  }, [studyDuration, breakDuration, cycles]);

  // notification permission
  useEffect(() => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (msg) => {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(msg);
    } else {
      // Fallback so users still get feedback
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  };

  // ---- persistence helpers ----------------------------------------------------
  const getDayISO = () => {
    // Using local date (browser TZ) as in the calendar UI
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const patchState = async ({ reason = "tick" } = {}) => {
    if (!eventId) return;
    try {
      await api.patch(`/events/${eventId}/pomodoro/state`, {
        dayISO: getDayISO(),
        phase: isStudyTime ? "study" : "break",
        cycleIndex: Math.max(0, currentCycle - 1), // store 0-based
        secondsLeft,
        meta: { reason }, // ignored by backend but useful if you ever log it
      });
    } catch (e) {
      // non-blocking
      // console.warn("Failed to patch pomodoro state", e);
    }
  };

  const startTick = () => {
    // guard against duplicates
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // autosave every 15s while running
    clearInterval(autosaveRef.current);
    autosaveRef.current = setInterval(() => {
      patchState({ reason: "autosave" });
    }, 15000);
  };

  const stopTick = async (reason = "pause") => {
    clearInterval(tickRef.current);
    clearInterval(autosaveRef.current);
    await patchState({ reason });
  };

  // main toggle
  const toggleTimer = async () => {
    if (isComplete) return;
    if (isRunning) {
      setIsRunning(false);
      await stopTick("pause");
    } else {
      setIsRunning(true);
      startTick();
    }
  };

  const resetTimer = async () => {
    if (isComplete) return;
    await stopTick("reset");
    setIsRunning(false);
    setSecondsLeft((isStudyTime ? studyDuration : breakDuration) * 60);
    await patchState({ reason: "reset" });
  };

  // move to next phase/cycle (force)
  const nextTime = async () => {
    if (isComplete) return;
    await stopTick("nextTime");
    setIsRunning(false);

    if (isStudyTime) {
      // switch to break
      setIsStudyTime(false);
      setSecondsLeft(breakDuration * 60);
      sendNotification("⏸️ Pausa iniziata!");
    } else {
      // switch to next study or complete
      if (currentCycle < cycles) {
        setIsStudyTime(true);
        setCurrentCycle((prev) => prev + 1);
        setSecondsLeft(studyDuration * 60);
        sendNotification(`🧠 Inizio ciclo ${currentCycle + 1}`);
      } else {
        sendNotification("🎉 Tutti i cicli completati!");
        setIsComplete(true);
        // finalize state with 0 seconds left
        setSecondsLeft(0);
        await patchState({ reason: "complete" });
      }
    }
  };

  const restartCycle = async () => {
    if (isComplete) return;
    await stopTick("restartCycle");
    setIsRunning(false);
    setIsStudyTime(true);
    setSecondsLeft(studyDuration * 60);
    sendNotification(`🔁 Ricominciato ciclo ${currentCycle}`);
    handleSaveSession()
    await patchState({ reason: "restartCycle" });
  };

  // finish current cycle early (advance to next study cycle, or complete)
  const finishCycle = async () => {
    if (isComplete) return;
    await stopTick("finishCycle");
    setIsRunning(false);

    if (currentCycle < cycles) {
      setCurrentCycle((prev) => prev + 1);
      setIsStudyTime(true);
      setSecondsLeft(studyDuration * 60);
      sendNotification(`➡️ Passato al ciclo ${currentCycle + 1}`);
      await patchState({ reason: "finishCycle-next" });
    } else {
      sendNotification("✅ Tutti i cicli completati!");
      setIsComplete(true);
      handleSaveSession()
      setSecondsLeft(0);
      await patchState({ reason: "finishCycle-complete" });
    }
  };

  // auto-advance when a phase ends
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft === 0) {
      // stop ticking first to avoid double trigs
      clearInterval(tickRef.current);
      clearInterval(autosaveRef.current);
      setIsRunning(false);
      // persist zero state then advance
      (async () => {
        await patchState({ reason: "phase-end" });
        await nextTime();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(tickRef.current);
      clearInterval(autosaveRef.current);
      // best-effort save on unmount
      patchState({ reason: "unmount" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSession = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("Nessun token trovato in sessionStorage");
        return;
      }
      const decoded = jwtDecode(token);

      await api.post(
        "/pomodoro",
        {
          userId: decoded.id,
          studyDuration,
          breakDuration,
          cyclesCompleted: currentCycle,
          totalStudyTime: currentCycle * studyDuration,
          note: "Sessione salvata automaticamente",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Errore salvataggio pomodoro:", error.message);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pomodoro-timer mb-4 p-3 shadow rounded">
      <h5>
        {isStudyTime ? "🧠 Studio" : "⏸️ Pausa"} – Ciclo {currentCycle}/{cycles}
      </h5>

      {isRunning && (isStudyTime ? <div className="study-animation"></div> : <div className="break-animation"></div>)}

      {isComplete && <div className="completion-animation my-3">🎉 Fine sessione!</div>}

      <h1 className="display-3 my-3">{formatTime(secondsLeft)}</h1>

      <div className="progress my-3" style={{ height: "15px" }}>
        <div className="progress-bar bg-success" style={{ width: `${(currentCycle / cycles) * 100}%` }} />
      </div>

      <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
        <button className="btn btn-success" onClick={toggleTimer} disabled={isComplete}>
          {isRunning ? "Pausa" : "Start"}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer} disabled={isComplete}>
          Reset
        </button>
        <button className="btn btn-warning" onClick={nextTime} disabled={isComplete}>
          Prossimo tempo
        </button>
        <button className="btn btn-info" onClick={restartCycle} disabled={isComplete}>
          Ricomincia ciclo
        </button>
        <button className="btn btn-danger" onClick={finishCycle} disabled={isComplete}>
          Termina ciclo
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
