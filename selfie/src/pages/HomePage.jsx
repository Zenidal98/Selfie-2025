import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const HomePage = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      {/* Messaggio di benvenuto */}
      <div className="bg-primary text-white text-center py-3 px-5 rounded mb-4">
        <h1>Benvenuto in Selfie!</h1>
        <p className="mb-0">L'applicazione fatta da studenti per gli studenti</p>
      </div>

      {/* Form di Login */}
      <div className="card p-4 shadow" style={{ width: "300px" }}>
        <form>
          <button className="btn btn-primary w-100">Login</button>
        </form>
      </div>

      {/* Link alla registrazione */}
      <p className="mt-3 text-muted">
        Se non sei registrato, <Link to="/register">clicca qui</Link>
      </p>
    </div>
  );
};

export default HomePage;
