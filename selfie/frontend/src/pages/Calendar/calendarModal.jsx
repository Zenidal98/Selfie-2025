import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTimeMachine } from '../../utils/TimeMachine';   
import { requestNotificationPermission, showNotification } from '../../utils/notify';
import { v4 as uuidv4 } from 'uuid';

const CalendarModal = ({ 
  modalRef, 
  selectedDate, 
  selectedEvents,
  onEventAdded,
  onEventDeleted,
}) => {
  const { virtualNow } = useTimeMachine();

  const [newText, setNewText] = useState('');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [newTime, setNewTime] = useState('00:00');
  const [newEndTime, setNewEndTime] = useState('00:00');
  const [spanningDays, setSpanningDays] = useState(1);

  const [useBrowserNotif, setUseBrowserNotif] = useState(true);
  const [useEmailNotif, setUseEmailNotif] = useState(false);
  const [advanceNotice, setAdvanceNotice] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);

  const [recurrence, setRecurrence] = useState({
    frequency: '',
    interval: 1,
    endDate: '',
  });

  const storedUser = JSON.parse(localStorage.getItem('utente'));
  const userId = storedUser?._id;

  const handleAdd = async () => {
    // check che la textbox non sia vuota
    if (!newText.trim()) return;
    
    try {
      const payload = {
        userId,
        date: selectedDate,
        text: newText.trim(),
        time: newTime,
        endTime: newEndTime || null,
        spanningDays,
        type: 'manual',
        notificationPrefs: {
          browser: useBrowserNotif,
          email: useEmailNotif,
          advance: advanceNotice,
          repeat: repeatCount
        }
      };

      if (recurrence.frequency) {
        payload.recurrence = {
          frequency: recurrence.frequency,
          interval: recurrence.interval,
          endDate: recurrence.endDate || null
        };
        payload.recurrenceId = uuidv4();
      }

      const res = await axios.post('/api/events', payload);
      // resetta lo stato
      setNewText('');
      setNewTime("00:00");
      setNewEndTime("00:00");
      setSpanningDays(1);
      setRecurrence({ frequency: '', interval: 1, endDate: '' });
      setUseBrowserNotif(true);
      setUseEmailNotif(false);
      setAdvanceNotice(0);
      setRepeatCount(1);

      onEventAdded(res.data);
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show();
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione dell\'evento.');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Vuoi davvero eliminare questa attività?')) return;
    setDeletingIds(ids => new Set(ids).add(eventId));
    try {
      await axios.delete(`/api/events/${eventId}`);
      onEventDeleted(eventId, selectedDate);
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'eliminazione.');
    } finally {
      setDeletingIds(ids => {
        const temp = new Set(ids);
        temp.delete(eventId);
        return temp;
      });
    }
  };


  // Ordina gli eventi per orario (d'inizio)
  const sortedEvents = [...selectedEvents].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="modal fade" tabIndex="-1" ref={modalRef}>
      <div className="modal-dialog">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">
              {selectedDate ? `Events on ${selectedDate}` : 'No date selected'}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <p><em>Cosa farai oggi?</em></p>
            {sortedEvents.length === 0 ? (
              <p><em>No events for this day</em></p>
            ) : ( 
              <ul className="list-group">
                {sortedEvents.map((event, index) => (
                  <li
                    key={index}
                    className={`list-group-item ${event.type === 'note' ? 'list-group-item-info' : 'list-group-item-success'}`}
                  >
                    <div className="text-wrap text-break">{event.text}</div>
                    <div className="d-flex justify-content-end align-items-center mt-2 flex-wrap gap-2">
                      <span className="badge rounded-pill bg-secondary mx-2">{event.time}</span>
                      {event.type === 'manual' && (
                        <button className="btn btn-sm btn-outline-danger rounded-pill mx-2" onClick={() => handleDelete(event._id)} disabled={deletingIds.has(event._id)}>
                          {deletingIds.has(event._id) ? '...' : 'x'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Form per aggiungere attività */}
            <div className="mt-4">
              <h5>Nuova Attività</h5>

              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <input className="form-control" value={newText} onChange={e => setNewText(e.target.value)} />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Ora Inizio</label>
                  <input type="time" className="form-control" value={newTime} onChange={e => setNewTime(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Ora Fine</label>
                  <input type="time" className="form-control" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Giorni di durata</label>
                <input type="number" className="form-control" min="1" value={spanningDays} onChange={(e) => setSpanningDays(parseInt(e.target.value) || 1)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Meccanismo di notifica</label>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="notify-browser" checked={useBrowserNotif} onChange={(e) => setUseBrowserNotif(e.target.checked)} />
                  <label className="form-check-label" htmlFor="notify-browser">Notifica browser</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="notify-email" checked={useEmailNotif} onChange={(e) => setUseEmailNotif(e.target.checked)} />
                  <label className="form-check-label" htmlFor="notify-email">Notifica email</label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Quando ricevere la notifica</label>
                <select className="form-select" value={advanceNotice} onChange={(e) => setAdvanceNotice(parseInt(e.target.value))}>
                  <option value={0}>Al momento dell’evento</option>
                  <option value={1}>1 minuto prima</option>
                  <option value={5}>5 minuti prima</option>
                  <option value={15}>15 minuti prima</option>
                  <option value={30}>30 minuti prima</option>
                  <option value={60}>1 ora prima</option>
                  <option value={120}>2 ore prima</option>
                  <option value={1440}>1 giorno prima</option>
                  <option value={2880}>2 giorni prima</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Ripetizione notifica</label>
                <select className="form-select" value={repeatCount} onChange={(e) => setRepeatCount(parseInt(e.target.value))}>
                  <option value={1}>Una volta sola</option>
                  <option value={3}>Ripeti 3 volte</option>
                  <option value={5}>Ogni minuto (max 5 volte)</option>
                  <option value={10}>Ogni ora (max 10 volte)</option>
                  <option value={999}>Fino a risposta</option>
                </select>
              </div>

              {/* Ricorrenza */}
              <div className="mb-3">
                <label className="form-label">Ricorrenza</label>
                <select
                  className="form-select mb-2"
                  value={recurrence.frequency}
                  onChange={(e) => setRecurrence({ ...recurrence, frequency: e.target.value })}
                >
                  <option value="">Nessuna</option>
                  <option value="DAILY">Giornaliera</option>
                  <option value="WEEKLY">Settimanale</option>
                  <option value="MONTHLY">Mensile</option>
                </select>

                {recurrence.frequency && (
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="form-label">Ripeti ogni (n giorni/settimane/mesi)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={recurrence.interval}
                        onChange={(e) => setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div className="col-md-6 mb-2">
                      <label className="form-label">Fino a</label>
                      <input
                        type="date"
                        className="form-control"
                        value={recurrence.endDate}
                        onChange={(e) => setRecurrence({ ...recurrence, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="d-grid">
                <button className="btn btn-primary" type="button" onClick={handleAdd}>Aggiungi +</button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
