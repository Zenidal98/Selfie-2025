import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const sections = [
  { id: "note", label: "Note", path: "/notes" },
  { id: "calendario", label: "Calendario", path: "/calendar" },
  { id: "pomodoro", label: "Pomodoro", path: "/pomodoro" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const utente = JSON.parse(sessionStorage.getItem("utente"));

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          console.error("Nessun token trovato in sessionStorage");
          return;
        }

        const decoded = jwtDecode(token);

        const res = await axios.get(
          `http://localhost:5000/api/pomodoro/last/${decoded.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // ✅ attach token here
            },
          }
        );

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
                <p className="text-white">Puoi scrivere e rivedere le tue note.</p>
              )}

              {sec.id === "calendario" && (
                <p className="text-white">Consulta i tuoi eventi e appuntamenti.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
