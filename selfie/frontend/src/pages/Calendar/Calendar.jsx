import React, { useState, useRef,useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  getDay,
  getDate,
  format,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addYears,
  subYears,
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
  // Semanticamente non rappresenta niente, ma permette di refreshare ==================
  const [monthTrigger, setMonthTrigger] = useState(0);
  const modalRef = useRef(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayIndex = getDay(monthStart);
  const lastDayIndex = getDay(monthStart);
  
  // Fetch degli eventi del mese ===============================================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('utente')) || {};
    const userId = storedUser._id;
    if (!userId) return;

    const start = format(monthStart, 'yyyy-MM-dd');
    const end = format(monthEnd,   'yyyy-MM-dd');

    axios
      .get(`/api/events?userId=${userId}&start=${start}&end=${end}`)
      .then((res) => {
        // mappa gli eventi sulle date del mese associate
        const map = {};
        res.data.forEach(evt => {
          map[evt.date] = map[evt.date] || []; // assicura non ci siano valori undefined
          map[evt.date].push(evt);
        });
        setEventsMap(map);
      })
      .catch(console.error);
  }, [monthStart, monthEnd, monthTrigger]);
  
  // forza il refresh ===============================================================
  const refreshMonth = () => setMonthTrigger(t => t + 1); 
  
  // aggiorna la lista del modale quando aggiungi eventi ============================
  useEffect(() => {
    if (selectedDate) {
      setSelectedEvents(eventsMap[selectedDate] || []);
    }
  }, [eventsMap, selectedDate]);
  
  // gestisce la cancellazione di un evento ============================================
  const handleEventDeletion = (deletedId, date) => {
    setEventsMap(map => {
      const dayEvents = (map[date] || []).filter(event => event._id !== deletedId);
      return { ...map, [date]: dayEvents };
    });
    if (selectedDate === date) {
      setSelectedEvents(events => events.filter(event => event._id !== deletedId));
    }
  };
  
  const showModal = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedEvents(eventsMap[dateStr] || []);
    const bsModal = new Modal(modalRef.current);
    bsModal.show();
  };

  const generateCalendar = () => {
    const cells = [];
    // Crea le celle di padding della prima settimana ============================== 
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    // Crea le celle dei vari giorni ================================================
    monthDays.forEach((day) => {
      const dayNum = getDate(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // per i giorni rossi
      const dayClass = isWeekend ? 'weekend' : 'weekday';
      
      const dayEvents = eventsMap[dateStr] || [];
      const types = [...new Set(dayEvents.map(e => e.type))]; // basta un solo evento per tipo per avere l'icona

      cells.push(
        <div
          key={dateStr}
          className={`calendar-cell day ${dayClass}`}
          onClick={() => showModal(dateStr)}
        >
          <div className="day-number">{dayNum}</div>
          {/* aggiunge le icone del caso */}
          {dayEvents.length > 0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon" />}
              {types.includes('manual') && <i className="bi bi-plus-circle manual-icon" />}
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
  
  // cambio mese/anno =====================================================================
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToPreviousYear = () => setCurrentDate(prev => subYears(prev, 1));
  const goToNextYear = () => setCurrentDate(prev => addYears(prev, 1));


  /*Ho button da sopra calendarmodal modalref a sopra h2 classname = ecc, ho cambiato div classname da mt-4 a mt-1*/
  return (
    <div className="container mt-1">

      <button className='btn btn-outline-primary mt-5 mb-2' onClick={goHome}>Torna alla home</button>
      <div className='d-flex justify-content-center align-items-center mb-3'>
        
        <div className='btn-group me-2'>
          <button className='btn btn-outline-secondary' onClick={goToPreviousYear}>
            &laquo;
          </button>
          <button className='btn btn-outline-secondary' onClick={goToPreviousMonth} >
            &lsaquo;
          </button>
        </div>

        <h2 className="mx-3 mb-2 px-5">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <div className='btn-group ms-2'>
          <button className='btn btn-outline-secondary' onClick={goToNextMonth}>
            &rsaquo;
          </button>
          <button className='btn btn-outline-secondary' onClick={goToNextYear}>
            &raquo;
          </button>
        </div>

      </div>
      <div className="calendar-grid-header">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-cell header">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid-body">{generateCalendar()}</div>
      <CalendarModal 
        modalRef={modalRef} 
        selectedDate={selectedDate} 
        selectedEvents={selectedEvents}
        onEventAdded={refreshMonth}
        onEventDeleted={handleEventDeletion}
      />
    </div>
  );
};

export default Calendar;

