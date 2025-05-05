import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const CalendarModal = ({ modalRef, selectedDate, selectedEvents }) => {
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
        </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>  
            <button type="button" className="btn btn-primary">Add Activity</button>
          </div>

        </div>
      </div>
    </div>
  ); 
};

export default CalendarModal;
