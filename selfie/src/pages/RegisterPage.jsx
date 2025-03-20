import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    username: "",
    password: "",
    dataNascita: "",
    foto: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dati registrazione:", formData);
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-white">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h4 className="text-center mb-3">Registrati</h4>
        <form onSubmit={handleSubmit}>
          <input type="text" name="nome" className="form-control mb-2" placeholder="Nome" onChange={handleChange} required />
          <input type="text" name="cognome" className="form-control mb-2" placeholder="Cognome" onChange={handleChange} required />
          <input type="text" name="username" className="form-control mb-2" placeholder="Nome utente" onChange={handleChange} required />
          <input type="password" name="password" className="form-control mb-2" placeholder="Password" onChange={handleChange} required />
          <input type="date" name="dataNascita" className="form-control mb-2" onChange={handleChange} required />
          <input type="file" name="foto" className="form-control mb-3" onChange={handleFileChange} accept="image/*" />
          <button className="btn btn-primary w-100">Registrati</button>
        </form>
      </div>
      <p className="mt-3 text-muted">
        Sei già registrato? <Link to="/">Accedi qui</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
