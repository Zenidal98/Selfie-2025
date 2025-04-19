import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotesList(){
  const [notes, setNotes] = useState([]);
  const [filtered, setFiltered] = useState([]);
};

export default NotesList;
