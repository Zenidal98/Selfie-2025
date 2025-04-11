import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate(); // Serve per reindirizzare

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", credentials);
      console.log("Utente:", res.data.data);

      // salva utente nel localStorage, mi serve per far si che nella home appaia il nome e cognome legato all'username di login e non uno a caso
      localStorage.setItem("utente", JSON.stringify(res.data.data));

      // Reindirizza alla home
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Errore durante il login");
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      {/* Messaggio di benvenuto */}
      <div className="bg-primary text-white text-center py-3 px-5 rounded mb-4">
        <h1>Benvenuto in Selfie!</h1>
        <p className="mb-0">L'applicazione fatta da studenti per gli studenti</p>
      </div>

      {/* Form di Login */}
      <div className="card p-4 shadow" style={{ width: "300px" }}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            className="form-control mb-2"
            placeholder="Username"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            className="form-control mb-3"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>

      {/* Link alla registrazione */}
      <p className="mt-3 text-muted">
        Se non sei registrato, <Link to="/register">clicca qui</Link>
      </p>
    </div>
  );
};

export default LoginPage;
