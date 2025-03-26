import React, { useState, useEffect } from "react";
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
  const user = { nome: "Mario", cognome: "Rossi" }; // Da sostituire con dati dinamici

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
            <span>{section.name}</span>
            <div className="preview-content">Preview dei contenuti...</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
