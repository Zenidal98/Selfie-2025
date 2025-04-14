import React, { useState } from "react";
import PomodoroTimer from "./PomodoroTimer";
import PomodoroSettings from "./PomodoroSettings";
//import "./Pomodoro.css";

const PomodoroPage = () => {
  const [settings, setSettings] = useState({
    studyMinutes: 30,
    breakMinutes: 5,
    cycles: 5,
  });

  return (
    <div className="container text-center mt-4">
      <h2 className="mb-4">🍅 Pomodoro</h2>
      <PomodoroTimer
        studyDuration={settings.studyMinutes}
        breakDuration={settings.breakMinutes}
        cycles={settings.cycles}
      />
      <PomodoroSettings onSettingsChange={setSettings} />
    </div>
  );
};

export default PomodoroPage;

// ci vanno pomodorotask e pomodorosettings sotto a timer ovviamente