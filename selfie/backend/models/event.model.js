import mongoose from "mongoose";

// unica aggiunta qui ossia schema di preferenza notifica con tipo (browser o mail), quanto prima farla partire (advance) e quante volte (repeat)
const notificationPrefsSchema = new mongoose.Schema(
  {
    browser: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    urgency: { type: Boolean, default: false }, // for escalating notifications on overdue activities
    advance: { type: Number, default: 0 }, // in minuti
    repeat: { type: Number, default: 1 }, // numero di ripetizioni (999 = fino a risposta)
  },
  { _id: false }
);

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY"],
      default: null,
    },
    interval: { type: Number, default: 1 }, // numero di giorni - settimane - mesi di intervallo tra ripetizioni
    endDate: { type: String, default: null },
  },
  { _id: false }
);

const pomodoroSchema = new mongoose.Schema(
  {
    //modalità classica o personalizzata con tempo personalizzabile a seconda di quanto metti
    mode: { type: String, enum: ["total", "fixed"], default: "fixed" },

    // modalità totale faccio i cicli secondo il 30+5
    totalMinutes: { type: Number, default: null, min: 0 },

    // fissato -> valori espliciti
    studyMinutes: { type: Number, default: 30, min: 1 },
    breakMinutes: { type: Number, default: 5, min: 1 },
    cycles: { type: Number, default: 5, min: 1 },

    // stato per dire a che punto sei arrivato. Serve per poter riprendere il Pomodoro se l’utente ricarica la pagina o chiude l’app
    state: {
      dayISO: { type: String, default: null }, // 'YYYY-MM-DD'
      phase: { type: String, enum: ["study", "break"], default: "study" },
      cycleIndex: { type: Number, default: 0, min: 0 }, // 0-based
      secondsLeft: { type: Number, default: 0, min: 0 },
      lastRunAt: { type: Date, default: null },
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    text: { type: String, required: true },
    // per gestire i promemoria 'HH:mm'
    time: { type: String, default: "00:00" },
    location: { type: String, default: null },
    // per creare range orari
    endTime: { type: String, default: null },
    spanningDays: { type: Number, default: null },
    type: {
      type: String,
      enum: ["manual", "note", "activity"],
      default: "manual",
    },
    noteId: {
      // la "foreign key" per gli eventi di tipo nota
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    recurrence: recurrenceSchema,
    recurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    }, //lookup veloce per gli eventi ripetuti
    exclusions: { type: [String], default: [] }, // per cancellare singole istanze

    // aggiunta preferenze notifica 
    notificationPrefs: notificationPrefsSchema,

    //aggiunte per le Attivita'
    dueDate: { type: String, default: null }, //YYYY-MM-DD
    dueTime: { type: String, default: null }, //HH:mm
    isComplete: { type: Boolean, default: false },
    
    //check pomodoro
    isPomodoro: { type: Boolean, default: false, index: true },
    pomodoro: { type: pomodoroSchema, default: null },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
