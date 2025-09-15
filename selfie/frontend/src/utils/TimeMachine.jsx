import React, { createContext, useContext, useState, useEffect } from "react";
import "./TimeMachine.css";
import api from "../utils/api";

const TimeMachineContext = createContext();
export const useTimeMachine = () => useContext(TimeMachineContext);

export const TimeMachineProvider = ({ children }) => {
  const [virtualNow, setVirtualNow] = useState(new Date());
  const [isSynced, setIsSynced] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [lastManualChange, setLastManualChange] = useState(null);

  // 🔹 On mount → fetch current virtual time from backend
  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await api.get("/time-machine");
        const { virtualNow } = res.data;
        setVirtualNow(new Date(virtualNow));
      } catch (err) {
        console.error("Failed to fetch virtual time:", err.message);
      }
    };
    fetchTime();
  }, []);

  // 🔹 Keep ticking if synced to real time
  useEffect(() => {
    if (isSynced) {
      const interval = setInterval(() => setVirtualNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isSynced]);

  // 🔹 Update time (frontend + backend)
  const updateTime = async (e) => {
    const newTime = new Date(e.target.value);
    setIsSynced(false);
    setVirtualNow(newTime);
    setLastManualChange(Date.now());

    try {
      await api.post("/time-machine", { virtualTime: newTime.toISOString() });
    } catch (err) {
      console.error("Failed to update virtual time:", err.message);
    }
  };

  // 🔹 Reset time (frontend + backend)
  const resetTime = async () => {
    setIsSynced(true);
    setVirtualNow(new Date());
    setLastManualChange(Date.now());

    try {
      await api.delete("/time-machine");
    } catch (err) {
      console.error("Failed to reset virtual time:", err.message);
    }
  };

  return (
    <TimeMachineContext.Provider
      value={{ virtualNow, isSynced, setIsSynced, lastManualChange }}
    >
      {children}

      {/* Pallino TM */}
      <div
        className="tm-toggle-button"
        onClick={() => setIsVisible((prev) => !prev)}
      >
        TM
      </div>

      {/* Barra Time Machine visibile solo se attiva */}
      {isVisible && (
        <div className="time-machine-bar">
          <label className="tm-label">🕓 Time Machine:</label>
          <input
            type="datetime-local"
            className="tm-input"
            value={new Date(
              virtualNow.getTime() - virtualNow.getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 16)}
            onChange={updateTime}
          />
          <button className="tm-reset" onClick={resetTime}>
            Torna all'ora reale
          </button>
        </div>
      )}
    </TimeMachineContext.Provider>
  );
};
