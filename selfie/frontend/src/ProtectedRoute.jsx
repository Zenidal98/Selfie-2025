// file che servirà per proteggere le varie parti da chi non ha fatto l'accesso in login
import React from "react";
import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);

    // Se il token è scaduto (opzionale)
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      localStorage.removeItem("token");
      localStorage.removeItem("utente");
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
