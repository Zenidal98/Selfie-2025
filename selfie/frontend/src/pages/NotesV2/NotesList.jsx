import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

function NotesList({ notes, filtered, setFiltered, onSelect, onDelete}) {
  
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("");
 
  // Modifica la lista quando i filtri vengono cambiati =========================================================================

  useEffect(() => {
    const filteredList = notes.filter(n => {
      const matchesTitle = n.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesTag = !tagFilter || n.tags.includes(tagFilter);
      return matchesTitle && matchesTag;   
    });
    setFiltered(filteredList);
    }, [notes, searchText, tagFilter, setFiltered]);

  // crea un solo array (grazie a flat) di tag UNICI (set), utile per i menu ==================================================== 
  const uniqueTagsList = Array.from(new Set(notes.flatMap(n => n.tags)));
  
  return (
    <>
      <div className="d-flex flex-column flex-md-row align-items-start mb-4 gap-3">
        <input
          type="text"
          className="form-control"
          placeholder="Cerca per titolo…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <select
          className="form-select w-auto"
          style={{ maxHeight: "200px", overflowY: "auto"}}
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
        >
          <option value="">Tutti i tag</option>
          {uniqueTagsList.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="row g-3">
        {filtered.length === 0 && (
          <div className="col-12 text-center text-muted">
            Nessuna nota trovata.
          </div>
        )}
        {/* cards delle note */}
        {filtered.map(note => (
          <div key={note._id} className="col-12 col-md-6 col-lg-4">
            <div 
              className="card h-100 shadow-sm"
              style={{cursor: "pointer"}}
              onClick={() => onSelect(note)}
            >
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{note.title}</h5>
                <p className="card-text text-truncate">
                  {note.markdown.split("\n")[0]}…
                </p>
                <div className="mt-auto">
                  <small className="text-muted">
                    Modificata{" "}
                    {formatDistanceToNow(new Date(note.lastEdited), {
                      addSuffix: true
                    })}
                  </small>
                </div>
              </div>
              {note.tags.length > 0 && (
                <div className="card-footer bg-white">
                  {note.tags.map(t => (
                    <span key={t} className="badge bg-secondary me-1">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {/* Delete button */}
              <button 
                type="button"
                className="btn btn-danger btn-sm position-absolute bottom-1 end-0 m-2 p-1"
                onClick={e => {
                  /* altrimenti conterebbe anche il click sulla card*/
                  e.stopPropagation();
                  onDelete(note._id);
                }}
              >
                <strong>X</strong>
              </button>
            </div>

           
          </div>
        ))}
      </div>
    </>  
  );
};

export default NotesList;
