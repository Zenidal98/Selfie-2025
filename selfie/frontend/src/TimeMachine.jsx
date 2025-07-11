import React, { createContext, useContext, useState, useEffect } from 'react';
import './TimeMachine.css';

const TimeMachineContext = createContext();
export const useTimeMachine = () => useContext(TimeMachineContext);

export const TimeMachineProvider = ({ children }) => {
  const [virtualNow, setVirtualNow] = useState(new Date());
  const [isSynced, setIsSynced] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // 👈 controlla se mostrare barra
  const [lastManualChange, setLastManualChange] = useState(null); // stato fantoccio per forzare refresh
  
  useEffect(() => {
    if (isSynced) {
      const interval = setInterval(() => setVirtualNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isSynced]);

  const updateTime = (e) => {
    setIsSynced(false);
    setVirtualNow(new Date(e.target.value));
    setLastManualChange(Date.now());
  };

  const resetTime = () => {
    setIsSynced(true);
    setVirtualNow(new Date());
    setLastManualChange(Date.now());
  };

  return (
    <TimeMachineContext.Provider value={{ virtualNow, isSynced, setIsSynced, lastManualChange }}>
      {children}

      {/* Pallino TM */}
      <div className="tm-toggle-button" onClick={() => setIsVisible((prev) => !prev)}>
        TM
      </div>

      {/* Barra Time Machine visibile solo se attiva */}
      {isVisible && (
        <div className="time-machine-bar">
          <label className="tm-label">🕓 Time Machine:</label>
          <input
            type="datetime-local"
            className="tm-input"
            value={new Date(virtualNow.getTime() - virtualNow.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            onChange={updateTime}
          />
          <button className="tm-reset" onClick={resetTime}>Torna all'ora reale</button>
        </div>
      )}
    </TimeMachineContext.Provider>
  );
};
