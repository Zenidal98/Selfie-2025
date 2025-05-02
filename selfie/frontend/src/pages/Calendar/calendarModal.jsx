import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const CalendarModal = ({ modalRef, selectedDate }) => {
  
  const [eventList, setEventList] = useState([]);
  

  // Fetch Utente ==================================================================
  const storedUser = JSON.parse(localStorage.getItem("utente")) || {};
  const userId = storedUser?._id;
   
  // Fetch Eventi (per quella data di quell'utente) ================================
  const fetchEvents = useCallback(() => {
      if(!userId) alert("invalid id!")
      else {
        axios
          .get(`/api/events/${selectedDate}?userId=${userId}`)
          .then(res => {
            setEventList(res.data);
          })
          .catch(console.error);
      };
  }, [selectedDate, userId]);
  
  useEffect(() => {
    fetchEvents();
  }, [selectedDate, fetchEvents]);
  
  // Genera la lista di eventi da inserire nel modale ==============================
  const generateActivityList = useCallback(() => {
    const entries = [];
    
    eventList.forEach(item => {
      entries.push(
          // in base al type possiamo applicare stili differenti ====================
          <li className={`${item.type}`}>{item.text}</li>
      );     
    });

    return entries;
  }, [eventList]);

  //##################################################################################
  return (
    <div className="modal fade" tabIndex="-1" ref={modalRef}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><strong>{selectedDate}</strong></h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        <div className="modal-body">
          <p><em>Cosa farai oggi?</em></p>
          <ul>
              {generateActivityList()}
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
