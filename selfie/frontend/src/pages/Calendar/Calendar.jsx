import React, { useState, useRef, useEffect } from 'react';
import { startOfMonth, endOfMonth, getDay, getDate, format, eachDayOfInterval,addMonths, subMonths, addYears, subYears, parseISO, addDays, isAfter, subDays, parse} from 'date-fns';
import { fromZonedTime, toZonedTime, format as formatTZ } from 'date-fns-tz'; 
import './calendar.css';
import { useNavigate } from "react-router-dom";
import CalendarModal from './calendarModal';
import { Modal } from 'bootstrap';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useTimeMachine } from '../../utils/TimeMachine'; 
import { RRule } from 'rrule';  
import { showNotification } from '../../utils/notify';

const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const timeZone = 'Europe/Rome';

const Calendar = () => {
  const { virtualNow, isSynced, setIsSynced, lastManualChange } = useTimeMachine(); 

  const [currentDate,  setCurrentDate]  = useState(virtualNow);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [monthTrigger, setMonthTrigger] = useState(0);
  const [eventsCache, setEventsCache]   = useState({});   
  const [notifiedEvents, setNotifiedEvents] = useState(new Set());

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
        const eventDate = evt.date; // per le attivita' la data di riferimento e' quella di inizio
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

  // arrichisce gli eventi "grezzi" del fetch con le ricorrenze / eventi lunghi 
  const expandEvents = (rawEvents, dateStr) => {
    const enrichedEvents = [];
    const currentDay = parseISO(dateStr);

    for (const evt of rawEvents) {
      if (evt.type === 'activity') {
        if (evt.isComplete) continue;
        const startDate = parseISO(evt.date);
        if (currentDay < startDate) continue;
        const dueDate = evt.dueDate ? parseISO(evt.dueDate) : null;
        const isDelayed = dueDate ? isAfter(currentDay, dueDate) : false;
        enrichedEvents.push({ ...evt, isDelayed });
      } else if (evt.recurrence?.frequency) {
        const [year, month, day] = evt.date.split('-').map(Number);
        // check per evitare conflitti causati dalla time zone
        const dtstart = new Date(Date.UTC(year, month - 1, day));
        let until = undefined;
        if (evt.recurrence.endDate){
          const [uYear, uMonth, uDay] = evt.recurrence.endDate.split('-').map(Number);
          until = new Date(Date.UTC(uYear, uMonth - 1, uDay, 23, 59, 59 ));
        }

        const rule = new RRule({
          freq: RRule[evt.recurrence.frequency],
          interval: evt.recurrence.interval || 1,
          dtstart: dtstart,
          until: until
        });
        
        // garantisce di trovare gli eventi in caso di errori off-by-one
        const wideSearchStart = subDays(monthStart, 2);
        const wideSearchEnd = addDays(monthEnd, 2);
        const occurrencesUTC = rule.between(wideSearchStart, wideSearchEnd, true);

        for (const occUTC of occurrencesUTC) {
          const startOfOccurrence = toZonedTime(occUTC, timeZone);

                // --- THIS IS THE DEFINITIVE FIX ---

                // Step 1: Generate an array of all date strings covered by this event's span.
                const spanDays = [];
                for (let i = 0; i < (evt.spanningDays || 1); i++) {
                    spanDays.push(format(addDays(startOfOccurrence, i), 'yyyy-MM-dd'));
                }

                // Step 2: Check if the day we are currently rendering (`dateStr`) is in that array.
                if (spanDays.includes(dateStr)) {
                    const startOccDateStr = format(startOfOccurrence, 'yyyy-MM-dd');

                    if (evt.exclusions?.includes(startOccDateStr)) {
                        // If the start date is excluded, the whole span is excluded.
                        break; 
                    }
                    
                    enrichedEvents.push({ ...evt, date: startOccDateStr, isVirtual: true });
                    
                    // We found the event instance that covers today, so we're done with this event.
                    break;
                }
        }               
      } else {
        const startOfEvent = parseISO(evt.date);
        const endOfEvent = addDays(startOfEvent, (evt.spanningDays || 1) - 1);
        if (currentDay >= startOfEvent && currentDay <= endOfEvent) {
          enrichedEvents.push(evt);
        }
      }
    }
    return enrichedEvents;
  };
  // synca il modale alla cache ===================================================
  useEffect(() => {
    if (selectedDate && selectedDate.startsWith(monthKey)) {
      const cm = eventsCache[monthKey] || {};
      const rawEvents = Object.values(cm).flat();
      const expanded = expandEvents(rawEvents, selectedDate);
      setSelectedEvents(expanded);
    }
  }, [eventsCache, selectedDate, monthKey]);

  // polling delle notifiche browser ===================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const now = virtualNow; // Using virtualNow for time machine compatibility
      const nowMin = Math.floor(now.getTime() / 60000);
      const allEvents = Object.values(eventsCache).flat(2);

      const eventsForNotification = allEvents.reduce((acc, event) => {
        if(event.recurrence?.frequency) {
          const rule = new RRule({
            freq: RRule[event.recurrence.frequency], interval: event.recurrence.interval || 1, dtstart: parseISO(event.date),
            until: event.recurrence.endDate ? parseISO(event.recurrence.endDate) : undefined
          });
          const today = format(now, 'yyyy-MM-dd');
          const occurrences = rule.between(subDays(now, 1), addDays(now, 1));
          occurrences.forEach(occ => {
            if (format(occ, 'yyyy-MM-dd') === today && !event.exclusions?.includes(today)) {
              acc.push({...event, date: today}); // Add occurrence with today's date
            }
          });
        } else {
          acc.push(event);
        }
        return acc;
      }, []);

      eventsForNotification.forEach(event => {
        if (!event.notificationPrefs?.browser) return;
        if (localStorage.getItem(`event-ack-${event._id}`)) return;

        let eventDateStr, eventTimeStr;

        if (event.type === 'activity') {
          if (!event.dueDate || !event.dueTime) return;
          eventDateStr = event.dueDate;
          eventTimeStr = event.dueTime;
        } else if (event.type === 'manual') {
          if (!event.time) return;
          eventDateStr = event.date;
          eventTimeStr = event.time;
        } else {
          return;
        }

        const [hour, minute] = eventTimeStr.split(':').map(Number);
        const evtDateTime = new Date(`${eventDateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
                
        const notifyTime = new Date(evtDateTime.getTime() - (event.notificationPrefs.advance || 0) * 60000);
        const notifyMin = Math.floor(notifyTime.getTime() / 60000);
        const repeat = event.notificationPrefs.repeat || 1;

        for (let i = 0; i < repeat; i++) {
          const thisNotifyMin = notifyMin + i * (event.notificationPrefs.repeatInterval || 1);
          const uniqueId = `${event._id}-${thisNotifyMin}`;

          if (!notifiedEvents.has(uniqueId) && nowMin === thisNotifyMin) {
            showNotification({
              title: event.type === 'activity' ? 'Activity Due' : 'Event Reminder',
              body: `${event.text} at ${eventTimeStr}`
              }, () => {
                localStorage.setItem(`event-ack-${event._id}`, 'true');
              });
              setNotifiedEvents(prev => new Set(prev).add(uniqueId));
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [eventsCache, notifiedEvents, virtualNow]);


  //const refreshMonth = () => setMonthTrigger(t => t + 1);

  // gestisce la rimozione di un evento dalla cache (e quindi dell'icona se necessario) ============================
  const handleEventDeletion = (deletedId) => {
        setEventsCache(cache => {
            const newCache = { ...cache };
            for (const key in newCache) { 
                const monthMap = newCache[key];
                for (const date in monthMap) {
                    monthMap[date] = monthMap[date].filter(e => e._id !== deletedId);
                }
                newCache[key] = monthMap;
            }
            return newCache;
        });

        setSelectedEvents(evts => evts.filter(e => e._id !== deletedId));
  }; 

  const handleEventExclusion = (eventId, excludedDate) => {
        setEventsCache(cache => {
            const newCache = { ...cache };
            let eventUpdated = false;
            for (const key in newCache) { 
                if (eventUpdated) break;
                const monthMap = newCache[key];
                for (const date in monthMap) {
                    const eventIndex = monthMap[date].findIndex(e => e._id === eventId);
                    if (eventIndex > -1) {
                        const eventToUpdate = monthMap[date][eventIndex];
                        eventToUpdate.exclusions = [...(eventToUpdate.exclusions || []), excludedDate];
                        eventUpdated = true;
                        break;
                    }
                }
            }
            return newCache;
        });

        setSelectedEvents(evts => evts.filter(e => !(e._id === eventId && e.date === excludedDate)));
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
  
  // gestisce il completamento di una attivita' e la rimuove
  const handleActivityToggled = (updatedActivity) => {
    setEventsCache(cache => {
      const newCache = { ...cache };
      for (const key in newCache) {
        const monthMap = newCache[key];
        for (const date in monthMap) {
          // aggiorna self alla posizione corretta
          newCache[key][date] = monthMap[date].map(e => e._id === updatedActivity._id ? updatedActivity : e);
        }
      }
      return newCache;
    });
    // riflette sulla lista modale
    setSelectedEvents(events => events.map(e => e._id === updatedActivity._id ? updatedActivity : e));
  };


  // mostra il modale in quella specifica giornata ============================================
  const showModal = dateStr => {
    setSelectedDate(dateStr);
    // check di controllo
    const cm = eventsCache[monthKey] || {};
    const rawEvents = Object.values(cm).flat();
    const expanded = expandEvents(rawEvents, dateStr);
    setSelectedEvents(expanded);
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

      const rawEvents = Object.values(cm).flat();
      const expandedToday = expandEvents(rawEvents, dateStr);
      // necessario per detrminare se c'è ALMENO UN evento di quel tipo in quel giorno
      const types = [...new Set(expandedToday.map(e=>e.type))];
      const isAnyActivityDelayed = expandedToday.some(e => e.type === 'activity' && e.isDelayed);
      
      cells.push(
        <div key={dateStr}
             className={`calendar-cell day ${dayClass}`}
             onClick={()=>showModal(dateStr)}>
          <div className="day-number">{dayNum}</div>
          {/* rendering condizionae delle icone */}
          {expandedToday.length>0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon" title="Note"/>}
              {types.includes('manual') && <i className="bi bi-plus-circle manual-icon" title="Event"/>}
              {types.includes('activity') && !isAnyActivityDelayed && <i className="bi bi-check2-square activity-icon" title="Activity"/>}
              {isAnyActivityDelayed && <i className="bi bi-exclamation-triangle-fill delayed-activity-icon" title="Delayed Activity!"/> }
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
        onEventExclusion={handleEventExclusion}
        onActivityToggled={handleActivityToggled}
      />
    </div>
  );
};

export default Calendar;


