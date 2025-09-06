import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import api from "../../utils/api.js"
import { format } from "date-fns";

const sections = [
  { id: "note", label: "Note", path: "/notes" },
  { id: "calendario", label: "Calendario", path: "/calendar" },
  { id: "pomodoro", label: "Pomodoro", path: "/pomodoro" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const utente = JSON.parse(sessionStorage.getItem("utente"));
  
  const [calendarReport, setCalendarReport] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [notesReport, setNotesReport] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);


  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const decoded = jwtDecode(token);
        const res = await axios.get(`http://localhost:5000/api/pomodoro/last/${decoded.id}`);
        setReport(res.data.data);
      } catch (err) {
        console.error("Errore caricamento pomodoro:", err.message);
      }
    };
    fetchReport();
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const fetchCalendarReport = async () => {
    setCalendarLoading(true);
    try{
      const res = await api.get("/events/report");
      setCalendarReport(res.data.activities || []);
    } catch (error) {
      console.error("Errore caricamento attivita':", error.message);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchNotesReport = async () => {
    setNotesLoading(true);
    try {
      const res = await api.get("notes/recent");
      setNotesReport(res.data);
    } catch (error) {
      console.error("Failed to fetch notes report", error);
    } finally {
      setNotesLoading(false);
    }
  };


  useEffect(() => {
    fetchCalendarReport();
    fetchNotesReport();

    const handleVisibilityChange = () => { //refetch sul page focus
      if (!document.hidden) {
        fetchCalendarReport();
        fetchNotesReport();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Benvenuto, {utente?.nome} {utente?.cognome}</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="section-container">
        {sections.map((sec) => (
          <div key={sec.id} className={`section ${sec.id}`}>
            <h2 className="section-label">{sec.label}</h2>
            <div className="section-details">
              <button className="btn btn-light mb-3" onClick={() => navigate(sec.path)}>
                Vai a {sec.label}
              </button>

              {sec.id === "pomodoro" && report && (
                <div className="text-white text-start">
                  <p className="text-white text-center">Puoi creare e organizzare cicli di studio.</p>
                  <strong>Report ultimo Pomodoro:</strong><br />
                  Cicli completati: {report.cyclesCompleted}<br />
                  Studio: {report.studyDuration} min<br />
                  Pausa: {report.breakDuration} min<br />
                  Totale: {report.totalStudyTime} min
                </div>
              )}

             
              {sec.id === "note" && (
                <div className="text-white text-center">
                  <div className="mb-2">
                    <p className="text-center mb-0">
                      Ultima nota creata o modificata.
                    </p>
                  </div>

                  {notesReport ? (
                    <div className="note-preview text-center text-dark">
                      <strong>{notesReport.title}</strong>
                      <div className="small text-muted">
                        Creato:{" "}
                        {format(
                          new Date(notesReport.createdAt),
                          "dd MMM yyyy HH:mm"
                        )}{" "}
                        — Modificato:{" "}
                        {format(
                          new Date(notesReport.lastEdited),
                          "dd MMM yyyy HH:mm"
                        )}
                      </div>

                      {notesReport.tags.length > 0 && (
                        <div className="small fst-italic">
                          (
                          {notesReport.tags
                            .map((tag) => `#${tag}`)
                            .join(", ")}
                          )
                        </div>
                      )}

                      <p className="mt-1">
                        {notesReport.markdown.length > 100
                          ? notesReport.markdown.slice(0, 100) + "…"
                          : notesReport.markdown}
                      </p>
                    </div>
                  ) : (
                    <p className="text-center">Nessuna nota recente</p>
                  )}
                </div>
              )}

              {sec.id === "calendario" && (
                <div className="calendar-report text-dark text-center">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="text-center flex-grow-1 mb-0 text-white">Consulta i tuoi eventi e appuntamenti.</p>
                    {/**
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={fetchCalendarReport}
                      disabled={calendarLoading}
                    >
                      {calendarLoading ? "Aggiornamento..." : "Aggiorna"}
                    </button>
                    **/} 
                  </div>

                  {calendarReport.length > 0 ? (
                    <>
                      <strong>Prossime attività:</strong>
                      <ul className="list-unstyled mt-2">
                        {calendarReport.map((act, i) => (
                          <li key={i}>
                            {format(new Date(act.dueDate), "EEE dd MMM")}{" "}
                            {act.dueTime ? act.dueTime : ""} -- {act.text}{" -- "}
                            {act.location ? act.location : ""}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-center">Nessuna attività imminente</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
