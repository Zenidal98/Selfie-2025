import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

function NotesList({ notes, filtered, setFiltered, onSelect, onDelete }) {
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Update filtered list when filters change
  useEffect(() => {
    const filteredList = notes.filter((n) => {
      const matchesTitle = n.title
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesTag = !tagFilter || n.tags.includes(tagFilter);
      return matchesTitle && matchesTag;
    });
    setFiltered(filteredList);
  }, [notes, searchText, tagFilter, setFiltered]);

  // Unique tag list
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
                  Modificata{" "}
                  {formatDistanceToNow(new Date(note.lastEdited), {
                    addSuffix: true,
                  })}
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
                e.stopPropagation(); // avoid selecting card
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

