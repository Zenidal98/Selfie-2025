import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./RegisterPage.css"
import axios from "axios"

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    username: "",
    email: "",
    password: "",
    conferma:"",
    dataNascita: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const navigate = useNavigate(); // lo uso per tornare subito a login dopo registrazione riuscita

  const handleSubmit = async (e) => {
    e.preventDefault(); // evita il refresh della pagina

    const oggi = new Date();
    const dataInserita = new Date(formData.dataNascita);
    const limiteInizio = new Date("1925-01-01");
  
    if (dataInserita > oggi) {
      alert("Data di nascita troppo avanti nel tempo");
      return;
    }
  
    if (dataInserita < limiteInizio) {
      alert("La data di nascita non può essere precedente al 1 gennaio 1925.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/register", formData);
      console.log("Registrazione avvenuta:", response.data);
      alert("Utente registrato con successo!");
      navigate("/login");

    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      alert("Registrazione fallita.");
    }
  };
  

  return (
    <div className="register-page">
      <div className="register-wrapper">
        <div className="register-container">
         <h4 className="text-center mb-3">Registrati</h4>
         <form onSubmit={handleSubmit}>
          <input type="text" name="nome" className="form-control mb-2" placeholder="Nome" onChange={handleChange} required />
          <input type="text" name="cognome" className="form-control mb-2" placeholder="Cognome" onChange={handleChange} required />
          <input type="text" name="username" className="form-control mb-2" placeholder="Nome utente" onChange={handleChange} required />
          <input type="email" name="email" className="form-control mb-2" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" className="form-control mb-2" placeholder="Password" onChange={handleChange} required />
          <input type="password" name="conferma" className="form-control mb-2" placeholder="Conferma Password" onChange={handleChange} required />
          <input type="date" name="dataNascita" className="form-control mb-2" onChange={handleChange} required />
          <button className="btn btn-primary w-100">Registrati</button>
         </form>
       
         <p className="mt-3 text-muted">
           Sei già registrato? <Link to="/">Accedi qui</Link>
         </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
