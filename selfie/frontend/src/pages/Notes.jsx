import React, { useState, useEffect, useRef}  from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap"; 

const Notes = () => {

  // State management per opzioni di tipografia delle note
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fontIndex, setFontIndex] = useState("0");

  // 3 opzioni di dimensione carattere
  const fontSizes = [
    { label: "Regular", size: "16px" },
    { label: "Big", size: "24px"},
    { label: "Very Big", size: "32px"},
  ];

  // funzione che cicla tra i tre size (mi piaceva l'idea di usare un solo pulsante)
  const cycleFontSize = () => {
    setFontIndex((prevIndex) => (prevIndex + 1) % 3 );
  };


  useEffect(() => {
    // Initializza i tooltip di bootstrap
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new Tooltip(el);
    });
  }, []);

  // funzioni per preparare l'alert

  const alertRef = useRef(null);         // le ref servono per il load order del dom
  const saveBtnRef = useRef(null);      
  
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

    const handleClick = () => {
      appendAlert('Test effettuato con successo: da inserire db', 'info');
    };

    const btn = saveBtnRef.current;
    if (btn) {
      btn.addEventListener('click', handleClick);
    }

   // evita i listener duplicati (o meglio, gestisce l'unmount)
    return () => {
      if (btn) {
        btn.removeEventListener('click', handleClick);
      }
    };
  }, []);

  return (
    <div className="container text-center">
      <div>
       <p className="h1 my-3">Selfie Scribe</p>
        <div role="toolbar" aria-label="Opzioni di formattazione del testo">
          {/* le iniezioni JS servono a syncare lo stato del bottone e quello della variabile associata, gli eventi click cambiano il valore */}
          <button className={` btn btn-outline-dark mt-3 mx-2 rounded ${bold ? "active" : ""}`} data-bs-toggle="tooltip" data-bs-title="Bold" onClick={() => setBold(!bold)}><b> B </b></button>
          <button className={` btn btn-outline-dark mt-3 mx-2 px-3 rounded ${italic ? "active" : ""}`} data-bs-toggle="tooltip" data-bs-title="Italic" onClick={() => setItalic(!italic)}><i> I </i></button>
          <button className={` btn btn-outline-dark mt-3 mx-2 rounded ${underline ? "active" : ""}`} data-bs-toggle="tooltip" data-bs-title="Underlined" onClick={() => setUnderline(!underline)}><u> U </u></button>
          <button className="btn btn-outline-dark mt-3 mx-2 rounded" onClick={cycleFontSize} data-bs-toggle="tooltip" data-bs-title="Change font size">{fontSizes[fontIndex].label}</button>
        </div>
        <textarea className="col-8 mt-3 bg-light" rows="15" placeholder="Scripta Manent"></textarea>
      </div>
      <div>
        <button className={`btn btn-primary my-3 rounded`} ref={saveBtnRef}> Salva Nota </button>
        <div ref={alertRef}></div>
      </div>
    </div>
  );
};

export default Notes;
