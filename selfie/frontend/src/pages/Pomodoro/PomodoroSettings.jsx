//File per calcolare i vari tempi nei cicli personalizzati
import React, { useState } from "react";
import { calcolaCicliStandard } from "./PomodoroUtils";

const PomodoroSettings = ({ onSettingsChange }) => {
  const [totalHours, setTotalHours] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [outputPreview, setOutputPreview] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const total = parseInt(totalHours || 0) * 60 + parseInt(totalMinutes || 0);

    const result = calcolaCicliStandard(total);

    if (result.error) {
      setError(result.error);
      setOutputPreview(null);
      return;
    }

    setError("");
    setOutputPreview(result);

    onSettingsChange({
      studyMinutes: result.studio,
      breakMinutes: result.pausa,
      cycles: result.cicli
    });
  };

  return (
    <div className="card mt-4 p-3 shadow" style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h5 className="mb-3 text-center">Se vuoi fare invece dei cicli personalizzati inserisci ore e minuti disponibili qui</h5>

      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col">
            <input type="number" className="form-control" placeholder="Ore" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} min={0}/>
          </div>
          <div className="col">
            <input type="number" className="form-control" placeholder="Minuti" value={totalMinutes} onChange={(e) => setTotalMinutes(e.target.value)} min={0}/>
          </div>
        </div>
        <button className="btn btn-primary w-100">Applica impostazioni</button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3 text-center">
          {error}
        </div>
      )}

      {outputPreview && (
        <div className="alert alert-info mt-3 text-center">
          <strong>Output:</strong><br />
          {outputPreview.cicli} cicli da {outputPreview.studio} min studio + {outputPreview.pausa} min pausa<br />
          {outputPreview.resto > 0 && (
            <>Ultima pausa estesa a {outputPreview.pausaFinale} minuti</>
          )}
        </div>
      )}
    </div>
  );
};

export default PomodoroSettings;
