import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const HomePage = () => {
  const [hoveredSection, setHoveredSection] = useState(null);

  const sections = [
    { name: "Note", path: "/note", color: "bg-primary" },
    { name: "Progetti", path: "/progetti", color: "bg-success" },
    { name: "Calendario", path: "/calendario", color: "bg-warning" },
    { name: "Pomodoro", path: "/pomodoro", color: "bg-danger" },
  ];

  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center vh-100">
      {/* Titolo e data */}
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
      <div className="d-flex justify-content-around w-100 mt-auto">
        {sections.map((section, index) => (
          <div
            key={index}
            className="section-wrapper"
            onMouseEnter={() => setHoveredSection(index)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {/* Box principale che si sposta */}
            <div className={`section-box ${section.color} ${hoveredSection === index ? "hovered" : ""}`}>
              {section.name}
            </div>

            {/* Tendina che appare sotto */}
            <div className={`dropdown-box ${hoveredSection === index ? "visible" : ""}`}>
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
