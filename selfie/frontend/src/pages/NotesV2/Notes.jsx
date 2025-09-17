import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import NotesList from "./NotesList";
import "./Notes.css";
import { useTimeMachine } from "../../utils/TimeMachine";
import api from "../../utils/api.js";

const NoteEditor = () => {
  const { virtualNow } = useTimeMachine();

  const [noteId, setNoteId] = useState(null);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date(virtualNow));     //  TM on init
  const [lastEdited, setLastEdited] = useState(new Date(virtualNow));   //  TM on init
  const [showEditor, setShowEditor] = useState(true); // for mobile
  const textareaRef = useRef();

  // Lista dell note (mtterla qui permette aggiornamenti in tempo reale)==============

  const [notes, setNotes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  
  /** sostituito, revisione in corso
  // limita il refecth quando carica la preview dell'ultima nota modificata
  const hasLoadedLastNote = useRef(false);
  **/

  // Fetch utente ====================================================================

  const storedUser = JSON.parse(localStorage.getItem("utente")) || {};
  const userId = storedUser?._id;
  // const username = storedUser.username;

  // Fetch note dell'utente ==========================================================

  const fetchNotes = () => {
    api
      .get("/notes")
      .then(res => {
        setNotes(res.data);
        setFiltered(res.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // aggiorna la data di modifica ====================================================

  useEffect(() => {
    setLastEdited(new Date(virtualNow));
  }, [title, markdown, tags]);
 
  // carica l'ultima nota modificata automaticamente
  useEffect(() => {
  const loadLastNote = async () => {
    try {
      const res = await api.get("/notes/recent");
      if (res.data) {
        loadNote(res.data);
      }
    } catch (err) {
      console.error("Errore caricamento l'ultima nota modificata", err);
    }
  };

  loadLastNote();
  }, []);

  /** sostituito, revisione in corso
  // quando apri la pagina autoload dell'ultima nota modificata
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !hasLoadedLastNote.current) {
        try {
          const res = await api.get("/notes/recent");
          if (res.data) {
            loadNote(res.data);
            hasLoadedLastNote.current = true; // evita il refetch se e' gia' caricata
          }
        } catch (error) {
          console.error("Errore caricamento l'ultima nota modificata", error);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return(() => { //unmount del listener
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  }, []);
  **/

  // Carica una nota preesitente nell'editor =========================================

  const loadNote = note => {
    setNoteId(note._id);
    setTitle(note.title);
    setMarkdown(note.markdown);
    setTags(note.tags);
    setCreatedAt(new Date(note.createdAt));
    setLastEdited(new Date(note.lastEdited));
    setShowEditor(true);
  };

  // HTML Sanitizing (pulisce il markdown per prevenire attacchi XSS) ================

  const renderMarkdown = (markdownText) => {
    const rawHtml = marked.parse(markdownText);
    const safeHtml = DOMPurify.sanitize(rawHtml);
    return { __html: safeHtml };
  };

  // aggiunge la formattazione al testo ==============================================

  const applyMarkdown = (type) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.slice(start, end);
    let newText = "";

    switch (type) {
      case "bold":
        newText = `**${selected || "bold"}**`;
        break;
      case "italic":
        newText = `*${selected || "italic"}*`;
        break;
      case "h1":
        newText = `# ${selected || "Title"}`;
        break;
      case "h2":
        newText = `## ${selected || "Subtitle"}`;
        break;
      case "ul":
        newText = `- ${selected || "li"}`;
        break;
      case "ol":
        newText = `1. ${selected || "ol"}`;
        break;
      default:
        return;
    }

    const updated = markdown.slice(0, start) + newText + markdown.slice(end);
    setMarkdown(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  // gestione dei tag ============================================================
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };
  
  // Limita la lunghezza dei tag  ====================


  const truncateTag = (str, max = 15) =>
    str.length > max ? str.slice(0, max - 1) + "..." : str;


  // data ========================================================================
  const formatDate = (date) =>
    date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // resetta l'editor, per creare una nota nuova ====================================
  
  const resetEditor = (newNote = true) => {
    if (newNote) {
      setNoteId(null); // resetta noteId SOLO se chiamato dal bottone (cosi le note preesitenti fanno solo update)
    }

    setTitle("");
    setMarkdown("");
    setTags([]);
    setTagInput("");
    setCreatedAt(new Date(virtualNow));
    setLastEdited(new Date(virtualNow));
  };

  // salvataggio delle note ======================================================
  
  const saveNote = async () => {
    //console.log("saving noteid:", noteId); //db
    try{

      const noteData = {
        userId,
        title,
        markdown,
        tags,
        createdAt,
        lastEdited: new Date(virtualNow),
      };
    
    let response;

    if (noteId) { // assicurasi che id esiste per modificare note preesitenti
      response = await api.put(`/notes/${noteId}`, noteData);
    } else {      
      response = await api.post("/notes", noteData);
      setNoteId(response.data.note._id);
    }


    alert("Nota salvata con successo!");
    await fetchNotes();
    } catch (error) {
      alert("error nel salvataggio");
    }

  };
 
  // crea una copia della nota nell'editor
  const cloneNote = () => {
    if (!noteId) return;

    setNoteId(null); // assicura sia una nota nuova e non una modifica della precedente
    setTitle(`COPIA DI ${title}`);
    setMarkdown(markdown);
    setTags([...tags]);
    setCreatedAt(new Date());
    setLastEdited(new Date());
  };
  

  // redirect alla homepage =========================================================

  const navigate = useNavigate();

  const goHome = () => {
    navigate("/home");
  };

  // Cancella una nota (chiede conferma) e refresha la lista =========================

  const deleteNote = id => {
    if (window.confirm("Vuoi veramente cancellare questa nota?")) {
      api.delete(`/notes/${id}`)
        .then(() => {
          alert("Nota cancellata con successo!!");
          fetchNotes();
        })
        .catch(err => console.error(err));
      resetEditor();
    }
  };


  //#################################################################################
  return (
    <div className="notes-wrapper">
      <div className="notes-content">
        <h1>Selfie Scribe</h1>

        {/* Titolo */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo della nota"
          className="form-control form-control-sm mb-2"
        />

        {/* Tag */}
        <div className="mb-2 d-flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={index} className="badge bg-primary text-white">
              {truncateTag(tag)}
              <button
                onClick={() => removeTag(tag)}
                className="btn-close btn-close-white btn-sm ms-2"
              />
            </span>
          ))}
        </div>

        {tags.length < 5 && (
          <div className="input-group input-group-sm mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Aggiungi un tag! (Premi INVIO per confermare)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <button onClick={addTag} className="btn btn-outline-secondary">Add</button>
          </div>
        )}

        {/* Date info */}
        <div className="text-muted small mb-2">
          <strong>Ultima modifica:</strong> {formatDate(lastEdited)}{" | "}
          <strong>Creata:</strong> {formatDate(createdAt)}
        </div>

        {/* Toolbar */}
        <div className="btn-group btn-group-sm mb-2">
          <button onClick={() => applyMarkdown("bold")} className="btn btn-outline-light">Bold</button>
          <button onClick={() => applyMarkdown("italic")} className="btn btn-outline-light">Italic</button>
          <button onClick={() => applyMarkdown("h1")} className="btn btn-outline-light">H1</button>
          <button onClick={() => applyMarkdown("h2")} className="btn btn-outline-light">H2</button>
          <button onClick={() => applyMarkdown("ul")} className="btn btn-outline-light">• List</button>
          <button onClick={() => applyMarkdown("ol")} className="btn btn-outline-light">1. List</button>
        </div>

        {/* Editor + Preview */}
        <div className="notes-main">
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="form-control"
            placeholder="Scripta Manent!"
          />
          <div
            className="preview-box p-2"
            dangerouslySetInnerHTML={renderMarkdown(markdown)}
          />
        </div>

        {/* Pulsanti */}
        <div className="notes-buttons">
          <button className="btn btn-success" onClick={saveNote}>Salva</button>
          <button className="btn btn-light" onClick={() => resetEditor(true)}>Nuova</button>
          <button className="btn btn-warning" onClick={cloneNote}>Crea una copia</button>
          <button className="btn btn-info" onClick={goHome}>Home</button>
        </div>

        {/* Lista note */}
        <div className="notes-footer">
          <h6 className="mt-2">Le tue note</h6>
          <NotesList
            notes={notes}
            setFiltered={setFiltered}
            filtered={filtered}
            onSelect={loadNote}
            onDelete={deleteNote}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;

