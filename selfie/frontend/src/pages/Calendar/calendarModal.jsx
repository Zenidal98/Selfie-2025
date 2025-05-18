import React, { useState } from "react";
import axios from "axios";

const CalendarModal = ({ 
  modalRef, 
  selectedDate, 
  selectedEvents,
  onEventAdded,
  onEventDeleted,
}) => {

  const [newText, setNewText] = useState('');
  const [deletingIds, setDeletingIds] = useState(new Set()) // assicura id unici
  const storedUser = JSON.parse(localStorage.getItem('utente')) //|| {}; tanto se spunta {} siamo fregati lo stesso
  const userId = storedUser._id;

  const handleAdd = async () => {
    // check che la textbox non sia vuota
    if (!newText.trim()) return;
    
    try {
      const res = await axios.post('/api/events', {
        userId,
        date: selectedDate,
        text: newText.trim(),
      });
      setNewText('');
      onEventAdded(res.data); // in realtà mi serve solo la data qui, ma almeno così sono certo che l'oggetto evento sia lo stesso 
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show();
    } catch (err) {
      console.error(err);
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
            {selectedEvents.length === 0 ? (
              <p><em>No events for this day</em></p>
            ) : ( 
              <ul className="list-group">
                {selectedEvents.map((event, index) => (
                  <li
                    key = {index}
                    className = {`list-group-item ${
                      event.type === 'note' ? 'list-group-item-info' : 'list-group-item-success'} d-flex justify-content-between align-items-center`}
                  >
                    <span>{event.text}</span>
                    {event.type === 'manual' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingIds.has(event._id)}
                      >{deletingIds.has(event._id) ? '...' : 'x'}
                      </button>
                    )}
                  </li>    
                ))}
              </ul>
            )}

            {/* Form per aggiungere attivita' */}
            <div>
              <label htmlFor="new-evt" className="form-label mt-2">New Activity:</label>
              <div className="input-group">
                <input
                  id="new-evt"
                  type="text"
                  className="form-control"  
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Insert your new activity here"
                />
                <button 
                  className="btn btn-primary"
                  type="button"
                  onClick={handleAdd}
                >Add +
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
