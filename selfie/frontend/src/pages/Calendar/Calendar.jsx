import React, { useState, useRef } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(null);                // La data che apri cliccando

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayIndex = getDay(monthStart);

  const modalRef = useRef(null);

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
          onClick={() => handleDayClick(day)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleDayClick(day); }}
          aria-label={`Info su ${format(day, 'PPPP')}`}
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
  
  const handleDayClick = (day) => {
    setSelectedDate(day);
    if (!window.bootstrap) {
      alert("qualcosa non va!");
    } 
    if (modalRef.current) {
      const modalTest = new window.bootstrap.Modal(modalRef.current);
      modalTest.show();
    }
  }

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
      {/* Modal */}
      <div
        className="modal fade"
        id="dayModal"
        tabIndex="-1"
        aria-labelledby="dayModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title" id="dayModalLabel">
                {selectedDate ? format(selectedDate, 'PPPP') : 'Day Details'}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <p>📅 Events or information for this day will go here.</p>
              {/* Placeholder for future events list */}
              <ul>
                <li>Example Event 1</li>
                <li>Example Event 2</li>
              </ul>

              <div className="d-grid gap-2 mt-3">
                <button className="btn btn-primary" type="button">
                  ➕ Add New Event
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

