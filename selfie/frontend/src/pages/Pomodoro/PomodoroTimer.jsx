import React, { useState, useEffect, useRef } from "react";
import "./PomodoroPage.css";
import api from "../../utils/api"; // shared axios instance with JWT
import { jwtDecode } from "jwt-decode";
import { useTimeMachine } from "../../utils/TimeMachine";
import { useNavigate } from "react-router-dom";

/**
 * Props:
 * - studyDuration (min)
 * - breakDuration (min)
 * - cycles (count)
 * - eventId? (string) -> if provided, runtime state will be PATCHed to the event
 */
const PomodoroTimer = ({ studyDuration, breakDuration, cycles, eventId = null }) => {
  // Time Machine
  const { virtualNow } = useTimeMachine();
  const navigate = useNavigate();

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(1); // 1-based for UI
  const [isComplete, setIsComplete] = useState(false);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);

  // intervals
  const tickRef = useRef(null);
  const autosaveRef = useRef(null);
  const dayCheckRef = useRef(null);

  // Load saved state for calendar events
  useEffect(() => {
    if (eventId && !stateLoaded) {
      loadSavedState();
    }
  }, [eventId, stateLoaded]);

  const loadSavedState = async () => {
    if (!eventId) return;
    try {
      const res = await api.get(`/events/${eventId}`);
      const event = res.data;

      if (event.pomodoro?.state?.lastRunAt) {
        const state = event.pomodoro.state;
        setCurrentCycle(state.cycleIndex + 1); // Convert to 1-based for UI
        setIsStudyTime(state.phase === "study");
        setSecondsLeft(state.secondsLeft !== undefined ? state.secondsLeft : (state.phase === "study" ? studyDuration * 60 : breakDuration * 60));
      }
      setStateLoaded(true);
    } catch (err) {
      console.error("Failed to load saved state", err);
      setStateLoaded(true);
    }
  };

  // reset when plan changes (but not on initial load for calendar events)
  useEffect(() => {
    if (stateLoaded && !eventId) {

      clearInterval(tickRef.current);
      clearInterval(autosaveRef.current);
      setSecondsLeft(studyDuration * 60);
      setIsRunning(false);
      setIsStudyTime(true);
      setCurrentCycle(1);
      setIsComplete(false);
    }
  }, [studyDuration, breakDuration, cycles, stateLoaded, eventId]);

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
    const d = virtualNow instanceof Date ? virtualNow : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const patchState = async ({ reason = "tick" } = {}) => {
    if (!eventId || isComplete) return;
    try {
      await api.patch(`/events/${eventId}/pomodoro/state`, {
        dayISO: getDayISO(),
        phase: isStudyTime ? "study" : "break",
        cycleIndex: Math.max(0, currentCycle - 1), // store 0-based
        secondsLeft,
        meta: { reason }, // ignored by backend but useful if you ever log it
      });
    } catch (err) {
      if (err.response?.status === 404) {
        clearInterval(tickRef.current);
        clearInterval(autosaveRef.current);
        setIsRunning(false);
        setIsComplete(true);
        return;
      }
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
    handleSaveSession();
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
      handleSaveSession();
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
      clearInterval(dayCheckRef.current);
      // best-effort save on unmount
      // patchState({ reason: "unmount" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor for day changes and auto-move to next day
  useEffect(() => {
    if (!eventId) return;

    // Initialize current day
    const today = getDayISO();
    setCurrentDay(today);

    // Check for day change every 30 seconds for more responsive detection
    dayCheckRef.current = setInterval(() => {
      const newDay = getDayISO();
      if (currentDay && newDay !== currentDay && secondsLeft > 0 && !isComplete) {
        console.log(`Day changed from ${currentDay} to ${newDay}, auto-moving Pomodoro`);
        autoMoveToNextDay();
      }
      setCurrentDay(newDay);
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(dayCheckRef.current);
    };
  }, [eventId, currentDay, secondsLeft, isComplete]);

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

  const autoMoveToNextDay = async () => {
    if (!eventId || isComplete || secondsLeft <= 0) return;

    try {
      // Get current event to calculate remaining time
      const res = await api.get(`/events/${eventId}`);
      const currentEvent = res.data;

      if (!currentEvent.pomodoro?.state) return;

      const remainingMinutes = Math.ceil(secondsLeft / 60);

      if (remainingMinutes <= 0) return;

      // Calculate next day
      const currentDate = new Date(currentEvent.date);
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      const nextDayISO = nextDay.toISOString().slice(0, 10);

      // Create new Pomodoro event for next day with remaining time
      const newEventPayload = {
        type: "manual",
        text: `${currentEvent.text} (continua automaticamente)`,
        date: nextDayISO,
        time: currentEvent.time,
        isPomodoro: true,
        pomodoro: {
          mode: "total",
          totalMinutes: remainingMinutes
        },
        location: currentEvent.location,
        notificationPrefs: currentEvent.notificationPrefs
      };

      // Create new event and get its ID
      const newEventResponse = await api.post("/events", newEventPayload);
      const newEventId = newEventResponse.data._id;

      // Transfer current state to the new event
      await api.patch(`/events/${newEventId}/pomodoro/state`, {
        dayISO: getDayISO(),
        phase: isStudyTime ? "study" : "break",
        cycleIndex: Math.max(0, currentCycle - 1),
        secondsLeft: secondsLeft
      });

      // Delete the current event
      await api.delete(`/events/${eventId}`);

      // Show notification about auto-move
      sendNotification(`⏰ Tempo rimanente (${remainingMinutes} min) spostato automaticamente a ${nextDayISO}`);

      // Stop the current timer
      setIsRunning(false);
      setIsComplete(true);
      clearInterval(tickRef.current);
      clearInterval(autosaveRef.current);
      clearInterval(dayCheckRef.current);

    } catch (err) {
      console.error("Failed to auto-move to next day", err);
    }
  };

  const handleMoveToNextDay = async () => {
    if (!eventId) {
      alert("Questa funzione è disponibile solo per eventi calendario.");
      return;
    }

    const confirmMove = window.confirm(
      "Vuoi spostare il tempo rimanente di questo Pomodoro al giorno successivo? Questo creerà un nuovo evento Pomodoro domani."
    );

    if (!confirmMove) return;

    try {
      // Get current event to calculate remaining time
      const res = await api.get(`/events/${eventId}`);
      const currentEvent = res.data;

      if (!currentEvent.pomodoro?.state) {
        alert("Nessun stato salvato trovato per questo Pomodoro.");
        return;
      }

      const remainingMinutes = Math.ceil(secondsLeft / 60);

      if (remainingMinutes <= 0) {
        alert("Non c'è tempo rimanente da spostare.");
        return;
      }

      // Calculate next day
      const currentDate = new Date(currentEvent.date);
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      const nextDayISO = nextDay.toISOString().slice(0, 10);

      // Create new Pomodoro event for next day with remaining time
      const newEventPayload = {
        type: "manual",
        text: `${currentEvent.text}`,
        date: nextDayISO,
        time: currentEvent.time,
        isPomodoro: true,
        pomodoro: {
          mode: "total",
          totalMinutes: remainingMinutes
        },
        location: currentEvent.location,
        notificationPrefs: currentEvent.notificationPrefs
      };

      // Create new event and get its ID
      const newEventResponse = await api.post("/events", newEventPayload);
      const newEventId = newEventResponse.data._id;

      // Transfer current state to the new event
      await api.patch(`/events/${newEventId}/pomodoro/state`, {
        dayISO: getDayISO(),
        phase: isStudyTime ? "study" : "break",
        cycleIndex: Math.max(0, currentCycle - 1),
        secondsLeft: secondsLeft
      });

      // Delete the current event
      await api.delete(`/events/${eventId}`);

      alert(`Nuovo evento Pomodoro creato per ${nextDayISO} con ${remainingMinutes} minuti rimanenti.`);
      navigate("/calendar");
    } catch (err) {
      console.error("Failed to move to next day", err);
      alert("Errore nella creazione dell'evento per il giorno successivo.");
    }
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
        {eventId && (
          <button className="btn btn-outline-warning" onClick={handleMoveToNextDay} disabled={isComplete}>
            Sposta a Domani
          </button>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
