import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import axios from "axios";

const NoteEditor = () => {
const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tags, setTags] = useState ([]);
  const [tagInput, setTagInput] = useState ("");
  const [createdAt] = useState(new Date());           
  const [lastEdited, setLastEdited] = useState(new Date());
  const [showEditor, setShowEditor] = useState(true); // toggle, per dispositivi mobile
  const textareaRef = useRef();

  // aggiorna la data di modifica ====================================================
  
  useEffect(() => {
    setLastEdited(new Date());
  }, [title, markdown, tags]);
  
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
  
  // data ========================================================================
  const formatDate = (date) =>
    date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // fetch del nome utente =======================================================
  
  const storedUser = JSON.parse(localStorage.getItem("utente"));
  const userId = storedUser?._id;
  const username = storedUser.username;

  // salvataggio delle note ======================================================
  
  const saveNote = async () => {
    const noteData = {
      userId,
      title,
      markdown,
      tags,
      createdAt,
      lastEdited: new Date(),      // obv aggiorna la data
    };
    
    try {
      await axios.post("/api/notes/save", noteData);
      alert("Nota Salvata!");
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore nel salvataggio");
    }
  };

  //#################################################################################
  return (
    <div className="container py-4">
      <h1> Selfie Scribe</h1>
      {/* Titolo della nota*/}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo della nota"
          className="form-control form-control-lg"
        />
      </div>
      {/* Tag delle note */}
      <div className="mb-3">
        <div className="my-2 d-flex flex-wrap align-items-center gap-2">
          {tags.map((tag, index) => (
            <span key={index} className="badge bg-primary text-white p-2">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="btn-close btn-close-white btn-sm ms-2"
                aria-label={`Remove tag ${tag}`}
              />
            </span>
          ))}
        </div>
        {tags.length < 5 && (
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              placeholder="Aggiungi un tag!"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <button onClick={addTag} className="btn btn-outline-secondary">
              Add
            </button>
          </div>
        )}
      </div>
      {/* sezione delle date */}
      <div className="text-muted small mb-3">
        <span className="me-3">
          <strong>Ultima modifica:</strong> {formatDate(lastEdited)}
        </span>
        <span>
          <strong>Data di creazione:</strong> {formatDate(createdAt)}
        </span>
      </div>
      {/* Toggle per mobile */}
      <button
        className="btn btn-secondary w-100 mb-3 d-md-none"
        onClick={() => setShowEditor(!showEditor)}
      >
        {showEditor ? "Show Preview" : "Show Editor"}
      </button>

      {/* Toolbar di formattazione */}
      <div className="btn-group flex-wrap my-3">
        <button onClick={() => applyMarkdown("bold")} className="btn btn-outline-dark btn-sm">
          Bold
        </button>
        <button onClick={() => applyMarkdown("italic")} className="btn btn-outline-dark btn-sm">
          Italic
        </button>
        <button onClick={() => applyMarkdown("h1")} className="btn btn-outline-dark btn-sm">
          Title
        </button>
        <button onClick={() => applyMarkdown("h2")} className="btn btn-outline-dark btn-sm">
          Subtitle
        </button>
        <button onClick={() => applyMarkdown("ul")} className="btn btn-outline-dark btn-sm">
          • List
        </button>
        <button onClick={() => applyMarkdown("ol")} className="btn btn-outline-dark btn-sm">
          1. List
        </button>
      </div>

      <div className="row">
        {/* Editor */}
        <div className={`col-md-6 ${showEditor ? "" : "d-none d-md-block"} mb-3`}>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="form-control"
            rows={15}
            placeholder="Scripta Manent!"
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Preview */}
        <div className={`col-md-6 ${showEditor ? "d-none d-md-block" : ""}`}>
          <div
            className="border rounded p-3 bg-light preview-box"
            style={{ minHeight: "300px", overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }}
          />
        </div>
      </div>
      {/* Save Button */}
      <div className="text-end mt-3">
        <button className="btn btn-success" onClick={saveNote}>
          Salva Nota
        </button>
      </div>
    </div>
  );
};

export default NoteEditor;

