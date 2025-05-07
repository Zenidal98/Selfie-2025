import React, { useState } from "react";
import axios from "axios";

const CalendarModal = ({ 
  modalRef, 
  selectedDate, 
  selectedEvents,
  onEventAdded
}) => {

  const [newText, setNewText] = useState('');
  const storedUser = JSON.parse(localStorage.getItem('utente')) || {};
  const userId = storedUser._id;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    
    try {
      await axios.post('api/events', {
        userId,
        date: selectedDate,
        text: newText.trim(),
      });
      setNewText('');
      onEventAdded();
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show();
    } catch (err) {
      console.error(err);
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
                      event.type === 'note' ? 'list-group-item-info' : 'list-group-item-success'}`}
                  >
                    {event.text}
                  </li>    
                ))}
              </ul>
            )}

            {/* Form per aggiungere attivita' */}
            <div>
              <label htmlFor="new-evt" className="form-label">New Activity:</label>
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
