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
  const user = { nome: "Mario", cognome: "Rossi" };

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container text-center mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Benvenuto {user.nome} {user.cognome}</h3>
        <h5>{dateTime.toLocaleString()}</h5>
      </div>
      <div className="d-flex justify-content-around flex-wrap">
        {sections.map((section) => (
          <div key={section.name} className={`section-box ${section.color}`}>
            {/* Nome della sezione quando il box è piccolo */}
            <span className="section-title">{section.name}</span>

            {/* Link che appare al centro quando il box è grande */}
            <Link to={section.path} className="start-link">
              Clicca qui per cominciare
            </Link>

            {/* Contenuto aggiuntivo in basso */}
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
