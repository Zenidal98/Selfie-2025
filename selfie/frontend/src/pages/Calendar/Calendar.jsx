import React, { useState, useRef, useEffect } from 'react';
import {
  startOfMonth, endOfMonth, getDay, getDate, format, eachDayOfInterval,
  addMonths, subMonths, addYears, subYears,
} from 'date-fns';
import './calendar.css';
import { useNavigate } from "react-router-dom";
import CalendarModal from './calendarModal';
import { Modal } from 'bootstrap';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useTimeMachine } from '../../TimeMachine'; 


const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const Calendar = () => {
  const { virtualNow, isSynced, setIsSynced, lastManualChange } = useTimeMachine(); 

  const [currentDate,  setCurrentDate]  = useState(virtualNow);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [monthTrigger, setMonthTrigger] = useState(0);
  const [eventsCache, setEventsCache]   = useState({});   
  
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayIndex = getDay(monthStart);

  //controlla che virtualNow non sia già stato pickato altrove prima del render di calendar
  useEffect(() => {
    setCurrentDate(virtualNow);
  }, []);

  // aggiorna quando ti sposti con la tm
  useEffect(() => {
    if (lastManualChange !== null) {
      setCurrentDate(virtualNow);
    }
  }, [lastManualChange]);

  // fetch dei mesi NON in cache ======================================================
  const fetchMonth = async (key, start, end) => {
    if (eventsCache[key]) return; // ce l'ho già:
    try {
      const stored = JSON.parse(localStorage.getItem('utente')) || {};
      const userId = stored._id;
      if (!userId) return;
      const res = await axios.get(`/api/events?userId=${userId}&start=${start}&end=${end}`);
      const map = {};
      res.data.forEach(evt => {
        map[evt.date] = map[evt.date] || [];
        map[evt.date].push(evt);
      });
      setEventsCache(c => ({ ...c, [key]: map }));
    } catch (err) {
      console.error('fetchMonth failed', err);
    }
  };

  // carica in cache i mesi prima/dopo ================================================
  useEffect(() => {
    const start = format(monthStart, 'yyyy-MM-dd');
    const end   = format(monthEnd,   'yyyy-MM-dd');
    fetchMonth(monthKey, start, end);
    // prefetch prev
    const prevKey = format(subMonths(monthStart,1), 'yyyy-MM');
    const prevStart = format(subMonths(monthStart,1), 'yyyy-MM-dd');
    const prevEnd   = format(endOfMonth(subMonths(monthStart,1)), 'yyyy-MM-dd');
    fetchMonth(prevKey, prevStart, prevEnd);
    // prefetch next
    const nextKey = format(addMonths(monthStart,1), 'yyyy-MM');
    const nextStart = format(addMonths(monthStart,1), 'yyyy-MM-dd');
    const nextEnd   = format(endOfMonth(addMonths(monthStart,1)), 'yyyy-MM-dd');
    fetchMonth(nextKey, nextStart, nextEnd);
  }, [monthKey, monthTrigger]);

  // synca il modale alla cache ===================================================
  useEffect(() => {
    if (selectedDate && selectedDate.startsWith(monthKey)) {
      const cm = eventsCache[monthKey] || {};
      setSelectedEvents(cm[selectedDate] || []);
    }
  }, [eventsCache, selectedDate, monthKey]);

  //const refreshMonth = () => setMonthTrigger(t => t + 1);

  // gestisce la rimozione di un evento dalla cache (e quindi dell'icona se necessario) ============================
  const handleEventDeletion = (deletedId, date) => {
    setEventsCache(c => {
      const m = { ...c };
      // filtra solo gli eventi che non devono essre cancellati
      const arr = (m[monthKey][date] || []).filter(e=>e._id!==deletedId);
      // aggiorna la map (in quel giorno) solo con gli eventi filtrati
      m[monthKey] = { ...m[monthKey], [date]: arr };
      return m;
    });
    if (selectedDate === date) {
      // aggiorna la lista del modale
      setSelectedEvents(evts => evts.filter(e=>e._id!==deletedId));
    }
  };

  // gestisce l'aggiunta di nuovi eventi (e quindi anche icone / lista modale ) =====================
  const handleEventAddition = (newEvt) => {
    const key = format(monthStart, 'yyyy-MM');
    setEventsCache(cache => {
      // check che la cache e le mappe effettivamente esistano
      const monthMap = cache[key] || {};
      const dayList = monthMap[newEvt.date] || [];
      // aggiunge l'evento alla map del mese
      const updatedDayList = [...dayList, newEvt];
      // aggiunge la map del mese alla cache
      return {
        ...cache,
        [key]: {
          ...monthMap,
          [newEvt.date]: updatedDayList
        }
      };
    });
    // aggiunge l'evento alla lista del modale
    if (selectedDate === newEvt.date) {
      setSelectedEvents(es => [...es, newEvt]);
    }
  };
  
  // mostra il modale in quella specifica giornata ============================================
  const showModal = dateStr => {
    setSelectedDate(dateStr);
    // check di controllo
    const cm = eventsCache[monthKey] || {};
    setSelectedEvents(cm[dateStr] || []);
    new Modal(modalRef.current).show();
  };

  // Funzioni per cambiare mese / anno. IMPORTANTE: il modale viene azzerato per evitare il flicker bug
  const changeMonth = changeIndex => {
    setIsSynced(false); // per "staccarsi" liberamente dal mese di arrivo della tm
    setCurrentDate(d => addMonths(d, changeIndex));
    setSelectedDate(null);
    setSelectedEvents([]);
  };

  const changeYear = changeIndex => {
    setIsSynced(false);
    setCurrentDate(d => addYears(d, changeIndex));
    setSelectedDate(null);
    setSelectedEvents([]);
  };

  // Genera le celle del calendario (in accordo con la map di quel mese) =======================
  const generateCalendar = () => {
    const cells = [];
    const cm = eventsCache[monthKey] || {};
    // genera l'offset del mese di calendario (le celle grigie inattive della prima settimana)
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`e${i}`} className="calendar-cell empty"/>);
    }
    monthDays.forEach(day => {
      const dateStr = format(day,'yyyy-MM-dd');
      const dayNum = getDate(day);
      const dow = getDay(day);
      // distinzione per fare i giorni del weekend di aspetto diverso
      const dayClass = (dow===0 || dow===6) ? 'weekend':'weekday';
      const dayEvents = cm[dateStr] || [];
      // necessario per detrminare se c'è ALMENO UN evento di quel tipo in quel giorno
      const types = [...new Set(dayEvents.map(e=>e.type))];
      cells.push(
        <div key={dateStr}
             className={`calendar-cell day ${dayClass}`}
             onClick={()=>showModal(dateStr)}>
          <div className="day-number">{dayNum}</div>
          {/* rendering condizionae delle icone */}
          {dayEvents.length>0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon"/>}
              {types.includes('manual') && <i className="bi bi-plus-circle manual-icon"/>}
            </div>
          )}
        </div>
      );
    });
    return cells;
  };

  return (
    <div className="container mt-1">
      
      {/* Home Button */}
      <button className="btn btn-outline-primary my-3" onClick={()=>navigate('/home')}>
        Torna alla home
      </button>

      {/* gruppo di cambio mese/anno */}    
      <div className="d-flex justify-content-center align-items-center mb-3">
        <div className="btn-group me-2">
          <button className="btn btn-outline-secondary" onClick={()=>changeYear(-1)}>&laquo;</button>
          <button className="btn btn-outline-secondary" onClick={()=>changeMonth(-1)}>&lsaquo;</button>
        </div>
        <h2 className="mx-3 mb-2 px-5">{format(currentDate,'MMMM yyyy')}</h2>
        <div className="btn-group ms-2">
          <button className="btn btn-outline-secondary" onClick={()=>changeMonth(1)}>&rsaquo;</button>
          <button className="btn btn-outline-secondary" onClick={()=>changeYear(1)}>&raquo;</button>
        </div>
      </div>

      {/* griglia del calendario*/}
      <div className="calendar-grid-header">
        {daysOfWeek.map(d=>(
          <div key={d} className="calendar-cell header">{d}</div>
        ))}
      </div>
      <div className="calendar-grid-body mb-5">{generateCalendar()}</div>
      
      <CalendarModal
        modalRef={modalRef}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
        onEventAdded={handleEventAddition}
        onEventDeleted={handleEventDeletion}
      />
    </div>
  );
};

export default Calendar;


