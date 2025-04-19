import Note from "../models/notes.model.js";

// Crea una nuova nota nel db ========================================================================================

export const saveNotes = async(req,res) => {
  const { userId, title, markdown, tags, createdAt, lastEdited } = req.body;
  
  if (!userId || !title || !markdown) {
    return res.status(400).json({ error: 'Missing mandatory fields'});
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

    res.status(201).json({ message: 'Nota salvata con successo', note: newNote});
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. '});
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
    res.status(500).json({ error: 'Server error. '});
  }
};

// Modifica una nota =================================================================================================

export const updateNote = async(req,res) => {
  const { id } = req.params;
  const { title, markdown, tags, lastEdited } = req.body;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      id,
      {
        title,
        markdown,
        tags,
        lastEdited: new Date(lastEdited),
      },
      { new: true }
    );
  } catch (error) {
    
  }
};




