import React from 'react';

const CalendarModal = ({ modalRef, selectedDate }) => {
  return (
    <div className="modal fade" tabindex="-1" ref={modalRef}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><strong>{selectedDate}</strong></h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        <div className="modal-body">
          <p><em>Cosa farai oggi?</em></p>
          <ul>
              <li>Miao!</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary">Add Activity</button>
        </div>
        </div>
      </div>
    </div>
  ); 
};

export default CalendarModal;
