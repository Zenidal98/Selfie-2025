import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", credentials);
      const token = res.data.token;

      // decodifichiamo il token per ottenere i dati utente
      const user = jwtDecode(token);

      // salva token e user nel session storage, in questo modo se si chiude la pagina si deve riaccedere, cosi come se si apre il 
      sessionStorage.setItem("token", token);                     // link in una nuova pagina
      sessionStorage.setItem("utente", JSON.stringify(user));

      // 🔁 Vai alla home
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Errore durante il login");
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="bg-primary text-white text-center py-3 px-5 rounded mb-4">
        <h1>Benvenuto in Selfie!</h1>
        <p className="mb-0">L'applicazione fatta da studenti per gli studenti</p>
      </div>

      <div className="card p-4 shadow" style={{ width: "300px" }}>
        <form onSubmit={handleSubmit}>
          <input type="text" name="username" className="form-control mb-2" placeholder="Nome utente" onChange={handleChange} required />
          <input type="password" name="password" className="form-control mb-3" placeholder="Password" onChange={handleChange} required />
          <button className="btn btn-primary w-100" type="submit">Login</button>
        </form>
      </div>

      <p className="mt-3 text-muted">
        Non sei registrato? <a href="/register">Registrati qui</a>
      </p>
    </div>
  );
};

export default LoginPage;
