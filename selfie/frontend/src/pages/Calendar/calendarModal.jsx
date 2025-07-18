import React, { useEffect, useState } from "react";
import axios from "axios";
import { parse, format } from "date-fns";
import { useTimeMachine } from "../../TimeMachine";   

const CalendarModal = ({ 
  modalRef, 
  selectedDate, 
  selectedEvents,
  onEventAdded,
  onEventDeleted,
}) => {

  const { virtualNow } = useTimeMachine();

  const [newText, setNewText] = useState('');
  const [deletingIds, setDeletingIds] = useState(new Set()) // assicura id unici
  const [newTime, setNewTime] = useState('00:00'); // orario inizio dell'attivita' (del form)
  const [newEndTime, setNewEndTime] = useState('00:00'); // fine
  const [spanningDays, setSpanningDays] = useState(1); 
  const [recurrence, setRecurrence] = useState({
    frequency: '',
    interval: 1,
    endDate: '',
  });

  const storedUser = JSON.parse(localStorage.getItem('utente')) //|| {}; tanto se spunta {} siamo fregati lo stesso
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
        spanningDays: spanningDays,
        type: 'manual'
      };
      
      if (recurrence.frequency) {
        payload.recurrence = {
          frequency: recurrence.frequency,
          interval: recurrence.interval,
          endDate: recurrence.endDate || null
        };
      }


      const res = await axios.post('/api/events', payload);
      // resetta lo stato
      setNewText('');
      setNewTime("00:00");
      setNewEndTime("00:00");
      setSpanningDays(1);
      setRecurrence({
        frequency: '',
        interval: 1,
        endDate: '',
      });
      
      onEventAdded(res.data); // così sono certo che l'oggetto evento sia lo stesso ( poi mi servono date e time)
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show();
    } catch (err) {
      console.error(err);
      alert('Error in adding event. Please try again');
    }
  };
 
  const handleDelete = async (eventId) => {   
    if (!window.confirm('Do you really want to delete this activity?')) return;
    // "Marca" unicamente gli eventi che dovranno essere filtrati via
    setDeletingIds(ids => new Set(ids).add(eventId));
    try {
      await axios.delete(`/api/events/${eventId}`);
      onEventDeleted(eventId, selectedDate);
    } catch (err) {
      console.error(err);
      alert('Error in deleting events');
    } finally {
      // se tutto è andato bene rimuove l'evento dalla lista nera
      setDeletingIds(ids => {
        const tempSet = new Set(ids);
        tempSet.delete(eventId);
        return tempSet;
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
                    key = {index}
                    className = {`list-group-item ${
                      event.type === 'note' ? 'list-group-item-info' : 'list-group-item-success'} `}
                  >
                    <div className="text-wrap text-break">
                      {event.text}
                    </div>
                      <div className="d-flex justify-content-end align-items-center mt-2 flex-wrap gap-2">
                        <span className="badge rounded-pill bg-secondary mx-2">
                          {event.time}
                        </span>
                        {event.type === 'manual' && (
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill mx-2"
                            onClick={() => handleDelete(event._id)}
                            disabled={deletingIds.has(event._id)}
                          >{deletingIds.has(event._id) ? '...' : 'x'}
                        </button>
                        )}
                        {event.type === 'note' && (
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill mx-2"
                            onClick={() => alert("Wanna go to the note editor and cancel this?")}
                          >?
                          </button>
                        )}
                      </div>
                  </li>    
                ))}
              </ul>
            )}

            {/* Form per aggiungere attivita' */}
            <div className="mt-4">
              <h5>Add a New Activity</h5>
  
              <div className="mb-3">
                <label htmlFor="new-evt-text" className="form-label">Activity Description</label>
                <input
                  id="new-evt-text"
                  type="text"
                  className="form-control"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="e.g., Study for exam"
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-2">
                  <label htmlFor="new-evt-start" className="form-label">Start Time</label>
                  <input
                    id="new-evt-start"
                    type="time"
                    className="form-control"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-2">
                  <label htmlFor="new-evt-end" className="form-label">End Time</label>
                  <input
                    id="new-evt-end"
                    type="time"
                    className="form-control"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="spanning-days" className="form-label">Spanning Days</label>
                <input
                  id="spanning-days"
                  type="number"
                  className="form-control"
                  min="1"
                  value={spanningDays}
                  onChange={(e) => setSpanningDays(parseInt(e.target.value) || 1)}
                />
                <div className="form-text">Defaults to 1 (same-day activity)</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Recurrence</label>
                <select
                  className="form-select mb-2"
                  value={recurrence.frequency}
                  onChange={(e) => setRecurrence({ ...recurrence, frequency: e.target.value })}
                >
                  <option value="">No recurrence</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>

                {recurrence.frequency && (
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label htmlFor="rec-interval" className="form-label">Repeat Every</label>
                        <input
                          id="rec-interval"
                          type="number"
                          className="form-control"
                          min="1"
                          value={recurrence.interval}
                          onChange={(e) =>
                            setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                          }
                        />
                    </div>

                    <div className="col-md-6 mb-2">
                      <label htmlFor="rec-enddate" className="form-label">Until (optional)</label>
                      <input
                        id="rec-enddate"
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
              </div>

              <div className="d-grid">
                <button 
                  className="btn btn-primary"
                  type="button"
                  onClick={handleAdd}
                >
                  Add +
                </button>
              </div>
            </div>
            
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>  
            {/* bottone per ora non lo cancello, ma e' spostato nel form
            <button type="button" className="btn btn-primary">Add Activity</button>
            */}
          </div>

        </div>
      </div>
    </div>
  ); 
};

export default CalendarModal;
