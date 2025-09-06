import Note from "../models/notes.model.js";
import Event from "../models/event.model.js";

import { format } from "date-fns";
// Crea una nuova nota nel db ========================================================================================

export const saveNotes = async (req, res) => {
  // Always take userId from the JWT middleware
  const authUserId = req.user?.id;

  const { title, markdown, tags, createdAt, lastEdited } = req.body;

  if (!authUserId || !title || !markdown) {
    return res.status(400).json({ error: "Missing mandatory fields" });
  }

  try {
    const created = createdAt ? new Date(createdAt) : new Date();
    const edited = lastEdited ? new Date(lastEdited) : created;

    const newNote = new Note({
      userId: authUserId, // <-- force ownership
      title,
      markdown,
      tags,
      createdAt: created,
      lastEdited: edited,
    });

    await newNote.save();

    // Create a linked Event of type "note"
    const eventDate = format(newNote.createdAt, "yyyy-MM-dd");
    const eventTime = format(newNote.createdAt, "HH:mm");

    const newNoteEvent = new Event({
      userId: authUserId, // <-- force ownership for the event too
      date: eventDate,
      time: eventTime,
      text: `Note created: "${title}"`,
      type: "note",
      noteId: newNote._id,
    });

    await newNoteEvent.save();

    res
      .status(201)
      .json({ message: "Nota salvata con successo", note: newNote });
  } catch (err) {
    console.error("saveNotes error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// Tutte le note dello user di riferimento ==============================================================================

export const getUserNotes = async (req, res) => {
  

  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ lastEdited: -1 });
    res.status(200).json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. " });
  }
};

// Modifica una nota =================================================================================================

export const updateNote = async (req, res) => {
  const { noteId } = req.params;
  const { title, markdown, tags, lastEdited } = req.body;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user.id }, // enforce ownership
      {
        title,
        markdown,
        tags,
        lastEdited: lastEdited ? new Date(lastEdited) : new Date(),
      },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found or not yours" });
    }

    res.json({ message: "Updated successfully", note: updatedNote });
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ error: "Note update failed" });
  }
};

// Cancella una nota ==============================================================

export const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  try {
    // Only delete if the note belongs to the logged-in user
    const deletedNote = await Note.findOneAndDelete({
      _id: noteId,
      userId: req.user.id,
    });

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found or not yours" });
    }

    // Delete the linked Event as well
    await Event.deleteOne({ noteId: noteId, userId: req.user.id });

    res.status(200).json({ message: "Deleted with success" });
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ error: "Failed note deletion" });
  }
};

// Nota piu' recente per la hp report
export const getMostRecentNote = async (req, res) => {
  try {
    const note = await Note.findOne({ userId: req.user.id })
    .sort({ lastEdited: -1})
    .select("title markdown tags createdAt lastEdited"); 

    if (!note) {
      return res.status(200).json(null);
    }

    res.json(note);
  } catch (error) {
    console.error("getMostRecentNote error: ", error);
    res.status(500).json({ error: "Server error fetching recent note" });
  }
};
