import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";
import { jwtDecode } from "jwt-decode";
import api from "../../utils/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // niente URL assoluto: usa l'istanza api con baseURL
      const res = await api.post("/login", credentials);
      const token = res.data.token;

      const user = jwtDecode(token);

      // salvi in sessionStorage (coerente col tuo codice)
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("utente", JSON.stringify(user));

      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Errore durante il login");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Benvenuto in Selfie!</h1>
        <p className="text-muted text-center">L'applicazione fatta da studenti per gli studenti</p>

        <form onSubmit={handleSubmit}>
          <input type="text" name="username" className="form-control mb-2" placeholder="Nome utente" onChange={handleChange} required />
          <input type="password" name="password" className="form-control mb-3" placeholder="Password" onChange={handleChange} required />
          <button className="btn btn-primary w-100" type="submit">Login</button>
        </form>

        <p className="mt-3 text-muted">
          Non sei registrato? <a href="/register">Registrati qui</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
