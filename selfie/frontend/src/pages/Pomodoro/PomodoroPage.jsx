import React, { useState } from "react";
import PomodoroSettings from "./PomodoroSettings";
import PomodoroTimer from "./PomodoroTimer";
import BackHomeButton from "../BackHomeButton";

const PomodoroPage = () => {
  const [settings, setSettings] = useState({
    studyMinutes: 30,
    breakMinutes: 5,
    cycles: 5,
  });

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };
                           // backhomebutton serve per tornare indietro, è presente in ogni pagina
  return (
    <div className="container py-4">                                       
      <BackHomeButton />                 

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
