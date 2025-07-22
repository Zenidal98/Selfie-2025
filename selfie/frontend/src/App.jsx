import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage.jsx";
import RegisterPage from "./pages/Register/RegisterPage.jsx";
import HomePage from "./pages/Home/HomePage.jsx";
import PomodoroPage from "./pages/Pomodoro/PomodoroPage.jsx";
import NoteEditor from "./pages/NotesV2/Notes";
import ProtectedRoute from './utils/ProtectedRoute.jsx';
import Calendar from "./pages/Calendar/Calendar.jsx";
import { TimeMachineProvider } from './utils/TimeMachine.jsx';

const App = () => {               // ho messo che / parte da /login
  return (  
    <Router>
      <TimeMachineProvider>
      <Routes>
      <Route path="/" element={<Navigate to="/login" />} />                        
      <Route path="/login" element={<LoginPage />} /> 
      <Route path="/register" element={<RegisterPage />} /> 
      <Route path="/home" element={<ProtectedRoute> <HomePage /> </ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute> <NoteEditor /> </ProtectedRoute>} />  
      <Route path="/pomodoro" element={<ProtectedRoute> <PomodoroPage /> </ProtectedRoute>}/>
      <Route path="/calendar" element={<ProtectedRoute> <Calendar/> </ProtectedRoute>}/>
      </Routes>
      </TimeMachineProvider>
    </Router>
  );
};

export default App;


