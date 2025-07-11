import Note from "../models/notes.model.js";
import Event from "../models/event.model.js";
 
import { format } from 'date-fns';
// Crea una nuova nota nel db ========================================================================================

export const saveNotes = async(req,res) => {
  const { userId, title, markdown, tags, createdAt, lastEdited } = req.body;
  
  if (!userId || !title || !markdown) {
    return res.status(400).json({ error: "Missing mandatory fields"});
  }

  try {
    const newNote = new Note({
      userId,
      title,
      markdown,
      tags,
      createdAt: new Date(createdAt),
      lastEdited: new Date(lastEdited),
    });

    await newNote.save();
    
    // crea anche un nuovo Evento associato =========================================================================

    const eventDate = format(newNote.createdAt, 'yyyy-MM-dd');
    const eventTime = format(newNote.createdAt, 'HH:mm');

    const newNoteEvent = new Event({
      userId,
      date: eventDate,
      time: eventTime,
      text: `Note created: "${title}"`,
      type: 'note',
      noteId: newNote._id            // foreign key 
    });
    
    await newNoteEvent.save();
    res.status(201).json({ message: "Nota salvata con successo", note: newNote});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. "});
  }
};

// Tutte le note dello user di riferimento ==============================================================================
  
export const getUserNotes = async(req,res) => {
  const { userId } = req.params;

  try {
    const notes = await Note.find({ userId }).sort({ lastEdited: -1});
    res.status(200).json(notes);    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. "});
  }
};

// Modifica una nota =================================================================================================

export const updateNote = async(req,res) => {
  const { noteId } = req.params;
  const { title, markdown, tags, lastEdited } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        title,
        markdown,
        tags,
        lastEdited: new Date(lastEdited),
      },
      { new: true }
    );
    if (!updatedNote) return res.status(404).json({ error: "Not found"});
    res.json({ message: "Updated succesfully", note: updatedNote});
  } catch (err) {
    res.status(500).json({ error: "Note update failed"});
  }
};

// Cancella una nota ==============================================================

export const deleteNote = async(req, res) => {
  const { noteId } = req.params;
  try {
    const deletedNote = await Note.findByIdAndDelete(noteId);
    if (!deletedNote) return res.status(404).json({ error: "Not found"});
    
    // cancella l'evento associato ==============================================
    await Event.deleteOne({ noteId: noteId });

    res.status(200).json({ message: "Deleted with success"});
  } catch (err) {
    res.status(500).json({ error: "Failed note deletion"});
  }
};


