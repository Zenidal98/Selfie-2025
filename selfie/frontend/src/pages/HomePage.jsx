import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const sections = [
  { name: "Note", path: "/note", color: "bg-primary" },
  { name: "Progetti", path: "/progetti", color: "bg-success" },
  { name: "Calendario", path: "/calendario", color: "bg-warning" },
  { name: "Pomodoro", path: "/pomodoro", color: "bg-danger" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());

  const utenteLoggato = JSON.parse(sessionStorage.getItem("utente"));

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="container mt-4">

      {/* 🔓 Pulsante Logout */}
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

      {/* Sezioni */}
      <div className="d-flex justify-content-around flex-wrap">
        {sections.map((section) => (
          <div key={section.name} className={`section-box ${section.color}`}>
            <span className="section-title">{section.name}</span>
            <Link to={section.path} className="start-link">
              Clicca qui per cominciare
            </Link>
            <div className="preview-content">
              Qui poi ci fa l'effettivo contenuto salvato di ogni sezione
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
