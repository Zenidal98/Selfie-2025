import React from "react";
import { useNavigate } from "react-router-dom";

const BackHomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/home")}
      className="btn btn-outline-secondary position-fixed"
      style={{
        top: "20px",
        left: "20px",
        zIndex: 999,
      }}
    >
      ⬅ Torna alla Home
    </button>
  );
};

export default BackHomeButton;
