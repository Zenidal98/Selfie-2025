import React, { useState } from "react";
import PomodoroSettings from "./PomodoroSettings";
import PomodoroTimer from "./PomodoroTimer";
import { useNavigate } from "react-router-dom";
import "./PomodoroPage.css"; // assicurati che il CSS sia importato qui

const PomodoroPage = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    studyMinutes: 30,
    breakMinutes: 5,
    cycles: 5,
  });

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="pomodoro-wrapper">
      <div className="pomodoro-content">
        {/* Pulsante Torna alla Home */}
        <div className="d-flex justify-content-start mb-3">
          <button onClick={() => navigate("/home")} className="btn btn-outline-light">
            Torna alla Home
          </button>
        </div>

        <h2 className="text-center mb-4 text-white">Modalità Pomodoro</h2>

        <PomodoroTimer
          studyDuration={settings.studyMinutes}
          breakDuration={settings.breakMinutes}
          cycles={settings.cycles}
        />

        <PomodoroSettings onSettingsChange={handleSettingsChange} />
      </div>
    </div>
  );
};

export default PomodoroPage;
