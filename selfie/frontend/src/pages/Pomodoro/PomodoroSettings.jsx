import React, { useState } from "react";
import { calcolaCicliOttimali } from "./PomodoroUtils";

const PomodoroSettings = ({ onSettingsChange }) => {
  const [studyMinutes, setStudyMinutes] = useState(30);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [cycles, setCycles] = useState(5);
  const [totalTime, setTotalTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (totalTime) {
      const { studio, pausa, cicli } = calcolaCicliOttimali(parseInt(totalTime));
      onSettingsChange({ studyMinutes: studio, breakMinutes: pausa, cycles: cicli });
    } else {
      onSettingsChange({ studyMinutes, breakMinutes, cycles });
    }
  };

  return (
    <div className="card mt-4 p-3 shadow" style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h5 className="mb-3 text-center">Impostazioni Pomodoro</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label>Minuti di studio:</label>
          <input
            type="number"
            className="form-control"
            value={studyMinutes}
            onChange={(e) => setStudyMinutes(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <div className="mb-2">
          <label>Minuti di pausa:</label>
          <input
            type="number"
            className="form-control"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <div className="mb-2">
          <label>Numero di cicli:</label>
          <input
            type="number"
            className="form-control"
            value={cycles}
            onChange={(e) => setCycles(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <div className="mb-3">
          <label>Oppure tempo totale disponibile (minuti):</label>
          <input
            type="number"
            className="form-control"
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            min={1}
          />
        </div>
        <button className="btn btn-primary w-100">Applica impostazioni</button>
      </form>
    </div>
  );
};

export default PomodoroSettings;
