import React, { useState, useEffect, useRef}  from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap"; 
import './notes.css';

const Notes = () => {
  //ref alla notebox
  const noteRef = useRef(null);

  // ref per preparare l'alert
  const alertRef = useRef(null);         // le ref servono perchè con getElementById verrebbe null (lo script è eseguito prima del dom load)
  
  const saveBtnRef = useRef(null);      
  
  // ref al pulsante per pickare i colori
  const colorPickerRef = useRef(null);

  // State management per opzioni di tipografia delle note
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  
  const [color, setColor] = useState("#000000");   // black come default obv
  
  /*
  const [fontIndex, setFontIndex] = useState("0");

  // 3 opzioni di dimensione carattere
  const fontSizes = [
    { label: "Regular", size: "16px" },
    { label: "Large", size: "24px"},
    { label: "XL", size: "32px"},
  ];
  
  
  // funzione che cicla tra i tre size (mi piaceva l'idea di usare un solo pulsante)
  const cycleFontSize = () => {
    setFontIndex((prevIndex) => (prevIndex + 1) % 3 );
  };
  */
  // funzione che apllica la formattazione al testo ed ai bottoni 
  const handleFormat = (command, value=null) => {
    if (command === "foreColor") {
      setColor(value);
      document.execCommand(command, false, value);
    }
    document.execCommand(command,false,value);
    noteRef.current?.focus();
  };
  
  // Synca lo stato dei bottoni con la selezione attuale
  useEffect(() => {
    
    const updateFormattingState = () => {
      setFormatting({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    };
    
    document.addEventListener("selectionchange", updateFormattingState);
    return () => {
      document.removeEventListener("selectionchange", updateFormattingState);
    };

  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Initializza i tooltip di bootstrap
  useEffect(() => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new Tooltip(el);
    });
  }, []);


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  // attiva l'alert del save button
  useEffect(() => {
    const appendAlert = (message, type) => {
      if (alertRef.current) {
      //   alertRef.current.innerHTML = '';          // con questo attivo hai max 1 alert
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
          <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>`;
        alertRef.current.append(wrapper);

        // Timeout per l'alert a 5 secondi
        setTimeout(() => wrapper.remove(), 5000);
      }
    };

    const handleSaveClick = () => {
      appendAlert('Test effettuato con successo: da inserire db', 'info');
    };

    const btn = saveBtnRef.current;
    if (btn) {
      btn.addEventListener('click', handleSaveClick);
    }

    // evita i listener duplicati (o meglio, gestisce l'unmount)
    return () => {
      if (btn) {
        btn.removeEventListener('click', handleSaveClick);
      }
    };
  }, []);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  

  return (
    <div className="container text-center">
      
      <div>
        <p className="h1 my-3">Selfie Scribe</p>
        {/* Toolbar */}
        <div className="row justify-content-center" role="toolbar" aria-label="Opzioni di formattazione del testo">
          <button 
            className={` col-1 btn btn-outline-dark mt-3 mx-2 rounded ${formatting.bold ? "active" : ""}`} 
            data-bs-toggle="tooltip" data-bs-title="Bold" aria-pressed={formatting.bold} aria-label="Bold" 
            onClick={() => handleFormat("bold")}>
            <strong> B </strong>
          </button>
          
          <button 
            className={` col-1 btn btn-outline-dark mt-3 mx-2 px-3 rounded ${formatting.italic ? "active" : ""}`} 
            data-bs-toggle="tooltip" data-bs-title="Italic" aria-pressed={formatting.italic} aria-label="Italic" 
            onClick={() => handleFormat("italic")}>
            <em> I </em>
          </button>

          <button 
            className={` col-1 btn btn-outline-dark mt-3 mx-2 rounded ${formatting.underline ? "active" : ""}`}  
            data-bs-toggle="tooltip" data-bs-title="Underlined" aria-pressed={formatting.underline} aria-label="Underlined" 
            onClick={() => handleFormat("underline")}>
            <span className="text-decoration-underline"> U </span>
          </button>
          {/*}
          <button 
            className="col-1 btn btn-outline-dark mt-3 mx-2 rounded" onClick={cycleFontSize} data-bs-toggle="tooltip" data-bs-title="Change font size" aria-label={`Font size: ${fontSizes[fontIndex].label}`}>{fontSizes[fontIndex].label}</button>
          */}      
          <div className="col-1 position-relative mt-3 mx-1 p-0">
            <button
              className="btn btn-outline-dark w-100 rounded"
              data-bs-toggle="tooltip"
              data-bs-title="Text Color"
              aria-label="Text Color"
              onClick={() => colorPickerRef.current?.click()}
            >
              <span style={{ color: color, fontWeight: 'bold' }}>A</span>
            </button>
            <input
              type="color"
              ref={colorPickerRef}
              value={color}
              onChange={(e) => handleFormat("foreColor", e.target.value)}
              style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer" }}
            />
          </div>          

        </div>
      </div>
        
      <div className="row justify-content-center">
        <div contentEditable="true" className="col-12 col-md-10 col-lg-8 mt-3 notebox" 
          ref={noteRef} aria-label="Editor delle note"></div>
      </div>

      <div>
        <button className="btn btn-primary my-3 rounded" ref={saveBtnRef}> Salva Nota </button>
        <div ref={alertRef}></div> {/* ref definite sopra per puntare qua nel dom  */}
      </div>

    </div>
  );
};

export default Notes;
