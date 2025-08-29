import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PomodoroSettings from "./PomodoroSettings";
import PomodoroTimer from "./PomodoroTimer";
import { calcolaCicliStandard } from "./PomodoroUtils";
import api from "../../utils/api";
import "./PomodoroPage.css";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const PomodoroPage = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const eventId = query.get("eventId");

  const [loading, setLoading] = useState(!!eventId);
  const [error, setError] = useState("");
  const [eventMeta, setEventMeta] = useState(null); // title/date/time preview

  const [settings, setSettings] = useState({
    studyMinutes: 30,
    breakMinutes: 5,
    cycles: 5,
  });

  // Load event if eventId is present
  useEffect(() => {
    let isMounted = true;
    async function fetchEvent() {
      if (!eventId) return;

      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/events/${eventId}`);
        if (!isMounted) return;
        const ev = res.data;

        setEventMeta({
          title: ev?.text || "Pomodoro",
          date: ev?.date,
          time: ev?.time || "00:00",
          isPomodoro: !!ev?.isPomodoro,
          plan: ev?.pomodoro || null,
        });

        if (ev?.isPomodoro && ev?.pomodoro) {
          const p = ev.pomodoro;
          if (p.mode === "total") {
            const total = Number(p.totalMinutes) || 0;
            const r = calcolaCicliStandard(total);
            if (r?.error) {
              setError(r.error);
              // keep defaults
            } else {
              setSettings({
                studyMinutes: r.studio,
                breakMinutes: r.pausa,
                cycles: r.cicli,
              });
            }
          } else {
            // mode 'fixed'
            setSettings({
              studyMinutes: Number(p.studyMinutes) || 30,
              breakMinutes: Number(p.breakMinutes) || 5,
              cycles: Number(p.cycles) || 5,
            });
          }
        } else {
          // Not a pomodoro event → use defaults
        }
      } catch (e) {
        console.error("Failed to load event", e);
        if (isMounted) setError("Impossibile caricare l'evento.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="pomodoro-wrapper">
      <div className="pomodoro-content">
        <div className="d-flex justify-content-start mb-3 gap-2">
          <button onClick={() => navigate("/home")} className="btn btn-outline-light">
            Torna alla Home
          </button>
          <button onClick={() => navigate("/calendar")} className="btn btn-outline-light">
            Vai al Calendario
          </button>
        </div>

        <h2 className="text-center mb-3 text-white">Modalità Pomodoro</h2>

        {eventId && (
          <div className="alert alert-secondary py-2 px-3 d-flex justify-content-between align-items-center">
            <div>
              <strong>{eventMeta?.title || "Evento"}</strong>
              {eventMeta?.date && (
                <span className="ms-2">
                  — {eventMeta.date} {eventMeta?.time ? `alle ${eventMeta.time}` : ""}
                </span>
              )}
              {eventMeta?.isPomodoro ? (
                <span className="badge bg-success ms-2">Pomodoro</span>
              ) : (
                <span className="badge bg-secondary ms-2">Evento</span>
              )}
            </div>
            {loading && <span className="small text-muted">caricamento…</span>}
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Timer */}
        <PomodoroTimer
          studyDuration={settings.studyMinutes}
          breakDuration={settings.breakMinutes}
          cycles={settings.cycles}
          // optional, for future PATCH of state/carryover
          eventId={eventId || null}
        />

        {/* Settings (lets user recompute plan ad-hoc) */}
        <PomodoroSettings onSettingsChange={handleSettingsChange} />
      </div>
    </div>
  );
};

export default PomodoroPage;
