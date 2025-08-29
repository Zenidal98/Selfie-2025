// File per calcolare i vari tempi nei cicli personalizzati
import React, { useState, useEffect } from "react";
import { calcolaCicliStandard } from "./PomodoroUtils";

/**
 * Props:
 * - onSettingsChange({ studyMinutes, breakMinutes, cycles })
 * - initial (optional): { studyMinutes, breakMinutes, cycles } to precompilare i valori fissi
 */
const PomodoroSettings = ({ onSettingsChange, initial }) => {
  // Modalità: calcolo da tempo totale (default) oppure valori fissi
  const [mode, setMode] = useState("total"); // 'total' | 'fixed'

  // --- TOTAL mode inputs ---
  const [totalHours, setTotalHours] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [outputPreview, setOutputPreview] = useState(null);

  // --- FIXED mode inputs ---
  const [studyFixed, setStudyFixed] = useState(initial?.studyMinutes ?? 30);
  const [breakFixed, setBreakFixed] = useState(initial?.breakMinutes ?? 5);
  const [cyclesFixed, setCyclesFixed] = useState(initial?.cycles ?? 5);

  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setStudyFixed(initial.studyMinutes ?? 30);
      setBreakFixed(initial.breakMinutes ?? 5);
      setCyclesFixed(initial.cycles ?? 5);
    }
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setOutputPreview(null);

    if (mode === "total") {
      const total =
        (parseInt(totalHours || 0, 10) * 60) + (parseInt(totalMinutes || 0, 10) || 0);

      const result = calcolaCicliStandard(total);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOutputPreview(result);
      onSettingsChange({
        studyMinutes: result.studio,
        breakMinutes: result.pausa,
        cycles: result.cicli,
      });
    } else {
      // fixed mode validation minima
      if (
        !Number.isFinite(+studyFixed) || +studyFixed <= 0 ||
        !Number.isFinite(+breakFixed) || +breakFixed <= 0 ||
        !Number.isFinite(+cyclesFixed) || +cyclesFixed <= 0
      ) {
        setError("Inserisci valori validi per studio/pausa/cicli (> 0).");
        return;
      }
      onSettingsChange({
        studyMinutes: Math.floor(+studyFixed),
        breakMinutes: Math.floor(+breakFixed),
        cycles: Math.floor(+cyclesFixed),
      });
    }
  };

  return (
    <div className="card mt-4 p-3 shadow" style={{ maxWidth: "560px", margin: "0 auto" }}>
      <h5 className="mb-3 text-center">Impostazioni Pomodoro</h5>

      {/* Toggle modalità */}
      <div className="d-flex justify-content-center gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${mode === "total" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("total")}
        >
          Calcola da tempo totale
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mode === "fixed" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("fixed")}
        >
          Imposta valori fissi
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "total" ? (
          <>
            <p className="text-muted small text-center mb-2">
              Inserisci ore e minuti disponibili. Useremo lo schema 30’ studio + 5’ pausa (ultima pausa estesa).
            </p>
            <div className="row mb-3">
              <div className="col">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ore"
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  min={0}
                />
              </div>
              <div className="col">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Minuti"
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(e.target.value)}
                  min={0}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted small text-center mb-2">
              Imposta manualmente durata di studio/pausa e numero di cicli.
            </p>
            <div className="row g-2 mb-3">
              <div className="col-4">
                <label className="form-label">Studio (min)</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={studyFixed}
                  onChange={(e) => setStudyFixed(e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Pausa (min)</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={breakFixed}
                  onChange={(e) => setBreakFixed(e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Cicli</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={cyclesFixed}
                  onChange={(e) => setCyclesFixed(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <button className="btn btn-primary w-100">Applica impostazioni</button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3 text-center">
          {error}
        </div>
      )}

      {mode === "total" && outputPreview && !error && (
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
