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

  // fa una richiesta lato server per prendere il valore corrente della virtualNow salvato lato server, evita cancellamenti se si ricarica la pagina
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

  // se è sincronizzata con il tempo reale continua a ticchettare in avanti
  useEffect(() => {
    if (isSynced) {
      const interval = setInterval(() => setVirtualNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isSynced]);

  // aggiorna il tempo sia frontend che backend
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

  // resetta il tempo ancora frontend e backend
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
    <TimeMachineContext.Provider value={{ virtualNow, isSynced, setIsSynced, lastManualChange }}>
      {children}

      {/* pallino time machine */}
      <div className="tm-toggle-button" onClick={() => setIsVisible((prev) => !prev)}> TM </div>

      {/* barra della time machine che è visibile solo se attiva */}
      {isVisible && (
        <div className="time-machine-bar">
          <label className="tm-label">🕓 Time Machine:</label>
          <input type="datetime-local" className="tm-input" value={new Date( virtualNow.getTime() - virtualNow.getTimezoneOffset() * 60000)
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
