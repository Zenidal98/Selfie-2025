import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// [MOD] istanza api con Bearer token
import api from "../../utils/api";
// [MOD] preview piano Pomodoro (adegua il path se diverso)
import { calcolaCicliStandard } from "../Pomodoro/PomodoroUtils";

const CalendarModal = ({
  modalRef,
  selectedDate,
  selectedEvents,
  onEventAdded,
  onEventDeleted,
  onEventExclusion,
  onActivityToggled
}) => {
  const navigate = useNavigate();

  // Base event/activity fields
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("00:00");
  const [newEndTime, setNewEndTime] = useState("00:00");
  const [spanningDays, setSpanningDays] = useState(1);
  const [recurrence, setRecurrence] = useState({ frequency: "", interval: 1, endDate: "" });
  const [useBrowserNotif, setUseBrowserNotif] = useState(true);
  const [useEmailNotif, setUseEmailNotif] = useState(false);
  const [advanceNotice, setAdvanceNotice] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [newDueDate, setNewDueDate] = useState("");
  const [newDueTime, setNewDueTime] = useState("09:00");
  const [newLocation, setNewLocation] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [itemType, setItemType] = useState("event");  // "activity" oppure "event"

  // Pomodoro fields
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [pomoMode, setPomoMode] = useState("total"); // 'total' | 'fixed'
  const [pomoTotalMinutes, setPomoTotalMinutes] = useState("");
  const [pomoStudy, setPomoStudy] = useState(30);
  const [pomoBreak, setPomoBreak] = useState(5);
  const [pomoCycles, setPomoCycles] = useState(5);

  // Reset form when date changes
  useEffect(() => {
    if (selectedDate) {
      setNewText("");
      setNewTime("00:00");
      setNewEndTime("00:00");
      setSpanningDays(1);
      setRecurrence({ frequency: "", interval: 1, endDate: "" });
      setNewDueDate("");
      setNewDueTime("09:00");
      setUseBrowserNotif(true);
      setUseEmailNotif(false);
      setAdvanceNotice(0);
      setRepeatCount(1);
      setNewLocation("");
      setItemType("event");

      // reset pomodoro
      setIsPomodoro(false);
      setPomoMode("total");
      setPomoTotalMinutes("");
      setPomoStudy(30);
      setPomoBreak(5);
      setPomoCycles(5);
    }
  }, [selectedDate]);

  // Mutually exclusive UI: picking a due date disables recurrence; picking recurrence clears due date/time
  const handleDueDateChange = (e) => {
    const newDate = e.target.value;
    setNewDueDate(newDate);
    if (newDate) {
      setRecurrence({ frequency: "", interval: 1, endDate: "" });
    }
  };

  const handleRecurrenceChange = (e) => {
    const newFrequency = e.target.value;
    setRecurrence((r) => ({ ...r, frequency: newFrequency }));
    if (newFrequency) {
      setNewDueDate("");
      setNewDueTime("");
    }
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;

    const notificationPayload = {
      browser: useBrowserNotif,
      email: useEmailNotif,
      advance: advanceNotice,
      repeat: repeatCount
    };

    let payload;

    if (itemType === "activity") {
      // Create ACTIVITY (To-Do)
      payload = {
        type: "activity",
        text: newText.trim(),
        date: selectedDate,
        dueDate: selectedDate,
        dueTime: newDueTime,
        notificationPrefs: notificationPayload,
        location: newLocation.trim() || null
      };
    } else {
      // Create EVENT (manual) — may also be Pomodoro
      payload = {
        type: "manual",
        text: newText.trim(),
        date: selectedDate,
        time: newTime,
        endTime: newEndTime,
        spanningDays: spanningDays,
        recurrence: recurrence.frequency ? recurrence : undefined,
        notificationPrefs: notificationPayload,
        location: newLocation.trim() || null,
        // Pomodoro block
        isPomodoro,
        pomodoro: isPomodoro
          ? pomoMode === "total"
            ? { mode: "total", totalMinutes: Number(pomoTotalMinutes) || 0 }
            : {
              mode: "fixed",
              studyMinutes: Number(pomoStudy) || 30,
              breakMinutes: Number(pomoBreak) || 5,
              cycles: Number(pomoCycles) || 5
            }
          : undefined
      };
    }

    try {
      const res = await api.post("/events", payload);
      onEventAdded(res.data);
      setNewText("");
      setNewDueDate("");
      setNewTime("00:00");
      setNewLocation("");
      setIsPomodoro(false);
    } catch (err) {
      console.error(err);
      alert("Errore nella creazione dell'elemento.");
    }
  };

  const handleToggleComplete = async (activityId) => {
    try {
      const res = await api.patch(`/events/${activityId}/toggle-complete`);
      onActivityToggled(res.data);
    } catch (err) {
      console.error("Failed to toggle activity", err);
      alert("Errore nell'aggiornamento dell'attività.");
    }
  };

  const handleDelete = async (event) => {
    const seriesId = event._id;
    if (event.isVirtual) {
      const choice = window.confirm(
        "This is a recurring event. Press OK to delete the ENTIRE series, or Cancel to delete ONLY this occurrence."
      );
      if (choice) {
        try {
          await api.delete(`/events/${seriesId}`);
          onEventDeleted(seriesId);
        } catch (err) {
          console.error("Failed to delete series", err);
          alert("Error deleting the event series.");
        }
      } else {
        try {
          await api.patch(`/events/${seriesId}/exclude`, { dateToExclude: event.date });
          onEventExclusion(seriesId, event.date);
        } catch (err) {
          console.error("Failed to exclude the single occurrence", err);
          alert("Error deleting the single occurrence.");
        }
      }
    } else {
      if (!window.confirm("Sei sicuro di voler cancellare questo elemento?")) return;
      try {
        await api.delete(`/events/${event._id}`);
        onEventDeleted(event._id);
      } catch (err) {
        console.error("Failed to delete item", err);
        alert("Error deleting the item.");
      }
    }
  };

  const sortedEvents = [...selectedEvents].sort((a, b) =>
    (a.time || a.dueTime || "00:00").localeCompare(b.time || b.dueTime || "00:00")
  );

  return (
    <div className="modal fade" tabIndex="-1" ref={modalRef}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedDate ? `Elementi del ${selectedDate}` : "Nessuna data selezionata"}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            {sortedEvents.length === 0 ? (
              <p>
                <em>Nessun elemento per questo giorno.</em>
              </p>
            ) : (
              <ul className="list-group mb-4">
                {sortedEvents.map((event) => (
                  <li
                    key={event._id + event.date}
                    className="list-group-item d-flex justify-content-between align-items-center flex-wrap"
                  >
                    <div className="me-auto">
                      <span className={`fw-bold ${event.isDelayed ? "text-danger" : ""}`}>
                        {event.text}
                        {event.isPomodoro && <span className="badge bg-success ms-2">Pomodoro</span>}
                      </span>
                      <br />
                      {event.type === "manual" && (
                        <small className="text-muted">
                          Evento alle {event.time}
                          {event.endTime ? ` - Termina alle ${event.endTime}` : ""}
                          {event.spanningDays && event.spanningDays > 1
                            ? ` (del ${new Date(
                              new Date(event.date).getTime() +
                              (event.spanningDays - 1) * 24 * 60 * 60 * 1000
                            )
                              .toISOString()
                              .slice(0, 10)
                            })`
                            : ""}
                          {event.location && ` - ${event.location}`}
                        </small>
                        
                      )}
                      {event.type === "activity" && (
                        <small className="text-muted">
                          Scadenza: {event.dueDate} alle {event.dueTime}
                          {event.isDelayed ? " - IN RITARDO!" : ""}
                        </small>
                      )}
                      {event.type === "note" && <small className="text-muted">Nota</small>}

                      {/* Pomodoro plan preview */}
                      {event.isPomodoro && event.pomodoro?.mode === "total" && (
                        <div>
                          <small className="text-muted">
                            Piano:{" "}
                            {(() => {
                              const t = event.pomodoro.totalMinutes || 0;
                              const r = t ? calcolaCicliStandard(t) : null;
                              return r && !r.error
                                ? `${r.cicli}× (${r.studio}’+${r.pausa}’)` +
                                (r.resto > 0 ? `, ultima pausa ${r.pausaFinale}’` : "")
                                : "—";
                            })()}
                          </small>
                        </div>
                      )}
                      {event.isPomodoro && event.pomodoro?.mode === "fixed" && (
                        <div>
                          <small className="text-muted">
                            Piano: {event.pomodoro.studyMinutes}’ studio + {event.pomodoro.breakMinutes}’ pausa ×{" "}
                            {event.pomodoro.cycles}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="d-flex align-items-center ms-2 mt-2 mt-md-0">
                      {/* Start Pomodoro */}
                      {event.isPomodoro && (
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            // chiudi modale e naviga alla pagina Pomodoro
                            document.querySelector(".modal.show .btn-close")?.click();
                            navigate(`/pomodoro?eventId=${event._id}`);
                          }}
                          title="Apri Pomodoro"
                        >
                          Start
                        </button>
                      )}

                      {/* Activity toggle */}
                      {event.type === "activity" && (
                        <button
                          className={`btn btn-sm me-2 ${event.isComplete ? "btn-success" : "btn-outline-success"}`}
                          onClick={() => handleToggleComplete(event._id)}
                        >
                          <i className={`bi ${event.isComplete ? "bi-check-circle-fill" : "bi-check-circle"}`}></i>{" "}
                          {event.isComplete ? "Completata" : "Completa"}
                        </button>
                      )}

                      {/* Delete (skip notes) */}
                      {event.type !== "note" && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => handleDelete(event)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <hr />
            {/* Create new element */}
            <div className="mt-4">
              <h5>Nuovo Elemento</h5>
              
              {/* Toggle between activity and event */}
              <div className="mb-3">
                <label className="form-label me-3">Tipo</label>
                <div className="btn-group">
                  <button
                    type="button"
                    className={`btn ${itemType === "activity" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setItemType("activity")}
                  >
                    Attività
                  </button>
                  <button
                    type="button"
                    className={`btn ${itemType === "event" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setItemType("event")}
                  >
                    Evento
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <input
                  className="form-control"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Luogo</label>
                <input
                  className="form-control"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>
              {/**
              <p className="text-muted small">
                Compila la data di scadenza per creare un'attività (To-Do), altrimenti verrà creato un normale
                evento. Per un Pomodoro, usa l'interruttore qui sotto.
              </p>
              **/}
              {/* Base date/time for events */}
              {itemType === "event" && (
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Ora Inizio</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Ora Fine</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Giorni di durata</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={spanningDays}
                      onChange={(e) => setSpanningDays(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              )}

              {itemType === "activity" && (              
                <div className="col-md-6 mb-3"><label className="form-label">Ora di Scadenza (per Attività)
                  </label>
                  <input
                      type="time"
                      className="form-control"
                      value={newDueTime}
                      disabled={!!recurrence.frequency || isPomodoro}
                      onChange={(e) => setNewDueTime(e.target.value)}
                  />  
                </div>
              )}

              {/* Pomodoro switch + plan */}
              <div className="form-check form-switch my-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isPomodoro"
                  checked={isPomodoro}
                  onChange={(e) => setIsPomodoro(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isPomodoro">
                  Evento Pomodoro
                </label>
              </div>

              {isPomodoro && (
                <div className="border rounded p-3 mb-3">
                  <div className="mb-2">
                    <label className="form-label me-3">Piano</label>
                    <div className="btn-group">
                      <button
                        type="button"
                        className={`btn btn-sm ${pomoMode === "total" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setPomoMode("total")}
                      >
                        Minuti totali
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${pomoMode === "fixed" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setPomoMode("fixed")}
                      >
                        Studio/Pausa/Cicli
                      </button>
                    </div>
                  </div>

                  {pomoMode === "total" ? (
                    <>
                      <label className="form-label">Minuti totali</label>
                      <input
                        type="number"
                        className="form-control"
                        min={35}
                        value={pomoTotalMinutes}
                        onChange={(e) => setPomoTotalMinutes(e.target.value)}
                        placeholder="Es. 200"
                      />
                      {!!pomoTotalMinutes &&
                        (() => {
                          const r = calcolaCicliStandard(Number(pomoTotalMinutes));
                          return !r.error ? (
                            <small className="text-muted">
                              Piano: {r.cicli}× ({r.studio}’ studio + {r.pausa}’ pausa)
                              {r.resto > 0 ? `, ultima pausa ${r.pausaFinale}’` : ""}
                            </small>
                          ) : (
                            <small className="text-danger">{r.error}</small>
                          );
                        })()}
                    </>
                  ) : (
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label">Studio (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          value={pomoStudy}
                          onChange={(e) => setPomoStudy(Number(e.target.value) || 30)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pausa (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          value={pomoBreak}
                          onChange={(e) => setPomoBreak(Number(e.target.value) || 5)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Cicli</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          value={pomoCycles}
                          onChange={(e) => setPomoCycles(Number(e.target.value) || 5)}
                        />
                      </div>
                    </div>
                  )}

                  <small className="text-muted d-block mt-2">
                    Suggerimento: l’ora di inizio dell’evento determinerà quando partire con il primo ciclo.
                  </small>
                </div>
              )}

              {/* Activity (To-Do) block, [MOVED] */}
              {/* Advanced options */}
              <div className="accordion mt-3" id="advancedOptions">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingAdvanced">
                    <button
                      className={`accordion-button ${advancedOpen ? "" : "collapsed"}`}
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
                    className={`accordion-collapse collapse ${advancedOpen ? "show" : ""}`}
                    aria-labelledby="headingAdvanced"
                  >
                    <div className="accordion-body">
                      <h6>Ricorrenza (per Eventi)</h6>
                      <select
                        className="form-select mb-2"
                        value={recurrence.frequency}
                        disabled={!!newDueDate || isPomodoro}
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
                              onChange={(e) => setRecurrence({ ...recurrence, endDate: e.target.value })}
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
                <button className="btn btn-primary" type="button" onClick={handleAdd}>
                  Aggiungi +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
