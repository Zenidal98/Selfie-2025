import React, { useState, useRef, useEffect } from 'react';
import { startOfMonth, endOfMonth, getDay, getDate, format, eachDayOfInterval, addMonths, subMonths, addYears, subYears, parseISO, addDays, isAfter, subDays, parse } from 'date-fns';
import { fromZonedTime, toZonedTime, format as formatTZ } from 'date-fns-tz';
import './calendar.css';
import { useNavigate } from "react-router-dom";
import CalendarModal from './calendarModal';
import { Modal } from 'bootstrap';
// import axios from 'axios';                         // [MOD] rimosso axios diretto
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useTimeMachine } from '../../utils/TimeMachine';
import { RRule } from 'rrule';
import { showNotification } from '../../utils/notify';
// [MOD] uso un'istanza axios condivisa che aggiunge automaticamente l'Authorization
import api from '../../utils/api';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeZone = 'Europe/Rome';

const Calendar = () => {
  const { virtualNow, isSynced, setIsSynced, lastManualChange } = useTimeMachine();

  const [currentDate, setCurrentDate] = useState(virtualNow);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [monthTrigger, setMonthTrigger] = useState(0);
  const [eventsCache, setEventsCache] = useState({});
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
      // const stored = JSON.parse(localStorage.getItem('utente')) || {};    // [MOD] non serve più leggere userId dal front
      // const userId = stored._id;                                          // [MOD] il backend lo inferisce dal JWT (req.user.id)
      // if (!userId) return;                                                // [MOD] rimosso controllo su userId lato client

      // const res = await axios.get(`/api/events?userId=${userId}&start=${start}&end=${end}`);
      // [MOD] uso api.get con params e senza userId; il token è aggiunto dall'interceptor
      const res = await api.get('/events', { params: { start, end } });

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
    const end = format(monthEnd, 'yyyy-MM-dd');
    fetchMonth(monthKey, start, end);
    // prefetch prev
    const prevKey = format(subMonths(monthStart, 1), 'yyyy-MM');
    const prevStart = format(subMonths(monthStart, 1), 'yyyy-MM-dd');
    const prevEnd = format(endOfMonth(subMonths(monthStart, 1)), 'yyyy-MM-dd');
    fetchMonth(prevKey, prevStart, prevEnd);
    // prefetch next
    const nextKey = format(addMonths(monthStart, 1), 'yyyy-MM');
    const nextStart = format(addMonths(monthStart, 1), 'yyyy-MM-dd');
    const nextEnd = format(endOfMonth(addMonths(monthStart, 1)), 'yyyy-MM-dd');
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
        if (evt.recurrence.endDate) {
          const [uYear, uMonth, uDay] = evt.recurrence.endDate.split('-').map(Number);
          until = new Date(Date.UTC(uYear, uMonth - 1, uDay, 23, 59, 59));
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
          const spanDays = [];
          for (let i = 0; i < (evt.spanningDays || 1); i++) {
            spanDays.push(format(addDays(startOfOccurrence, i), 'yyyy-MM-dd'));
          }

          if (spanDays.includes(dateStr)) {
            const startOccDateStr = format(startOfOccurrence, 'yyyy-MM-dd');
            if (evt.exclusions?.includes(startOccDateStr)) {
              break;
            }
            enrichedEvents.push({ ...evt, date: startOccDateStr, isVirtual: true });
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

  // polling delle notifiche browser
  useEffect(() => {
    const interval = setInterval(() => {
      const now = virtualNow; // compatibilita' con time machine
      const nowMin = Math.floor(now.getTime() / 60000);
      const allEvents = Object.values(eventsCache).flat(2);
      const today = format(now, 'yyyy-MM-dd');
      console.log('Polling notifications at', allEvents, 'for', allEvents.length, 'events');
      // crea la lista di eventi da notificare
      // helper: flatten [{ "2025-08-18": [evt, ...] }, { "2025-08-04": [evt, ...] }, ...]
      const flattenedEvents = (allEvents || [])
        .flatMap(bucket =>
          Object.entries(bucket || {}).flatMap(([bucketDate, list]) =>
            (Array.isArray(list) ? list : []).map(ev => ({
              ...ev,
              // keep the bucket's date in case ev.date is undefined
              __bucketDate: bucketDate
            }))
          )
        );

      const eventsForNotification = flattenedEvents.reduce((acc, event) => {
        if (!event) return acc;

        // prefer event.date, fallback to the date key from the bucket
        const eventDate = event.date ?? event.__bucketDate;
        if (!eventDate) return acc;

        if (event.type === "activity") {
          // activities: due today and not complete
          if (!event.isComplete && event.dueDate === today) {
            acc.push(event);
          }
        } else if (event.recurrence?.frequency) {
          // recurring events via RRule
          const rule = new RRule({
            freq: RRule[event.recurrence.frequency],
            interval: event.recurrence.interval || 1,
            dtstart: parseISO(eventDate),
            until: event.recurrence.endDate
              ? parseISO(event.recurrence.endDate)
              : undefined,
          });

          // widened search window to avoid off-by-one
          const occurrencesUTC = rule.between(subDays(now, 1), addDays(now, 1), true);
          for (const occUTC of occurrencesUTC) {
            const occDateStr = format(toZonedTime(occUTC, timeZone), "yyyy-MM-dd");
            if (occDateStr === today && !event.exclusions?.includes(occDateStr)) {
              acc.push({ ...event, date: today }); // normalize date to today
              break;
            }
          }
        } else {
          // one-off events: match today's date (from event or bucket)
          if (eventDate === today) {
            acc.push(event);
          }
        }

        return acc;
      }, []);
      console.log('Events for notification:', eventsForNotification);
      // processa la lista appena creata e notifica al momento opportuno 
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

          const thisNotifyMin = notifyMin + i;
          const uniqueId = `${event._id}-${thisNotifyMin}`;

          if (!notifiedEvents.has(uniqueId) && nowMin === thisNotifyMin) {
            console.log('Notifying event:', event.text, 'at', eventTimeStr, 'on', eventDateStr);
            showNotification({
              title: event.type === 'activity' ? 'Activity Due' : 'Event Reminder',
              body: `${event.text} at ${eventTimeStr} (${eventDateStr}) `
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
    // evita il refresh per gli eventi che spannano negli altri mesi
    if (newEvt.recurrence?.frequency || newEvt.type === 'activity') {
      setEventsCache({});
      setMonthTrigger(t => t + 1); // This forces a refetch
    } else {
      const key = format(monthStart, 'yyyy-MM');
      setEventsCache(cache => {
        const monthMap = cache[key] || {};
        const dayList = monthMap[newEvt.date] || [];
        const updatedDayList = [...dayList, newEvt];
        return { ...cache, [key]: { ...monthMap, [newEvt.date]: updatedDayList } };
      });
    }

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
      cells.push(<div key={`e${i}`} className="calendar-cell empty" />);
    }
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayNum = getDate(day);
      const dow = getDay(day);
      // distinzione per fare i giorni del weekend di aspetto diverso
      const dayClass = (dow === 0 || dow === 6) ? 'weekend' : 'weekday';

      const rawEvents = Object.values(cm).flat();
      const expandedToday = expandEvents(rawEvents, dateStr);
      // necessario per detrminare se c'è ALMENO UN evento di quel tipo in quel giorno
      const types = [...new Set(expandedToday.map(e => e.type))];
      const isAnyActivityDelayed = expandedToday.some(e => e.type === 'activity' && e.isDelayed);

      cells.push(
        <div key={dateStr}
          className={`calendar-cell day ${dayClass}`}
          onClick={() => showModal(dateStr)}>
          <div className="day-number">{dayNum}</div>
          {/* rendering condizionae delle icone */}
          {expandedToday.length > 0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon" title="Note" />}
              {types.includes('manual') && <i className="bi bi-plus-circle manual-icon" title="Event" />}
              {types.includes('activity') && !isAnyActivityDelayed && <i className="bi bi-check2-square activity-icon" title="Activity" />}
              {isAnyActivityDelayed && <i className="bi bi-exclamation-triangle-fill delayed-activity-icon" title="Delayed Activity!" />}
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
      <button className="btn btn-outline-primary my-3" onClick={() => navigate('/home')}>
        Torna alla home
      </button>

      {/* gruppo di cambio mese/anno */}
      <div className="d-flex justify-content-center align-items-center mb-3">
        <div className="btn-group me-2">
          <button className="btn btn-outline-secondary" onClick={() => changeYear(-1)}>&laquo;</button>
          <button className="btn btn-outline-secondary" onClick={() => changeMonth(-1)}>&lsaquo;</button>
        </div>
        <h2 className="mx-3 mb-2 px-5">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="btn-group ms-2">
          <button className="btn btn-outline-secondary" onClick={() => changeMonth(1)}>&rsaquo;</button>
          <button className="btn btn-outline-secondary" onClick={() => changeYear(1)}>&raquo;</button>
        </div>
      </div>

      {/* griglia del calendario*/}
      <div className="calendar-grid-header">
        {daysOfWeek.map(d => (
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
