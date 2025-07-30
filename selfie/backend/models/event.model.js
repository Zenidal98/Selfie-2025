import mongoose from "mongoose";  

// unica aggiunta qui ossia schema di preferenza notifica con tipo (browser o mail), quanto prima farla partire (advance) e quante volte (repeat)
const notificationPrefsSchema = new mongoose.Schema({
  browser: { type: Boolean, default: true },
  email: { type: Boolean, default: false },
  advance: { type: Number, default: 0 }, // in minuti
  repeat: { type: Number, default: 1 }   // numero di ripetizioni (999 = fino a risposta)
}, { _id: false });

const recurrenceSchema = new mongoose.Schema({
  frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], default: null },
  interval: { type: Number, default: 1 },
  endDate: { type: String, default: null },
}, { _id: false });

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
  type: { type: String, enum: ['manual', 'note', 'activity'], default: 'manual' },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref:'Note', default: null },

  recurrence: recurrenceSchema,
  recurrenceId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
    index: true 
  }, //lookup veloce per gli eventi ripetuti
  exclusions: { type: [String], default: [] }, // per cancellare singole istanze

  // aggiunta preferenze notifica
  notificationPrefs: notificationPrefsSchema,

  //aggiunte per le Attivita'
  dueDate: { type: String, default: null}, //YYYY-MM-DD 
  dueTime: { type: String, default: null}, //HH:mm
  isComplete: { type: Boolean, default: false},
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;

