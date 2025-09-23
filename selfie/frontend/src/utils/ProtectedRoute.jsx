// file che serve per proteggere le varie sezioni del sito da chi non ha fatto l'accesso in login
import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTimeMachine } from "./TimeMachine";

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const now = new Date().getTime() / 1000;

    if (decoded.exp < now) {
      sessionStorage.clear();
      return <Navigate to="/login" replace />;
    }

    return children;

  } catch (error) {
    sessionStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;

