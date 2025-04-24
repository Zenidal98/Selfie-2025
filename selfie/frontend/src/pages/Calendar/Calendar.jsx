import React, { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  getDay,
  getDate,
  format,
  eachDayOfInterval,
} from 'date-fns';
import './calendar.css';
import { useNavigate } from 'react-router-dom';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];     // Locale da rivedere, lo so

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayIndex = getDay(monthStart);

  const generateCalendar = () => {
    const cells = [];

    // Giorni vuoti per allineare il calendario
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    // Crea le celle per ogni giorno
    monthDays.forEach((day) => {
      const dayNum = getDate(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sabato o Domenica  

      const dayClass = isWeekend ? 'weekend' : 'weekday'; 
      cells.push(
        <div
          key={dateStr}
          className={`calendar-cell day ${dayClass}`}     // giorni weekend css diverso
          onClick={() => alert(`Clicked on ${day}`)}
        >
          <div className="day-number">{dayNum}</div>
        </div>
      );
    });

    return cells;
  };
  
  // Naviga ala homepage
  
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/home");
  };


  return (
    <div className="container mt-4">
      <button className="btn btn-outline-primary" onClick={goHome}>
        Vai alla homepage
      </button>  
      <h2 className="text-center mb-4">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
      <div className="calendar-grid-header">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-cell header">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid-body">{generateCalendar()}</div>
    </div>
  );
};

export default Calendar;

