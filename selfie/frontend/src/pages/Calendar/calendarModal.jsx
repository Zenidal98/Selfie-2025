import React, { useEffect, useState } from "react";
//import { Collapse } from "bootstrap"; 
// import axios from "axios";                 // [MOD] rimosso axios diretto
// [MOD] uso l'istanza api che allega automaticamente il Bearer token
import api from "../../utils/api";

const CalendarModal = ({
  modalRef,
  selectedDate,
  selectedEvents,
  onEventAdded,
  onEventDeleted,
  onEventExclusion,
  onActivityToggled
}) => {
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('00:00');
  const [newEndTime, setNewEndTime] = useState('00:00');
  const [spanningDays, setSpanningDays] = useState(1);
  const [recurrence, setRecurrence] = useState({ frequency: '', interval: 1, endDate: '' });
  const [useBrowserNotif, setUseBrowserNotif] = useState(true);
  const [useEmailNotif, setUseEmailNotif] = useState(false);
  const [advanceNotice, setAdvanceNotice] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('09:00');
  const [newLocation, setNewLocation] = useState(''); 
  const [advancedOpen, setAdvancedOpen] = useState(false); // gestisce lo stato dell'accordion
  // const storedUser = JSON.parse(localStorage.getItem('utente'));
  // const userId = storedUser?._id;
  // [MOD] non passiamo più userId dal frontend: il backend lo prende da req.user.id (JWT)

  useEffect(() => {
    if (selectedDate) {
      setNewText('');
      setNewTime('00:00');
      setNewEndTime('00:00');
      setSpanningDays(1);
      setRecurrence({ frequency: '', interval: 1, endDate: '' });
      setNewDueDate('');
      setNewDueTime('09:00');
      setUseBrowserNotif(true);
      setUseEmailNotif(false);
      setAdvanceNotice(0);
      setRepeatCount(1);
      setNewLocation('');
    }
  }, [selectedDate]);

  const handleAdd = async () => {
    if (!newText.trim() /*|| !userId*/ ) return; // [MOD] rimosso controllo su userId (non serve lato client)

    let payload;
    const notificationPayload = {
      browser: useBrowserNotif,
      email: useEmailNotif,
      advance: advanceNotice,
      repeat: repeatCount
    };

    if (newDueDate) {
      payload = {
        // userId,                                      // [MOD] NON inviare userId dal client
        type: 'activity',
        text: newText.trim(),
        date: selectedDate,
        dueDate: newDueDate,
        dueTime: newDueTime,
        notificationPrefs: notificationPayload,
        location: newLocation.trim() || null,
      };
    } else {
      payload = {
        // userId,                                      // [MOD] NON inviare userId dal client
        type: 'manual',
        text: newText.trim(),
        date: selectedDate,
        time: newTime,
        endTime: newEndTime,
        spanningDays: spanningDays,
        recurrence: recurrence.frequency ? recurrence : undefined,
        notificationPrefs: notificationPayload,
        location: newLocation.trim() || null,
      };
    }

    try {
      // const res = await axios.post('/api/events', payload);
      // [MOD] uso api.post (aggiunge Authorization) e rotta senza prefisso /api (è già nel baseURL)
      const res = await api.post('/events', payload);
      onEventAdded(res.data);
      setNewText('');
      setNewDueDate('');
      setNewTime('00:00');
      setNewLocation('');
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione dell\'elemento.');
    }
  };

  const handleToggleComplete = async (activityId) => {
    try {
      // const res = await axios.patch(`/api/events/${activityId}/toggle-complete`);
      // [MOD] uso api.patch per includere il token
      const res = await api.patch(`/events/${activityId}/toggle-complete`);
      onActivityToggled(res.data);
    } catch (err) {
      console.error('Failed to toggle activity', err);
      alert('Errore nell\'aggiornamento dell\'attività.');
      }
  };

  const handleDelete = async (event) => {
    const seriesId = event._id;
    if (event.isVirtual) {
      const choice = window.confirm("This is a recurring event. Press OK to delete the ENTIRE series, or Cancel to delete ONLY this occurrence.");
      if (choice) {
        try {
          // await axios.delete(`/api/events/${seriesId}`);
          // [MOD] uso api.delete (token) e path coerente col baseURL
          await api.delete(`/events/${seriesId}`);
          onEventDeleted(seriesId);
        } catch (err) {
          console.error("Failed to delete series", err);
          alert('Error deleting the event series.');
        }
      } else {
        try {
          // await axios.patch(`/api/events/${seriesId}/exclude`, { dateToExclude: event.date });
          // [MOD] idem sopra
          await api.patch(`/events/${seriesId}/exclude`, { dateToExclude: event.date });
          onEventExclusion(seriesId, event.date);
        } catch (err) {
          console.error("Failed to exclude the single occurrence", err);
          alert('Error deleting the single occurrence.');
        }
      }
    } else {
      if (!window.confirm('Sei sicuro di voler cancellare questo elemento?')) return;
      try {
        // await axios.delete(`/api/events/${event._id}`);
        // [MOD] idem sopra
        await api.delete(`/events/${event._id}`);
        onEventDeleted(event._id);
      } catch (err) {
        console.error("Failed to delete item", err);
        alert('Error deleting the item.');
      }
    }
  };
    
  // i seguenti due metodi rendono la UI di attivita' e ricorrenza mutuamente esclusive
  const handleDueDateChange = (e) => {
    const newDate = e.target.value;
    setNewDueDate(newDate);
    if (newDate) {
      setRecurrence({ frequency: '', interval: 1, endDate: '' });
    }
  };

  const handleRecurrenceChange = (e) => {
    const newFrequency = e.target.value;
    setRecurrence(r => ({ ...r, frequency: newFrequency }));
    if (newFrequency) {
      setNewDueDate('');
      setNewDueTime('');
    }
  };

  const sortedEvents = [...selectedEvents].sort((a, b) => (a.time || a.dueTime || '00:00').localeCompare(b.time || b.dueTime || '00:00'));

    return (
        <div className="modal fade" tabIndex="-1" ref={modalRef}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{selectedDate ? `Elementi del ${selectedDate}` : 'Nessuna data selezionata'}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {sortedEvents.length === 0 ? (
                            <p><em>Nessun elemento per questo giorno.</em></p>
                        ) : (
                            <ul className="list-group mb-4">
                                {sortedEvents.map(event => (
                                    <li key={event._id + event.date} className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                        <div className="me-auto">
                                            <span className={`fw-bold ${event.isDelayed ? 'text-danger' : ''}`}>{event.text}</span><br />
                                            {event.type === 'manual' && ( 
                                              <small className="text-muted">
                                                Evento alle {event.time}
                                                {event.endTime ? ` - Termina alle ${event.endTime}` : ''}
                                                {event.spanningDays && event.spanningDays > 1 ? ` (del ${new Date(new Date(event.date).getTime() + (event.spanningDays - 1) * 24*60*60*1000).toISOString().slice(0,10)})` : ''}
                                              </small>)}
                                            {event.type === 'activity' && <small className="text-muted">Scadenza: {event.dueDate} alle {event.dueTime}{event.isDelayed ? ' - IN RITARDO!' : ''}</small>}
                                            {event.type === 'note' && <small className="text-muted">Nota</small>}
                                        </div>
                                        <div className="d-flex align-items-center ms-2 mt-2 mt-md-0">
                                            {event.type === 'activity' && (
                                                <button className={`btn btn-sm me-2 ${event.isComplete ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleToggleComplete(event._id)}>
                                                    <i className={`bi ${event.isComplete ? 'bi-check-circle-fill' : 'bi-check-circle'}`}></i> {event.isComplete ? 'Completata' : 'Completa'}
                                                </button>
                                            )}
                                            {event.type !== 'note' && (
                                                <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDelete(event)}>&times;</button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <hr />
                        <div className="mt-4">
                            <h5>Nuovo Elemento</h5>
                            <div className="mb-3">
                                <label className="form-label">Descrizione</label>
                                <input className="form-control" value={newText} onChange={e => setNewText(e.target.value)} />
                            </div>
                            <p className="text-muted small">Compila la data di scadenza per creare un'attività (To-Do), altrimenti verrà creato un normale evento.</p>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Data di Scadenza (per Attività)</label>
                                    {/* il doppio !! assicura robustezza nel fatto che il campo sia boolean true, anziche' truthy */}
                                    <input type="date" className="form-control" value={newDueDate} disabled={!!recurrence.frequency} onChange={handleDueDateChange} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Ora di Scadenza (per Attività)</label>
                                    <input type="time" className="form-control" value={newDueTime} disabled={!!recurrence.frequency} onChange={e => setNewDueTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <label className="form-label">Ora Inizio (per Eventi)</label>
                                    <input type="time" className="form-control" value={newTime}  disabled={!!newDueDate} onChange={e => setNewTime(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Ora Fine (per Eventi)</label>
                                    <input type="time" className="form-control" value={newEndTime} disabled={!!newDueDate} onChange={e => setNewEndTime(e.target.value)} />
                                </div>
                                <div className="mb-3 mt-3">
                                    <label className="form-label">Giorni di duarata (per Eventi)</label>
                                    <input type="number" className="form-control" min= "1" value={spanningDays} disabled={!!newDueDate} onChange={(e) => setSpanningDays(parseInt(e.target.value) || 1)} />
                                </div>
                            </div>
                            <div className="accordion mt-3" id="advancedOptions">
                              <div className="accordion-item">
                                <h2 className="accordion-header" id="headingAdvanced">
                                  <button
                                    className={`accordion-button ${advancedOpen ? '' : 'collapsed'}`}
                                    type="button"
                                    onClick={() => setAdvancedOpen(!advancedOpen)}
                                    aria-expanded={advancedOpen}
                                    aria-controls="collapseAdvanced"
                                  >
                                    Opzioni Avanzate (Ricorrenza & Notifiche)
                                  </button>
                                </h2>
                                <div
                                  id="collapseAdvanced"
                                  className={`accordion-collapse collapse ${advancedOpen ? 'show' : ''}`}
                                  aria-labelledby="headingAdvanced"
                                >
                                <div className="accordion-body">
                                  <h6>Ricorrenza (per Eventi)</h6>
                                  <select
                                    className="form-select mb-2"
                                    value={recurrence.frequency}
                                    disabled={!!newDueDate}
                                    onChange={handleRecurrenceChange}
                                  >
                                    <option value="">Nessuna</option>
                                    <option value="DAILY">Giornaliera</option>
                                    <option value="WEEKLY">Settimanale</option>
                                    <option value="MONTHLY">Mensile</option>
                                  </select>

                                  {recurrence.frequency && (
                                    <div className="row">
                                      <div className="col-md-6 mb-2">
                                        <label className="form-label">Ripeti ogni</label>
                                        <input
                                          type="number"
                                          className="form-control"
                                          min="1"
                                          value={recurrence.interval}
                                          onChange={(e) =>
                                            setRecurrence({
                                              ...recurrence,
                                              interval: parseInt(e.target.value) || 1
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="col-md-6 mb-2">
                                        <label className="form-label">Fino a</label>
                                        <input
                                          type="date"
                                          className="form-control"
                                          value={recurrence.endDate}
                                          onChange={(e) =>
                                            setRecurrence({ ...recurrence, endDate: e.target.value })
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <hr />
                                  <h6 className="mt-3">Notifiche</h6>
                                  <div className="mb-3">
                                    <label className="form-label">Meccanismo di notifica</label>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="notify-browser"
                                        checked={useBrowserNotif}
                                        onChange={(e) => setUseBrowserNotif(e.target.checked)}
                                      />
                                      <label className="form-check-label" htmlFor="notify-browser">
                                        Notifica browser
                                      </label>
                                    </div>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="notify-email"
                                        checked={useEmailNotif}
                                        onChange={(e) => setUseEmailNotif(e.target.checked)}
                                      />
                                      <label className="form-check-label" htmlFor="notify-email">
                                        Notifica email
                                      </label>
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <label className="form-label">Quando ricevere la notifica</label>
                                    <select
                                      className="form-select"
                                      value={advanceNotice}
                                      onChange={(e) => setAdvanceNotice(parseInt(e.target.value))}
                                    >
                                      <option value={0}>Al momento dell’evento</option>
                                      <option value={5}>5 minuti prima</option>
                                      <option value={15}>15 minuti prima</option>
                                      <option value={60}>1 ora prima</option>
                                      <option value={1440}>1 giorno prima</option>
                                    </select>
                                  </div>

                                  <div className="mb-3">
                                    <label className="form-label">Ripetizione notifica</label>
                                    <select
                                      className="form-select"
                                      value={repeatCount}
                                      onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                                    >
                                      <option value={1}>Una volta sola</option>
                                      <option value={3}>Ripeti 3 volte</option>
                                      <option value={5}>Ogni minuto (max 5 volte)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                            <div className="d-grid mt-4">
                                <button className="btn btn-primary" type="button" onClick={handleAdd}>Aggiungi +</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
