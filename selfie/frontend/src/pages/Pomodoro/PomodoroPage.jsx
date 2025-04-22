import React, { useState } from "react";
import PomodoroSettings from "./PomodoroSettings";
import PomodoroTimer from "./PomodoroTimer";
import { useNavigate } from "react-router-dom";

const PomodoroPage = () => {
   
  const navigate=useNavigate();        // per tornare ad home

  const [settings, setSettings] = useState({
    studyMinutes: 30,
    breakMinutes: 5,
    cycles: 5,
  });

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };
                           
  return (
    <div className="container py-4">  
                           {/*pulsante per tornare alla home*/}
      <div className="d-flex justify-content-start mb-3">
       <button onClick={() => navigate("/home")} className="btn btn-outline-secondary">
        Torna alla Home
       </button>
      </div>

      <h2 className="text-center mb-4">🍅 Modalità Pomodoro</h2>
      <PomodoroTimer
        studyDuration={settings.studyMinutes}
        breakDuration={settings.breakMinutes}
        cycles={settings.cycles}
      />

      <PomodoroSettings onSettingsChange={handleSettingsChange} />
    </div>
  );
};

export default PomodoroPage;
