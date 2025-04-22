import mongoose from "mongoose"; 

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  markdown: { type: String, required: true },
  tags: { type: [String], default: [], validate: [arr => arr.length <= 5, "Max 5 tags"] },
  createdAt: { type: Date, default: Date.now },
  lastEdited: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
