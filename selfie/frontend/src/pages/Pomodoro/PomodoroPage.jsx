import React from "react";
import PomodoroTimer from "./PomodoroTimer";
//import PomodoroTasks from "../components/PomodoroTasks";
//import PomodoroSettings from "../components/PomodoroSettings";
//import "../styles/Pomodoro.css";

const PomodoroPage = () => {
  return (
    <div className="pomodoro-container">
      <PomodoroTimer />
    </div>
  );
};

export default PomodoroPage;


// ci vanno pomodorotask e pomodorosettings sotto a timer ovviamente