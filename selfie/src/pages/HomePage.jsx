import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const sections = [
  { name: "Note", path: "/note", color: "bg-primary" },
  { name: "Progetti", path: "/progetti", color: "bg-success" },
  { name: "Calendario", path: "/calendario", color: "bg-warning" },
  { name: "Pomodoro", path: "/pomodoro", color: "bg-danger" },
];

const HomePage = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center vh-100">
      {/* Titolo e Data */}
      <div className="w-100 d-flex justify-content-between p-3">
        <h2 className="text-white">Benvenuto Nome Cognome!</h2>
        <h4 className="text-white">
          {new Date().toLocaleDateString("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </h4>
      </div>

      {/* Sezioni */}
      <div className="sections-container">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`section-wrapper ${activeIndex === index ? "active" : activeIndex !== null ? "hidden" : ""}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {/* Box principale */}
            <div className={`section-box ${section.color}`}>{section.name}</div>

            {/* Tendina che appare sotto */}
            <div className="dropdown-box">
              <Link to={section.path} className="text-white">
                {section.name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;


