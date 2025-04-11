import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const sections = [
  { name: "Note", path: "/note", color: "bg-primary" },
  { name: "Progetti", path: "/progetti", color: "bg-success" },
  { name: "Calendario", path: "/calendario", color: "bg-warning" },
  { name: "Pomodoro", path: "/pomodoro", color: "bg-danger" },
];

const HomePage = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [utente, setUtente] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    const utenteSalvato = localStorage.getItem("utente");
    if (utenteSalvato) {
      setUtente(JSON.parse(utenteSalvato));
    }

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container text-center mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Benvenuto {utente?.nome} {utente?.cognome}!</h3>
        <h5>{dateTime.toLocaleString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</h5>
      </div>

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
