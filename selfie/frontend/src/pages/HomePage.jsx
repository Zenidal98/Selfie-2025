import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const sections = [
  { name: "Note", path: "/note", color: "bg-primary" },
  { name: "Progetti", path: "/progetti", color: "bg-success" },
  { name: "Calendario", path: "/calendario", color: "bg-warning" },
  { name: "Pomodoro", path: "/pomodoro", color: "bg-danger" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [report, setReport] = useState(null);
  const utenteLoggato = JSON.parse(sessionStorage.getItem("utente"));

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="container mt-4">
      {/* Logout */}
      <div className="d-flex justify-content-start mb-3">
        <button onClick={handleLogout} className="btn btn-outline-danger">
          Logout
        </button>
      </div>

      {/* Benvenuto + Data */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Benvenuto {utenteLoggato?.nome} {utenteLoggato?.cognome}!</h4>
        <p className="mb-0">
          {dateTime.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          {dateTime.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Riquadri Sezioni */}
      <div className="d-flex justify-content-around flex-wrap">
        {sections.map((section) => (
          <div key={section.name} className={`section-box ${section.color}`}>
            <span className="section-title">{section.name}</span>
            <Link to={section.path} className="start-link">
              Clicca qui per cominciare
            </Link>

            {/* Preview Pomodoro */}
            {section.name === "Pomodoro" && report && (
              <div className="preview-content text-white text-start px-2">
                <strong>Ultimo Pomodoro:</strong><br />
                Cicli: {report.cyclesCompleted}<br />
                Studio: {report.studyDuration} min<br />
                Pausa: {report.breakDuration} min<br />
                Totale: {report.totalStudyTime} min
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
