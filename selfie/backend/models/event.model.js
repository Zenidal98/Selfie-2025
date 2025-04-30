import mongoose from "mongoose";  

const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  // per inserire l'attivita' di creazione nota
  type: { type: String, enum: ['manual', 'note'], default: 'manual'},
  noteId: { type: mongoose.Schema.Types.ObjectId, ref:'Note', default: null}
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
