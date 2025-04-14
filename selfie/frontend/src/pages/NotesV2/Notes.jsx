import React, { useState, useRef } from "react";
import { marked } from "marked";

const NoteEditor = () => {
  const [markdown, setMarkdown] = useState("");
  const [showEditor, setShowEditor] = useState(true); // for mobile toggle
  const textareaRef = useRef();

  const applyMarkdown = (type) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.slice(start, end);
    let newText = "";

    switch (type) {
      case "bold":
        newText = `**${selected || "bold text"}**`;
        break;
      case "italic":
        newText = `*${selected || "italic text"}*`;
        break;
      case "h1":
        newText = `# ${selected || "Heading 1"}`;
        break;
      case "h2":
        newText = `## ${selected || "Heading 2"}`;
        break;
      case "ul":
        newText = `- ${selected || "List item"}`;
        break;
      case "ol":
        newText = `1. ${selected || "List item"}`;
        break;
      default:
        newText = selected;
    }

    const updated = markdown.slice(0, start) + newText + markdown.slice(end);
    setMarkdown(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  return (
    <div className="container py-4">
      {/* Mobile toggle button */}
      <button
        className="btn btn-secondary w-100 mb-3 d-md-none"
        onClick={() => setShowEditor(!showEditor)}
      >
        {showEditor ? "Show Preview" : "Show Editor"}
      </button>

      {/* Formatting buttons */}
      <div className="btn-group flex-wrap mb-3">
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
            placeholder="Write your notes in markdown..."
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
    </div>
  );
};

export default NoteEditor;

