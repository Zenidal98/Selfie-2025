import mongoose from "mongoose";  

const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  text: { type: String, required: true },
  // per gestire i promemoria 'HH:mm'
  time: { type: String, default: '00:00'},
  // per creare range orari
  endTime: { type: String, default: null },
  spanningDays: { type: Number, default: null },
  // per inserire  l'attivita' di creazione nota
  type: { type: String, enum: ['manual', 'note'], default: 'manual' },
  // per eventi complessi
  recurrence: {
    frequency: { type: String, enum: ['DAILY','WEEKLY','MONTHLY'], default: null }, //il capslock li rende immediatamente compatibili con rrule (e quindi anche ics)
    interval: { type: Number, default: 1 },
    endDate: { type: String, default: null }
  },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref:'Note', default: null }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
