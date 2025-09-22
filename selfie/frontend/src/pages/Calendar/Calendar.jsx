import React, { useState, useRef, useEffect } from 'react';
import { startOfMonth, endOfMonth, getDay, getDate, format, eachDayOfInterval, addMonths, subMonths, addYears, subYears, parseISO, addDays, isAfter, subDays, parse, startOfWeek, endOfWeek, getISOWeek } from 'date-fns';
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

  const todayStr = format(virtualNow, 'yyyy-MM-dd');
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

  // utilities settimanali
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekNumber = getISOWeek(currentDate);

  //controlla che virtualNow non sia già stato pickato altrove prima del render di calendar
  useEffect(() => {
    setCurrentDate(virtualNow);
  }, []);

  // aggiorna quando ti sposti con la tm
  useEffect(() => {
    if (lastManualChange !== null) {
      setCurrentDate(virtualNow);
    }
  }, [lastManualChange, virtualNow]);

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
    const prevKey = format(subMonths(monthStart, 1), 'yyyy-MM');
    const prevStart = format(subMonths(monthStart, 1), 'yyyy-MM-dd');
    const prevEnd = format(endOfMonth(subMonths(monthStart, 1)), 'yyyy-MM-dd');
    fetchMonth(prevKey, prevStart, prevEnd);
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

        const dueDate = evt.dueDate ? parseISO(evt.dueDate) : parseISO(evt.date);
        const today = virtualNow;

        // marca gli eventi: giallo se in orario, rosso altrimenti
        if (dueDate > today) {
          if (format(currentDay, 'yyyy-MM-dd') === format(dueDate, 'yyyy-MM-dd')) {
            enrichedEvents.push({ ...evt, status: 'yellow' });
          }
        } else if (format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          if (format(currentDay, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            let status = 'yellow';
            if (evt.dueTime) { // stesso giorno, ma in ritardo sull'orario
              const dueDateTime = parse(evt.dueTime, 'HH:mm', today);
              if (isAfter(today, dueDateTime)) {
                status = 'red';
              }
            }
            enrichedEvents.push({ ...evt, status });
          }
        }
        else if (dueDate < today) {
          const dueStr = format(dueDate, 'yyyy-MM-dd');
          const todayStrLocal = format(today, 'yyyy-MM-dd');
          const currentStr = format(currentDay, 'yyyy-MM-dd');
          if (currentStr === dueStr || currentStr === todayStrLocal) {
            enrichedEvents.push({ ...evt, status: 'red' });
          }
        }
      } else if (evt.recurrence?.frequency) {
        const [year, month, day] = evt.date.split('-').map(Number);
        const dtstart = new Date(Date.UTC(year, month - 1, day));
        let until = undefined;
        if (evt.recurrence.endDate) {
          const [uYear, uMonth, uDay] = evt.recurrence.endDate.split('-').map(Number);
          until = new Date(Date.UTC(uYear, uMonth - 1, uDay, 23, 59, 59));
        } else {
          // default a 3 anni
          const defaultEndDate = addYears(monthEnd, 3);
                until = new Date(Date.UTC(defaultEndDate.getFullYear(), defaultEndDate.getMonth(), defaultEndDate.getDate(), 23, 59, 59));
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

        const startUTC = new Date(Date.UTC(wideSearchStart.getFullYear(), wideSearchStart.getMonth(), wideSearchStart.getDate()));
        const endUTC = new Date(Date.UTC(wideSearchEnd.getFullYear(), wideSearchEnd.getMonth(), wideSearchEnd.getDate()));


        const occurrencesUTC = rule.between(startUTC, endUTC, true);

        for (const occUTC of occurrencesUTC) {
          const startOfOccurrence = toZonedTime(occUTC, timeZone);
          const spanDays = [];
          for (let i = 0; i < (evt.spanningDays || 1); i++) { // se l'evento dura piu' giorni 
            spanDays.push(format(addDays(startOfOccurrence, i), 'yyyy-MM-dd'));
          }

          if (spanDays.includes(dateStr)) {
            const startOccDateStr = format(startOfOccurrence, 'yyyy-MM-dd');
            if (evt.exclusions?.includes(startOccDateStr)) continue; // non espande gli eventi nella lista esclusioni
            enrichedEvents.push({ ...evt, date: startOccDateStr, isVirtual: true }); // isVirtual marca gli eventi frutto della espansione
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
  }, [eventsCache, selectedDate, monthKey, virtualNow]);

  // notifiche browser controllate dalla time machine, calcola quali eventi vanno notificati nell’istante corrente
  useEffect(() => {


    const interval = setInterval(() => {
      // usa sempre il tempo attuale virtual time
      const now = virtualNow;
      const nowMin = Math.floor(now.getTime() / 60000);
      const allEvents = Object.values(eventsCache).flat(2);
      const today = format(now, 'yyyy-MM-dd');
      const GRACE_MINUTES = 5; // fallo se il ritardo è inferiore a 5 minuti, serve per dare una mini finestra di tolleranza alle notifiche

      // fa la lista di eventi da notificare (solo per il giorno virtuale corrente)
      const eventsForNotification = allEvents.reduce((acc, dayObj) => {
        if (!dayObj || typeof dayObj !== 'object') return acc;

        for (const [dateKey, events] of Object.entries(dayObj)) {
          if (!Array.isArray(events) || events.length === 0) continue;

          for (const event of events) {
            if (!event) continue;

            // 1) Attività: notifica se scadono oggi e non sono completate
            if (event.type === 'activity') {
              if (!event.isComplete && event.dueDate === today) {
                acc.push(event);
              }
              
              // 1b) Urgency notifications for overdue activities
              if (!event.isComplete && event.notificationPrefs?.urgency && event.dueDate && event.dueTime) {
                const dueDateTime = new Date(`${event.dueDate}T${event.dueTime}:00`);
                if (now > dueDateTime) {
                  // Calculate days overdue
                  const diffTime = now - dueDateTime;
                  const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  
                  // Add urgency notification info to the event
                  const urgencyEvent = {
                    ...event,
                    isUrgencyNotification: true,
                    daysOverdue,
                    originalDueDateTime: dueDateTime
                  };
                  acc.push(urgencyEvent);
                }
              }
              
              continue;
            }

            // 2) Eventi ricorrenti
            if (event.recurrence?.frequency) {
              const rule = new RRule({
                freq: RRule[event.recurrence.frequency],
                interval: event.recurrence.interval || 1,
                dtstart: parseISO(event.date), // start
                until: event.recurrence.endDate ? parseISO(event.recurrence.endDate) : undefined,
              });

              // cerca intorno al now virtuale per evitare errori di un singolo giorno
              const occurrencesUTC = rule.between(subDays(now, 1), addDays(now, 1), true);

              for (const occUTC of occurrencesUTC) {
                const occDateStr = format(toZonedTime(occUTC, timeZone), 'yyyy-MM-dd');
                if (occDateStr === today && !(event.exclusions || []).includes(occDateStr)) {
                  acc.push({ ...event, date: today }); // normalizza all'occorrenza di oggi
                  break;
                }
              }
              continue;
            }

            // 3) Eventi singoli (ossia non ricorrenti): solo se cadono nella data di oggi 
            if (event.date === today || dateKey === today) {
              acc.push(event);
            }
          }
        }
        return acc;
      }, []);


      // elabora e notifica al minuto virtuale corretto (con la tolleranza di sopra) 
      eventsForNotification.forEach(event => {
        // Handle urgency notifications differently
        if (event.isUrgencyNotification) {
          const daysOverdue = event.daysOverdue;
          const [baseHour, baseMinute] = event.dueTime.split(':').map(n => Number(n));
          
          // Calculate how many notifications for today (max 10)
          const notificationsToday = Math.min(daysOverdue, 10);
          
          for (let i = 0; i < notificationsToday; i++) {
            // Each notification is 1 hour later than the previous
            const urgencyHour = baseHour + i;
            const urgencyTime = new Date(now);
            urgencyTime.setHours(urgencyHour, baseMinute, 0, 0);
            
            const urgencyMin = Math.floor(urgencyTime.getTime() / 60_000);
            const baseKey = `urgency-${event._id}-${today}-${i}`;
            
            // Check if it's time for this urgency notification (within 5 minute window)
            const inWindow = nowMin >= urgencyMin && nowMin < urgencyMin + GRACE_MINUTES;
            if (!inWindow) continue;
            
            // Browser urgency notification
            if (event.notificationPrefs?.browser) {
              const uniqueId = `browser-${baseKey}`;
              const ackKey = `event-ack-browser-${baseKey}`;
              if (!notifiedEvents.has(uniqueId) && !localStorage.getItem(ackKey)) {
                showNotification(
                  {
                    title: `🚨 Attività in ritardo (${daysOverdue} giorno/i)`,
                    body: `"${event.text}" - Notifica ${i + 1} di oggi`
                  },
                  () => localStorage.setItem(ackKey, 'true')
                );
                setNotifiedEvents(prev => new Set(prev).add(uniqueId));
              }
            }
          }
          return; // Skip normal notification processing for urgency events
        }
        // decidi le stringhe di data/ora dell’occorrenza
        let eventDateStr, eventTimeStr;

        if (event.type === 'activity') {
          if (!event.dueDate || !event.dueTime) return;
          eventDateStr = event.dueDate;
          eventTimeStr = event.dueTime;
        } else if (event.type === 'manual') {
          if (!event.date || !event.time) return;
          eventDateStr = event.date;
          eventTimeStr = event.time;
        } else {
          return; 
        }

        const [hour, minute] = String(eventTimeStr).split(':').map(n => Number(n));
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;

        // costruisce la data e ora locale
        const evtDateTime = new Date(
          `${eventDateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
        );

        const advanceMin = Number(event.notificationPrefs?.advance) || 0;
        const repeatCount = Math.max(1, Number(event.notificationPrefs?.repeat) || 1);
        const repeatIntervalMin = Math.max(1, Number(event.notificationPrefs?.repeatIntervalMin) || 1);

        const notifyTime = new Date(evtDateTime.getTime() - advanceMin * 60_000);
        const notifyMin = Math.floor(notifyTime.getTime() / 60_000);


        for (let i = 0; i < repeatCount; i++) {
          const thisNotifyMin = notifyMin + i * repeatIntervalMin;
          const baseKey = `${event._id}-${eventDateStr}-${thisNotifyMin}`;

          // notifica entro la finestra di tolleranza: [thisNotifyMin, thisNotifyMin + GRACE_MINUTES)
          const inWindow = nowMin >= thisNotifyMin && nowMin < thisNotifyMin + GRACE_MINUTES;
          if (!inWindow) continue;

          // Browser 
          if (event.notificationPrefs?.browser) {
            const uniqueId = `browser-${baseKey}`;
            const ackKey = `event-ack-browser-${baseKey}`;
            if (!notifiedEvents.has(uniqueId) && !localStorage.getItem(ackKey)) {
              showNotification(
                {
                  title: event.type === 'activity' ? 'Activity Due' : 'Event Reminder',
                  body: `${event.text} at ${eventTimeStr} (${eventDateStr})`
                },
                () => localStorage.setItem(ackKey, 'true')
              );
              setNotifiedEvents(prev => new Set(prev).add(uniqueId));
            }
          }
        }
      });
    }, 2000);

    return () => clearInterval(interval);
    // includi lastManualChange così un salto della Time Machine viene applicato subito
  }, [eventsCache, notifiedEvents, virtualNow, lastManualChange]);

  // cancella gli eventi dalla cache (e causa rerender)
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

  // gestisce l'eccezione di un evento istanza di una ricorrenza
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

  // gestisce l'aggiunta di un  evento in cache
  const handleEventAddition = (newEvt) => {
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

  // gestisce il completamento di una attivita' e la rimuove dalla visualizzazione
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

  // Funzioni per cambiare mese-settimana / anno. 
  const changePeriod = (changeIndex) => {
    setIsSynced(false); // per "staccarsi" liberamente dal mese di arrivo della tm
    if (viewMode === 'month') {
      setCurrentDate(d => addMonths(d, changeIndex));
    } else {
      setCurrentDate(d => addDays(d, changeIndex * 7));
    }
    setSelectedDate(null);
    setSelectedEvents([]);
  };



  const changeYear = (changeIndex) => {
    setIsSynced(false);
    setCurrentDate(d => addYears(d, changeIndex));
    setSelectedDate(null);
    setSelectedEvents([]);
  };

  // causa il download del file .ics alla pressione del pulsante
  const handleExport = async () => {
    try {
      const response = await api.get("/events/export", {
        responseType: "blob", //cosi' axios non lo parsa come JSON
      });
      // crea, clicca e rimuove un link per il download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "selfieCalendar.ics");
      document.body.appendChild(link);
      link.click();
      //reset
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to donwload ICS", error);
    }
  };

  // aggiorna un evento esistente in cache (post-edit) 
  const handleEventUpdated = (updatedEvt) => {
    setEventsCache(cache => {
      const newCache = { ...cache };

      // togli da vecchia data se sposti
      for (const key in newCache) {
        for (const date in newCache[key]) {
          newCache[key][date] = newCache[key][date].filter(e => e._id !== updatedEvt._id);
        }
      }

      // aggiungi alla nuova
      const monthKey = updatedEvt.date.slice(0, 7); // yyyy-MM
      if (!newCache[monthKey]) newCache[monthKey] = {};
      if (!newCache[monthKey][updatedEvt.date]) newCache[monthKey][updatedEvt.date] = [];
      newCache[monthKey][updatedEvt.date].push(updatedEvt);

      return newCache;
    });

    setSelectedEvents(es => es.map(e => (e._id === updatedEvt._id ? updatedEvt : e)));

  };

  // genera la vista mensile del calendario
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
      //const isAnyActivityDelayed = expandedToday.some(e => e.type === 'activity' && e.isDelayed);

      cells.push(
        <div key={dateStr}
          className={`calendar-cell day ${dayClass} ${dateStr === todayStr ? 'today-highlight' : ''}`} // evidenzia la data (virtuale) di oggi
          onClick={() => showModal(dateStr)}>
          <div className="day-number">{dayNum}</div>
          {expandedToday.length > 0 && (
            <div className="event-indicators">
              {types.includes('note') && <i className="bi bi-stickies-fill note-icon" title="Note" />}
              {types.includes('manual') && (expandedToday.some(e => e.isPomodoro) ? <span className="manual-icon" title="Pomodoro">🍅</span>: <i className="bi bi-plus-circle manual-icon" title="Event" />)}
              {expandedToday.some(e => e.type === 'activity' && e.status === 'yellow') && (
                <i className="bi bi-exclamation-circle-fill due-activity-icon" title="Activity In Progress / Due" />
              )}
              {expandedToday.some(e => e.type === 'activity' && e.status === 'red') && (
                <i className="bi bi-exclamation-triangle-fill delayed-activity-icon" title="Delayed Activity" />
              )}
            </div>
          )}
        </div>
      );
    });

    while (cells.length < 42) {
      cells.push(<div key={`empty-end-${cells.length}`} className="calendar-cell empty" />);
    } // pusha celle grigie alla fine del calendario, permette di avere un layout fisso e uniforme
    return cells;
  };

  // genera la view settimanale del calendario
  const generateWeekView = () => {
    const cm = eventsCache[monthKey] || {};
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const rawEvents = Object.values(cm).flat();
      const expandedToday = expandEvents(rawEvents, dateStr);
      const types = [...new Set(expandedToday.map(e => e.type))];
      const dayClass = (getDay(day) === 0 || getDay(day) === 6) ? 'weekend' : 'weekday';
      return (
        <div key={dateStr} className={`calendar-cell week-day ${dayClass} ${dateStr === todayStr ? 'today-highlight' : ''}`} onClick={() => showModal(dateStr)}>
          <div className="day-number">{format(day, 'EEE dd MMM')}</div>
          <div className="event-indicators">
            {types.includes('note') && <i className="bi bi-stickies-fill note-icon" title="Note"/>}
            {types.includes('manual') && (expandedToday.some(e => e.isPomodoro) ? <span className='manual-icon' title="Pomodoro">🍅</span> : <i className="bi bi-plus-circle manual-icon" title="Event"/>)}
            {expandedToday.some(e => e.type === 'activity' && e.status === 'yellow') && (
              <i className="bi bi-exclamation-circle-fill due-activity-icon" title="Activity In Progress / Due" />
            )}
            {expandedToday.some(e => e.type === 'activity' && e.status === 'red') && (
              <i className="bi bi-exclamation-triangle-fill delayed-activity-icon" title="Delayed Activity" />
            )}
          </div>
        </div>
      );
    });
  };

  // genera la overview delle attivita'
  const generateActivitiesPanel = () => {
    const cm = eventsCache[monthKey] || {};
    const rawEvents = Object.values(cm).flat();

    const days = viewMode === 'month' ? monthDays : weekDays; // le attivita' del mese o della settimana in base alla view scelta

    const collected = [];
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const expanded = expandEvents(rawEvents, dateStr);
      expanded
        .filter(e => e.type === 'activity')
        .forEach(e => {
          if (!collected.find(c => c._id === e._id)) { // evita la duplicazione delle attivita'
            collected.push(e);
          }
        });
    });

    return (
      <div className="activities-panel">
        <h4>Activities this {viewMode === 'month' ? 'month' : 'week'}</h4>

        {collected.length === 0 ? (
          <div className="text-muted">No activities</div>
        ) : (
          <div className="activities-list">
            {collected.map(act => {
              const status = act.status || 'yellow';
              return (
                <div
                  key={act._id}
                  className={`activity-card ${status === 'yellow' ? 'due-bg' : 'delayed-bg'}`}
                >
                  <div className="activity-text">{act.text}</div>
                  {act.dueDate && (
                    <div className="activity-meta">
                      <span className="label">Due:</span>{' '}
                      {format(parseISO(act.dueDate), 'PP')}
                      {act.dueTime ? ` • ${act.dueTime}` : ''}
                    </div>
                  )}
                  {!act.dueDate && act.date && (
                    <div className="activity-meta">
                      <span className="label">Start:</span>{' '}
                      {format(parseISO(act.date), 'PP')}
                      {act.dueTime ? ` • ${act.dueTime}` : ''}
                    </div>
                  )}
                  {act.location && (
                    <div className="activity-meta">
                      <span className="label">Location:</span> {act.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mt-1">
      
      <div className="d-flex justify-content-center align-items-center my-3 period-nav">
        
        <div className="btn-group period-btn-left">
          <button className="btn btn-outline-secondary" onClick={()=>changeYear(-1)}>&laquo;</button>
          <button className="btn btn-outline-secondary" onClick={()=>changePeriod(-1)}>&lsaquo;</button>
        </div>
        <h2 className="mx-3 mb-2 px-5 period-label text-truncate">
          {viewMode==='month' ? format(currentDate,'MMMM yyyy') : `Week ${weekNumber}, ${format(currentDate,'yyyy')}`}
        </h2>
        <div className="btn-group period-btn-right">
          <button className="btn btn-outline-secondary" onClick={()=>changePeriod(1)}>&rsaquo;</button>
          <button className="btn btn-outline-secondary" onClick={()=>changeYear(1)}>&raquo;</button>
        </div>
        

      </div>

      {viewMode === 'month' && (
        <div className="calendar-grid-header">
          {daysOfWeek.map(d => (
            <div key={d} className="calendar-cell header">
              {d}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'month' ? (
        <div className="calendar-grid-body mb-5">{generateCalendar()}</div>
      ) : (
        <div className="week-view mb-5">{generateWeekView()}</div>
      )}
      
      <div className="d-flex flex-wrap justify-content-end align-items-center button-row gap-2">
         
        <button className="btn btn-primary flex-shrink-1 mb-2" onClick={()=>navigate('/home')}>Torna alla home</button>
        <div className="btn-group flex-shrink-1">
          <button className={`btn btn-secondary ${viewMode==='month'?'active':''}`} onClick={()=>setViewMode('month')}>Month</button>
          <button className={`btn btn-secondary ${viewMode==='week'?'active':''}`} onClick={()=>setViewMode('week')}>Week</button>
        </div>
        <button className='btn btn-dark flex-shrink-1 mb-2' onClick={handleExport}>
          EXPORT ICS 
        </button>


      </div>

      {generateActivitiesPanel()}

      <CalendarModal
        modalRef={modalRef}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
        onEventAdded={handleEventAddition}
        onEventDeleted={handleEventDeletion}
        onEventExclusion={handleEventExclusion}
        onActivityToggled={handleActivityToggled}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  );

};

export default Calendar;
