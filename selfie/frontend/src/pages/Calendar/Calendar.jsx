import React, { useState, useRef,useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  getDay,
  getDate,
  format,
  eachDayOfInterval,
} from 'date-fns';
import './calendar.css';
import { useNavigate } from "react-router-dom";
import CalendarModal from './calendarModal';
import { Modal } from 'bootstrap';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventsMap, setEventsMap] = useState({});
  const [selectedEvents, setSelectedEvents] = useState([]);

  const modalRef = useRef(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayIndex = getDay(monthStart);
  
  
  // Fetch all months' worth of events ===============================================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('utente')) || {};
    const userId = storedUser._id;
    if (!userId) return;

    const start = format(monthStart, 'yyyy-MM-dd');
    const end   = format(monthEnd,   'yyyy-MM-dd');

    axios
      .get(`/api/events?userId=${userId}&start=${start}&end=${end}`)
      .then((res) => {
        // build date→events map
        const map = {};
        res.data.forEach(evt => {
          map[evt.date] = map[evt.date] || [];
          map[evt.date].push(evt);
        });
        setEventsMap(map);
      })
      .catch(console.error);
  }, [monthStart, monthEnd]);
  

  const showModal = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedEvents(eventsMap[dateStr] || []);
    const bsModal = new Modal(modalRef.current);
    bsModal.show();
  };

  const generateCalendar = () => {
    const cells = [];
    // Empty cells before month start
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    // Day cells
    monthDays.forEach((day) => {
      const dayNum = getDate(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday 
      const dayClass = isWeekend ? 'weekend' : 'weekday';
      
      const dayEvents = eventsMap[dateStr] || [];
      const types = [...new Set(dayEvents.map(e => e.type))];

      cells.push(
        <div
          key={dateStr}
          className={`calendar-cell day ${dayClass}`}
          onClick={() => showModal(dateStr)}
        >
          <div className="day-number">{dayNum}</div>

          {dayEvents.length > 0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon" />}
              {types.includes('manual') && <i className="bi bi-plus-cricle manual-icon" />}
            </div>
          )}
        </div>
      );
    });

    return cells;
  };
  
  //  Torna alla homepage =================================================================
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/home");
  };
                           /*Ho button da sopra calendarmodal modalref a sopra h2 classname = ecc, ho cambiato div classname da mt-4 a mt-1*/
  return (
    <div className="container mt-1">
      <button className='btn btn-outline-primary mt-5' onClick={goHome}>Torna alla home</button>         
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
      <CalendarModal modalRef={modalRef} selectedDate={selectedDate} selectedEvents={selectedEvents}></CalendarModal>
    </div>
  );
};

export default Calendar;

