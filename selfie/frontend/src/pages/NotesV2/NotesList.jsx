import React, { useState, useEffect } from "react";
import { formatDistance, formatDistanceToNow } from "date-fns";
import { useTimeMachine } from "../../utils/TimeMachine";


function NotesList({ notes, filtered, setFiltered, onSelect, onDelete }) {
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortOption, setSortOption] = useState("lastEdited"); // ordina per data di modifica oppure lunghezza del testo ("textLength")

  const { virtualNow } = useTimeMachine();

  // Modifica la lista quando i filtri vengono cambiati =========================================================================

  // gestisce il render della lista filtrata e ordinata
  useEffect(() => {
    let filteredList = notes.filter((n) => {
      const matchesTitle = n.title
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesTag = !tagFilter || n.tags.includes(tagFilter);
      return matchesTitle && matchesTag;
    });

    // ordina la lista
    filteredList = filteredList.sort((a, b) => {
      if (sortOption === "lastEdited") {
        return new Date(b.lastEdited) - new Date(a.lastEdited);
      } else if (sortOption === "textLengthAsc") {
        return a.markdown.length - b.markdown.length;
      } else if (sortOption === "textLengthDesc") {
        return b.markdown.length - a.markdown.length;
      } else {
        return 0;
      }
    });

    setFiltered(filteredList);
  }, [notes, searchText, tagFilter, setFiltered, sortOption, virtualNow]);

  // crea un insime di tag unici
  const uniqueTagsList = Array.from(new Set(notes.flatMap((n) => n.tags)));


  return (
    <>
      <div className="d-flex flex-column flex-md-row align-items-start mb-4 gap-3">
        <input
          type="text"
          className="form-control"
          placeholder="Cerca per titolo…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="form-select w-auto"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="lastEdited">Ordina per ultima modifica</option>
          <option value="textLengthAsc">Ordina per lunghezza testo ↑</option>
          <option value="textLengthDesc">Ordina per lunghezza testo ↓</option>
        </select>



        <select
          className="form-select w-auto"

          style={{ maxHeight: "200px", overflowY: "auto" }}
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">Tutti i tag</option>
          {uniqueTagsList.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="notes-grid">
        {filtered.length === 0 && (

          <div className="text-center text-muted w-100">
            Nessuna nota trovata.
          </div>
        )}

        {filtered.map((note) => (
          <div
            key={note._id}
            className="card shadow-sm note-card"
            onClick={() => onSelect(note)}
          >
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">{note.title}</h5>
              <p className="card-text text-truncate">
                {note.markdown.split("\n")[0]}…
              </p>
              <div className="mt-auto">
                <small className="text-muted">
                  {(() => { // testo di distsnza in tempo da virtualNow, rosso se "nel futuro"
                    const diffText = formatDistance(new Date(note.lastEdited), new Date(virtualNow), { addSuffix: true });
                    const isFuture = new Date(note.lastEdited) > new Date(virtualNow);
                    return (
                      <>
                        Modificata{" "}
                        <span style={{ color: isFuture ? "tomato" : "inherit" }}>
                          {diffText}
                        </span>
                      </>
                    );
                  })()}
                </small>
              </div>
            </div>

            {note.tags.length > 0 && (
              <div className="card-footer bg-white">
                {note.tags.map((t) => (
                  <span key={t} className="badge bg-secondary me-1">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute bottom-0 end-0 m-2 p-1"
              onClick={(e) => {
                e.stopPropagation(); 
                onDelete(note._id);
              }}
            >
              <strong>X</strong>
            </button>

          </div>
        ))}
      </div>
    </>
  );
}

export default NotesList;

