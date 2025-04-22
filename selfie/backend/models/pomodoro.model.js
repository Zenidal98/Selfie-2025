import mongoose from "mongoose";
                                                   //contiene dati sui cicli completati per ogni utente
const pomodoroSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Register",
    required: true
  },
  data: {
    type: Date,
    default: Date.now
  },
  studyDuration: {
    type: Number, // in minuti
    required: true
  },
  breakDuration: {
    type: Number,
    required: true
  },
  cyclesCompleted: {
    type: Number,
    required: true
  },
  totalStudyTime: {
    type: Number, // in minuti
    required: true
  }
}, { timestamps: true });

const Pomodoro = mongoose.model("Pomodoro", pomodoroSchema);

export default Pomodoro;
