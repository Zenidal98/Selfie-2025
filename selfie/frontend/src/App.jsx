import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import Notes from "./pages/Notes.jsx";
import PomodoroPage from "./pages/Pomodoro/PomodoroPage.jsx";

const App = () => {               // ho messo che / parte da /login
  return (  
    <Router>
      <Routes>
      <Route path="/" element={<Navigate to="/login" />} />                        
      <Route path="/login" element={<LoginPage />} /> 
      <Route path="/register" element={<RegisterPage />} /> 
      <Route path="/home" element={<HomePage />} />
      <Route path="/notes" element={<Notes />} />  
      <Route path="/pomodoro" element={<PomodoroPage/>} />
      </Routes>
    </Router>
  );
};

export default App;


